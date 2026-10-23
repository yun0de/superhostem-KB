#!/usr/bin/env python3
"""Audit the production sitemap and its indexability signals.

Uses only the Python standard library so it can run locally and in CI:
    python3 scripts/audit-seo.py
"""

import argparse
import sys
import time
import xml.etree.ElementTree as ET
from collections import defaultdict
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urldefrag, urljoin, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener


DEFAULT_SITEMAP = "https://knowledgebase.superhostem.cz/sitemap.xml"
USER_AGENT = "SuperhostemSEOAudit/1.0 (+https://knowledgebase.superhostem.cz/)"


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonicals = []
        self.hreflang = {}
        self.robots = []
        self.links = []
        self.anchors = set()
        self.in_title = False
        self.title_parts = []

    def handle_starttag(self, tag, attrs):
        attributes = {key.lower(): value or "" for key, value in attrs}
        if attributes.get("id"):
            self.anchors.add(attributes["id"])
        if attributes.get("name"):
            self.anchors.add(attributes["name"])
        if tag == "title":
            self.in_title = True
        if tag == "a" and attributes.get("href"):
            self.links.append(attributes["href"])
        if tag == "link" and attributes.get("rel", "").lower() == "canonical":
            self.canonicals.append(attributes.get("href", ""))
        if tag == "link" and attributes.get("rel", "").lower() == "alternate" and attributes.get("hreflang"):
            self.hreflang[attributes["hreflang"].lower()] = attributes.get("href", "")
        if tag == "meta" and attributes.get("name", "").lower() in {"robots", "googlebot"}:
            self.robots.append(attributes.get("content", "").lower())

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title_parts.append(data)

    @property
    def title(self):
        return " ".join("".join(self.title_parts).split())


def fetch(url, timeout):
    last_error = None
    for attempt in range(3):
        request = Request(url, headers={"User-Agent": USER_AGENT})
        try:
            response = build_opener(NoRedirect).open(request, timeout=timeout)
            return response.status, dict(response.headers.items()), response.read().decode("utf-8", "replace")
        except HTTPError as error:
            return error.code, dict(error.headers.items()), error.read().decode("utf-8", "replace")
        except (URLError, OSError) as error:
            last_error = error
            if attempt < 2:
                time.sleep(0.5)
    return 0, {}, str(last_error)


def normalized(url):
    return urldefrag(url)[0]


def language_key(url):
    path = urlparse(url).path
    if "/html/en/" in path:
        return "en", path.replace("/html/en/", "/html/", 1)
    if "/html/vn/" in path:
        return "vi", path.replace("/html/vn/", "/html/", 1)
    return "cs", path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sitemap", default=DEFAULT_SITEMAP)
    parser.add_argument("--timeout", type=int, default=20)
    args = parser.parse_args()

    status, _, body = fetch(args.sitemap, args.timeout)
    if status != 200:
        print(f"SITEMAP ERROR: HTTP {status} {args.sitemap}")
        return 1
    try:
        root = ET.fromstring(body)
    except ET.ParseError as error:
        print(f"SITEMAP ERROR: invalid XML: {error}")
        return 1

    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [node.text.strip() for node in root.findall("sm:url/sm:loc", namespace) if node.text]
    if not urls:
        print("SITEMAP ERROR: no <loc> entries")
        return 1

    sitemap_set = set(urls)
    host = urlparse(args.sitemap).netloc
    groups = defaultdict(dict)
    for url in urls:
        language, key = language_key(url)
        groups[key][language] = url

    pages = {}
    reports = {}
    inbound = defaultdict(int)
    internal_links = []

    for url in urls:
        errors = []
        status, headers, html = fetch(url, args.timeout)
        page = PageParser()
        if status == 200:
            page.feed(html)
            canonical = [normalized(urljoin(url, value)) for value in page.canonicals]
            if canonical != [url]:
                errors.append(f"canonical is {canonical or 'missing'}, not self")
            if any("noindex" in value for value in page.robots):
                errors.append("robots meta contains noindex")
            if "noindex" in headers.get("X-Robots-Tag", "").lower():
                errors.append("X-Robots-Tag contains noindex")
            if not page.title:
                errors.append("missing title")

            language, key = language_key(url)
            expected = groups[key]
            if len(expected) > 1:
                for expected_language, expected_url in expected.items():
                    if page.hreflang.get(expected_language) != expected_url:
                        errors.append(f"hreflang {expected_language} missing or incorrect")
                if "cs" in expected and page.hreflang.get("x-default") != expected["cs"]:
                    errors.append("hreflang x-default missing or incorrect")

            for href in page.links:
                target, fragment = urldefrag(urljoin(url, href))
                parsed_target = urlparse(target)
                if parsed_target.scheme in {"http", "https"} and parsed_target.netloc == host:
                    internal_links.append((url, target, fragment))
                    if target in sitemap_set:
                        inbound[target] += 1
        else:
            errors.append(f"HTTP {status or 'timeout'}")
        pages[url] = page
        reports[url] = errors

    targets_checked = set()
    for source, target, fragment in internal_links:
        if target not in targets_checked and target not in pages:
            targets_checked.add(target)
            status, _, _ = fetch(target, args.timeout)
            if status != 200:
                reports[source].append(f"broken internal link: {target} (HTTP {status or 'timeout'})")
        if fragment and target in pages and fragment not in pages[target].anchors:
            reports[source].append(f"broken fragment: {target}#{fragment}")

    for url in urls:
        if inbound[url] == 0:
            reports[url].append("orphan sitemap URL: no internal HTML link found")

    failures = 0
    for url in urls:
        page = pages[url]
        errors = reports[url]
        language, key = language_key(url)
        expected_hreflang = "/".join(sorted(groups[key])) if len(groups[key]) > 1 else "N/A"
        print(url)
        print(f"  HTTP: {'200' if not any(error.startswith('HTTP') for error in errors) else errors[0]}")
        print(f"  INDEXABLE: {'YES' if not any('noindex' in error for error in errors) else 'NO'}")
        print(f"  CANONICAL: {'SELF' if not any('canonical' in error for error in errors) else 'ERROR'}")
        print(f"  TITLE: {'OK' if page.title else 'MISSING'}")
        print(f"  HREFLANG: {expected_hreflang}")
        print(f"  INTERNAL LINKS TO PAGE: {inbound[url]}")
        print(f"  ERRORS: {'NONE' if not errors else '; '.join(errors)}")
        if errors:
            failures += 1

    print(f"\nSUMMARY: {len(urls)} sitemap URLs, {failures} URL(s) with errors.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
