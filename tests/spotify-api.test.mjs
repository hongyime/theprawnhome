import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import test from 'node:test';
import ts from 'typescript';

// Compile in memory so the checks also work on Node versions without native TS.
const source = await readFile(new URL('../api/spotify.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
let moduleSequence = 0;
const originalFetch = globalThis.fetch;
const realTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;
const token = { access_token: 'synthetic-access-token', expires_in: 3600 };
const unavailable = { isPlaying: false, error: 'Spotify temporarily unavailable' };
const playing = {
  is_playing: true, progress_ms: 1200,
  item: {
    name: 'Synthetic song', artists: [{ name: 'Synthetic artist' }],
    album: { images: [{ url: 'https://example.invalid/cover' }] },
    external_urls: { spotify: 'https://example.invalid/song' }, duration_ms: 60000,
  },
};

function mockClock(t) {
  let now = 1_800_000_000_000;
  t.mock.method(Date, 'now', () => now);
  return { advance(ms) { now += ms; } };
}

function setup(t) {
  for (const name of ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN']) {
    const previous = process.env[name];
    process.env[name] = 'synthetic-only';
    t.after(() => { if (previous === undefined) delete process.env[name]; else process.env[name] = previous; });
  }
  t.mock.method(console, 'error', () => {});
  // A new function instance per test, but all requests within a test share it.
  const module = import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}#${++moduleSequence}`);
  const result = { calls: 0 };
  const headers = {};
  const response = { status(code) { result.code = code; return {
    json(body) { result.body = body; result.calls += 1; return body; },
    end() { result.calls += 1; },
  }; }, setHeader(name, value) { headers[name.toLowerCase()] = value; } };
  return { result, headers, invoke: async (request = {}) => (await module).default(request, response) };
}

function trackDeadlines(t, { manual = false } = {}) {
  const active = new Set();
  let created = 0;
  let fire;
  let fireFirst;
  t.mock.method(globalThis, 'setTimeout', (callback, ms, ...args) => {
    // Controlled network fixtures fire the captured production callback after
    // startup; a heavily loaded Windows host can take >10s to open loopback.
    const timer = manual && ms === 10000 ? realTimeout(() => {}, 60000) : realTimeout(callback, ms, ...args);
    if (ms === 10000) {
      active.add(timer); created += 1; fire = () => callback(...args);
      fireFirst ??= fire;
    }
    return timer;
  });
  t.mock.method(globalThis, 'clearTimeout', (timer) => { active.delete(timer); return realClearTimeout(timer); });
  t.after(() => { for (const timer of active) realClearTimeout(timer); });
  return { active, created: () => created,
    fire: () => { assert.ok(fire, 'Expected one ten-second deadline'); fire(); },
    fireFirst: () => { assert.ok(fireFirst, 'Expected the owner deadline'); fireFirst(); } };
}

test('missing configuration makes no provider request', async (t) => {
  const { result, invoke } = setup(t);
  delete process.env.SPOTIFY_CLIENT_ID;
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected provider request'); });
  await invoke();
  assert.deepEqual(result, { calls: 1, code: 200, body: { isPlaying: false, error: 'Secrets missing' } });
});

test('success preserves public fields and clears its shared deadline', async (t) => {
  const { result, invoke } = setup(t);
  const timers = trackDeadlines(t);
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return Response.json(calls.length === 1 ? token : playing);
  });
  await invoke();
  assert.equal(result.calls, 1);
  assert.equal(result.code, 200);
  assert.deepEqual(result.body, { isPlaying: true, title: 'Synthetic song', artist: 'Synthetic artist',
    albumArt: 'https://example.invalid/cover', url: 'https://example.invalid/song', progress: 1200, duration: 60000 });
  assert.equal(calls.length, 2);
  assert.ok(calls[0].options.signal instanceof AbortSignal);
  assert.equal(calls[0].options.signal, calls[1].options.signal);
  assert.equal(timers.created(), 1);
  assert.equal(timers.active.size, 0);
});

