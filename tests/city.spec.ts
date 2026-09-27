import { test, expect, type Page } from '@playwright/test';

// Headless Chromium only keeps a WebGL context on SwiftShader. The city serves 2D on software
// renderers, so the 3D tests pass ?city=force; the fallback tests also force, so that only the
// condition under test (reduced motion, no WebGL) is what sends them to the 2D page.
test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });

const CITY = '/?city=force';

const FILES = [
  { n: '01', t: 'ABOUT', text: 'TRAN NGOC HAI' },
  { n: '02', t: 'WORK', text: 'Dalmore Group' },
  { n: '03', t: 'LEDGER', text: 'CyberLogitec' },
  { n: '04', t: 'STACK', text: 'TanStack Query' },
  { n: '05', t: 'CONTACT', text: "LET'S BUILD" },
];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text());
  });
  return errors;
}

/** The engine is running once the boot screen is gone (the loader itself is there from first paint). */
async function waitForCity(page: Page) {
  await expect(page.locator('.city canvas')).toBeAttached({ timeout: 60_000 });
  await expect(page.locator('.city-boot')).toHaveCount(0, { timeout: 60_000 });
}

/** Load the city, skip the flyover from the loader and start riding (autopilot on mobile). */
async function startRide(page: Page, mobile: boolean) {
  await page.goto(CITY);
  await page.getByRole('button', { name: /SKIP/ }).click({ timeout: 60_000 });
  if (mobile) {
    await page.getByRole('button', { name: /START AUTOPILOT TOUR/ }).click();
  } else {
    // The ready card appears once the engine has started (slow on SwiftShader under parallel load).
    await expect(page.getByRole('button', { name: /IGNITE/ })).toBeVisible({ timeout: 60_000 });
    await page.keyboard.press('Enter');
  }
  await expect(page.getByRole('link', { name: 'CLASSIC', exact: true })).toBeVisible();
}

