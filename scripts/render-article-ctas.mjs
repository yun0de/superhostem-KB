import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { updateArticleCta } from './lib/article-cta.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlRoot = path.join(root, 'knowledge base/html');
let count = 0;
for (const [locale, prefix] of Object.entries({ cs: '', en: 'en', vi: 'vn' })) {
  for (const filename of fs.readdirSync(path.join(htmlRoot, prefix))) {
    if (!filename.endsWith('.html') || filename === 'index.html') continue;
    const file = path.join(htmlRoot, prefix, filename);
    let html = updateArticleCta(fs.readFileSync(file, 'utf8'), filename.slice(0, -5), locale);
    html = html.replace(/superhostem\.css\?v=[^"\s]+/g, 'superhostem.css?v=article-ctas-20261103');
    fs.writeFileSync(file, html);
    count++;
  }
}
console.log(`Rendered main-site CTAs on ${count} localized article pages.`);