for (const [label, reply, expected] of [
  ['no playback', () => new Response(null, { status: 204 }), { isPlaying: false }],
  ['missing item', () => Response.json({ item: null }), { isPlaying: false }],
  ['upstream unavailable', () => new Response(null, { status: 503 }), unavailable],
  ['malformed body', () => new Response('{'), unavailable],
]) {
  test(`${label} keeps the quiet fallback and clears its timer`, async (t) => {
    const { result, invoke } = setup(t);
    const timers = trackDeadlines(t);
    let count = 0;
    t.mock.method(globalThis, 'fetch', async () => ++count === 1 ? Response.json(token) : reply());
    await invoke();
    assert.deepEqual(result, { calls: 1, code: 200, body: expected });
    assert.equal(timers.active.size, 0);
  });
}

for (const phase of ['token-headers', 'token-body', 'playback-headers', 'playback-body']) {
  test(`${phase} deadline cancels the stalled real HTTP fetch/body`, async (t) => {
    const { result, invoke } = setup(t);
    const timers = trackDeadlines(t, { manual: true });
    const phases = [];
    const signals = [];
    let entered;
    const stalled = new Promise((resolve) => { entered = resolve; });
    const server = createServer((request, response) => {
      const name = request.url === '/token' ? 'token' : 'playback';
      phases.push(name);
      if (phase.startsWith(name)) {
        if (phase.endsWith('body')) {
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.write('{');
        }
        entered();
      } else {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(name === 'token' ? token : playing));
      }
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    t.mock.method(globalThis, 'fetch', (url, options) => {
      signals.push(options.signal);
      return originalFetch(origin + (url.includes('/api/token') ? '/token' : '/playback'), options);
    });
    const pending = invoke();
    let observer;
    try {
      const reached = await Promise.race([stalled.then(() => true), new Promise((resolve) => {
        observer = realTimeout(() => resolve(false), 30000);
      })]);
      realClearTimeout(observer);
      assert.ok(reached, 'Fixture must reach the intended stalled phase');
      // Fire the actual scheduled deadline only after the network fixture has
      // reached its target phase; wall-clock acceleration races slow machines.
      timers.fire();
      const settled = await Promise.race([pending.then(() => true), new Promise((resolve) => {
        observer = realTimeout(() => resolve(false), 5000);
      })]);
      realClearTimeout(observer);
      assert.ok(settled, 'Request must finish while the provider remains stalled');
      assert.deepEqual(result, { calls: 1, code: 200, body: unavailable });
      assert.ok(signals.every((signal) => signal?.aborted));
      assert.equal(timers.created(), 1);
      assert.equal(timers.active.size, 0);
      assert.deepEqual(phases, phase.startsWith('token') ? ['token'] : ['token', 'playback']);
    } finally {
      realClearTimeout(observer);
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      await pending;
    }
  });
}

test('120 successful polls reuse one token while playback remains fresh', async (t) => {
  const { result, invoke, headers } = setup(t);
  const clock = mockClock(t);
  let refreshes = 0;
  let lookups = 0;
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.includes('/api/token')) { refreshes += 1; return Response.json(token); }
    lookups += 1;
    return Response.json({ ...playing, progress_ms: lookups });
  });
  for (let i = 0; i < 119; i += 1) { await invoke(); clock.advance(30000); }
  assert.equal(refreshes, 1);
  await invoke(); // At the 30-second expiry margin, refresh before use.
  assert.equal(refreshes, 2);
  assert.equal(lookups, 120);
  assert.equal(result.body.progress, 120);
  assert.equal(headers['cache-control'], 'no-store');
});

test('overlapping requests share one token refresh and retain separate playback requests', async (t) => {
  const { invoke } = setup(t);
  let release;
  let entered;
  const started = new Promise(resolve => { entered = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  let refreshes = 0;
  let lookups = 0;
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.includes('/api/token')) { refreshes += 1; entered(); await gate; return Response.json(token); }
    lookups += 1;
    return Response.json(playing);
  });
  const calls = Array.from({ length: 8 }, () => invoke());
  await started;
  release();
  await Promise.all(calls);
  assert.equal(refreshes, 1);
  assert.equal(lookups, 8);
});

