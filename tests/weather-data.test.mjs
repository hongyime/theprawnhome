import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../lib/weather.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { parseWeather, weatherCondition, fetchWeather, SINGAPORE } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const valid = () => ({ current: { temperature_2m: 28.5, weather_code: 95, time: 1789243200, is_day: 1 }, current_units: { temperature_2m: '°C' } });

test('valid current weather retains numeric precision, timestamp and conditions', () => {
  const result = parseWeather(valid());
  assert.deepEqual(result, { temperature: 28.5, weatherCode: 95, observedAt: 1789243200000, isDay: true });
  assert.deepEqual(weatherCondition(result), ['Thunderstorm', '⛈️']);
});
for (const [name, value] of [
  ['missing response', null], ['missing current', {}], ['null current', { current: null }],
  ['wrong units', { ...valid(), current_units: { temperature_2m: '°F' } }],
  ...[['temperature_2m',null],['temperature_2m','28'],['temperature_2m',Infinity],['weather_code',123],['weather_code',1.5],['weather_code','95'],['time',null],['time','2026-09-13'],['time',Infinity],['time',1e30],['is_day',null],['is_day',2]].map(([key,value])=>[`${key}: ${value}`,{...valid(), current:{...valid().current,[key]:value}}]),
]) {
  test(`malformed weather rejected: ${name}`, () => assert.throws(() => parseWeather(value), /unavailable/));
}
test('clear night, fog, snow and hail have distinct conditions', () => {
  for (const [code,day,label,icon] of [[0,0,'Clear sky','🌙'],[0,1,'Clear sky','☀️'],[45,1,'Fog','🌫️'],[73,1,'Snow','🌨️'],[99,1,'Thunderstorm with heavy hail','⛈️']]) {
    assert.deepEqual(weatherCondition(parseWeather({...valid(),current:{...valid().current,weather_code:code,is_day:day}})),[label,icon]);
  }
});
test('request contains only current weather fields and forwards cancellation', async t => {
  const controller = new AbortController();
  t.mock.method(globalThis,'fetch', async (url,options) => {
    const query = new URL(url).searchParams;
    assert.equal(query.get('latitude'),'1.3521');assert.equal(query.get('longitude'),'103.8198');
    assert.equal(query.get('current'),'temperature_2m,weather_code,is_day');assert.equal(query.get('timeformat'),'unixtime');
    assert.equal(query.get('temperature_unit'),'celsius');assert.equal(query.has('hourly'),false);assert.equal(query.has('daily'),false);
    assert.equal(options.signal,controller.signal);
    return new Response(JSON.stringify(valid()));
  });
  assert.equal((await fetchWeather(SINGAPORE,controller.signal)).temperature,28.5);
});
test('failed HTTP status cannot masquerade as valid weather', async t => {
  t.mock.method(globalThis,'fetch', async () => new Response(JSON.stringify(valid()),{status:503}));
  await assert.rejects(fetchWeather(SINGAPORE,new AbortController().signal),/provider/);
});
test('invalid coordinates do not make a request', async t => {
  let calls=0;t.mock.method(globalThis,'fetch',()=>{calls++;throw new Error('Unexpected request');});
  for (const [latitude,longitude] of [[NaN,0],[91,0],[0,181],[0,Infinity]]) {
    await assert.rejects(fetchWeather({label:'Fixture',latitude,longitude},new AbortController().signal),/location/);
  }
  assert.equal(calls,0);
});
