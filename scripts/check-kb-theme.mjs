import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlRoot = path.join(root, 'knowledge base/html');
const files = fs.readdirSync(htmlRoot, { recursive: true }).filter(file => file.endsWith('.html'));
let checks = 0;

function run(code, preference, systemDark, blockedStorage = false) {
  let dark;
  const style = {};
  vm.runInNewContext(code, {
    document: {
      documentElement: { classList: { toggle: (_, value) => { dark = value; } }, style },
      querySelectorAll: () => []
    },
    localStorage: {
      getItem(key) {
        if (blockedStorage) throw new Error('Storage disabled');
        // An old automatic-dark preference must not override a fresh light default.
        return key === 'superhostem-kb-theme' ? 'system' : preference;
      }
    },
    window: { matchMedia: () => ({ matches: systemDark }) }
  });
  return { dark, scheme: style.colorScheme };
}

function check(code, label) {
  for (const systemDark of [false, true]) {
    for (const preference of [null, 'light', 'dark', 'system']) {
      const expected = preference === 'dark' || (preference === 'system' && systemDark);
      const result = run(code, preference, systemDark);
      assert.equal(result.dark, expected, label);
      assert.equal(result.scheme, expected ? 'dark' : 'light', label);
      checks++;
    }
  }
  assert.equal(run(code, null, true, true).dark, false, `${label}: blocked storage`);
  checks++;
}

for (const file of files) {
  const html = fs.readFileSync(path.join(htmlRoot, file), 'utf8');
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).find(code => code.includes('prefers-color-scheme'));
  assert.ok(script, `${file}: missing theme bootstrap`);
  check(script, file);
}
const navigation = fs.readFileSync(path.join(root, 'knowledge base/assets/kb-navigation.js'), 'utf8');
const boundary = navigation.indexOf('  const bindThemeToggle =');
assert.ok(boundary > 0, 'Shared theme function boundary missing');
check(navigation.slice(0, boundary) + '\napplyTheme(getThemePreference());\n})();', 'Shared navigation');

const legacyPages = ['knowledge-base-site.html', 'knowledge-base-concept.html', 'knowledge-base-categories.html', 'articles/knowledge-base-library.html'];
for (const file of legacyPages) {
  const html = fs.readFileSync(path.join(root, 'knowledge base', file), 'utf8');
  assert.ok(!/<html\b[^>]*class="[^"]*\bdark\b/.test(html), `${file}: forced dark mode`);
  checks++;
}
console.log(`${files.length} current pages, shared theme logic and ${legacyPages.length} legacy pages: ${checks} checks passed.`);
