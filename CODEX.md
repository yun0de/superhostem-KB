# Codex Notes

## Project

This repo is `superhostem-KB`, a static knowledge base for Superhostem.

- Main content lives in `knowledge base/`.
- Public-compatible alias `knowledge-base` points to `knowledge base`.
- HTML output lives in `knowledge base/html/`.
- Shared CSS: `knowledge base/assets/superhostem.css`.
- Shared JS: `knowledge base/assets/kb-navigation.js`.
- Active `origin`: `https://github.com/vojtatranta/knowledgebase-superhostem.git`.
- The old yun0de repository is `legacy`, with pushing disabled.

## October 2026 Review

- Review ledger: `knowledge base/article-review-2026-10-23.json`; covers all 33 topics in CZ/EN/VI, including seven new topics after the earlier workflow draft.
- Evidence: application commit `79a08894609a36971763644696d5a3cb6f1a17be` and official external references, not every signed-in production screen.
- Managed guide sources: `knowledge base/reviewed-guides.json` and `workflow-guides.json`.
- Build: `node scripts/render-workflow-guides.mjs`, then `node scripts/review-reference-guides.mjs`, then `python3 scripts/generate-sitemap.py`.
- Checks: `python3 scripts/check-kb-local.py`; browser audit `node scripts/check-kb-browser.mjs` requires a running root preview and Playwright session (`kb-review`, default port 8092).
- HTML review report: `output/kb-review-2026-10-23.html`.
- Light is the fresh-visit default, regardless of OS theme. Explicit user choices remain supported under `superhostem-kb-theme-v2`.
- All 24 existing screenshot references retained. Managed illustrated HTML must not be deleted before regenerating: figures are preserved from existing files.
- Current changes remain local on `codex/kb-refresh-2026-10`; no deployment was performed.
- **Canonical deployment:** canonical URLs, sitemaps, robots.txt and SEO audit are aligned to `https://www.superhostem.cz`, completing the migration from upstream `9b3533e` across all refreshed and new multilingual guides.

## Local Preview

Serve from `knowledge base/`, not from `knowledge base/html/`.

```sh
cd "/Users/phnguyen/Documents/Projects/superhostem-KB/knowledge base"
python3 -m http.server 8080
```

Main URL:

```text
http://localhost:8080/html/index.html
```

## Recent Work Summary

- Added missing index links for city fee articles.
- Added root redirect `knowledge base/index.html`.
- Expanded article `co-vsechno-najdu-v-detailu-rezervace` in CZ/EN/VN.
- Added CTA to message automation in that reservation detail article.
- Styled article CTA link lists (`.kb-article-link-list`) as cards.
- Styled rich article CTA component (`.kb-article-next-cta`).
- Added homepage live search suggestions with keyboard support.
- Fixed homepage anchor navigation around `Začínáme`, `Knihovna`, `Nejčtenější`.
- Changed language switcher to globe dropdown, like main `superhostem.cz`.
- Changed light/dark switcher to compact dropdown.
- Rolled header menu CSS/JS cache-bust across all 66 HTML files.
- Fixed `jak-pridat-novou-nemovitost` tip blocks by adding `.kb-article-tip` CSS.

## Important Checks

Useful checks before commit/push:

```sh
git diff --check
node --check "knowledge base/assets/kb-navigation.js"
bash scripts/check-kb-publish-safety.sh
```

The index consistency check now passes in all three languages.

## Git Notes

Git remote push can succeed while local `origin/main` ref update fails with:

```text
cannot lock ref 'refs/remotes/origin/main'
```

When that happens, verify remote with:

```sh
git ls-remote origin refs/heads/main
git rev-parse HEAD
```

If SHA matches, push is OK even if `git status` says `ahead`.

## Untracked Files

Do not accidentally commit:

- `.DS_Store`
- `knowledge base/articles/.DS_Store`
- AIDesigner/Codex setup files unless explicitly wanted:
  - `.agents/`
  - `.aidesigner/`
  - `.claude/`
  - `.codex/`
  - `.mcp.json`

## AIDesigner State

AIDesigner init was attempted.

- Project config files were created locally.
- MCP login succeeded once.
- Current session did not hot-load AIDesigner tools.
- Fresh Codex session may be needed for AIDesigner MCP.

## Latest Published Commit

Latest pushed fix:

```text
c4409e9 fix: style add-property article tips
```
