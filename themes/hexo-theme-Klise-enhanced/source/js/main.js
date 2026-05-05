
(() => {
  
  // Theme switch
  const body = document.body;
  const modeButton = document.getElementById("mode");
  const autoButton = document.getElementById("theme-auto");
  const THEME_STORAGE_KEY = "theme";

  let elem = document.querySelectorAll('figure.highlight')
  elem.forEach(function(item){
    let langName = item.getAttribute('class').split(' ')[1]
    if (langName === 'plain' || langName === undefined) langName = 'Code'
    item.setAttribute('data-lang',langName);
  })

  const DEFAULT_LIGHT_BG = "/img/fuji.png";
  const DEFAULT_DARK_BG = "/img/fuji.png";
  const bgImages = window.__BG_IMAGES__ || {};
  const LIGHT_BG_IMAGES = Array.isArray(bgImages.light) ? bgImages.light : [];
  const DARK_BG_IMAGES = Array.isArray(bgImages.dark) ? bgImages.dark : [];
  const BG_ROTATE_MS = 5 * 60 * 1000;
  const BG_STORAGE_KEYS = {
    light: "bg:last:light",
    dark: "bg:last:dark"
  };

  let bgTimer = null;
  let autoThemeTimer = null;
  let backgroundRequestId = 0;

  const getBackgroundList = (theme) => theme === "dark" ? DARK_BG_IMAGES : LIGHT_BG_IMAGES;

  const getBackgroundFallback = (theme) => theme === "dark" ? DEFAULT_DARK_BG : DEFAULT_LIGHT_BG;

  const isKnownBackground = (theme, value) => {
    if (!value) return false;
    const list = getBackgroundList(theme);
    return value === getBackgroundFallback(theme) || list.includes(value);
  };

  const getStoredBackground = (theme) => {
    const key = BG_STORAGE_KEYS[theme];
    if (!key) return null;
    try {
      const stored = localStorage.getItem(key);
      return isKnownBackground(theme, stored) ? stored : null;
    } catch (error) {
      return null;
    }
  };

  const setStoredBackground = (theme, value) => {
    const key = BG_STORAGE_KEYS[theme];
    if (!key) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Ignore storage errors.
    }
  };

  const pickInitialBackground = (theme) => {
    const list = getBackgroundList(theme);
    const fallback = getBackgroundFallback(theme);
    if (!Array.isArray(list) || list.length === 0) return fallback;
    return list[Math.floor(Math.random() * list.length)] || fallback;
  };

  const getCurrentBackground = (theme) => {
    const stored = getStoredBackground(theme);
    if (stored) return stored;
    const initial = pickInitialBackground(theme);
    setStoredBackground(theme, initial);
    return initial;
  };

  const getNextBackground = (theme) => {
    const list = getBackgroundList(theme);
    const fallback = getBackgroundFallback(theme);
    if (!Array.isArray(list) || list.length === 0) return fallback;
    if (list.length === 1) return list[0] || fallback;

    const current = getCurrentBackground(theme);
    const currentIndex = list.indexOf(current);
    if (currentIndex === -1) return list[0] || fallback;
    return list[(currentIndex + 1) % list.length] || fallback;
  };

  const getThemeMode = () => (body.getAttribute("data-theme") === "dark" ? "dark" : "light");

  const getStoredTheme = () => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === "light" || saved === "dark" ? saved : null;
    } catch (error) {
      return null;
    }
  };

  const setStoredTheme = (theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      // Ignore storage errors.
    }
  };

  const clearStoredTheme = () => {
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } catch (error) {
      // Ignore storage errors.
    }
  };

  const clearAutoThemeTimer = () => {
    if (!autoThemeTimer) return;
    window.clearTimeout(autoThemeTimer);
    autoThemeTimer = null;
  };

  const syncThemeControls = () => {
    const savedTheme = getStoredTheme();
    const isAutoMode = !savedTheme;
    body.dataset.themeState = isAutoMode ? "auto" : "manual";

    if (modeButton) {
      modeButton.classList.toggle("is-active", !isAutoMode);
      modeButton.setAttribute("aria-pressed", String(!isAutoMode));
      modeButton.title = isAutoMode
        ? "切换黑白天"
        : `当前手动：${savedTheme === "dark" ? "深色" : "浅色"}`;
    }

    if (autoButton) {
      autoButton.classList.toggle("is-active", isAutoMode);
      autoButton.setAttribute("aria-pressed", String(isAutoMode));
      autoButton.title = isAutoMode ? "当前自动切换" : "恢复自动切换";
    }
  };

  const setBackgroundCss = (theme, imageUrl) => {
    const cssVar = theme === "dark" ? "--bg-image-dark" : "--bg-image";
    body.style.setProperty(cssVar, `url("${imageUrl}")`);
  };

  const preloadBackground = (imageUrl) => new Promise((resolve) => {
    if (!imageUrl) {
      resolve(false);
      return;
    }

    const image = new Image();
    const finish = (loaded) => resolve(loaded);
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.src = imageUrl;
    if (image.complete) finish(true);
  });

  const applyBackground = (theme, options = {}) => {
    const imageUrl = options.advance ? getNextBackground(theme) : getCurrentBackground(theme);
    const requestId = ++backgroundRequestId;

    const commit = () => {
      if (requestId !== backgroundRequestId) return;
      setBackgroundCss(theme, imageUrl);
      setStoredBackground(theme, imageUrl);
    };

    if (options.preload) {
      preloadBackground(imageUrl).then((loaded) => {
        if (loaded) commit();
      });
      return;
    }

    commit();
  };

  const syncBackgroundToTheme = () => {
    applyBackground(getThemeMode());
  };

  const rotateBackgroundToTheme = () => {
    applyBackground(getThemeMode(), { advance: true, preload: true });
  };

  const startBackgroundRotation = () => {
    if (bgTimer) window.clearInterval(bgTimer);
    bgTimer = window.setInterval(rotateBackgroundToTheme, BG_ROTATE_MS);
  };

  const AUTO_START_HOUR = 7;
  const AUTO_END_HOUR = 19;

  const getTimeTheme = () => {
    const hour = new Date().getHours();
    return hour >= AUTO_START_HOUR && hour < AUTO_END_HOUR ? "light" : "dark";
  };

  const applyTheme = (theme) => {
    if (theme === "dark") {
      body.setAttribute("data-theme", "dark");
    } else {
      body.removeAttribute("data-theme");
    }
    syncBackgroundToTheme();
  };

  const initTheme = () => {
    const saved = getStoredTheme();
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
      return;
    }
    applyTheme(getTimeTheme());
  };

  const scheduleAutoTheme = () => {
    clearAutoThemeTimer();
    if (getStoredTheme()) return;

    const now = new Date();
    const next = new Date(now);
    next.setMinutes(0, 0, 0);
    next.setHours(now.getHours() + 1);
    const delay = next.getTime() - now.getTime() + 1000;

    autoThemeTimer = window.setTimeout(() => {
      initTheme();
      scheduleAutoTheme();
    }, delay);
  };

  const toggleTheme = (state) => {
    const current = state === "light" || state === "dark" ? state : getTimeTheme();
    const next = current === "dark" ? "light" : "dark";
    setStoredTheme(next);
    applyTheme(next);
    scheduleAutoTheme();
    syncThemeControls();
  };

  const enableAutoTheme = () => {
    clearStoredTheme();
    initTheme();
    scheduleAutoTheme();
    syncThemeControls();
  };

  requestAnimationFrame(() => {
    initTheme();
    syncThemeControls();
    startBackgroundRotation();
    scheduleAutoTheme();
  });

  if (modeButton) {
    modeButton.addEventListener("click", () =>
      toggleTheme(getStoredTheme())
    );
  }

  if (autoButton) {
    autoButton.addEventListener("click", enableAutoTheme);
  }

  const HITOKOTO_TYPES = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
  const HITOKOTO_ENDPOINT = `https://v1.hitokoto.cn/?encode=json&${HITOKOTO_TYPES.map((type) => `c=${type}`).join("&")}`;
  const HITOKOTO_TYPE_SPEED_MS = 240;
  const HITOKOTO_STAY_MS = 6000;

  const initHitokoto = () => {
    const textEl = document.getElementById("hitokoto-text");
    const fromEl = document.getElementById("hitokoto-from");
    if (!textEl || !fromEl) return;

    let isLoading = false;
    let typingTimer = null;
    let cycleTimer = null;

    const renderSource = (data) => {
      const from = data.from ? `《${data.from}》` : "";
      const who = data.from_who ? ` · ${data.from_who}` : "";
      const sourceText = from || who ? `—— ${from}${who}` : "";
      fromEl.textContent = sourceText;
      fromEl.title = sourceText;
    };

    const typeText = (text, onDone) => {
      if (typingTimer) window.clearTimeout(typingTimer);

      const chars = Array.from(text);
      const fragment = document.createDocumentFragment();
      textEl.textContent = "";
      textEl.title = text;
      textEl.setAttribute("aria-label", text);

      chars.forEach((char) => {
        if (char === "\n") {
          fragment.appendChild(document.createElement("br"));
          return;
        }

        const charEl = document.createElement("span");
        charEl.className = "hitokoto-char";
        charEl.setAttribute("aria-hidden", "true");
        charEl.textContent = char;
        fragment.appendChild(charEl);
      });

      textEl.appendChild(fragment);

      const charEls = Array.from(textEl.querySelectorAll(".hitokoto-char"));
      let index = 0;

      const step = () => {
        if (index < charEls.length) {
          charEls[index].classList.add("is-visible");
          index += 1;
          typingTimer = window.setTimeout(step, HITOKOTO_TYPE_SPEED_MS);
          return;
        }

        typingTimer = null;
        if (typeof onDone === "function") onDone();
      };

      step();
    };

    const fetchHitokoto = () => {
      if (isLoading) return;
      isLoading = true;

      fetch(HITOKOTO_ENDPOINT)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.hitokoto) {
            fromEl.textContent = "";
            fromEl.title = "";
            typeText(data.hitokoto, () => {
              renderSource(data);
              cycleTimer = window.setTimeout(fetchHitokoto, HITOKOTO_STAY_MS);
            });
            return;
          }
          cycleTimer = window.setTimeout(fetchHitokoto, HITOKOTO_STAY_MS);
        })
        .catch(() => {
          // Ignore network errors silently.
          cycleTimer = window.setTimeout(fetchHitokoto, HITOKOTO_STAY_MS * 2);
        })
        .finally(() => {
          isLoading = false;
        });
    };

    textEl.textContent = "正在加载一言...";
    fetchHitokoto();

    window.addEventListener("beforeunload", () => {
      if (typingTimer) window.clearTimeout(typingTimer);
      if (cycleTimer) window.clearTimeout(cycleTimer);
    });
  };

  initHitokoto();

  window.addEventListener("beforeunload", () => {
    if (bgTimer) window.clearInterval(bgTimer);
    clearAutoThemeTimer();
  });

  // Blur the content when the menu is open
  const cbox = document.getElementById("menu-trigger");

  if (cbox) {
    cbox.addEventListener("change", function () {
      const area = document.querySelector(".wrapper");
      if (!area) return;
      this.checked
        ? area.classList.add("blurry")
        : area.classList.remove("blurry");
    });
  }

  const toggleButton = document.getElementById("toggleButton");
  const overlay = document.getElementById("overlay");
  const closeButton = document.getElementById("closeButton");

  if (toggleButton && overlay) {
    toggleButton.addEventListener("click", function() {
      overlay.style.display = overlay.style.display === "none" || overlay.style.display === "" ? "flex" : "none";
      toggleButton.style.display = "none";
    });
  }

  if (closeButton && overlay && toggleButton) {
    closeButton.addEventListener("click", function() {
      overlay.style.display = "none";
      toggleButton.style.display = "flex";
    });
  }

  const toTopBtn = document.getElementById("toTopBtn");
  const updateToTopVisibility = () => {
    if (!toTopBtn) return;
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
      toTopBtn.style.display = "flex";
    } else {
      toTopBtn.style.display = "none";
    }
  };

  if (toTopBtn) {
    window.addEventListener("scroll", updateToTopVisibility);
    requestAnimationFrame(updateToTopVisibility);
    toTopBtn.addEventListener("click", function() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }





})();
