import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.DASHBOARD_URL ?? 'http://127.0.0.1:3000';
const ids = ['geral', 'reg', 'saving', 'roi', 'req', 'comp', 'prot', 'cat', 'forn', 'rac', 'base'];
const reviewDir = resolve('.impeccable/review');
const errors = [];

async function downloadCsv(page, trigger, filename, firstHeader) {
  const [download] = await Promise.all([page.waitForEvent('download'), trigger()]);
  assert.equal(download.suggestedFilename(), filename);
  const path = await download.path();
  assert.ok(path, `${filename} has a downloadable file`);
  const contents = await readFile(path, 'utf8');
  assert.ok(contents.startsWith(`\uFEFF${firstHeader}`), `${filename} starts with UTF-8 BOM and expected header`);
  assert.ok(contents.includes('\r\n'), `${filename} contains CSV rows`);
  return contents;
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await mkdir(reviewDir, { recursive: true });

  const overviewText = await page.locator('.view.on').innerText();
  for (const value of ['R$ 57,3 mi', 'R$ 41,2 mi', 'R$ 4,0 mi', 'R$ 25 mil', '474']) {
    assert.ok(overviewText.includes(value), `overview shows ${value}`);
  }

  for (const { width, name } of [{ width: 1440, name: 'desktop' }, { width: 768, name: 'tablet' }, { width: 390, name: 'mobile' }]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ids) {
      await page.locator(`#tab-${id}`).click();
      await page.waitForFunction((expected) => document.querySelector('.view.on')?.id === `v-${expected}`, id);
      assert.ok(await page.locator(`#tab-${id}`).getAttribute('aria-selected') === 'true', `${id} tab is active`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `${id} has no page-level horizontal overflow at ${width}px`);
    }
    await page.locator('#tab-geral').click();
    await page.waitForTimeout(450);
    await page.screenshot({ path: resolve(reviewDir, `${name}.png`), fullPage: true, animations: 'disabled' });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#tab-geral').click();
  await page.locator('#tab-geral').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#tab-reg').getAttribute('aria-selected'), 'true');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#tab-geral').getAttribute('aria-selected'), 'true');
  const defaultSpend = await page.locator('.view.on .kpi').first().innerText();
  await page.getByRole('group', { name: 'Mês de criação' }).getByRole('button', { name: 'Fev', exact: true }).click();
  await page.getByRole('group', { name: 'Empresa' }).getByRole('button', { name: 'Poligraph', exact: true }).click();
  await page.getByRole('group', { name: 'Natureza' }).getByRole('button', { name: 'Só registros', exact: true }).click();
  assert.match(await page.locator('.pill-stat').nth(1).innerText(), /Fev.*Poligraph/);
  assert.notEqual(await page.locator('.view.on .kpi').first().innerText(), defaultSpend);
  await page.locator('#tab-roi').click();
  assert.deepEqual(await page.locator('.view.on table').last().locator('tbody tr td:nth-child(2)').allInnerTexts(),
    ['R$ 257,80', '5', 'R$ 1.289,02', '0,0 mês'], 'ROI operational opportunity follows filtered rationalization');
  await page.locator('#tab-geral').click();
  await page.locator('.filters .reset button').click();
  assert.equal(await page.locator('#fBusca').inputValue(), '');
  assert.match(await page.locator('.pill-stat').nth(1).innerText(), /Jan.?Jul/);
  assert.equal(await page.locator('.view.on .kpi').first().innerText(), defaultSpend);

  await page.locator('#fBusca').fill('Oracle');
  await page.waitForTimeout(280);
  await page.locator('#tab-req').click();
  assert.match(await page.locator('.view.on .tfoot').innerText(), /1–6 de 6 requisições/);
  await page.locator('.filters .reset button').click();
  await page.locator('#tab-req').click();
  await page.locator('.view.on .tfoot button:last-child').click();
  assert.match(await page.locator('.view.on .tfoot').innerText(), /51–100/);

  await page.locator('#tab-prot').click();
  await page.locator('.view.on .localfilter .chips button').nth(2).click();
  assert.match(await page.locator('.view.on .kpi').first().innerText(), /928/);
  await page.locator('.view.on .localfilter .chips button').first().click();
  assert.match(await page.locator('.view.on .kpi').first().innerText(), /2\.317/);
  await page.locator('.view.on .tfoot button:last-child').click();
  assert.match(await page.locator('.view.on .tfoot').innerText(), /2 \/ 47/);

  await page.locator('#tab-saving').click();
  assert.deepEqual(await page.locator('.view.on .ca-detail strong').allInnerTexts(), [
    '40% para 12,5%', 'Evento de Líderes', 'Fórum de MPs',
  ]);
  assert.equal((await page.locator('.view.on .ca-detail').allInnerTexts()).join(' ').includes('<strong>'), false);
  for (const id of ['comp', 'cat', 'req', 'prot']) {
    await page.locator(`#tab-${id}`).click();
    const header = page.locator('.view.on th[aria-sort]');
    await header.click();
    const direction = await header.getAttribute('aria-sort');
    const table = header.locator('xpath=ancestor::table');
    const rows = await table.locator('tbody tr').allInnerTexts();
    await page.locator('#tab-geral').click();
    await page.locator(`#tab-${id}`).click();
    assert.equal(await header.getAttribute('aria-sort'), direction, `${id} preserves sort across tabs`);
    assert.deepEqual(await table.locator('tbody tr').allInnerTexts(), rows, `${id} preserves sorted rows across tabs`);
    await page.locator('.filters .reset button').click();
    assert.equal(await header.getAttribute('aria-sort'), direction, `${id} preserves sort when clearing filters`);
  }

  await page.locator('#tab-cat').click();
  await page.locator('.view.on thead th').nth(1).click();
  const categoryNames = await page.locator('.view.on tbody tr td:first-child').allInnerTexts();
  assert.ok(categoryNames.indexOf('Facilities & Escritório') < categoryNames.indexOf('Telecom & Conectividade'),
    'category lines sort by displayed line count');

  await page.locator('#tab-base').click();
  const spendHeader = page.locator('.view.on thead th').nth(9);
  assert.equal(await spendHeader.getAttribute('aria-sort'), 'descending');
  await spendHeader.click();
  assert.equal(await spendHeader.getAttribute('aria-sort'), 'ascending');
  const baseCsv = await downloadCsv(page, () => page.locator('.view.on').getByRole('button', { name: 'Exportar CSV', exact: true }).click(), 'ocs_softplan_selecao.csv', '"OC";"Data"');
  const headerCsv = await downloadCsv(page, () => page.getByRole('button', { name: 'Exportar seleção (CSV)' }).click(), 'ocs_softplan_selecao.csv', '"OC";"Data"');
  assert.equal(headerCsv.split('\r\n')[1], baseCsv.split('\r\n')[1], 'header CSV follows current base-table sort');
  await page.locator('.view.on .tfoot button:last-child').click();
  assert.match(await page.locator('.view.on .tfoot').innerText(), /51–100 de 2\.656 linhas/);

  await page.locator('.filters .reset button').click();
  await downloadCsv(page, () => page.getByRole('button', { name: 'Exportar seleção (CSV)' }).click(), 'ocs_softplan_selecao.csv', '"OC";"Data"');
  await downloadCsv(page, () => page.locator('.view.on').getByRole('button', { name: 'Exportar CSV', exact: true }).click(), 'ocs_softplan_selecao.csv', '"OC";"Data"');
  await page.locator('#tab-req').click();
  await downloadCsv(page, () => page.locator('.view.on').getByRole('button', { name: 'Exportar CSV', exact: true }).click(), 'requisicoes_unicas_selecao.csv', '"Numero";"Origem do dado"');
  await page.locator('#tab-prot').click();
  await downloadCsv(page, () => page.locator('.view.on').getByRole('button', { name: 'Exportar CSV', exact: true }).click(), 'notas_protocoladas_selecao.csv', '"Data";"Hora";"Dia da semana"');

  assert.deepEqual(errors, [], 'dashboard has no uncaught browser errors');
  console.log('Dashboard smoke passed: 11 tabs, 3 viewports, filters, search, emphasis, sorting, pagination and CSV downloads.');
  await context.close();
} finally {
  await browser.close();
}
