// Run against a local server with an existing Playwright installation; no application dependency required.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3001/', { waitUntil: 'networkidle' });
    const map = page.locator('.region-map');
    await map.getByRole('button', { name: 'Perbesar peta', exact: true }).waitFor();
    await page.locator('.analytics-chart svg').first().waitFor();
    const year = page.locator('.year-multi-select');
    await year.locator('summary').click();
    await year.getByLabel('2023', { exact: true }).check();
    await year.press('Escape');
    assert.equal(await year.getAttribute('open'), null);
    await map.getByRole('button', { name: '2023', exact: true }).click();
    assert.equal(await map.getByRole('button', { name: '2023', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Aceh', exact: true }).click();
    await page.locator('.public-region-summary').getByRole('heading', { name: 'Aceh', exact: true }).waitFor();
    // Recreate an already populated map: cached source keys must not suppress its data update.
    await map.locator('canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
    await map.getByText('Peta tidak dapat ditampilkan', { exact: true }).waitFor();
    await map.getByRole('button', { name: 'Coba lagi' }).click();
    await map.getByRole('button', { name: 'Perbesar peta', exact: true }).waitFor();
    await page.waitForTimeout(1500);
    if (process.env.TEST_SCREENSHOTS) await map.screenshot({ path: `${process.env.TEST_SCREENSHOTS}/map-retry.png` });
    await page.getByRole('searchbox', { name: 'Cari wilayah' }).fill('wilayah-tidak-ada');
    await map.getByText('Tidak ada wilayah sesuai filter').waitFor();
    await page.locator('.public-analysis').getByText('Tidak ada hasil', { exact: true }).waitFor();
    await page.locator('.public-analysis').getByRole('button', { name: 'Reset filter' }).click();
    await page.getByRole('button', { name: 'Halaman berikutnya' }).click();
    await page.getByText('11–20 dari 38', { exact: true }).waitFor();
    for (const width of [1440, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator('#peta').scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
      if (process.env.TEST_SCREENSHOTS) await page.screenshot({ path: `${process.env.TEST_SCREENSHOTS}/analytics-${width}.png` });
    }
    await page.locator('#perbandingan').scrollIntoViewIfNeeded();
    if (process.env.TEST_SCREENSHOTS) await page.screenshot({ path: `${process.env.TEST_SCREENSHOTS}/trend-mobile.png` });
    await page.getByRole('button', { name: 'Filter', exact: true }).click();
    await page.getByRole('button', { name: 'Reset filter', exact: true }).click();
    await page.getByRole('button', { name: 'Kabupaten/Kota', exact: true }).click();
    await page.getByText(/514 wilayah ditampilkan/).waitFor();
    for (const name of ['Kapasitas Fiskal Daerah', 'Evaluasi Penyelenggaraan Pemerintahan Daerah', 'Persentase Penduduk Miskin']) {
      await page.getByRole('combobox', { name: 'Indikator', exact: true }).click();
      await page.getByRole('option', { name: new RegExp(name) }).click();
      await page.locator('.public-map-panel').getByRole('heading', { name, exact: true }).waitFor();
    }
    await page.getByRole('combobox', { name: 'Periode', exact: true }).click();
    await page.getByRole('option', { name: 'September', exact: true }).click();
    const offline = await browser.newPage();
    await offline.route('**/data/region-boundaries.json', route => route.abort());
    await offline.goto(process.env.TEST_URL || 'http://127.0.0.1:3001/');
    await offline.getByText('Peta tidak dapat ditampilkan', { exact: true }).waitFor();
    if (process.env.TEST_SCREENSHOTS) await offline.locator('.region-map').screenshot({ path: `${process.env.TEST_SCREENSHOTS}/map-error.png` });
    await offline.unroute('**/data/region-boundaries.json');
    await offline.getByRole('button', { name: 'Coba lagi' }).click();
    await offline.getByRole('button', { name: 'Perbesar peta', exact: true }).waitFor();
    await offline.close();
    assert.deepEqual(errors, []);
    console.log('PASS: map load/retry, year keyboard control, region selection, empty/reset, pagination, district level, and 4 responsive widths.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