test('waiter and owner deadlines settle shared work independently, then permit recovery', async (t) => {
  const { result, invoke } = setup(t);
  const clock = mockClock(t);
  const timers = trackDeadlines(t, { manual: true });
  let started;
  let ownerSignal;
  const entered = new Promise(resolve => { started = resolve; });
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    ownerSignal = options.signal;
    started();
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
  });
  const first = invoke();
  t.after(() => { timers.fireFirst(); timers.fire(); });
  await entered;
  const second = invoke();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(timers.created(), 2);
  // The waiter deadline fires first; it must not cancel the owner's fetch.
  timers.fire();
  await second;
  assert.equal(ownerSignal.aborted, false);
  // The owner's actual deadline must also cancel the shared network operation.
  timers.fireFirst();
  await first;
  assert.equal(ownerSignal.aborted, true);
  assert.equal(result.calls, 2);
  assert.equal(timers.active.size, 0);
  clock.advance(30000);
  t.mock.method(globalThis, 'fetch', async url => Response.json(url.includes('/api/token') ? token : playing));
  await invoke();
  assert.equal(result.body.isPlaying, true);
});

test('a late 401 cannot invalidate the replacement token used by another request', async (t) => {
  const { invoke } = setup(t);
  let refreshes = 0;
  let oldLookups = 0;
  let releaseLate;
  let lateStarted;
  const entered = new Promise(resolve => { lateStarted = resolve; });
  const gate = new Promise(resolve => { releaseLate = resolve; });
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.includes('/api/token')) return Response.json({ ...token, access_token: `synthetic-${++refreshes}` });
    if (options.headers.Authorization === 'Bearer synthetic-1') {
      oldLookups += 1;
      if (oldLookups === 2) { lateStarted(); await gate; }
      if (oldLookups > 1) return new Response(null, { status: 401 });
    }
    return Response.json(playing);
  });
  await invoke();
  const late = invoke();
  t.after(() => releaseLate());
  await Promise.race([entered, late.then(() => assert.fail('Expected playback to reuse the first token'))]);
  await invoke();
  releaseLate();
  await late;
  await invoke();
  assert.equal(refreshes, 2);
});

test('a backward clock and a configuration change each invalidate the cached token', async (t) => {
  const { invoke } = setup(t);
  const clock = mockClock(t);
  let refreshes = 0;
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.includes('/api/token')) { refreshes += 1; return Response.json(token); }
    return Response.json(playing);
  });
  await invoke();
  clock.advance(-1);
  await invoke();
  process.env.SPOTIFY_REFRESH_TOKEN = 'synthetic-reconfigured';
  await invoke();
  assert.equal(refreshes, 3);
});

test('401 invalidates a reused token and retries playback once', async (t) => {
  const { result, invoke } = setup(t);
  let refreshes = 0;
  let lookups = 0;
  const authorizations = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.includes('/api/token')) return Response.json({ ...token, access_token: `synthetic-${++refreshes}` });
    authorizations.push(options.headers.Authorization);
    return ++lookups === 2 ? new Response(null, { status: 401 }) : Response.json(playing);
  });
  await invoke();
  await invoke();
  assert.equal(refreshes, 2);
  assert.deepEqual(authorizations, ['Bearer synthetic-1', 'Bearer synthetic-1', 'Bearer synthetic-2']);
  assert.equal(result.body.isPlaying, true);
});

test('repeated 401 responses cannot create an unbounded refresh loop', async (t) => {
  const { result, invoke } = setup(t);
  let refreshes = 0;
  let lookups = 0;
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.includes('/api/token')) { refreshes += 1; return Response.json(token); }
    lookups += 1;
    return new Response(null, { status: 401 });
  });
  await invoke();
  await invoke();
  assert.deepEqual(result.body, unavailable);
  assert.equal(refreshes, 2);
  assert.equal(lookups, 2);
});

