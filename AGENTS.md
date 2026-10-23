# AGENTS.md

Instructions for AI agents and coding assistants working in this repository.

## Site URL

The production site is deployed at:

```
https://knowledgebase.superhostem.cz
```

## URL structure

All HTML pages are served under the `/knowledge-base/html/` path prefix. Always use this base when constructing absolute URLs (e.g. in `og:url` meta tags, sitemaps, redirects, or any other references):

```
https://knowledgebase.superhostem.cz/knowledge-base/html/<filename>.html
```

### Language subfolders

| Language | Path prefix |
|----------|-------------|
| Czech (default) | `/knowledge-base/html/` |
| English | `/knowledge-base/html/en/` |
| Vietnamese | `/knowledge-base/html/vn/` |

### Examples

```
https://knowledgebase.superhostem.cz/knowledge-base/html/index.html
https://knowledgebase.superhostem.cz/knowledge-base/html/en/index.html
https://knowledgebase.superhostem.cz/knowledge-base/html/vn/index.html
https://knowledgebase.superhostem.cz/knowledge-base/html/jak-funguje-napojeni-pres-ical.html
```

## What NOT to do

- **Do not** use `/html/` as the path prefix — this will result in broken links.
- **Do not** use relative paths in `og:url` or other absolute URL fields.

## SEO requirements

Treat SEO as a required acceptance check for every change that affects HTML, URLs,
metadata, navigation, or content. Before completing such a change, verify that
canonical URLs, Open Graph URLs, sitemap entries, and internal links use the
production URL structure above and resolve correctly.

For changes to localized pages, perform an additional multilingual SEO review:

- Each page must have exactly one self-referencing canonical URL.
- Each set of equivalent translations must include reciprocal HTML `hreflang`
  annotations for every available language and `x-default` should point to the
  Czech default page.
- Use valid language codes: `cs` for Czech, `en` for English, and `vi` for
  Vietnamese. The `/vn/` directory name is a URL path, not an hreflang code.
- Only connect genuinely equivalent, fully localized main content with
  `hreflang`; update all translations together or remove the relationship until
  they are equivalent.
- Do not let translated titles, descriptions, headings, or body copy target a
  Czech keyword unless that Czech wording is intentional for that language.
- Regenerate and validate `sitemap.xml` after URL or language changes, and
  check local links and fragment anchors for broken targets.

## Build output

The deploy workflow (`/.github/workflows/deploy-pages.yml`) copies all HTML files into `_site/knowledge-base/html/`. The source files live in `knowledge base/html/` (with a space) in this repo.
