(() => {
  const storageKey = "superhostem-kb-theme-v2";
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  let tocObserver = null;
  let shortcutBound = false;
  const articleTextCache = new Map();

  const normalize = (value, locale) =>
    (value || "")
      .toLocaleLowerCase(locale || document.documentElement.lang || "en")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const getThemePreference = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "light" || saved === "dark" || saved === "system") return saved;
    } catch {
      // File previews and restricted browsers can disable storage.
    }
    return "light";
  };

  const applyTheme = (preference) => {
    const resolved = preference === "system" ? (media.matches ? "dark" : "light") : preference;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved === "dark" ? "dark" : "light";
    document.querySelectorAll("[data-theme-option]").forEach((button) => {
      const active = button.dataset.themeOption === preference;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  const bindThemeToggle = () => {
    document.querySelectorAll("[data-theme-option]").forEach((button) => {
      if (button.dataset.kbThemeBound === "true") return;
      button.dataset.kbThemeBound = "true";
      button.addEventListener("click", () => {
        try {
          localStorage.setItem(storageKey, button.dataset.themeOption);
        } catch {
          // The selection still applies to this page when storage is unavailable.
        }
        applyTheme(button.dataset.themeOption);
      });
    });
  };

  const bindThemeDropdown = () => {
    const themeLabelsByLanguage = {
      cs: {
        light: "Světlý",
        system: "Auto",
        dark: "Tmavý"
      },
      en: {
        light: "Light",
        system: "Auto",
        dark: "Dark"
      },
      vi: {
        light: "Sáng",
        system: "Auto",
        dark: "Tối"
      }
    };
    const language = document.documentElement.lang || "en";
    const themeLabels = themeLabelsByLanguage[language] || themeLabelsByLanguage.en;

    document.querySelectorAll(".kb-theme-toggle").forEach((toggle) => {
      if (toggle.dataset.kbThemeDropdownBound === "true") return;
      toggle.dataset.kbThemeDropdownBound = "true";

      const options = [...toggle.querySelectorAll("[data-theme-option]")];
      if (options.length === 0) return;

      let menu = toggle.querySelector(".kb-theme-toggle-menu");
      let button = toggle.querySelector(".kb-theme-toggle-trigger");

      if (!menu) {
        menu = document.createElement("div");
        menu.className = "kb-theme-toggle-menu";
        options.forEach((option) => menu.appendChild(option));
      }

      options.forEach((option) => {
        option.setAttribute("role", "menuitemradio");
        const themeOption = option.dataset.themeOption;
        if (themeLabels[themeOption]) {
          option.textContent = themeLabels[themeOption];
        }
        option.dataset.themeIcon = themeOption;
      });

      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "kb-theme-toggle-trigger";
        button.innerHTML = `
          <svg class="kb-theme-icon-sun" aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="m4.93 4.93 1.41 1.41"></path>
            <path d="m17.66 17.66 1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="m6.34 17.66-1.41 1.41"></path>
            <path d="m19.07 4.93-1.41 1.41"></path>
          </svg>
          <svg class="kb-theme-icon-moon" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
          </svg>
          <span class="sr-only">Theme</span>
        `;
      }

      button.setAttribute("aria-haspopup", "menu");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", toggle.getAttribute("aria-label") || "Theme");
      toggle.append(button, menu);

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const open = toggle.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(open));
      });

      options.forEach((option) => {
        option.addEventListener("click", () => {
          toggle.classList.remove("is-open");
          button.setAttribute("aria-expanded", "false");
        });
      });

      document.addEventListener("click", (event) => {
        if (toggle.contains(event.target)) return;
        toggle.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
      });

      toggle.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        toggle.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
        button.focus();
      });
    });
  };

  const slugify = (value, locale) =>
    value
      .toLocaleLowerCase(locale || document.documentElement.lang || "en")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "sekce";

  const bindArticleToc = () => {
    const toc = document.querySelector("#kb-article-toc");
    const sidebar = document.querySelector("#kb-article-sidebar");
    const content = document.querySelector("#kb-article-content");
    if (!toc || !sidebar || !content) return;

    if (tocObserver) {
      tocObserver.disconnect();
      tocObserver = null;
    }

    const headings = [...content.querySelectorAll("h2")];
    const usedIds = new Set();

    headings.forEach((heading) => {
      let base = heading.id ? slugify(heading.id) : slugify(heading.textContent || "sekce");
      let id = base;
      let i = 2;
      while (usedIds.has(id) || (document.getElementById(id) && document.getElementById(id) !== heading)) {
        id = `${base}-${i}`;
        i += 1;
      }
      heading.id = id;
      usedIds.add(id);
    });

    if (headings.length < 2) {
      sidebar.hidden = true;
      toc.innerHTML = "";
      return;
    }

    sidebar.hidden = false;
    toc.innerHTML = headings
      .map((heading) => `<a href="#${heading.id}">${heading.textContent.trim()}</a>`)
      .join("");

    const tocLinks = [...toc.querySelectorAll("a")];
    tocObserver = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!active) return;
        tocLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${active.target.id}`);
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    headings.forEach((heading) => tocObserver.observe(heading));
  };

  const bindSearch = () => {
    const searchInput = document.querySelector("#kb-search-input");
    if (!searchInput) return;
    const searchBox = searchInput.closest(".kb-help-search");
    const searchableCards = [...document.querySelectorAll("[data-search-text]")];
    const emptyState = document.querySelector(".kb-empty-state");
    const searchableSections = [...document.querySelectorAll(".kb-help-section")];
    const loadingState = { active: false };
    const labelsByLanguage = {
      cs: {
        count: (count) => `${count} ${count === 1 ? "výsledek" : count > 1 && count < 5 ? "výsledky" : "výsledků"}`,
        noResults: "Nic se nenašlo. Zkuste iCal, poplatek nebo rezervace.",
        open: "Otevřít"
      },
      en: {
        count: (count) => `${count} ${count === 1 ? "result" : "results"}`,
        noResults: "No results. Try iCal, fee, or reservation.",
        open: "Open"
      },
      vi: {
        count: (count) => `${count} kết quả`,
        noResults: "Không tìm thấy. Hãy thử iCal, phí hoặc đặt phòng.",
        open: "Mở"
      }
    };
    const language = document.documentElement.lang || "en";
    const labels = labelsByLanguage[language] || labelsByLanguage.en;
    let activeSuggestionIndex = 0;
    let suggestions = [];
    let resultsPanel = document.querySelector("#kb-search-results");

    if (searchBox && !resultsPanel) {
      resultsPanel = document.createElement("div");
      resultsPanel.id = "kb-search-results";
      resultsPanel.className = "kb-search-results";
      resultsPanel.hidden = true;
      resultsPanel.setAttribute("role", "listbox");
      resultsPanel.setAttribute("aria-label", searchInput.getAttribute("aria-label") || "Search results");
      searchBox.insertAdjacentElement("afterend", resultsPanel);
    }

    if (resultsPanel) {
      searchInput.setAttribute("aria-controls", resultsPanel.id);
      searchInput.setAttribute("aria-expanded", "false");
      searchInput.setAttribute("role", "combobox");
      searchInput.setAttribute("aria-autocomplete", "list");
    }

    const getCardLinks = (card) =>
      [...card.querySelectorAll("a[href$='.html']")]
        .map((link) => new URL(link.getAttribute("href"), window.location.href).href);

    const getSuggestionItems = () => {
      const seen = new Set();
      const items = [];

      searchableCards.forEach((card) => {
        const sectionTitle = card.closest(".kb-help-section")?.querySelector("h2")?.textContent?.trim() || "";
        const cardTitle = card.querySelector("h3, strong")?.textContent?.trim() || "";

        [...card.querySelectorAll("a[href$='.html']")].forEach((link) => {
          const url = new URL(link.getAttribute("href"), window.location.href).href;
          if (seen.has(url)) return;
          seen.add(url);
          const title = link.textContent.trim() || cardTitle || url;
          const titleText = normalize(title);
          const contextText = normalize(`${cardTitle} ${sectionTitle}`);
          const text = normalize(`${title} ${cardTitle} ${sectionTitle} ${card.dataset.searchText || ""}`);

          items.push({
            url,
            title,
            context: [cardTitle, sectionTitle].filter(Boolean).join(" · "),
            titleText,
            contextText,
            text
          });
        });
      });

      return items;
    };

    const suggestionItems = getSuggestionItems();

    const fetchArticleText = async (url) => {
      if (articleTextCache.has(url)) return articleTextCache.get(url);

      const promise = fetch(url, { headers: { "X-Requested-With": "kb-search-index" } })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.text();
        })
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, "text/html");
          const title = doc.querySelector(".kb-article-title, title")?.textContent || "";
          const lead = doc.querySelector(".kb-article-lead")?.textContent || "";
          const body = doc.querySelector("#kb-article-content")?.textContent || "";
          return normalize(`${title} ${lead} ${body}`);
        })
        .catch(() => "");

      articleTextCache.set(url, promise);
      return promise;
    };

    const renderSuggestions = (query) => {
      if (!resultsPanel) return;

      if (!query) {
        suggestions = [];
        activeSuggestionIndex = 0;
        resultsPanel.hidden = true;
        resultsPanel.innerHTML = "";
        searchInput.setAttribute("aria-expanded", "false");
        searchInput.removeAttribute("aria-activedescendant");
        return;
      }

      suggestions = suggestionItems
        .map((item) => {
          const titleMatch = item.titleText.includes(query);
          const contextMatch = item.contextText.includes(query);
          const broadMatch = item.text.includes(query);
          return {
            ...item,
            score: titleMatch ? 4 : contextMatch ? 3 : broadMatch ? 1 : 0
          };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, language))
        .slice(0, 6);

      activeSuggestionIndex = Math.min(activeSuggestionIndex, Math.max(suggestions.length - 1, 0));

      if (suggestions.length === 0) {
        resultsPanel.hidden = false;
        resultsPanel.innerHTML = `<p class="kb-search-results-empty">${labels.noResults}</p>`;
        searchInput.setAttribute("aria-expanded", "true");
        searchInput.removeAttribute("aria-activedescendant");
        return;
      }

      resultsPanel.hidden = false;
      resultsPanel.innerHTML = `
        <div class="kb-search-results-head">${labels.count(suggestions.length)}</div>
        <div class="kb-search-results-list">
          ${suggestions
            .map(
              (item, index) => `
                <a
                  id="kb-search-result-${index}"
                  class="kb-search-result${index === activeSuggestionIndex ? " is-active" : ""}"
                  href="${item.url}"
                  role="option"
                  aria-selected="${index === activeSuggestionIndex ? "true" : "false"}"
                >
                  <span>
                    <strong>${item.title}</strong>
                    ${item.context ? `<small>${item.context}</small>` : ""}
                  </span>
                  <em>${labels.open}</em>
                </a>
              `
            )
            .join("")}
        </div>
      `;
      searchInput.setAttribute("aria-expanded", "true");
      searchInput.setAttribute("aria-activedescendant", `kb-search-result-${activeSuggestionIndex}`);
    };

    const enrichCardsWithArticleText = async () => {
      const cardsToLoad = searchableCards.filter((card) => card.dataset.kbIndexed !== "true");
      await Promise.all(
        cardsToLoad.map(async (card) => {
          const urls = [...new Set(getCardLinks(card))];
          if (urls.length === 0) {
            card.dataset.kbIndexed = "true";
            return;
          }

          const articleTexts = await Promise.all(urls.map((url) => fetchArticleText(url)));
          card.dataset.kbArticleText = articleTexts.filter(Boolean).join(" ");
          card.dataset.kbIndexed = "true";
        })
      );

      suggestionItems.forEach((item) => {
        const cached = articleTextCache.get(item.url);
        if (!cached || typeof cached.then !== "function") return;
        cached.then((articleText) => {
          item.text = normalize(`${item.text} ${articleText}`);
        });
      });
    };

    const applySearch = () => {
      const query = normalize(searchInput.value.trim());
      let visibleCount = 0;

      searchableCards.forEach((card) => {
        const haystack = normalize(
          `${card.textContent || ""} ${card.dataset.searchText || ""} ${card.dataset.kbArticleText || ""}`
        );
        const match = !query || haystack.includes(query);
        card.hidden = !match;
        if (match) visibleCount += 1;
      });

      searchableSections.forEach((section) => {
        const visibleInSection = [...section.querySelectorAll("[data-search-text]")].some((card) => !card.hidden);
        section.hidden = !visibleInSection;
      });

      if (emptyState) {
        emptyState.hidden = visibleCount > 0;
      }

      renderSuggestions(query);
    };

    if (searchInput.dataset.kbSearchBound !== "true") {
      searchInput.dataset.kbSearchBound = "true";
      searchInput.addEventListener("input", async () => {
        const hasQuery = Boolean(searchInput.value.trim());
        searchBox?.classList.toggle("has-value", hasQuery);
        applySearch();

        if (hasQuery && !loadingState.active) {
          loadingState.active = true;
          await enrichCardsWithArticleText();
          loadingState.active = false;
          applySearch();
        }
      });

      searchInput.addEventListener("keydown", (event) => {
        if (!suggestions.length && event.key !== "Enter") return;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
          renderSuggestions(normalize(searchInput.value.trim()));
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
          renderSuggestions(normalize(searchInput.value.trim()));
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          const target = suggestions[activeSuggestionIndex];
          if (target) window.location.href = target.url;
          return;
        }

        if (event.key === "Escape") {
          resultsPanel.hidden = true;
          searchInput.setAttribute("aria-expanded", "false");
        }
      });
    }

    if (!shortcutBound) {
      shortcutBound = true;
      document.addEventListener("keydown", (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          document.querySelector("#kb-search-input")?.focus();
        }
      });
    }

    applySearch();
  };

  const syncLanguageSwitcher = () => {
    const currentPath = new URL(window.location.href).pathname;
    document.querySelectorAll(".kb-language-switcher").forEach((switcher) => {
      let activeLabel = "";
      switcher.querySelectorAll("a").forEach((link) => {
        const active = new URL(link.href, window.location.href).pathname === currentPath;
        link.classList.toggle("is-active", active);
        if (active) {
          link.setAttribute("aria-current", "page");
          activeLabel = link.textContent.trim();
        } else {
          link.removeAttribute("aria-current");
        }
      });

      const triggerLabel = switcher.querySelector(".kb-language-switcher-toggle span");
      if (triggerLabel && activeLabel) {
        triggerLabel.textContent = activeLabel;
      }
    });
  };

  const refreshPage = (nextDocument, targetUrl) => {
    const nextBody = nextDocument.body;
    if (!nextBody) {
      window.location.href = targetUrl;
      return;
    }

    document.documentElement.lang = nextDocument.documentElement.lang || document.documentElement.lang;
    document.title = nextDocument.title;
    document.body.className = nextBody.className;

    const currentMain = document.querySelector("main");
    const nextMain = nextDocument.querySelector("main");
    if (currentMain && nextMain) {
      currentMain.replaceWith(nextMain);
    } else if (currentMain) {
      currentMain.remove();
    }

    const currentHeader = document.querySelector(".kb-help-header");
    const nextHeader = nextDocument.querySelector(".kb-help-header");
    if (currentHeader && nextHeader) {
      currentHeader.replaceWith(nextHeader);
    }

    const currentFooter = document.querySelector("footer");
    const nextFooter = nextDocument.querySelector("footer");
    if (currentFooter && nextFooter) {
      currentFooter.replaceWith(nextFooter);
    }

    const currentBackToTop = document.querySelector(".back-to-top");
    const nextBackToTop = nextDocument.querySelector(".back-to-top");
    if (currentBackToTop && nextBackToTop) {
      currentBackToTop.replaceWith(nextBackToTop);
    } else if (currentBackToTop && !nextBackToTop) {
      currentBackToTop.remove();
    } else if (!currentBackToTop && nextBackToTop) {
      document.body.appendChild(nextBackToTop);
    }

    history.pushState({ soft: true }, "", targetUrl);
    window.scrollTo({ top: 0, behavior: "auto" });
    initPage();
  };

  const getLanguageFallbackUrl = (link) => {
    const language = (link.textContent || "").trim().toLowerCase();
    const currentUrl = new URL(window.location.href);
    const htmlRoot = currentUrl.pathname.match(/^(.*\/html)(?:\/|$)/)?.[1];
    if (!htmlRoot) return null;

    if (language === "cz") return `${currentUrl.origin}${htmlRoot}/index.html`;
    if (language === "en") return `${currentUrl.origin}${htmlRoot}/en/index.html`;
    if (language === "vn") return `${currentUrl.origin}${htmlRoot}/vn/index.html`;
    return null;
  };

  const softNavigate = async (targetUrl, fallbackUrl = null) => {
    try {
      const response = await fetch(targetUrl, {
        headers: { "X-Requested-With": "kb-soft-nav" }
      });
      if (!response.ok) {
        if (fallbackUrl && fallbackUrl !== targetUrl) {
          await softNavigate(fallbackUrl);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const html = await response.text();
      const nextDocument = new DOMParser().parseFromString(html, "text/html");
      refreshPage(nextDocument, targetUrl);
    } catch (_error) {
      window.location.href = targetUrl;
    }
  };

  const bindLanguageSwitcher = () => {
    document.querySelectorAll(".kb-language-switcher a").forEach((link) => {
      if (link.dataset.kbSoftNavBound === "true") return;
      link.dataset.kbSoftNavBound = "true";
      link.addEventListener("click", (event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        const targetUrl = new URL(link.href, window.location.href);
        if (targetUrl.origin !== window.location.origin) return;
        if (targetUrl.pathname === window.location.pathname && targetUrl.hash === window.location.hash) return;

        event.preventDefault();
        softNavigate(targetUrl.href, getLanguageFallbackUrl(link));
      });
    });
  };

  const bindLanguageDropdown = () => {
    document.querySelectorAll(".kb-language-switcher").forEach((switcher) => {
      if (switcher.dataset.kbLanguageDropdownBound === "true") return;
      switcher.dataset.kbLanguageDropdownBound = "true";

      const links = [...switcher.querySelectorAll("a")];
      const activeLink = links.find((link) => link.classList.contains("is-active")) || links[0];
      let menu = switcher.querySelector(".kb-language-switcher-menu");
      let button = switcher.querySelector(".kb-language-switcher-toggle");

      if (!menu) {
        menu = document.createElement("div");
        menu.className = "kb-language-switcher-menu";
        links.forEach((link) => menu.appendChild(link));
      }

      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "kb-language-switcher-toggle";
        button.innerHTML = `
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
            <path d="M2 12h20"></path>
          </svg>
          <span>${activeLink?.textContent?.trim() || "CZ"}</span>
        `;
      }

      button.setAttribute("aria-haspopup", "menu");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", switcher.getAttribute("aria-label") || "Change language");
      switcher.append(button, menu);

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const open = switcher.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(open));
      });

      document.addEventListener("click", (event) => {
        if (switcher.contains(event.target)) return;
        switcher.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
      });

      switcher.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        switcher.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
        button.focus();
      });
    });
  };

  const bindHomeNavAnchors = () => {
    document.querySelectorAll(".kb-help-nav a[href^='#']").forEach((link) => {
      if (link.dataset.kbHomeAnchorBound === "true") return;
      link.dataset.kbHomeAnchorBound = "true";
      link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href");
        const anchor = hash ? document.querySelector(hash) : null;
        const target = anchor?.classList.contains("kb-anchor-target") ? anchor.nextElementSibling : anchor;
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ block: "start", behavior: "smooth" });
        history.replaceState(null, "", hash);
      });
    });
  };

  const bindArticleHashAnchors = () => {
    document.querySelectorAll(".kb-article-main a[href^='#']").forEach((link) => {
      if (link.dataset.kbArticleAnchorBound === "true") return;
      link.dataset.kbArticleAnchorBound = "true";
      link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href");
        if (!hash || hash === "#") return;

        const anchor = document.querySelector(hash);
        if (!anchor) return;

        event.preventDefault();
        anchor.scrollIntoView({ block: "start", behavior: "smooth" });
        history.replaceState(null, "", hash);
      });
    });
  };

  const bindCopyButtons = () => {
    document.querySelectorAll("[data-copy-target]").forEach((button) => {
      if (button.dataset.kbCopyBound === "true") return;
      button.dataset.kbCopyBound = "true";
      button.addEventListener("click", async () => {
        const target = document.querySelector(button.dataset.copyTarget);
        if (!target) return;
        const originalLabel = button.textContent;
        try {
          await navigator.clipboard.writeText(target.textContent.trim());
          button.textContent = button.dataset.copySuccess || "Copied";
        } catch {
          button.textContent = "Copy manually";
        }
        window.setTimeout(() => {
          button.textContent = originalLabel;
        }, 1800);
      });
    });
  };

  const bindPropertyCreationCtas = () => {
    document.querySelectorAll('.kb-property-decision-cta[href="#property-next-steps"]').forEach((link) => {
      link.href = "https://www.superhostem.cz/dashboard/properties/new";
    });
  };

  const initPage = () => {
    applyTheme(getThemePreference());
    bindThemeToggle();
    bindThemeDropdown();
    bindArticleToc();
    bindSearch();
    bindLanguageSwitcher();
    bindLanguageDropdown();
    bindHomeNavAnchors();
    bindArticleHashAnchors();
    bindCopyButtons();
    bindPropertyCreationCtas();
    syncLanguageSwitcher();
  };

  media.addEventListener("change", () => {
    if (getThemePreference() === "system") {
      applyTheme("system");
    }
  });

  window.addEventListener("popstate", () => {
    window.location.reload();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage, { once: true });
  } else {
    initPage();
  }
})();
