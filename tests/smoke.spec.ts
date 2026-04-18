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
});