test.describe('Neon City (3D)', () => {
  test.setTimeout(180_000);

  test('loads without console errors, skips the intro and rides', async ({ page }, testInfo) => {
    const errors = trackErrors(page);
    const mobile = testInfo.project.name === 'mobile';
    await startRide(page, mobile);
    await expect(page.locator('.city canvas')).toBeAttached();
    await expect(page.locator('#breach')).toHaveCount(0);
    await expect(page.locator('h1')).toHaveText(/Tran Ngoc Hai/);
    await expect(page.getByRole('link', { name: 'CLASSIC', exact: true })).toHaveAttribute('href', '/os/');
    expect(errors).toEqual([]);
  });

  test('every gate opens its file, and files close and reopen', async ({ page }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await startRide(page, mobile);
    if (!mobile) await page.keyboard.press('c'); // autopilot drives to each gate
    const panel = page.locator('[data-panel]');
    for (const f of FILES) {
      const warp = mobile ? page.getByRole('button', { name: `Warp to sector ${f.n} ${f.t}` }) : page.locator('button[title="Warp to sector"]', { hasText: f.n });
      await warp.click();
      // SwiftShader under parallel load can drop to a few frames per second: wait on this gate's file itself.
      await expect(panel).toContainText(`FILE://${f.t}.dossier`, { timeout: 120_000 });
      await expect(panel).toBeVisible();
      await expect(panel).toContainText(f.text);
    }
    await panel.getByRole('button', { name: /CLOSE/ }).click();
    await expect(panel).toBeHidden();
    await page.getByRole('button', { name: 'OPEN FILE' }).click();
    await expect(panel).toBeVisible();
    if (!mobile) {
      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();
    }
  });

  test('the loader paints with the server HTML and SKIP works before the page is even hydrated', async ({ page, request }) => {
    const html = await (await request.get(CITY)).text();
    expect(html).toContain('city-load-pct');
    // Hold every script until SKIP has been tapped: the tap lands on the server-rendered loader before
    // React has hydrated (let alone started the engine) and must still take the rider to the ready card.
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    await page.route('**/_next/static/chunks/**', async (route) => {
      await held;
      return route.continue();
    });
    await page.goto(CITY, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.city-boot')).toBeVisible();
    await page.getByRole('button', { name: /SKIP/ }).click();
    release();
    // Once the engine runs, the ready card must follow at once: the flyover alone takes at least 9.9 s.
    await expect(page.locator('.city-boot')).toHaveCount(0, { timeout: 60_000 });
    await expect(page.getByRole('button', { name: /IGNITE|START AUTOPILOT TOUR/ })).toBeVisible({ timeout: 8_000 });
    // The early tap was handed over and its listener/flag cleared, so a later visit cannot auto-skip.
    expect(await page.evaluate(() => Object.keys(window).filter((k) => k.startsWith('__cityEarlySkip')))).toEqual([]);
  });

  test('panel content is in the server HTML for crawlers', async ({ request }) => {
    const html = await (await request.get('/')).text();
    for (const f of FILES) expect(html).toContain(f.text.replace("'", '&#x27;'));
    expect(html).toContain('/images/work/dalmore-desktop.webp');
    // Outline: one h1 (the name), then an h2 per sector file.
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    for (const f of FILES) expect(html).toContain(`<h2 class="city-sec-label">[ ${f.n} // `);
  });
});

async function expect2D(page: Page) {
  await expect(page.locator('#breach')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.city')).toHaveCount(0); // city overlay gone
  // Scroll works again (the 2D page's own boot loader locks it briefly).
  await expect
    .poll(() => page.evaluate(() => (window.scrollTo(0, 600), window.scrollY)), { timeout: 30_000 })
    .toBeGreaterThan(0);
}

/** Collects the city's "falling back to 2D" warnings: one per onFallback call. */
function trackFallbacks(page: Page) {
  const calls: string[] = [];
  page.on('console', (msg) => {
    if (msg.text().includes('[city] falling back')) calls.push(msg.text());
  });
  return calls;
}

test.describe('Neon City start-up', () => {
  test.setTimeout(180_000);

  test('a tab switch and a resize during start-up neither start the city early nor double its render loop', async ({ page }) => {
    const fallbacks = trackFallbacks(page);
    const errors = trackErrors(page);
    await page.addInitScript(() => {
      const w = window as unknown as { __holdCompile: boolean; __rafDup: number };
      w.__holdCompile = true;
      w.__rafDup = 0;
      // Advertise parallel shader compile (SwiftShader lacks it; its compiles are synchronous, so
      // "complete" is true once released) and report every shader as still compiling until then:
      // start-up parks in warm-up, with the renderer and the city built but not live yet.
      const proto = WebGL2RenderingContext.prototype;
      const COMPLETION_STATUS_KHR = 0x91b1;
      type GetExtension = (this: WebGL2RenderingContext, name: string) => unknown;
      const ext = proto.getExtension as unknown as GetExtension;
      proto.getExtension = function (this: WebGL2RenderingContext, name: string) {
        return ext.call(this, name) ?? (name === 'KHR_parallel_shader_compile' ? { COMPLETION_STATUS_KHR } : null);
      } as unknown as typeof proto.getExtension;
      const gpp = proto.getProgramParameter;
      proto.getProgramParameter = function (this: WebGL2RenderingContext, p: WebGLProgram, pname: number) {
        return pname === COMPLETION_STATUS_KHR ? !w.__holdCompile : gpp.call(this, p, pname);
      };
      // A render loop re-queues the same callback once per frame; two loops would queue it twice.
      const pending = new Map<FrameRequestCallback, number>();
      const ids = new Map<number, FrameRequestCallback>();
      const raf = window.requestAnimationFrame.bind(window);
      const caf = window.cancelAnimationFrame.bind(window);
      const done = (cb: FrameRequestCallback) => pending.set(cb, (pending.get(cb) ?? 1) - 1);
      window.requestAnimationFrame = (cb) => {
        const n = (pending.get(cb) ?? 0) + 1;
        pending.set(cb, n);
        w.__rafDup = Math.max(w.__rafDup, n);
        const id = raf((ts) => {
          ids.delete(id);
          done(cb);
          cb(ts);
        });
        ids.set(id, cb);
        return id;
      };
      window.cancelAnimationFrame = (id) => {
        const cb = ids.get(id);
        if (cb) {
          ids.delete(id);
          done(cb);
        }
        caf(id);
      };
    });
    const setHidden = (hidden: boolean) =>
      page.evaluate((h) => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);
    await page.goto(CITY);
    await expect(page.locator('.city canvas')).toBeAttached({ timeout: 60_000 });
    const vp = page.viewportSize()!;
    const size = { width: vp.width - 40, height: vp.height - 40 };
    await page.setViewportSize(size); // resize while the city is being built
    await setHidden(true); // tab away and back while it is being built
    await setHidden(false);
    await page.waitForTimeout(1000);
    await expect(page.locator('.city-boot')).toBeVisible(); // still starting: nothing went live early
    await page.evaluate(() => ((window as unknown as { __holdCompile: boolean }).__holdCompile = false));
    await waitForCity(page);
    await page.getByRole('button', { name: /SKIP/ }).click();
    await expect(page.getByRole('button', { name: /IGNITE|START AUTOPILOT TOUR/ })).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as unknown as { __rafDup: number }).__rafDup)).toBe(1);
    // The resize made during the build was applied when the city went live.
    expect(await page.locator('.city canvas').evaluate((c) => (c as HTMLCanvasElement).style.width)).toBe(`${size.width}px`);
    expect(fallbacks).toEqual([]);
    expect(errors).toEqual([]);
    await expect(page.locator('#breach')).toHaveCount(0);
  });
});

