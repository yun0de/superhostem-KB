#!/usr/bin/env python3
"""Generate sitemap.xml at the repo root for the Superhostem knowledge base."""
from pathlib import Path
import subprocess

REPO_ROOT = Path(__file__).resolve().parent.parent
KB_DIR = REPO_ROOT / "knowledge base"
SITE = "https://knowledgebase.superhostem.cz"
SITEMAP_PATH = REPO_ROOT / "sitemap.xml"

def url_path_from_file(rel_path: str) -> str:
    """Return the public URL path for a file relative to KB_DIR."""
    # e.g. "html/index.html" -> "/knowledge-base/html/index.html"
    return f"/knowledge-base/{rel_path}"


def collect_html_files():
    """Collect every indexable knowledge-base page published under /html/."""
    return sorted(KB_DIR.glob("html/*.html")) + sorted(KB_DIR.glob("html/en/*.html")) + sorted(KB_DIR.glob("html/vn/*.html"))


def get_lastmod(file_path: Path):
    """Return the date of the last committed change to this source file.

    Filesystem mtimes are not reliable in CI: a fresh checkout would make every
    URL look newly modified on each deploy. The deploy workflow fetches history
    so this value remains truthful and stable between content changes.
    """
    result = subprocess.run(
        ["git", "log", "-1", "--format=%cs", "--", str(file_path)],
        cwd=REPO_ROOT,
        universal_newlines=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    date = result.stdout.strip()
    # A shallow CI checkout may not contain the commit that last changed an
    # untouched file. Omitting lastmod is more truthful than using the checkout
    # time; Google accepts sitemap entries without this optional field.
    return date or None


def lang_from_rel_path(rel_path: str) -> str:
    if rel_path.startswith("html/en/"):
        return "en"
    if rel_path.startswith("html/vn/"):
        return "vn"
    return "cs"


def main() -> None:
    files = collect_html_files()

    # Group translations by canonical name
    by_canonical = {}
    for file_path in files:
        rel_path = file_path.relative_to(KB_DIR).as_posix()
        lang = lang_from_rel_path(rel_path)
        filename = Path(rel_path).name
        canonical = f"html/{filename}"
        by_canonical.setdefault(canonical, {})[lang] = file_path

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]

    for canonical, lang_files in sorted(by_canonical.items()):
        alternates = []
        for lang, hreflang in [("cs", "cs"), ("en", "en"), ("vn", "vi")]:
            if lang in lang_files:
                lang_rel = lang_files[lang].relative_to(KB_DIR).as_posix()
                alternates.append((hreflang, f"{SITE}{url_path_from_file(lang_rel)}"))

        for lang_file in sorted(lang_files.values()):
            rel_path = lang_file.relative_to(KB_DIR).as_posix()
            lines.append("  <url>")
            lines.append(f"    <loc>{SITE}{url_path_from_file(rel_path)}</loc>")
            lastmod = get_lastmod(lang_file)
            if lastmod:
                lines.append(f"    <lastmod>{lastmod}</lastmod>")
            lines.append("    <changefreq>weekly</changefreq>")
            for hreflang, href in alternates:
                lines.append(f'    <xhtml:link rel="alternate" hreflang="{hreflang}" href="{href}" />')
            if "cs" in lang_files:
                cs_rel = lang_files["cs"].relative_to(KB_DIR).as_posix()
                lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{url_path_from_file(cs_rel)}" />')
            lines.append("  </url>")

    lines.append("</urlset>")

    SITEMAP_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"Generated {SITEMAP_PATH} with {len(files)} URLs.")


if __name__ == "__main__":
    main()
