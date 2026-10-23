import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlRoot = path.join(root, 'knowledge base/html');
const articles = ['workflow-guides.json', 'reviewed-guides.json']
  .filter(file => fs.existsSync(path.join(root, 'knowledge base', file)))
  .flatMap(file => JSON.parse(fs.readFileSync(path.join(root, 'knowledge base', file), 'utf8')));
const base = 'https://www.superhostem.cz/knowledge-base/html/';
const locales = { cs: '', en: 'en/', vi: 'vn/' };
const labels = {
  cs: { category: 'Praktické návody', home: 'Centrum nápovědy', library: 'Knihovna', related: 'Související návody', next: 'Další krok' },
  en: { category: 'Practical guides', home: 'Help centre', library: 'Library', related: 'Related guides', next: 'Next step' },
  vi: { category: 'Hướng dẫn thực tế', home: 'Trung tâm trợ giúp', library: 'Thư viện', related: 'Hướng dẫn liên quan', next: 'Bước tiếp theo' }
};
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const markdownFiles = fs.readdirSync(path.join(root, 'knowledge base/articles'), { recursive: true })
  .filter(file => file.endsWith('.md'));

for (const article of articles) {
  for (const [locale, prefix] of Object.entries(locales)) {
    const copy = article[locale];
    if (!copy) throw new Error(`Missing ${locale}: ${article.slug}`);
    const destination = path.join(htmlRoot, prefix, article.slug + '.html');
    const previous = fs.existsSync(destination) ? fs.readFileSync(destination, 'utf8') : '';
    const figureBlocks = article.keepFigures ? [...previous.matchAll(/<figure\b[\s\S]*?<\/figure>/g)].map(match => match[0]) : [];
    let template = fs.readFileSync(path.join(htmlRoot, prefix, 'co-je-ical.html'), 'utf8');
    template = template.replaceAll('co-je-ical.html', article.slug + '.html');
    const url = base + prefix + article.slug + '.html';
    const title = escape(copy.title);
    const description = escape(copy.lead);
    template = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${title} | Superhostem</title>`);
    template = template.replace(/(<meta (?:name|property)="(?:og:description|twitter:description|description)" content=")[^"]*/g, `$1${description}`);
    // Both social title tags must match the localized headline.
    template = template.replace(/(<meta (?:name|property)="(?:og:title|twitter:title)" content=")[^"]*/g, `$1${title}`);
    const schema = { '@context': 'https://schema.org', '@type': 'TechArticle', headline: copy.title, inLanguage: locale, mainEntityOfPage: { '@type': 'WebPage', '@id': url } };
    template = template.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
    const relatedItems = copy.related || article.relatedSlugs.map(slug => {
      const managed = articles.find(item => item.slug === slug)?.[locale]?.title;
      const existing = managed ? '' : fs.readFileSync(path.join(htmlRoot, prefix, slug + '.html'), 'utf8');
      const title = managed || existing.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '') || slug;
      return [slug, title];
    });
    const related = relatedItems.map(([slug, text]) => `<a class="kb-article-related-card" href="./${slug}.html"><span>${labels[locale].related}</span><strong>${escape(text)}</strong></a>`).join('\n');
    const nextSlugs = {
      'prvni-prihlaseni-a-orientace-v-uctu': 'jak-pridat-novou-nemovitost',
      'jak-pridat-novou-nemovitost': 'jak-funguji-automatizace-v-superhostem'
    };
    const nextSlug = nextSlugs[article.slug];
    const nextTitle = nextSlug && articles.find(item => item.slug === nextSlug)[locale].title;
    const nextCta = nextSlug ? `<a class="kb-article-next-cta" href="./${nextSlug}.html"><span class="kb-article-next-cta-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14"></path><path d="m5 12 7 7 7-7"></path></svg></span><span><strong>${escape(nextTitle)}</strong><small>${labels[locale].next}</small></span><svg class="kb-article-next-cta-arrow" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path></svg></a>` : '';
    const steps = (copy.steps || []).map((text, i) => `<li><span class="kb-article-flow-number">${i + 1}</span>${escape(text)}</li>`).join('\n');
    const content = copy.sections.map(section => {
      const figures = section.figures ? figureBlocks.filter(block => !section.figureMatch || block.includes(section.figureMatch)).join('\n') : '';
      return `<section><h2 id="${section.id}">${escape(section.title)}</h2>${section.html}${figures}</section>`;
    }).join('\n');
    const source = copy.source ? `<p><a href="${escape(copy.source.url)}" target="_blank" rel="noreferrer">${escape(copy.source.label)}</a></p>` : '';
    const articleHtml = `<article class="kb-article-main">
      <p class="kb-article-kicker">${labels[locale].category}</p>
      <h1 class="kb-article-title">${title}</h1>
      <p class="kb-article-lead">${description}</p>
      <div class="kb-article-jump"><a href="./index.html">${labels[locale].home}</a><a href="./index.html#knihovna">${labels[locale].library}</a></div>
      <div class="kb-article-divider"></div>
      <div class="kb-article-prose" id="kb-article-content">${steps ? `<ol class="kb-article-flow">${steps}</ol>` : ''}${content}${source}${nextCta}</div>
      <section class="kb-article-related" id="kb-article-related"><h2>${labels[locale].related}</h2><div class="kb-article-related-grid">${related}</div></section>
    </article>`;
    template = template.replace(/<article class="kb-article-main">[\s\S]*?<\/article>/, articleHtml);
    fs.writeFileSync(destination, template);
    const anchorSlugs = {
      'jak-poslat-online-check-in': 'jak-vest-evidenci-hostu-a-pobytu-v-superhostem',
      'jak-odeslat-hosty-do-ubyportu': 'jak-se-zaregistrovat-do-ubyportu',
      'jak-nastavit-automaticke-emaily': 'jak-funguji-automatizace-v-superhostem'
    };
    const indexPath = path.join(htmlRoot, prefix, 'index.html');
    let index = fs.readFileSync(indexPath, 'utf8');
    const titlePattern = new RegExp(`(<a href="\\./${article.slug}\\.html">)[^<]*(</a>)`, 'g');
    index = index.replace(titlePattern, (_, open, close) => `${open}${title}${close}`);
    if (!index.includes(`href="./${article.slug}.html"`)) {
      const anchor = new RegExp(`<a href="\\./${article.indexAfter || anchorSlugs[article.slug]}\\.html">[^<]*</a>`);
      if (!anchor.test(index)) throw new Error(`Missing index anchor: ${locale}/${article.slug}`);
      index = index.replace(anchor, match => `${match}\n              <a href="./${article.slug}.html">${title}</a>`);
    }
    fs.writeFileSync(indexPath, index);
  }
  const markdownFile = markdownFiles.find(file => path.basename(file) === article.slug + '.md');
  if (markdownFile) {
    const copy = article.cs;
    const sections = copy.sections.map(section => `## ${section.title}\n\n${section.html}`).join('\n\n');
    fs.writeFileSync(path.join(root, 'knowledge base/articles', markdownFile),
      `<!-- Generated from reviewed-guides.json / workflow-guides.json. Edit the JSON source. -->\n\n# ${copy.title}\n\n${copy.lead}\n\n${(copy.steps || []).map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\n${sections}\n`);
  }
}
console.log(`Rendered ${articles.length * 3} localized workflow guides.`);
