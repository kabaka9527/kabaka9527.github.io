
(() => {
  
  // Theme switch
  const body = document.body;
  const lamp = document.getElementById("mode");

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
  const BG_ROTATE_MS = 45000;
  const BG_STORAGE_KEYS = {
    light: "bg:last:light",
    dark: "bg:last:dark"
  };

  let lightBgIndex = 0;
  let darkBgIndex = 0;
  let bgTimer = null;

  const getStoredBackground = (theme) => {
    const key = BG_STORAGE_KEYS[theme];
    if (!key) return null;
    try {
      return localStorage.getItem(key);
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

  const pickStartIndex = (theme, list) => {
    if (!Array.isArray(list) || list.length === 0) return 0;
    if (list.length === 1) return 0;
    const last = getStoredBackground(theme);
    if (!last) return Math.floor(Math.random() * list.length);
    const lastIndex = list.indexOf(last);
    if (lastIndex === -1) return Math.floor(Math.random() * list.length);
    return (lastIndex + 1) % list.length;
  };

  const seedBackgroundIndex = () => {
    lightBgIndex = pickStartIndex("light", LIGHT_BG_IMAGES);
    darkBgIndex = pickStartIndex("dark", DARK_BG_IMAGES);
  };

  const getThemeMode = () => (body.getAttribute("data-theme") === "dark" ? "dark" : "light");

  const getNextBackground = (theme) => {
    const list = theme === "dark" ? DARK_BG_IMAGES : LIGHT_BG_IMAGES;
    const fallback = theme === "dark" ? DEFAULT_DARK_BG : DEFAULT_LIGHT_BG;
    if (!Array.isArray(list) || list.length === 0) return fallback;

    if (theme === "dark") {
      const image = list[darkBgIndex % list.length];
      darkBgIndex += 1;
      return image || fallback;
    }

    const image = list[lightBgIndex % list.length];
    lightBgIndex += 1;
    return image || fallback;
  };

  const applyBackground = (theme) => {
    const imageUrl = getNextBackground(theme);
    const cssVar = theme === "dark" ? "--bg-image-dark" : "--bg-image";
    body.style.setProperty(cssVar, `url("${imageUrl}")`);
    setStoredBackground(theme, imageUrl);
  };

  const syncBackgroundToTheme = () => {
    applyBackground(getThemeMode());
  };

  const startBackgroundRotation = () => {
    syncBackgroundToTheme();
    if (bgTimer) window.clearInterval(bgTimer);
    bgTimer = window.setInterval(syncBackgroundToTheme, BG_ROTATE_MS);
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
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
      return;
    }
    applyTheme(getTimeTheme());
  };

  const scheduleAutoTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return;

    const now = new Date();
    const next = new Date(now);
    next.setMinutes(0, 0, 0);
    next.setHours(now.getHours() + 1);
    const delay = next.getTime() - now.getTime() + 1000;

    setTimeout(() => {
      initTheme();
      scheduleAutoTheme();
    }, delay);
  };

  const toggleTheme = (state) => {
    const current = state === "light" || state === "dark" ? state : getTimeTheme();
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  seedBackgroundIndex();
  initTheme();
  startBackgroundRotation();
  scheduleAutoTheme();

  lamp.addEventListener("click", () =>
    toggleTheme(localStorage.getItem("theme"))
  );

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
    };

    const typeText = (text, onDone) => {
      let index = 0;
      textEl.textContent = "";

      const step = () => {
        if (index <= text.length) {
          textEl.textContent = text.slice(0, index);
          index += 1;
          typingTimer = window.setTimeout(step, HITOKOTO_TYPE_SPEED_MS);
        } else if (typeof onDone === "function") {
          onDone();
        }
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
  });

  // Blur the content when the menu is open
  const cbox = document.getElementById("menu-trigger");

  cbox.addEventListener("change", function () {
    const area = document.querySelector(".wrapper");
    this.checked
      ? area.classList.add("blurry")
      : area.classList.remove("blurry");
  });

  // 获取元素
const toggleButton = document.getElementById('toggleButton');
const overlay = document.getElementById('overlay');
const closeButton = document.getElementById('closeButton');

// 切换显示和隐藏
toggleButton.addEventListener('click', function() {
  overlay.style.display = overlay.style.display === 'none' || overlay.style.display === '' ? 'flex' : 'none';
  toggleButton.style.display = 'none';  // 隐藏返回顶部按钮
});

// 点击关闭按钮
closeButton.addEventListener('click', function() {
  overlay.style.display = 'none';
  toggleButton.style.display = 'flex';
  
});

// 获取按钮
let toTopBtn = document.getElementById("toTopBtn");

// 当用户向下滚动20px时，显示按钮
window.onscroll = function () {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    toTopBtn.style.display = "flex";
  } else {
    toTopBtn.style.display = "none";
  }
};

toTopBtn.addEventListener('click',function(){
  window.scrollTo({ top: 0, behavior: 'smooth' });
})





})();

