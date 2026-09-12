"""Browser weather fixtures. No live weather, music, news or location providers."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit
import argparse, json, re
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
    def end_headers(self):
        self.send_header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()')
        super().end_headers()

FIXTURE = r"""(() => {
  const originalFetch = window.fetch.bind(window);
  const config = __CONFIG__;
  const weather = window.__weather = {requests: [], aborts: 0, geoCalls: 0, geoMode: 'denied', mode: config.mode, pending: []};
  const response = () => {
    const current = {temperature_2m: 28.5, weather_code: 95, time: Math.floor(Date.now()/1000), is_day: 1};
    if (weather.mode === 'null') current.temperature_2m = null;
    if (weather.mode === 'unknown') current.weather_code = 123;
    return {current, current_units: {temperature_2m: '°C', time: 'unixtime', weather_code: 'wmo code', is_day: ''}};
  };
  if (!config.native) Object.defineProperty(navigator, 'geolocation', {configurable:true, value:{getCurrentPosition(success, failure, options) {
    weather.geoCalls++;
    weather.geoOptions = options;
    if (weather.geoMode === 'pending') {weather.geoLate = success; return;}
    Promise.resolve().then(() => weather.geoMode === 'success'
      ? success({coords:{latitude:48.8566,longitude:2.3522}})
      : failure({code:1,message:'Fixture denied'}));
  }}});
  Object.defineProperty(navigator, 'onLine', {configurable:true, get:()=>!window.__offline});
  Object.defineProperty(document, 'visibilityState', {configurable:true, get:()=>window.__hidden?'hidden':'visible'});
  window.__offline = config.offline || false;
  window.__hidden = config.hidden || false;
  window.fetch = (input, options = {}) => {
    const url = String(input);
    if (!url.startsWith('https://api.open-meteo.com/')) return originalFetch(input, options);
    weather.requests.push(url);
    const mode = weather.mode;
    const aborted = () => {weather.aborts++;};
    options.signal?.addEventListener('abort', aborted, {once:true});
    if (mode === 'headers' || mode === 'late') return new Promise((resolve,reject) => {
      weather.pending.push(()=>resolve(new Response(JSON.stringify(response()), {status:200})));
      if (mode !== 'late') options.signal?.addEventListener('abort', ()=>reject(new DOMException('Fixture aborted','AbortError')), {once:true});
    });
    if (mode === 'body') return Promise.resolve({ok:true, json:()=>new Promise((resolve,reject)=> {
      options.signal?.addEventListener('abort', ()=>reject(new DOMException('Fixture aborted','AbortError')), {once:true});
    })});
    if (mode === 'network') return Promise.reject(new TypeError('Synthetic network failure'));
    if (mode === 'json') return Promise.resolve(new Response('{', {status:200}));
    return Promise.resolve(new Response(JSON.stringify(response()), {status:mode === 'http' ? 503 : 200}));
  };
})();
"""

DEFAULT_CASES = ['singapore', 'http', 'null', 'json', 'headers', 'body', 'unknown', 'network', 'retry', 'no-polling', 'hidden-start', 'offline-start', 'hidden-cancel', 'offline-cancel', 'geo-success', 'geo-denied', 'geo-timeout', 'geo-native', 'geo-cancel', 'geo-weather-failure', 'late-response', 'refresh-failure']

def run(base, output, cases, widths):
    checks = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width in widths:
            for case in cases:
                config = {'mode': case if case in ['http','null','json','headers','body','unknown','network'] else 'ok',
                          'hidden': case == 'hidden-start', 'offline': case == 'offline-start', 'native': case == 'geo-native'}
                if case in ['hidden-cancel','offline-cancel','late-response']:config['mode']='late'
                context = browser.new_context(viewport={'width':width,'height':1000}, reduced_motion='reduce',
                    permissions=['geolocation'] if case == 'geo-native' else [], geolocation={'latitude':48.8566,'longitude':2.3522})
                context.add_init_script(FIXTURE.replace('__CONFIG__', json.dumps(config)))
                external = []; errors = []
                def route(request):
                    url = request.request.url
                    parsed = urlsplit(url)
                    if url.startswith(base) and parsed.path == '/api/spotify':
                        request.fulfill(status=200,content_type='application/json',body='{"isPlaying":false}')
                    elif parsed.hostname == 'hacker-news.firebaseio.com':
                        request.fulfill(status=200,content_type='application/json',body='[]')
                    elif parsed.hostname == 'fonts.googleapis.com':
                        request.fulfill(status=200,content_type='text/css',body='/* Offline font fixture; system fallback. */')
                    elif parsed.netloc == urlsplit(base).netloc:
                        request.continue_()
                    else:
                        external.append(url); request.abort()
                context.route('**/*', route)
                page = context.new_page(); page.on('pageerror', lambda error:errors.append(str(error)))
                page.clock.install()
                result = {'case':case,'width':width}
                try:
                    page.goto(base)
                    page.wait_for_function("document.body.textContent.includes('PRAWN_SAYS:')")
                    weather = page.locator('[aria-label="Weather"]')
                    if not weather.count():
                        weather = page.get_by_role('link', name='View Singapore rain radar')
                    if case == 'singapore':
                        page.wait_for_function('window.__weather.requests.length>0')
                        request = page.evaluate('window.__weather.requests[0]')
                        assert 'latitude=1.3521' in request and 'longitude=103.8198' in request, request
                        assert page.evaluate('window.__weather.geoCalls') == 0
                        expect(weather).to_contain_text('Singapore')
                        expect(weather).to_contain_text('28.5°C')
                        expect(weather).to_contain_text('Thunderstorm')
                        expect(weather.locator('time')).to_have_attribute('datetime', re.compile(r'^\d{4}-'))
                    elif case in ['http','null','json','headers','body','unknown','network']:
                        page.wait_for_function('window.__weather.requests.length>0')
                        if case in ['headers','body']:page.clock.fast_forward(10001)
                        expect(weather).to_contain_text('Weather unavailable')
                        expect(weather.get_by_role('button',name='Retry weather')).to_be_enabled()
                        assert '°C' not in weather.inner_text()
                    elif case == 'retry':
                        expect(weather).to_contain_text('28.5°C')
                        page.evaluate("window.__weather.mode='http'")
                        weather.get_by_role('button',name='Refresh weather').click()
                        expect(weather).to_contain_text('Could not refresh')
                        page.evaluate("window.__weather.mode='ok'")
                        weather.get_by_role('button',name='Retry weather').click()
                        expect(weather).not_to_contain_text('Could not refresh')
                        assert page.evaluate('window.__weather.requests.length') == 3
                    elif case == 'no-polling':
                        expect(weather).to_contain_text('28.5°C')
                        page.clock.fast_forward(3600000)
                        assert page.evaluate('window.__weather.requests.length') == 1
                        page.evaluate("window.__hidden=true;document.dispatchEvent(new Event('visibilitychange'))")
                        page.clock.fast_forward(600000)
                        page.evaluate("window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'))")
                        assert page.evaluate('window.__weather.requests.length') == 1
                    elif case in ['hidden-start','offline-start']:
                        assert page.evaluate('window.__weather.requests.length') == 0
                        page.clock.fast_forward(600000)
                        assert page.evaluate('window.__weather.requests.length') == 0
                        event = 'visibilitychange' if case == 'hidden-start' else 'online'
                        page.evaluate("window.__hidden=false;window.__offline=false")
                        page.evaluate("event => (event==='visibilitychange'?document:window).dispatchEvent(new Event(event))",event)
                        expect(weather).to_contain_text('28.5°C')
                        assert page.evaluate('window.__weather.requests.length') == 1
                    elif case in ['hidden-cancel','offline-cancel','late-response']:
                        page.wait_for_function('window.__weather.requests.length===1')
                        event = 'offline' if case == 'offline-cancel' else 'visibilitychange'
                        page.evaluate("window.__hidden=true;window.__offline=true")
                        page.evaluate("event => (event==='visibilitychange'?document:window).dispatchEvent(new Event(event))",event)
                        assert page.evaluate('window.__weather.aborts') == 1
                        page.evaluate("window.__weather.pending[0]();window.__weather.mode='ok'")
                        page.clock.fast_forward(600000)
                        assert page.evaluate('window.__weather.requests.length') == 1
                        assert weather.locator('time').count() == 0
                        page.evaluate("window.__hidden=false;window.__offline=false;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('online'))")
                        expect(weather).to_contain_text('28.5°C')
                        assert page.evaluate('window.__weather.requests.length') == 2
                    elif case.startswith('geo-'):
                        expect(weather).to_contain_text('Singapore')
                        page.evaluate("mode => window.__weather.geoMode=mode",{'geo-success':'success','geo-denied':'denied','geo-timeout':'pending','geo-native':'success','geo-cancel':'pending','geo-weather-failure':'success'}[case])
                        if case == 'geo-weather-failure':page.evaluate("window.__weather.mode='http'")
                        weather.get_by_role('button',name='Use my location').click()
                        if case in ['geo-success','geo-native']:
                            expect(weather).to_contain_text('Your location')
                            assert 'latitude=48.8566' in page.evaluate('window.__weather.requests.at(-1)')
                            weather.get_by_role('button',name='Use Singapore').click()
                            expect(weather).to_contain_text('Singapore')
                        elif case == 'geo-weather-failure':
                            expect(weather).to_contain_text('Could not refresh')
                            expect(weather.get_by_role('heading')).to_have_text('Singapore')
                            expect(weather).to_contain_text('28.5°C')
                            assert page.evaluate('window.__weather.requests.length') == 2
                        else:
                            if case == 'geo-cancel':page.evaluate("window.__hidden=true;document.dispatchEvent(new Event('visibilitychange'))")
                            if case == 'geo-timeout':page.clock.fast_forward(10001)
                            expect(weather).to_contain_text('Location unavailable')
                            expect(weather).to_contain_text('Singapore')
                            assert page.evaluate('window.__weather.requests.length') == 1
                            if case in ['geo-timeout','geo-cancel']:
                                page.evaluate('window.__weather.geoLate({coords:{latitude:48.8566,longitude:2.3522}})')
                                assert page.evaluate('window.__weather.requests.length') == 1
                    elif case == 'refresh-failure':
                        expect(weather).to_contain_text('28.5°C')
                        page.evaluate("window.__weather.mode='headers'")
                        weather.get_by_role('button',name='Refresh weather').click()
                        expect(weather.get_by_role('button',name='Refreshing weather')).to_be_disabled()
                        assert page.evaluate('window.__weather.requests.length') == 2
                        page.clock.fast_forward(10001)
                        expect(weather).to_contain_text('Could not refresh')
                        expect(weather).to_contain_text('28.5°C')
                        expect(weather.locator('time')).to_be_visible()
                    assert not errors, errors
                    assert not external, external
                    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Horizontal overflow'
                    result.update(status='passed',weather_requests=page.evaluate('window.__weather.requests.length'),external_requests=0)
                except Exception as error:
                    result.update(status='failed',error=str(error),javascript_errors=errors)
                    if weather.count():result['observed_weather']=weather.inner_text()
                page.locator('text=PRAWN_SAYS:').first.scroll_into_view_if_needed()
                page.screenshot(path=str(output/f'{case}-{width}.png'),animations='disabled')
                checks.append(result); print(json.dumps(result),flush=True); context.close()
        browser.close()
    (output/'results.json').write_text(json.dumps({'base':base,'checks':checks},indent=2)+'\n')
    return all(c['status']=='passed' for c in checks)

if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--base');parser.add_argument('--dist',type=Path,default=ROOT/'dist')
    parser.add_argument('--output',type=Path,default=ROOT/'weather-results');parser.add_argument('--cases',nargs='+',default=DEFAULT_CASES)
    parser.add_argument('--widths',nargs='+',type=int,default=[1440,390])
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True);server=None
    try:
        base=args.base
        if not base:
            server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(args.dist)))
            worker=Thread(target=server.serve_forever,daemon=True);worker.start();base=f'http://127.0.0.1:{server.server_port}'
        passed=run(base,args.output,args.cases,args.widths)
    finally:
        if server:server.shutdown();server.server_close();worker.join()
    raise SystemExit(0 if passed else 1)
