import { test, expect } from '@playwright/test';

test.describe('Resume landing — smoke', () => {
  test('loads with no fatal console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      // Ignore resource 404s (dev server flakiness with HMR chunks); only
      // catch real JS errors.
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
  });

  test('hero name renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-beat="intro"]')).toContainText(/TRAN NGOC HAI/i);
  });

  test('all section anchors exist', async ({ page }) => {
    await page.goto('/');
    for (const id of ['hero', 'about', 'work', 'skills', 'contact']) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test('mailto + social + PDF links wired', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('link', { name: /tranngochai171@gmail.com/ })
    ).toHaveAttribute('href', 'mailto:tranngochai171@gmail.com');
    await expect(page.getByRole('link', { name: /LinkedIn/i })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/topytran'
    );
    await expect(page.getByRole('link', { name: /GitHub/i })).toHaveAttribute(
      'href',
      'https://github.com/tranngochai171'
    );
    await expect(page.getByRole('link', { name: /Download Resume/i })).toHaveAttribute(
      'href',
      '/resume/Topy_Tran_Resume_2026.pdf'
    );
  });

  test('reduced-motion: hero video stays paused on load', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const paused = await page.locator('video').first().evaluate((v: HTMLVideoElement) => v.paused);
    expect(paused).toBe(true);
    await context.close();
  });

  test('hero beats render at initial scroll (intro visible)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const intro = page.locator('[data-beat="intro"]');
    await expect(intro).toHaveText(/TRAN NGOC HAI/);
  });

  test('reduced-motion: portfolio + invitation beats present', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-beat="portfolio"]')).toContainText(/Dalmore/);
    await expect(page.locator('[data-beat="invitation"]')).toContainText(/See the work/i);
    await context.close();
  });

  test('about portrait renders with correct alt and dimensions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const portrait = page.locator('#about img[alt="Topy Tran"]');
    await expect(portrait).toBeVisible();
    await expect(portrait).toHaveAttribute('width', '480');
    await expect(portrait).toHaveAttribute('height', '600');
    await expect(portrait).toHaveAttribute('loading', 'lazy');
  });

  test('about portrait has AVIF and WebP sources', async ({ page }) => {
    await page.goto('/');
    const sources = page.locator('#about picture source');
    const count = await sources.count();
    expect(count).toBeGreaterThanOrEqual(4);
    const types = await sources.evaluateAll((els) =>
      els.map((e) => e.getAttribute('type'))
    );
    expect(types).toContain('image/avif');
    expect(types).toContain('image/webp');
  });

  test('reduced-motion: portrait renders without grayscale filter', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const wrapper = page.locator('[data-scroll-desaturate]').first();
    await expect(wrapper).toBeVisible();
    const filter = await wrapper.evaluate((el) => getComputedStyle(el).filter);
    expect(filter === 'none' || filter === '').toBe(true);
    await context.close();
  });

  test('analytics: resume_download fires on PDF click', async ({ page }) => {
    // Block the external Vercel analytics script so our window.va stub is not overwritten.
    await page.route('**/va.vercel-scripts.com/**', (route) => route.abort());
    await page.addInitScript(() => {
      (window as unknown as { __va: unknown[] }).__va = [];
      (window as unknown as { va: (...args: unknown[]) => void }).va = (
        ...args: unknown[]
      ) => {
        (window as unknown as { __va: unknown[][] }).__va.push(args);
      };
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const pdf = page.getByRole('link', { name: /Download Resume/i });
    await pdf.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault()));
    await pdf.click();

    const calls = await page.evaluate(
      () => (window as unknown as { __va: unknown[][] }).__va
    );
    const hit = calls.find(
      (c) => c[0] === 'event' && (c[1] as { name?: string }).name === 'resume_download'
    );
    expect(hit).toBeTruthy();
  });

  test('analytics: contact_social fires for GitHub click', async ({ page }) => {
    // Block the external Vercel analytics script so our window.va stub is not overwritten.
    await page.route('**/va.vercel-scripts.com/**', (route) => route.abort());
    await page.addInitScript(() => {
      (window as unknown as { __va: unknown[] }).__va = [];
      (window as unknown as { va: (...args: unknown[]) => void }).va = (
        ...args: unknown[]
      ) => {
        (window as unknown as { __va: unknown[][] }).__va.push(args);
      };
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const gh = page.getByRole('link', { name: /GitHub/i });
    await gh.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault()));
    await gh.click();

    const calls = await page.evaluate(
      () => (window as unknown as { __va: unknown[][] }).__va
    );
    const hit = calls.find(
      (c) =>
        c[0] === 'event' &&
        (c[1] as { name?: string; data?: { network?: string } }).name ===
          'contact_social' &&
        (c[1] as { data?: { network?: string } }).data?.network === 'github'
    );
    expect(hit).toBeTruthy();
  });

  test('analytics: section_view fires once for About after scroll', async ({ page }) => {
    // Block the external Vercel analytics script so our window.va stub is not overwritten.
    await page.route('**/va.vercel-scripts.com/**', (route) => route.abort());
    await page.addInitScript(() => {
      (window as unknown as { __va: unknown[] }).__va = [];
      (window as unknown as { va: (...args: unknown[]) => void }).va = (
        ...args: unknown[]
      ) => {
        (window as unknown as { __va: unknown[][] }).__va.push(args);
      };
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await page.locator('#hero').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const calls = await page.evaluate(
      () => (window as unknown as { __va: unknown[][] }).__va
    );
    const aboutHits = calls.filter(
      (c) =>
        c[0] === 'event' &&
        (c[1] as { name?: string; data?: { section?: string } }).name ===
          'section_view' &&
        (c[1] as { data?: { section?: string } }).data?.section === 'about'
    );
    expect(aboutHits).toHaveLength(1);
  });
});
