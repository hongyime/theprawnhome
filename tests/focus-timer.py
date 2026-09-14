"""Exercise the real focus timer with synthetic elapsed time and provider fixtures."""
from datetime import datetime, timedelta, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit
import argparse
import json
from playwright.sync_api import sync_playwright, expect
from weather import FIXTURE

ROOT = Path(__file__).resolve().parents[1]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

def run(base):
    checks = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for case in ['sleep-gap', 'finish-and-restart', 'pause-resume-fraction', 'reset', 'hidden-resume']:
            context = browser.new_context(viewport={'width': 390, 'height': 1000}, reduced_motion='reduce')
            context.add_init_script(FIXTURE.replace('__CONFIG__', json.dumps({'mode': 'ok'})))
            context.add_init_script("Object.defineProperty(document,'hidden',{configurable:true,get:()=>Boolean(window.__hidden)});")
            external = []
            def route(request):
                url = request.request.url
                parsed = urlsplit(url)
                if url.startswith(base) and parsed.path == '/api/spotify':
                    request.fulfill(status=200, content_type='application/json', body='{"isPlaying":false}')
                elif parsed.hostname == 'hacker-news.firebaseio.com':
                    request.fulfill(status=200, content_type='application/json', body='[]')
                elif parsed.hostname == 'fonts.googleapis.com':
                    request.fulfill(status=200, content_type='text/css', body='/* Synthetic font response. */')
                elif parsed.netloc == urlsplit(base).netloc:
                    request.continue_()
                else:
                    external.append(parsed.hostname)
                    request.abort()
            context.route('**/*', route)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            start_time = datetime(2026, 9, 14, tzinfo=timezone.utc)
            page.clock.install(time=start_time)
            page.clock.pause_at(start_time + timedelta(seconds=1))
            timer = page.get_by_role('timer', name='Focus time remaining')
            row = {'case': case}
            try:
                page.goto(base)
                expect(timer).to_have_text('25:00')
                page.get_by_role('button', name='START', exact=True).click()
                expect(page.get_by_role('button', name='PAUSE', exact=True)).to_be_visible()
                if case == 'sleep-gap':
                    page.clock.fast_forward(600000)
                    expect(timer).to_have_text('15:00')
                elif case == 'finish-and-restart':
                    page.clock.fast_forward(1560000)
                    expect(timer).to_have_text('00:00')
                    expect(page.get_by_text('Focus timer finished', exact=True)).to_be_visible()
                    page.get_by_role('button', name='START', exact=True).click()
                    expect(timer).to_have_text('25:00')
                    page.clock.run_for(1000)
                    expect(timer).to_have_text('24:59')
                elif case == 'pause-resume-fraction':
                    page.clock.run_for(1250)
                    page.get_by_role('button', name='PAUSE', exact=True).click()
                    expect(timer).to_have_text('24:59')
                    page.clock.fast_forward(600000)
                    expect(timer).to_have_text('24:59')
                    page.get_by_role('button', name='START', exact=True).click()
                    page.clock.fast_forward(60000)
                    expect(timer).to_have_text('23:59')
                elif case == 'reset':
                    page.clock.run_for(2000)
                    page.get_by_role('button', name='RESET', exact=True).click()
                    page.clock.fast_forward(1800000)
                    expect(timer).to_have_text('25:00')
                    expect(page.get_by_text('Focus timer paused', exact=True)).to_be_visible()
                else:
                    page.evaluate("window.__hidden=true; document.dispatchEvent(new Event('visibilitychange'))")
                    page.clock.fast_forward(600000)
                    page.evaluate("window.__hidden=false; document.dispatchEvent(new Event('visibilitychange'))")
                    expect(timer).to_have_text('15:00')
                assert not errors, errors
                assert not external, external
                row['passed'] = True
            except Exception as error:
                row.update(passed=False, error=str(error)[:800], timer_text=timer.text_content())
            finally:
                checks.append(row)
                context.close()
        browser.close()
    return {'checks': checks, 'passed': sum(row['passed'] for row in checks), 'total': len(checks), 'provider_calls': 0}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT / 'dist')))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        result = run(f'http://127.0.0.1:{server.server_port}')
        Path(args.output).write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps(result))
    finally:
        server.shutdown()
        server.server_close()
        thread.join()
    raise SystemExit(0 if result['passed'] == result['total'] else 1)
