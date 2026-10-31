(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------
     Scroll state: header, reading progress, active navigation
     ------------------------------------------------------------------ */
  const header = $("#siteHeader");
  const progressBar = $("#progressBar");
  const navLinks = $$(".main-nav a[data-nav]");
  const regions = ["notes", "archive", "about"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  let scrollFrame = 0;

  const updateScrollState = () => {
    scrollFrame = 0;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(scrollTop / scrollable, 1) : 0;

    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }

    if (header) {
      header.classList.toggle("is-scrolled", scrollTop > 28);
    }

    let current = "";
    const marker = scrollTop + window.innerHeight * 0.34;

    regions.forEach((region) => {
      if (region.offsetTop <= marker) current = region.id;
    });

    navLinks.forEach((link) => {
      const isActive = link.dataset.nav === current;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const requestScrollUpdate = () => {
    if (!scrollFrame) {
      scrollFrame = window.requestAnimationFrame(updateScrollState);
    }
  };

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  updateScrollState();

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  const menuToggle = $(".menu-toggle");
  const mobileMenu = $("#mobileMenu");
  let lastFocused = null;

  const focusableInMenu = () =>
    $$('a[href], button:not([disabled])', mobileMenu).filter(
      (el) => el.offsetParent !== null
    );

  const openMenu = () => {
    if (!mobileMenu || !menuToggle) return;
    lastFocused = document.activeElement;
    document.body.classList.add("menu-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "关闭菜单");
    window.setTimeout(() => {
      if (!document.body.classList.contains("menu-open")) return;
      const firstLink = focusableInMenu()[0];
      if (firstLink) firstLink.focus();
    }, 260);
  };

  const closeMenu = (returnFocus = true) => {
    if (!mobileMenu || !menuToggle || !document.body.classList.contains("menu-open")) {
      return;
    }
    document.body.classList.remove("menu-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "打开菜单");
    if (returnFocus && lastFocused instanceof HTMLElement) {
      lastFocused.focus();
    }
    lastFocused = null;
  };

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      if (document.body.classList.contains("menu-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    $$("a", mobileMenu).forEach((link) => {
      link.addEventListener("click", () => closeMenu(false));
    });

    $$(".brand").forEach((brand) => {
      brand.addEventListener("click", () => closeMenu(false));
    });

    mobileMenu.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const items = focusableInMenu();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
        closeMenu();
      }
    });

    const desktopQuery = window.matchMedia("(min-width: 921px)");
    const handleDesktop = (event) => {
      if (event.matches) closeMenu(false);
    };

    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", handleDesktop);
    } else if (desktopQuery.addListener) {
      desktopQuery.addListener(handleDesktop);
    }
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  $$("[data-stagger]").forEach((parent) => {
    Array.from(parent.children).forEach((child, index) => {
      if (child.classList.contains("reveal")) {
        child.style.setProperty("--reveal-delay", `${index * 85}ms`);
      }
    });
  });

  const revealItems = $$(".reveal");

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------
     Hero parallax
     ------------------------------------------------------------------ */
  const hero = $(".hero");
  const heroArt = $("[data-parallax]");

  if (hero && heroArt && !reduceMotion.matches && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      heroArt.style.setProperty("--mx", x.toFixed(3));
      heroArt.style.setProperty("--my", y.toFixed(3));
    });

    hero.addEventListener("pointerleave", () => {
      heroArt.style.setProperty("--mx", "0");
      heroArt.style.setProperty("--my", "0");
    });
  }

  /* ------------------------------------------------------------------
     Sharingan follows the pointer
     ------------------------------------------------------------------ */
  const eyeCard = $("[data-eye]");
  const iris = eyeCard ? $(".iris", eyeCard) : null;

  if (eyeCard && iris && !reduceMotion.matches && window.matchMedia("(pointer: fine)").matches) {
    eyeCard.addEventListener("pointermove", (event) => {
      const rect = eyeCard.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      iris.style.transform = `translate(${(x * 9).toFixed(2)}px, ${(y * 6).toFixed(2)}px)`;
    });

    eyeCard.addEventListener("pointerleave", () => {
      iris.style.transform = "translate(0, 0)";
    });
  }

  /* ------------------------------------------------------------------
     Newsletter
     ------------------------------------------------------------------ */
  const letterForm = $("#letterForm");
  const emailInput = $("#email");
  const letterStatus = $("#letterStatus");

  if (letterForm && emailInput && letterStatus) {
    const defaultMessage = "只用来寄信。随时可以离开。";

    letterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = emailInput.value.trim();
      const valid = email.length > 0 && emailInput.checkValidity();

      letterStatus.classList.remove("is-error", "is-success");

      if (!valid) {
        letterStatus.textContent = "需要一个有效的邮箱地址，信才能找到你。";
        letterStatus.classList.add("is-error");
        emailInput.focus();
        return;
      }

      letterStatus.textContent = "正在把信封投进夜色里……";
      const submitButton = $("button[type='submit']", letterForm);
      if (submitButton) submitButton.disabled = true;

      window.setTimeout(() => {
        letterStatus.textContent = "信封已封好。下一封信，会在月升时抵达。";
        letterStatus.classList.add("is-success");
        letterForm.reset();
        if (submitButton) submitButton.disabled = false;
      }, 850);
    });

    emailInput.addEventListener("input", () => {
      if (!letterStatus.classList.contains("is-error")) return;
      letterStatus.textContent = defaultMessage;
      letterStatus.classList.remove("is-error");
    });
  }

  /* ------------------------------------------------------------------
     Article reader dialog
     ------------------------------------------------------------------ */
  const dialog = $("#readingDialog");
  const dialogKicker = $("#dialogKicker");
  const dialogTitle = $("#dialogTitle");
  const dialogIntro = $("#dialogIntro");
  const dialogBody = $("#dialogBody");
  const dialogClose = $(".dialog-close", dialog || document);
  let activeTrigger = null;

  const articles = {
    time: {
      kicker: "幻术研究 / 2026.10.28 · 7 MIN READ",
      title: "在月读的世界里，时间是一种谎言",
      intro:
        "七十二小时，可以是一瞬；一瞬，也可以是一生。我们以为自己在丈量时间，其实只是被时间温柔地囚禁。",
      body: [
        "月读里的第一夜，我替自己造了一座钟。钟摆在红色的天幕下摆动，每一下都像有人在很远的地方敲门。后来我才明白，那座钟从来没有离开过我的房间。",
        "人并不是被时间困住的。我们只是把无法承受的那部分时间折叠起来，藏进一个看不见的抽屉里。偶尔打开，灰尘会先于记忆涌出来。",
        "在幻术里，七十二小时可以只够喝完一杯凉掉的茶。在现实里，一个转身却可能耗尽一生。时间不是尺子，它只是我们为了理解失去而发明的借口。",
        "离开月读之后，我仍然会在夜里听见那口钟。它提醒我：被拉长的从来不是时间，而是我们不肯放下的那一刻。",
      ],
    },
    rain: {
      kicker: "记忆 / 2026.10.21 · 6 MIN READ",
      title: "雨隐村没有晴天",
      intro:
        "雨水落在铁皮屋顶上，像有人在很远的地方，一遍遍练习告别。",
      body: [
        "雨隐村的雨没有开始，也没有结束。它只是在那里，像一种被默认的背景音。铁皮屋顶被敲打得发亮，屋檐下的人把声音压得很低，仿佛大声说话就会惊动什么。",
        "我住过的房间有一扇朝北的窗。窗外看不见海，只能看见更高处的管道、更远处的塔，以及一层永远散不掉的雾。每到傍晚，整座村子会亮起零星的灯，像沉在水底的火。",
        "人们说雨会洗掉痕迹。可真正的痕迹不在石头上，而在一个人停顿的方式里：拿杯子的手势、听到某个名字时忽然变慢的呼吸。",
        "所以我不讨厌雨。它至少替我保守了一部分秘密。",
      ],
    },
    truth: {
      kicker: "幻术 / 2026.10.12 · 5 MIN READ",
      title: "写轮眼从不撒谎",
      intro:
        "它只负责把所有被我们精心修饰过的真相，原封不动地还回来。",
      body: [
        "写轮眼是一种很残忍的天赋。它不负责安慰你，只负责记录。那些你以为已经处理干净的细节——对方说话时避开的眼神、袖口上没洗净的灰、深夜里多出来的那一声叹息——都会被原封不动地归档。",
        "人们说眼睛不会撒谎，这句话其实不准确。眼睛只是太诚实。诚实到让人来不及替自己编一个更好听的故事。",
        "后来我学会不轻易看别人的眼睛。不是因为看不清，而是因为看得太清楚。有些真相一旦被看见，就再也无法假装不知道。",
        "如果有一天我选择闭上眼睛，希望那不是因为懦弱，而是因为我终于允许自己只做一个普通人。",
      ],
    },
    dawn: {
      kicker: "忍界 / 2026.09.30 · 8 MIN READ",
      title: "晓的黎明，不属于任何人",
      intro:
        "我们披着同一件黑袍，却各自走向完全不同的黑夜。",
      body: [
        "晓组织的黑袍很宽大，能藏住很多东西：武器、卷轴、旧伤，以及每个人不愿意解释的来路。走在雨里，黑色会把人变成影子，影子再变成雨的一部分。",
        "我们围坐在同一张桌子旁，谈论和平、秩序、力量，谈论一个更干净的明天。没有人说破的是，每个人心里的明天并不是同一个。",
        "黎明并不属于组织，也不属于任何一个名字。它只属于那些熬过黑夜，却仍愿意睁开眼睛的人。",
        "我偶尔会想，如果那天我们没有穿上同样的衣服，会不会在另一条路上遇见。但雨没有回答，火也没有。",
      ],
    },
    name: {
      kicker: "独白 / 2026.09.18 · 4 MIN READ",
      title: "把名字留在纸上",
      intro:
        "当一个人被世界遗忘，至少还有墨迹，替他记得曾经来过。",
      body: [
        "纸张是很奇怪的东西。它看起来比人脆弱，却常常比人活得久。墨迹干透之后，某个人就拥有了一个不会老去的副本。",
        "我喜欢在夜里写字。灯很少，纸很白，笔尖划过纸面的声音像一条很细的河。写错的地方不能擦，只能划掉。这一点和人生相似，但比人生宽容——至少它允许你留下修改的痕迹。",
        "名字是最短的咒语。有人叫你的时候，你会回头；没有人叫的时候，你仍然知道自己是谁。可如果所有人都忘了呢？",
        "所以我把它写下来。不为了被记住，只是想在月亮升起的时候，证明这些字确实被人认真地写过。",
      ],
    },
    archive: {
      kicker: "全部手记 / 14 ENTRIES",
      title: "月光已经晾干了十页",
      intro:
        "还有十篇手记没有出现在首页。它们按照卷宗顺序，安静地躺在下面。",
      body: [
        "05 / 《乌鸦停在第七根电线杆上》 / 记忆 / 2026.09.07",
        "06 / 《别天神：一个未被采用的方案》 / 幻术 / 2026.08.29",
        "07 / 《关于沉默的二十三种练习》 / 独白 / 2026.08.14",
        "08 / 《雨天不适宜告别》 / 记忆 / 2026.08.02",
        "09 / 《写轮眼使用者的夜间视力》 / 幻术 / 2026.07.26",
        "10 / 《一件黑袍的清洗说明》 / 忍界 / 2026.07.11",
        "11 / 《火之国边境的野花》 / 记忆 / 2026.06.30",
        "12 / 《给未来某人的一封信》 / 独白 / 2026.06.18",
        "13 / 《月读的第十三层》 / 幻术 / 2026.06.03",
        "14 / 《日落之后，保持安静》 / 独白 / 2026.05.24",
      ],
    },
  };

  const openArticle = (id, trigger) => {
    const article = articles[id];
    if (!article || !dialog) return;

    activeTrigger = trigger || null;
    dialogKicker.textContent = article.kicker;
    dialogTitle.textContent = article.title;
    dialogIntro.textContent = article.intro;
    dialogBody.replaceChildren();

    article.body.forEach((line) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      dialogBody.appendChild(paragraph);
    });

    const inner = $(".dialog-inner", dialog);
    if (inner) inner.scrollTop = 0;

    if (!dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }

    document.body.classList.add("dialog-open");
    if (dialogClose) {
      window.setTimeout(() => dialogClose.focus(), 80);
    }
  };

  if (dialog) {
    $$("[data-article]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        openArticle(trigger.dataset.article, trigger);
      });
    });

    if (dialogClose) {
      dialogClose.addEventListener("click", () => dialog.close());
    }

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      if (activeTrigger instanceof HTMLElement) {
        activeTrigger.focus({ preventScroll: true });
      }
      activeTrigger = null;
    });
  }

  /* ------------------------------------------------------------------
     Small details
     ------------------------------------------------------------------ */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const localTime = $("#localTime");
  const updateClock = () => {
    if (!localTime) return;
    const now = new Date();
    localTime.textContent = now.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  updateClock();
  window.setInterval(updateClock, 30000);

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener("change", (event) => {
      if (event.matches) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
        const art = $("[data-parallax]");
        if (art) {
          art.style.setProperty("--mx", "0");
          art.style.setProperty("--my", "0");
        }
        if (iris) iris.style.transform = "translate(0, 0)";
      }
    });
  }
})();
