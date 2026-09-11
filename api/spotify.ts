type ApiResponse = {
  status: (statusCode: number) => {
    json: (body: SpotifyApiResponse) => unknown;
  };
};

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

type SpotifyTokenResponse = {
  access_token?: string;
};

type SpotifyArtist = {
  name: string;
};

type SpotifyNowPlayingResponse = {
  is_playing: boolean;
  item: {
    name: string;
    artists: SpotifyArtist[];
    album: {
      images: Array<{ url: string }>;
    };
    external_urls: {
      spotify: string;
    };
    duration_ms: number;
  } | null;
  progress_ms: number;
};

export default async function handler(_request: unknown, response: ApiResponse) {
  const {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REFRESH_TOKEN,
  } = process.env;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return response.status(200).json({ isPlaying: false, error: 'Secrets missing' });
  }

  const basic = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
  const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
  // One budget covers token refresh, playback lookup, and both response bodies.
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 10_000);

  try {
    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: SPOTIFY_REFRESH_TOKEN,
      }),
    });

    const tokenData = await tokenRes.json() as SpotifyTokenResponse;
    
    if (!tokenData.access_token) {
        throw new Error("Failed to get access token");
    }

    const spotifyRes = await fetch(NOW_PLAYING_ENDPOINT, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (spotifyRes.status === 204 || spotifyRes.status > 400) {
      return response.status(200).json({ isPlaying: false });
    }

    const song = await spotifyRes.json() as SpotifyNowPlayingResponse;
    
    if (song.item === null) {
      return response.status(200).json({ isPlaying: false });
    }

    const isPlaying = song.is_playing;
    const title = song.item.name;
    const artist = song.item.artists.map((_artist) => _artist.name).join(', ');
    const albumArt = song.item.album.images[0].url;
    const url = song.item.external_urls.spotify;
    const progress = song.progress_ms;
    const duration = song.item.duration_ms;

    return response.status(200).json({
      isPlaying,
      title,
      artist,
      albumArt,
      url,
      progress,
      duration
    });
  } catch (error) {
    if (!controller.signal.aborted) console.error("Spotify API Error:", error);
    return response.status(200).json({ isPlaying: false });
  } finally {
    clearTimeout(deadline);
  }
}
