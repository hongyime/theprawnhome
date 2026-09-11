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
const { default: handler } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const originalFetch = globalThis.fetch;
const realTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;
const token = { access_token: 'synthetic-access-token' };
const playing = {
  is_playing: true, progress_ms: 1200,
  item: {
    name: 'Synthetic song', artists: [{ name: 'Synthetic artist' }],
    album: { images: [{ url: 'https://example.invalid/cover' }] },
    external_urls: { spotify: 'https://example.invalid/song' }, duration_ms: 60000,
  },
};

function setup(t) {
  for (const name of ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN']) {
    const previous = process.env[name];
    process.env[name] = 'synthetic-only';
    t.after(() => { if (previous === undefined) delete process.env[name]; else process.env[name] = previous; });
  }
  t.mock.method(console, 'error', () => {});
  const result = { calls: 0 };
  const response = { status(code) { result.code = code; return {
    json(body) { result.body = body; result.calls += 1; return body; },
  }; } };
  return { result, invoke: () => handler({}, response) };
}

function trackDeadlines(t) {
  const active = new Set();
  let created = 0;
  let fire;
  t.mock.method(globalThis, 'setTimeout', (callback, ms, ...args) => {
    const timer = realTimeout(callback, ms, ...args);
    if (ms === 10000) { active.add(timer); created += 1; fire = () => callback(...args); }
    return timer;
  });
  t.mock.method(globalThis, 'clearTimeout', (timer) => { active.delete(timer); return realClearTimeout(timer); });
  t.after(() => { for (const timer of active) realClearTimeout(timer); });
  return { active, created: () => created, fire: () => { assert.ok(fire, 'Expected one ten-second deadline'); fire(); } };
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

for (const [label, reply] of [
  ['no playback', () => new Response(null, { status: 204 })],
  ['missing item', () => Response.json({ item: null })],
  ['upstream unavailable', () => new Response(null, { status: 503 })],
  ['malformed body', () => new Response('{')],
]) {
  test(`${label} keeps the quiet fallback and clears its timer`, async (t) => {
    const { result, invoke } = setup(t);
    const timers = trackDeadlines(t);
    let count = 0;
    t.mock.method(globalThis, 'fetch', async () => ++count === 1 ? Response.json(token) : reply());
    await invoke();
    assert.deepEqual(result, { calls: 1, code: 200, body: { isPlaying: false } });
    assert.equal(timers.active.size, 0);
  });
}

for (const phase of ['token-headers', 'token-body', 'playback-headers', 'playback-body']) {
  test(`${phase} deadline cancels the stalled real HTTP fetch/body`, async (t) => {
    const { result, invoke } = setup(t);
    const timers = trackDeadlines(t);
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
        observer = realTimeout(() => resolve(false), 5000);
      })]);
      realClearTimeout(observer);
      assert.ok(reached, 'Fixture must reach the intended stalled phase');
      // Fire the actual scheduled deadline only after the network fixture has
      // reached its target phase; wall-clock acceleration races slow machines.
      timers.fire();
      const settled = await Promise.race([pending.then(() => true), new Promise((resolve) => {
        observer = realTimeout(() => resolve(false), 1000);
      })]);
      realClearTimeout(observer);
      assert.ok(settled, 'Request must finish while the provider remains stalled');
      assert.deepEqual(result, { calls: 1, code: 200, body: { isPlaying: false } });
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
