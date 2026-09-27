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
    await expect(page.getByRole('button', { name: /IGNITE/ })).toBeVisible();
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

  test('the loader paints with the server HTML and SKIP works while the city is still starting', async ({ page, request }) => {
    const html = await (await request.get(CITY)).text();
    expect(html).toContain('city-load-pct');
    // Hold the engine download until SKIP has been pressed, so the click lands before the city exists.
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    await page.route('**/_next/static/chunks/**', async (route) => {
      const res = await route.fetch();
      const body = await res.text();
      if (body.includes('UnrealBloomPass')) await held;
      return route.fulfill({ response: res, body });
    });
    await page.goto(CITY);
    await expect(page.locator('.city-boot')).toBeVisible();
    await page.getByRole('button', { name: /SKIP/ }).click();
    release();
    await expect(page.getByRole('button', { name: /IGNITE|START AUTOPILOT TOUR/ })).toBeVisible({ timeout: 60_000 });
  });

  test('panel content is in the server HTML for crawlers', async ({ request }) => {
    const html = await (await request.get('/')).text();
    for (const f of FILES) expect(html).toContain(f.text.replace("'", '&#x27;'));
    expect(html).toContain('/images/work/dalmore-desktop.webp');
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
  });
});