test('provider failures back off, recover, and reset the next failure delay', async (t) => {
  const { result, invoke } = setup(t);
  const clock = mockClock(t);
  let failed = true;
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async url => {
    requests += 1;
    if (failed) return new Response(null, { status: 503 });
    return Response.json(url.includes('/api/token') ? token : playing);
  });
  await invoke(); await invoke();
  assert.equal(requests, 1);
  clock.advance(30000); await invoke(); await invoke();
  assert.equal(requests, 2);
  clock.advance(59000); await invoke();
  assert.equal(requests, 2);
  clock.advance(1000); failed = false; await invoke();
  assert.equal(result.body.isPlaying, true);
  failed = true; await invoke();
  const afterFailure = requests;
  clock.advance(29999); await invoke();
  assert.equal(requests, afterFailure);
  clock.advance(1); failed = false; await invoke();
  assert.equal(result.body.isPlaying, true);
  assert.equal(requests, afterFailure + 1);
});

for (const stage of ['token', 'playback']) {
  test(`${stage} 429 respects a Retry-After longer than the normal backoff`, async (t) => {
    const { invoke } = setup(t);
    const clock = mockClock(t);
    let requests = 0;
    t.mock.method(globalThis, 'fetch', async url => {
      requests += 1;
      if (stage === 'playback' && url.includes('/api/token')) return Response.json(token);
      return new Response(null, { status: 429, headers: { 'Retry-After': '900' } });
    });
    await invoke();
    const count = requests;
    clock.advance(899999); await invoke();
    assert.equal(requests, count);
    clock.advance(1); await invoke();
    assert.equal(requests, count + 1);
  });
}

for (const providerCode of ['invalid_grant', 'invalid_client']) {
  test(`${providerCode} stops refresh retries in this instance until configuration changes`, async (t) => {
    const { result, invoke } = setup(t);
    const clock = mockClock(t);
    let requests = 0;
    const logs = [];
    t.mock.method(console, 'error', (...args) => logs.push(args));
    t.mock.method(globalThis, 'fetch', async () => {
      requests += 1;
      return Response.json({ error: providerCode, error_description: 'DO-NOT-LOG synthetic-only' }, { status: 400 });
    });
    await invoke();
    clock.advance(86400000); await invoke();
    assert.equal(requests, 1);
    assert.deepEqual(result.body, unavailable);
    assert.equal(logs.length, 1);
    assert.match(JSON.stringify(logs), new RegExp(providerCode));
    assert.doesNotMatch(JSON.stringify(logs), /DO-NOT-LOG|synthetic-only/);
    process.env.SPOTIFY_REFRESH_TOKEN = 'synthetic-reconfigured';
    await invoke();
    assert.equal(requests, 2);
  });
}

for (const invalid of [{}, { access_token: 123, expires_in: 3600 }, { ...token, expires_in: -1 }, { ...token, expires_in: '3600' }]) {
  test(`malformed token ${JSON.stringify(invalid)} never reaches playback`, async (t) => {
    const { result, invoke } = setup(t);
    let requests = 0;
    t.mock.method(globalThis, 'fetch', async () => { requests += 1; return Response.json(invalid); });
    await invoke(); await invoke();
    assert.equal(requests, 1);
    assert.deepEqual(result.body, unavailable);
  });
}

test('oversized provider bodies are cancelled without exposing their content', async (t) => {
  const { result, invoke } = setup(t);
  let cancelled = false;
  let close;
  t.after(() => realClearTimeout(close));
  t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('x'.repeat(70000)));
      close = realTimeout(() => controller.close(), 1000);
    },
    cancel() { cancelled = true; realClearTimeout(close); },
  })));
  await invoke();
  assert.ok(cancelled);
  assert.deepEqual(result.body, unavailable);
});

test('HEAD health checks and unsupported methods make no provider request', async (t) => {
  const { result, invoke, headers } = setup(t);
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected provider request'); });
  await invoke({ method: 'HEAD' });
  assert.equal(result.code, 200);
  assert.equal(result.body, undefined);
  await invoke({ method: 'POST' });
  assert.equal(result.code, 405);
  assert.equal(headers.allow, 'GET, HEAD');
  assert.equal(headers['cache-control'], 'no-store');
});