test.describe('Neon City hands over to 2D at runtime', () => {
  test.setTimeout(180_000);

  test('a throwing frame stops the loop and falls back exactly once', async ({ page }) => {
    const fallbacks = trackFallbacks(page);
    await page.goto(CITY);
    await waitForCity(page);
    // Every loader frame reads the percent readout; make that throw on every call.
    await page.evaluate(() => {
      const proto = Element.prototype as unknown as { querySelector: (s: string) => Element | null };
      const orig = proto.querySelector;
      proto.querySelector = function (this: Element, s: string) {
        if (s.includes('ld-pct')) throw new Error('forced frame error');
        return orig.call(this, s);
      };
    });
    await expect2D(page);
    await page.waitForTimeout(1000);
    expect(fallbacks).toHaveLength(1);
    expect(fallbacks[0]).toContain('forced frame error');
  });

  test('a lost WebGL context falls back', async ({ page }) => {
    const fallbacks = trackFallbacks(page);
    await page.goto(CITY);
    await waitForCity(page);
    await page.evaluate(() => {
      const canvas = document.querySelector('.city canvas') as HTMLCanvasElement;
      canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
    });
    await expect2D(page);
    expect(fallbacks).toHaveLength(1);
  });

  test('an engine chunk that fails to load falls back', async ({ page }) => {
    // Chunk names differ between dev and production builds, so abort whichever chunk holds the engine.
    await page.route('**/_next/static/chunks/**', async (route) => {
      const res = await route.fetch();
      const body = await res.text();
      if (body.includes('UnrealBloomPass')) return route.abort();
      return route.fulfill({ response: res, body });
    });
    await page.goto(CITY);
    await expect2D(page);
  });
});

test.describe('2D fallback', () => {
  test('reduced motion renders TOPY.OS 2D', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(CITY);
    await expect(page.locator('#breach')).toBeAttached({ timeout: 30_000 });
    await expect(page.locator('.city')).toHaveCount(0);
    await context.close();
  });

  test('no WebGL renders TOPY.OS 2D', async ({ page }) => {
    await page.addInitScript(() => {
      type GetContext = (this: HTMLCanvasElement, type: string, ...rest: unknown[]) => unknown;
      const proto = HTMLCanvasElement.prototype as unknown as { getContext: GetContext };
      const orig = proto.getContext;
      proto.getContext = function (type, ...rest) {
        return /webgl/i.test(type) ? null : orig.call(this, type, ...rest);
      };
    });
    await page.goto(CITY);
    await expect(page.locator('#breach')).toBeAttached({ timeout: 30_000 });
    await expect(page.locator('.city')).toHaveCount(0);
  });

  test('a software renderer gets TOPY.OS 2D without ?city=force', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#breach')).toBeAttached({ timeout: 30_000 });
  });

  test('/os/ still renders TOPY.OS 2D', async ({ page }) => {
    await page.goto('/os/');
    await expect(page.locator('#breach')).toBeAttached();
    await expect(page.locator('.city')).toHaveCount(0);
    // The glitch copies are CSS-only: the name is in the DOM once and the boot title is not a heading.
    await expect(page.locator('h1')).toHaveCount(1);
    expect((await page.locator('h1').textContent())?.match(/TRAN NGOC/g)).toHaveLength(1);
    await expect(page.locator('h1, h2, h3').filter({ hasText: /^TOPY\.OS$/ })).toHaveCount(0);
  });
});
