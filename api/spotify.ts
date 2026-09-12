type SpotifyApiResponse = {
  isPlaying: boolean;
  error?: string;
  title?: string;
  artist?: string;
  albumArt?: string;
  url?: string;
  progress?: number;
  duration?: number;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => unknown;
  status: (statusCode: number) => {
    json: (body: SpotifyApiResponse) => unknown;
    end: () => unknown;
  };
};
type AccessToken = { value: string; issuedAt: number; expiresAt: number };
type ProviderState = {
  configuration: string;
  token?: AccessToken;
  pending?: Promise<AccessToken>;
  failures: number;
  retryAt: number;
  generation: number;
};

// One bounded entry per warm function instance. This is temporary memory, not
// shared storage or a global rate limit; a cold instance starts empty.
let currentState: ProviderState | undefined;
const unavailable: SpotifyApiResponse = { isPlaying: false, error: 'Spotify temporarily unavailable' };
const credentialErrors = new Set(['invalid_grant', 'invalid_client', 'unauthorized_client']);
const safeCodes = new Set([...credentialErrors, 'invalid_scope', 'unsupported_grant_type']);

class ProviderError extends Error {
  constructor(readonly stage: 'token' | 'playback', readonly status = 0,
    readonly code = 'unavailable', readonly retryAt = 0) {
    super('Spotify provider unavailable');
  }
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

function retryAt(response: Response): number {
  const header = response.headers.get('retry-after')?.trim() ?? '';
  if (!/^\d+(\.\d+)?$/.test(header)) return 0;
  const until = Date.now() + Number(header) * 1000;
  return Number.isSafeInteger(Math.ceil(until)) ? Math.ceil(until) : 0;
}

async function readJson(response: Response, stage: 'token' | 'playback', signal: AbortSignal) {
  const reader = response.body?.getReader();
  if (!reader) throw new ProviderError(stage, response.status, 'invalid_response');
  const limit = stage === 'token' ? 16_384 : 262_144;
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new ProviderError(stage, response.status, 'invalid_response');
      }
      chunks.push(value);
    }
    signal.throwIfAborted();
    const body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return record(JSON.parse(new TextDecoder().decode(body)));
  } catch (error) {
    if (signal.aborted) throw error;
    throw new ProviderError(stage, response.status, 'invalid_response');
  } finally {
    reader.releaseLock();
  }
}

// A waiter keeps its own deadline even when sharing another request's refresh.
// The refresh owner's deadline also cancels that shared network operation.
function waitForToken(pending: Promise<AccessToken>, signal: AbortSignal) {
  return new Promise<AccessToken>((resolve, reject) => {
    const aborted = () => reject(signal.reason);
    if (signal.aborted) { reject(signal.reason); return; }
    signal.addEventListener('abort', aborted, { once: true });
    pending.then(resolve, reject).finally(() => signal.removeEventListener('abort', aborted));
  });
}

function accessToken(state: ProviderState, signal: AbortSignal, basic: string, refreshToken: string) {
  const now = Date.now();
  if (state.token && now >= state.token.issuedAt && now < state.token.expiresAt) {
    return Promise.resolve(state.token);
  }
  if (!state.pending) {
    state.pending = (async () => {
      const issuedAt = Date.now();
      const response = await fetch('https://accounts.spotify.com/api/token', {
        signal, method: 'POST', redirect: 'error',
        headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
      });
      if (!response.ok) {
        // Capture only allowlisted OAuth codes. Never log descriptions or bodies.
        let code = 'unavailable';
        try {
          const data = await readJson(response, 'token', signal);
          if (typeof data.error === 'string' && safeCodes.has(data.error)) code = data.error;
        } catch { /* The HTTP status and Retry-After are still useful. */ }
        throw new ProviderError('token', response.status, code, retryAt(response));
      }
      const data = await readJson(response, 'token', signal);
      if (typeof data.access_token !== 'string' || !data.access_token.trim() || data.access_token.length > 8192
        || typeof data.expires_in !== 'number' || !Number.isFinite(data.expires_in) || data.expires_in <= 30) {
        throw new ProviderError('token', response.status, 'invalid_response');
      }
      const token = { value: data.access_token, issuedAt,
        expiresAt: issuedAt + Math.min(data.expires_in * 1000, 86_400_000) - 30_000 };
      signal.throwIfAborted();
      if (Date.now() >= token.expiresAt) throw new ProviderError('token', response.status, 'invalid_response');
      state.token = token;
      return token;
    })().finally(() => { state.pending = undefined; });
  }
  return waitForToken(state.pending, signal);
}

