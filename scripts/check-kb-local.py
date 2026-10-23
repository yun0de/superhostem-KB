#!/usr/bin/env python3
"""Validate the complete local KB and render an evidence-backed review report."""

import html
import json
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import unquote, urldefrag, urljoin, urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / 'knowledge base/html'
REVIEW = json.loads((ROOT / 'knowledge base/article-review-2026-10-23.json').read_text())
BASE = REVIEW['canonicalBase']
LOCALES = {'cs': '', 'en': 'en/', 'vi': 'vn/'}


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.canonical, self.alternates, self.og = [], [], []
        self.links, self.assets, self.ids = [], [], []
        self.language = ''
        self.h1 = 0
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'html':
            self.language = attrs.get('lang')
        if tag == 'h1':
            self.h1 += 1
        if tag == 'link':
            if attrs.get('rel') == 'canonical':
                self.canonical.append(attrs.get('href'))
            if attrs.get('hreflang'):
                self.alternates.append((attrs['hreflang'], attrs.get('href')))
            if attrs.get('rel') == 'stylesheet':
                self.assets.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('property') == 'og:url':
            self.og.append(attrs.get('content'))
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag in {'img', 'script'} and attrs.get('src'):
            self.assets.append(attrs['src'])


def main():
    errors = []
    expected_slugs = {item['slug'] for item in REVIEW['articles']}
    if len(expected_slugs) != len(REVIEW['articles']):
        errors.append('Duplicate review ledger entries')
    pages = {file.relative_to(HTML).as_posix(): Page(file.read_text()) for file in HTML.rglob('*.html')}
    sitemap = ET.parse(ROOT / 'sitemap.xml')
    urls = [node.text for node in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    expected_urls = {BASE + file for file in pages}
    if set(urls) != expected_urls or len(urls) != len(expected_urls):
        errors.append('Sitemap inventory differs from local HTML')
    for locale, prefix in LOCALES.items():
        slugs = {Path(file).stem for file in pages if Path(file).parent.as_posix() == (prefix.rstrip('/') or '.') and Path(file).stem != 'index'}
        if slugs != expected_slugs:
            errors.append(f'{locale}: article inventory differs: {slugs ^ expected_slugs}')
        index = pages[prefix + 'index.html']
        index_targets = {urldefrag(urljoin(BASE + prefix + 'index.html', link))[0] for link in index.links}
        for slug in expected_slugs:
            if BASE + prefix + slug + '.html' not in index_targets:
                errors.append(f'{locale}: missing index link: {slug}')
    links_checked = 0
    assets_checked = 0
    for file, page in pages.items():
        url = BASE + file
        prefix = file.split('/')[0] + '/' if '/' in file else ''
        locale = next(key for key, value in LOCALES.items() if value == prefix)
        expected_alternates = [(key, BASE + value + Path(file).name) for key, value in LOCALES.items()]
        expected_alternates.append(('x-default', BASE + Path(file).name))
        checks = {
            'canonical': page.canonical == [url],
            'og:url': page.og == [url],
            'hreflang': sorted(page.alternates) == sorted(expected_alternates),
            'html lang': page.language == locale,
            'single h1': page.h1 == 1,
            'unique IDs': len(page.ids) == len(set(page.ids)),
        }
        for check, passed in checks.items():
            if not passed:
                errors.append(f'{file}: {check}')
        for link in page.links + page.assets:
            absolute, fragment = urldefrag(urljoin(url, link))
            parsed = urlparse(absolute)
            if parsed.netloc != urlparse(BASE).netloc:
                continue
            site_path = unquote(parsed.path)
            if site_path.startswith('/knowledge-base/'):
                target = ROOT / 'knowledge base' / site_path.removeprefix('/knowledge-base/')
            else:
                target = ROOT / site_path.lstrip('/')
            if not target.exists():
                errors.append(f'{file}: missing target {link}')
            if link in page.assets:
                assets_checked += 1
            else:
                links_checked += 1
                if fragment and site_path.startswith('/knowledge-base/html/'):
                    target_page = pages.get(site_path.removeprefix('/knowledge-base/html/'))
                    if target_page and fragment not in target_page.ids:
                        errors.append(f'{file}: missing fragment {link}')
    for source in ['workflow-guides.json', 'reviewed-guides.json']:
        for guide in json.loads((ROOT / 'knowledge base' / source).read_text()):
            # Anchor names are localized; compare section and workflow coverage.
            shapes = [(len(guide[locale]['sections']), len(guide[locale].get('steps', []))) for locale in LOCALES]
            if any(shape != shapes[0] for shape in shapes):
                errors.append(f'{guide["slug"]}: localized section/step coverage differs')
    print(f'{len(expected_slugs)} topics, {len(pages)} pages, {links_checked} links, {assets_checked} assets; {len(errors)} errors.')
    for error in errors:
        print(error)
    render_report(len(pages), errors)
    return bool(errors)


def render_report(page_count, errors):
    esc = html.escape
    browser_file = ROOT / 'output/playwright/kb-browser-review.json'
    browser = json.loads(browser_file.read_text()) if browser_file.exists() else None
    browser_summary = f'{browser["checked"]} page/viewport checks; {len(browser["failures"])} failures. See output/playwright/kb-browser-review.json.' if browser else 'Not run.'
    rows = []
    for article in REVIEW['articles']:
        links = ' · '.join(f'<a href="../knowledge%20base/html/{prefix}{article["slug"]}.html">{locale.upper()}</a>' for locale, prefix in LOCALES.items())
        evidence = []
        for group in article['sources']:
            for source in REVIEW['sourceGroups'][group]:
                url = source if source.startswith('https://') else f'https://github.com/{REVIEW["applicationRepository"]}/blob/{REVIEW["applicationCommit"]}/{source}'
                evidence.append(f'<a href="{esc(url)}">{esc(group)}: {esc(source)}</a>')
        rows.append(f'<tr><td><strong>{esc(article["slug"])}</strong><br>{links}</td><td>{esc(article["outcome"])}</td><td>{esc(article["change"])}<details><summary>Evidence</summary>{"<br>".join(evidence)}</details></td></tr>')
    counts = Counter(article['outcome'] for article in REVIEW['articles'])
    report = f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KB Review — {REVIEW['reviewedAt']}</title>
<style>body{{margin:0;background:#f4f7f6;color:#183631;font:16px/1.6 Georgia,serif}}main{{max-width:1200px;margin:auto;padding:40px 24px}}h1{{font-size:40px;line-height:1.1}}a{{color:#006f64;overflow-wrap:anywhere}}table{{border-collapse:collapse;width:100%;background:white}}td,th{{padding:16px;text-align:left;border-bottom:1px solid #d5e3df;vertical-align:top}}td:first-child{{width:35%;overflow-wrap:anywhere}}summary{{cursor:pointer}}details{{font-size:13px;margin-top:12px}}.note{{border-left:4px solid #008f7a;padding:16px;background:#e6f1ee}}@media(max-width:700px){{tr,td,th{{display:block}}td:first-child{{width:auto}}thead{{display:none}}}}</style>
<main><h1>Superhostem KB Review</h1><p>{REVIEW['reviewedAt']} · {len(REVIEW['articles'])} topics · {page_count} localized pages, including indexes.</p><p>{counts['updated']} updated · {counts['reviewed']} reviewed · {counts['new']} new topics since the previous draft audit. Three previously drafted workflow guides are included in the reviewed count.</p>
<div class="note"><strong>Scope and limits</strong><ul>{''.join(f'<li>{esc(limit)}</li>' for limit in REVIEW['limits'])}</ul><p>Application source: <code>{REVIEW['applicationCommit']}</code>. Local validation: {len(errors)} errors. These changes are local, not deployed.</p></div>
<p><a href="../knowledge%20base/html/index.html">Open Czech homepage</a> · <a href="../knowledge%20base/html/en/index.html">English</a> · <a href="../knowledge%20base/html/vn/index.html">Vietnamese</a></p>
<p><strong>Browser audit:</strong> {esc(browser_summary)} This checks rendering and theme behaviour, not the accuracy of every product instruction.</p>
<h2>Complete Article Inventory</h2><table><thead><tr><th>Article / Preview</th><th>Outcome</th><th>Review Result</th></tr></thead><tbody>{''.join(rows)}</tbody></table>
<h2>Publication Checks Still Required</h2><p>Resolve the canonical-domain difference against upstream commit 9b3533e before merging. Verify account-gated workflows in an enabled production account. After deployment, run the production SEO audit and check public URLs; local checks do not prove live deployment.</p></main></html>'''
    destination = ROOT / 'output/kb-review-2026-10-23.html'
    destination.parent.mkdir(exist_ok=True)
    destination.write_text(report)


if __name__ == '__main__':
    sys.exit(main())
