# Knowledge Base Articles

## Current Sources (October 2026)

Published pages live in `../html/`, including `en/` and `vn/` translations.
For managed guides, edit `../reviewed-guides.json` or `../workflow-guides.json`,
then run `node scripts/render-workflow-guides.mjs` from the repository root.
The renderer also synchronizes existing Czech Markdown drafts for these guides.
Screenshots remain in the HTML figures and are preserved during rendering.
Do not delete an existing illustrated HTML page before regenerating it.

Other reference articles are maintained directly in HTML; older Markdown drafts
below are not their publication source. Apply reference review notes with
`node scripts/review-reference-guides.mjs`, regenerate the sitemap with
`python3 scripts/generate-sitemap.py`, then run
`python3 scripts/check-kb-local.py` for coverage, metadata, links and assets.
The complete article review and its evidence are in
`../article-review-2026-10-23.json`.

## Historical Draft Structure

Tato složka obsahuje první pracovní verzi článků pro knowledge base `superhostem.cz`.

## Struktura

- `01-zaciname`
- `02-nemovitosti-a-kalendare`
- `03-rezervace-a-provoz`
- `04-trzby-a-finance`
- `05-automatizace-a-komunikace`
- `06-legislativa-v-cr`
- `07-reseni-problemu`
- `08-faq-a-slovnik`

## První vlna obsahu

V každé kategorii jsou zatím:

- `index.md` s účelem kategorie a seznamem prioritních článků
- 2 základní články jako startovací obsahový pattern

Další krok může být:

1. doplnit zbylé články v každé kategorii
2. sjednotit šablonu článků do jednoho reusable template
3. převést vybrané články do HTML detailů
