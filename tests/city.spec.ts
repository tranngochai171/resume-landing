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
  await expect(page.getByRole('link', { name: '2D VIEW' })).toBeVisible();
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
    await expect(page.getByRole('link', { name: '2D VIEW' })).toHaveAttribute('href', '/os/');
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
      await expect(panel).toBeVisible({ timeout: 90_000 });
      await expect(panel).toContainText(`FILE://${f.t}.dossier`);
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

  test('panel content is in the server HTML for crawlers', async ({ request }) => {
    const html = await (await request.get('/')).text();
    for (const f of FILES) expect(html).toContain(f.text.replace("'", '&#x27;'));
    expect(html).toContain('/images/work/dalmore-desktop.webp');
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