function publicSong(data: Record<string, unknown>): SpotifyApiResponse {
  if (data.item === null) return { isPlaying: false };
  const item = record(data.item);
  const artists = Array.isArray(item.artists) ? item.artists.map(record) : [];
  const album = record(item.album);
  const images = Array.isArray(album.images) ? album.images.map(record) : [];
  const url = record(item.external_urls).spotify;
  if (typeof data.is_playing !== 'boolean' || typeof item.name !== 'string'
    || !artists.length || artists.some(artist => typeof artist.name !== 'string')
    || typeof images[0]?.url !== 'string' || typeof url !== 'string'
    || typeof data.progress_ms !== 'number' || !Number.isFinite(data.progress_ms)
    || typeof item.duration_ms !== 'number' || !Number.isFinite(item.duration_ms)) {
    throw new ProviderError('playback', 200, 'invalid_response');
  }
  return { isPlaying: data.is_playing, title: item.name, artist: artists.map(artist => artist.name).join(', '),
    albumArt: images[0].url, url, progress: data.progress_ms, duration: item.duration_ms };
}

function backoff(state: ProviderState, error: ProviderError) {
  const now = Date.now();
  // Count a simultaneous failure burst once, and never shorten Retry-After.
  const newFailure = now >= state.retryAt;
  if (newFailure) {
    state.failures = Math.min(state.failures + 1, 5);
    state.generation += 1;
    state.retryAt = now + Math.min(30_000 * 2 ** (state.failures - 1), 300_000);
  }
  state.retryAt = Math.max(state.retryAt, error.retryAt);
  if (credentialErrors.has(error.code)) { state.retryAt = Infinity; state.token = undefined; }
  if (newFailure) console.error('Spotify provider unavailable', {
    stage: error.stage, status: error.status, code: error.code,
  });
}

export default async function handler(request: { method?: string }, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Allow', 'GET, HEAD');
  // Health checks must not consume a Spotify request or return playback data.
  if (request.method === 'HEAD') return response.status(200).end();
  if (request.method && request.method !== 'GET') return response.status(405).json({ isPlaying: false });
  const { SPOTIFY_CLIENT_ID: clientId, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refreshToken } = process.env;
  if (!clientId || !secret || !refreshToken) {
    currentState = undefined;
    return response.status(200).json({ isPlaying: false, error: 'Secrets missing' });
  }
  const configuration = JSON.stringify([clientId, secret, refreshToken]);
  if (!currentState || currentState.configuration !== configuration) {
    currentState = { configuration, failures: 0, retryAt: 0, generation: 0 };
  }
  const state = currentState;
  if (Date.now() < state.retryAt) return response.status(200).json(unavailable);
  const generation = state.generation;
  const controller = new AbortController();
  // One budget covers shared token waiting, retry, playback and body reads.
  const deadline = setTimeout(() => controller.abort(), 10_000);
  let stage: 'token' | 'playback' = 'token';
  try {
    const basic = Buffer.from(`${clientId}:${secret}`).toString('base64');
    let token = await accessToken(state, controller.signal, basic, refreshToken);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      stage = 'playback';
      controller.signal.throwIfAborted();
      const spotify = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        signal: controller.signal, redirect: 'error', headers: { Authorization: `Bearer ${token.value}` },
      });
      if (spotify.status === 401) {
        // A late 401 for an old token must not discard a newer shared token.
        if (state.token === token) state.token = undefined;
        await spotify.body?.cancel();
        if (attempt === 0) {
          stage = 'token';
          token = await accessToken(state, controller.signal, basic, refreshToken);
          continue;
        }
      }
      if (!spotify.ok) {
        await spotify.body?.cancel();
        throw new ProviderError('playback', spotify.status, 'unavailable', retryAt(spotify));
      }
      const result = spotify.status === 204 ? { isPlaying: false }
        : publicSong(await readJson(spotify, 'playback', controller.signal));
      if (state.generation === generation) { state.failures = 0; state.retryAt = 0; }
      return response.status(200).json(result);
    }
    throw new ProviderError('playback', 401);
  } catch (error) {
    backoff(state, error instanceof ProviderError ? error
      : new ProviderError(stage, 0, controller.signal.aborted ? 'timeout' : 'network'));
    return response.status(200).json(unavailable);
  } finally {
    clearTimeout(deadline);
  }
}
