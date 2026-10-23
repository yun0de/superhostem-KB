import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlRoot = path.join(root, 'knowledge base/html');
const files = fs.readdirSync(htmlRoot, { recursive: true }).filter(file => file.endsWith('.html'));
const cli = path.join(process.env.HOME, '.codex/skills/playwright/scripts/playwright_cli.sh');
const session = process.env.KB_BROWSER_SESSION || 'kb-review';
const origin = process.env.KB_PREVIEW_ORIGIN || 'http://127.0.0.1:8092';
const code = `async (page) => {
  const files = ${JSON.stringify(files)};
  const failures = [];
  let checked = 0;
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto(${JSON.stringify(origin)} + '/knowledge-base/html/index.html');
  await page.evaluate(() => localStorage.clear());
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const file of files) {
      const response = await page.goto(${JSON.stringify(origin)} + '/knowledge-base/html/' + file);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
      });
      const result = await page.evaluate(() => ({
        dark: document.documentElement.classList.contains('dark'),
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        brokenImages: [...document.images].filter(image => !image.naturalWidth).map(image => image.getAttribute('src')),
        badNumberBadges: [...document.querySelectorAll('.kb-ubyport-flow-number')].filter(element => getComputedStyle(element).display !== 'grid').length,
        headings: document.querySelectorAll('h1').length
      }));
      checked++;
      if (response.status() !== 200 || result.dark || result.overflow || result.brokenImages.length || result.badNumberBadges || result.headings !== 1) failures.push({ file, width, status: response.status(), ...result });
    }
  }
  await page.goto(${JSON.stringify(origin)} + '/knowledge-base/html/jak-se-zaregistrovat-do-ubyportu.html');
  for (const preference of ['dark', 'light', 'system']) {
    await page.evaluate(value => localStorage.setItem('superhostem-kb-theme-v2', value), preference);
    await page.reload();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (isDark !== (preference !== 'light')) failures.push({ preference, isDark });
  }
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  return { checked, failures };
}`;
const result = spawnSync(cli, [`-s=${session}`, 'run-code', code], { cwd: root, encoding: 'utf8', timeout: 300000, maxBuffer: 2 * 1024 * 1024 });
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
const match = result.stdout?.match(/### Result\s*\n([^\n]+)/);
if (!match) process.exit(1);
const report = JSON.parse(match[1]);
fs.mkdirSync(path.join(root, 'output/playwright'), { recursive: true });
fs.writeFileSync(path.join(root, 'output/playwright/kb-browser-review.json'), JSON.stringify(report, null, 2) + '\n');
process.exit(result.status || (report.failures.length ? 1 : 0));
