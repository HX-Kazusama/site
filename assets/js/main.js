(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const DATA = window.EXPO || { sweets: [], news: [], posters: [], regions: [], event: { days: [] } };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    },
  };

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  try { sessionStorage.setItem("expo-intro", "1"); } catch {}
  const introMs = document.documentElement.classList.contains("no-intro") ? 200 : 1900;
  setTimeout(() => document.body.classList.add("is-ready"), introMs);

  const header = $(".site-header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const menuBtn = $(".menu-btn");
  const menu = $("#mobile-menu");
  if (menuBtn && menu) {
    menu.hidden = false;
    const setMenu = (open) => {
      document.body.classList.toggle("menu-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
      if (open) setTimeout(() => $("a", menu)?.focus(), 350);
    };
    menuBtn.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) { setMenu(false); menuBtn.focus(); }
    });
    matchMedia("(min-width: 761px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });
  }

  $$(".marquee-track").forEach((track) => {
    const original = track.innerHTML;
    for (let n = 0; n < 4 && track.scrollWidth / 2 < window.innerWidth + 200; n++) track.innerHTML += original;
  });

  $(".to-top")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" })
    : null;
  const reveal = (el) => {
    if (!el) return;
    if (el.hasAttribute("data-stagger")) [...el.children].forEach((child, i) => child.style.setProperty("--i", i));
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add("is-in");
  };

  function splitChars(el, text = el.textContent) {
    (el.closest("h1") || el).setAttribute("aria-label", text);
    el.innerHTML = [...text].map((ch, i) => `<span class="char" aria-hidden="true" style="--ci:${i}">${escapeHtml(ch)}</span>`).join("");
  }
  $$(".page-title [data-split]").forEach((el) => splitChars(el));

  const parallax = $("[data-parallax]");
  if (parallax && finePointer && !reduceMotion) {
    let raf = 0;
    parallax.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = parallax.getBoundingClientRect();
        parallax.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        parallax.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    });
    parallax.addEventListener("pointerleave", () => {
      parallax.style.setProperty("--px", 0);
      parallax.style.setProperty("--py", 0);
    });
  }

  const cdTimer = $("#cd-timer");
  if (cdTimer) {
    const statusEl = $("#cd-status");
    const noteEl = $("#cd-note");
    const nums = { d: $('[data-unit="d"]', cdTimer), h: $('[data-unit="h"]', cdTimer), m: $('[data-unit="m"]', cdTimer), s: $('[data-unit="s"]', cdTimer) };
    const days = (DATA.event?.days || []).map((d) => ({ ...d, open: new Date(d.open), close: new Date(d.close) }));
    const fmtTime = (d) => d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" });
    const prev = {};

    const setNum = (key, value) => {
      const v = String(value).padStart(2, "0");
      if (prev[key] === v) return;
      prev[key] = v;
      nums[key].textContent = v;
      if (nums[key].animate) {
        nums[key].animate([{ transform: "translateY(-45%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" });
      }
    };

    const tick = () => {
      const now = new Date();
      let target = null;
      let status = "";
      let note = "";
      let live = false;

      const current = days.find((d) => now >= d.open && now < d.close);
      const next = days.find((d) => now < d.open);
      if (current) {
        live = true;
        target = current.close;
        const isLast = current === days[days.length - 1];
        status = `ただいま開催中！${isLast ? "（最終日）" : ""}`;
        note = `本日 ${fmtTime(current.close)} まで。1-7でお待ちしています！`;
      } else if (next) {
        target = next.open;
        status = next === days[0] ? "開幕まで" : `${next.label}の開場まで`;
        note = "10月3日(土)・4日(日) 10:00〜15:00";
      }

      statusEl.classList.toggle("is-live", live);
      if (!target) {
        statusEl.textContent = "ご来場ありがとうございました！";
        noteEl.textContent = "Y校祭2026 1-7「世界のお菓子万博」は終了しました。";
        cdTimer.classList.add("is-done");
        return false;
      }
      statusEl.textContent = status;
      noteEl.textContent = note;

      const diff = Math.max(0, target - now);
      setNum("d", Math.floor(diff / 86400000));
      setNum("h", Math.floor(diff / 3600000) % 24);
      setNum("m", Math.floor(diff / 60000) % 60);
      setNum("s", Math.floor(diff / 1000) % 60);
      return true;
    };
    if (tick()) setInterval(tick, 1000);
  }

  const postmarkSvg = `
    <svg class="postmark" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="3"/>
      <circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <text x="50" y="47" text-anchor="middle" font-family="Space Mono, monospace" font-weight="700" font-size="10" fill="currentColor">1-7 EXPO</text>
      <text x="50" y="60" text-anchor="middle" font-family="Space Mono, monospace" font-size="8" fill="currentColor">2026.10</text>
      <path d="M86 36q4-3 8 0t8 0M86 50q4-3 8 0t8 0M86 64q4-3 8 0t8 0" fill="none" stroke="currentColor" stroke-width="2.5"/>
    </svg>`;
  const stampGrid = $("#stamp-grid");
  if (stampGrid) {
    const rots = [-4, 3, -2, 5, -5, 2, -3];
    stampGrid.innerHTML = DATA.sweets.map((s, i) => `
      <li>
        <a class="stamp-link" href="sweet.html?id=${s.id}" style="--c:${s.color};--rot:${rots[i % rots.length]}deg">
          <span class="stamp">
            <span class="stamp-inner">
              <span class="stamp-flag"><img src="${s.flag}" alt="${escapeHtml(s.countryJa)}の国旗" loading="lazy"></span>
              <span class="stamp-meta"><span>No.${s.no}</span><span>${escapeHtml(s.country.toUpperCase())}</span></span>
              <span class="stamp-name">${escapeHtml(s.name)}</span>
            </span>
          </span>
          ${postmarkSvg}
        </a>
      </li>`).join("");
  }

  const newsList = $("#news-list");
  if (newsList) {
    const now = Date.now();
    newsList.innerHTML = DATA.news.map((n) => {
      const isNew = now - new Date(`${n.date}T00:00:00+09:00`).getTime() < 7 * 86400000;
      return `<li>
        <time class="news-date" datetime="${n.date}">${n.date.replaceAll("-", ".")}${isNew ? '<span class="news-new">NEW</span>' : ""}</time>
        <p>${escapeHtml(n.text)}</p>
      </li>`;
    }).join("");
  }

  const PASSPORT_KEY = "yko-expo-passport";
  const visited = new Set(store.get(PASSPORT_KEY, []));
  const sweetUrl = (s) => `sweet.html?id=${encodeURIComponent(s.id)}`;
  const allergyText = (s) => (s.allergens && s.allergens.length ? s.allergens.join("・") : "準備中");

  const sweetGrid = $("#sweet-grid");
  if (sweetGrid) {
    sweetGrid.innerHTML = DATA.sweets.map((s) => `
      <li data-region="${s.region}" style="view-transition-name: card-${s.id}">
        <a class="sweet-card" href="${sweetUrl(s)}" data-id="${s.id}" style="--c:${s.color}" data-tilt>
          <div class="sweet-flag">
            <img src="${s.flag}" alt="" loading="lazy">
            <span class="sweet-no">No.${s.no}</span>
            <span class="visited-badge" aria-hidden="true">入国<br>済み</span>
          </div>
          ${s.photo ? `<span class="sweet-thumb" aria-hidden="true"><img src="${s.photo}" alt="" loading="lazy"></span>` : ""}
          <div class="sweet-body">
            <p class="sweet-from">FROM ${escapeHtml(s.country.toUpperCase())} · ${escapeHtml(s.countryJa)}</p>
            <h3 class="sweet-name">${escapeHtml(s.name)}</h3>
            <p class="sweet-native">${escapeHtml(s.native)}</p>
            <p class="sweet-desc">${escapeHtml(s.desc[0])}</p>
            <ul class="sweet-tags">${s.tags.map((t) => `<li>#${escapeHtml(t)}</li>`).join("")}</ul>
          </div>
          <div class="sweet-foot">
            <span class="allergy-pill"><span aria-hidden="true">⚠</span> ${escapeHtml(allergyText(s))}</span>
            <span class="sweet-more">詳しく見る <span class="arrow" aria-hidden="true">→</span></span>
          </div>
        </a>
      </li>`).join("");

    const filters = $("#filters");
    if (filters) {
      filters.innerHTML = DATA.regions.map((r, i) => {
        const count = r.id === "all" ? DATA.sweets.length : DATA.sweets.filter((s) => s.region === r.id).length;
        return `<button class="chip" type="button" data-region="${r.id}" aria-pressed="${i === 0}">${escapeHtml(r.label)}<span class="chip-count">${count}</span></button>`;
      }).join("");
      filters.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        const region = chip.dataset.region;
        const apply = () => {
          $$(".chip", filters).forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
          $$("li[data-region]", sweetGrid).forEach((li) => { li.hidden = region !== "all" && li.dataset.region !== region; });
        };
        if (document.startViewTransition) document.startViewTransition(apply);
        else apply();
      });
    }

    const slots = $("#passport-slots");
    const renderPassport = () => {
      const stamps = new Set(store.get(PASSPORT_KEY, []));
      const total = DATA.sweets.length;
      $$(".sweet-card", sweetGrid).forEach((card) => card.classList.toggle("is-visited", stamps.has(card.dataset.id)));
      if (!slots) return;
      slots.innerHTML = DATA.sweets.map((s) => `
        <li class="${stamps.has(s.id) ? "is-visited" : ""}">
          <a href="${sweetUrl(s)}" aria-label="${escapeHtml(s.countryJa)}：${escapeHtml(s.name)}${stamps.has(s.id) ? "（入国済み）" : ""}"><img src="${s.flag}" alt=""></a>
        </li>`).join("");
      $("#passport-count").innerHTML = `<b>${stamps.size}</b> / ${total} カ国`;
      $("#passport-bar").style.setProperty("--p", stamps.size / total);
      $("#passport").classList.toggle("is-complete", stamps.size === total);
    };
    renderPassport();
    window.addEventListener("pageshow", (e) => { if (e.persisted) renderPassport(); });
    $("#passport-reset")?.addEventListener("click", () => {
      if (!confirm("パスポートのスタンプをリセットしますか？")) return;
      store.set(PASSPORT_KEY, []);
      renderPassport();
    });
  }

  const sweetHero = $("#sweet-hero");
  if (sweetHero) {
    const id = new URLSearchParams(location.search).get("id");
    const index = DATA.sweets.findIndex((s) => s.id === id);
    if (index < 0) {
      location.replace("okashi.html");
    } else {
      const s = DATA.sweets[index];
      const total = DATA.sweets.length;
      document.title = `${s.name} | お菓子紹介 | お菓子万博 Y校祭2026 1-7`;
      document.body.style.setProperty("--c", s.color);

      $("#sweet-bg").style.backgroundImage = `url("${s.bg}")`;
      $("#sweet-country-bg").textContent = s.country.toUpperCase();
      $("#crumb-name").textContent = s.name;
      $("#sweet-flag").src = s.flag;
      $("#sweet-flag").alt = `${s.countryJa}の国旗`;
      $("#sweet-from").textContent = `No.${s.no} · FROM ${s.country.toUpperCase()} · ${s.countryJa}`;
      splitChars($("#sweet-title"), s.name);
      $("#sweet-native").textContent = s.native;

      $("#sweet-photo").innerHTML = s.photo
        ? `<img src="${s.photo}" alt="${escapeHtml(s.name)}の商品写真">`
        : `<div class="photo-placeholder"><span class="ph-native">${escapeHtml(s.native)}</span><span class="ph-label">PHOTO COMING SOON<br>写真準備中</span></div>`;
      $("#sweet-photo").dataset.caption = s.name;
      $("#sweet-desc").innerHTML = s.desc.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
      $("#sweet-tags").innerHTML = s.tags.map((t) => `<li>#${escapeHtml(t)}</li>`).join("");

      $("#sweet-allergens").innerHTML = s.allergens && s.allergens.length
        ? s.allergens.map((a) => `<li>${escapeHtml(a)}</li>`).join("")
        : `<li class="is-pending">準備中</li>`;
      if (s.notes && s.notes.length) {
        $("#sweet-notes").innerHTML = s.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("");
      } else {
        $("#sweet-notes-block").hidden = true;
      }

      const neighbours = [
        { dir: "prev", label: "PREV · 前の国", s: DATA.sweets[(index - 1 + total) % total] },
        { dir: "next", label: "NEXT · 次の国", s: DATA.sweets[(index + 1) % total] },
      ];
      $("#sweet-pager").innerHTML = neighbours.map(({ dir, label, s: n }) => `
        <a class="pager-card pager-${dir}" href="${sweetUrl(n)}" style="--c:${n.color}">
          <span class="pager-bg" style="background-image:url('${n.bg}')" aria-hidden="true"></span>
          <span class="pager-label">${dir === "prev" ? "← " : ""}${label}${dir === "next" ? " →" : ""}</span>
          <span class="pager-name">${escapeHtml(n.name)}</span>
          <span class="pager-country"><img src="${n.flag}" alt="">${escapeHtml(n.countryJa)}</span>
        </a>`).join("");

      const tabs = $$(".sweet-tabs a");
      if ("IntersectionObserver" in window) {
        const spy = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) tabs.forEach((t) => t.classList.toggle("is-active", t.getAttribute("href") === `#${en.target.id}`));
          });
        }, { rootMargin: "-40% 0px -55% 0px" });
        ["#intro", "#allergy"].forEach((sel) => spy.observe($(sel)));
      }

      $("#entry-stamp-country").textContent = s.country.toUpperCase();
      const stamp = $("#entry-stamp");
      const isNew = !visited.has(s.id);
      if (isNew) {
        visited.add(s.id);
        store.set(PASSPORT_KEY, [...visited]);
        stamp.classList.add("slam");
        setTimeout(() => {
          if (visited.size === total) {
            confetti();
            toast("🎉 世界一周達成！7カ国すべてのお菓子を見ました");
          } else {
            toast(`🛂 ${s.countryJa}に入国！ パスポート ${visited.size} / ${total}`);
          }
        }, 1200);
      } else {
        stamp.classList.add("is-shown");
      }
    }
  }

  if (finePointer && !reduceMotion) {
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest?.("[data-tilt]");
      $$("[data-tilt].is-tilting").forEach((c) => {
        if (c !== card) { c.classList.remove("is-tilting"); c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); }
      });
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add("is-tilting");
      card.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
    }, { passive: true });
  }

  const galleryGrid = $("#gallery-grid");
  if (galleryGrid) {
    const rots = [-2.5, 2, -1.5, 3];
    galleryGrid.innerHTML = DATA.posters.map((p, i) => `
      <li>
        <button class="gallery-item" type="button" data-index="${i}" aria-label="ポスター${i + 1}「${escapeHtml(p.title)}」を拡大">
          <span class="gallery-frame" style="--rot:${rots[i % rots.length]}deg">
            <img src="${p.thumb}" alt="${escapeHtml(p.alt)}" loading="lazy" width="720" height="960">
            <span class="gallery-zoom" aria-hidden="true">＋</span>
          </span>
          <span class="gallery-cap"><span class="mono">POSTER No.${String(i + 1).padStart(2, "0")}</span><b>${escapeHtml(p.title)}</b></span>
        </button>
      </li>`).join("");

    const lb = $("#lightbox");
    const lbImg = $("#lb-img");
    const lbCaption = $("#lb-caption");
    const lbCounter = $("#lb-counter");
    let index = 0;
    let lastFocus = null;

    const show = (i, dir = 0) => {
      index = (i + DATA.posters.length) % DATA.posters.length;
      const p = DATA.posters[index];
      lbImg.src = p.src;
      lbImg.alt = p.alt;
      lbCaption.textContent = p.title;
      lbCounter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(DATA.posters.length).padStart(2, "0")}`;
      if (lbImg.animate) {
        lbImg.animate(
          [{ opacity: 0, transform: `translateX(${dir * 40}px) scale(.96)` }, { opacity: 1, transform: "none" }],
          { duration: 450, easing: "cubic-bezier(.22,1,.36,1)" }
        );
      }

      const nextP = DATA.posters[(index + 1) % DATA.posters.length];
      const pre = new Image();
      pre.src = nextP.src;
    };

    galleryGrid.addEventListener("click", (e) => {
      const item = e.target.closest(".gallery-item");
      if (!item) return;
      lastFocus = item;
      show(Number(item.dataset.index));
      lb.showModal();
    });
    $("#lb-prev").addEventListener("click", () => show(index - 1, -1));
    $("#lb-next").addEventListener("click", () => show(index + 1, 1));
    $("#lb-close").addEventListener("click", () => lb.close());
    lb.addEventListener("close", () => lastFocus?.focus());
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(index - 1, -1);
      if (e.key === "ArrowRight") show(index + 1, 1);
    });
    lb.addEventListener("click", (e) => { if (e.target.classList.contains("lb-stage")) lb.close(); });

    let startX = null;
    const stage = $(".lb-stage", lb);
    stage.addEventListener("pointerdown", (e) => { startX = e.clientX; });
    stage.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) dx < 0 ? show(index + 1, 1) : show(index - 1, -1);
    });
  }

  function showOnTop(el) {
    if (!el.isConnected) document.body.append(el);
    if (!el.showPopover) return;
    el.popover = "manual";
    if (el.matches(":popover-open")) el.hidePopover();
    el.showPopover();
  }

  function toast(message) {
    let el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
    }
    el.textContent = message;
    el.classList.remove("is-shown");
    showOnTop(el);
    void el.offsetWidth;
    el.classList.add("is-shown");
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.classList.remove("is-shown");
      setTimeout(() => el.matches?.(":popover-open") && el.hidePopover(), 600);
    }, 4200);
  }

  function confetti() {
    if (reduceMotion) return;
    const canvas = document.createElement("canvas");
    canvas.className = "confetti";
    showOnTop(canvas);
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const colors = ["#DE2910", "#FFDE00", "#0047A0", "#FCD116", "#012169", "#B22234", "#D91023", "#006600", "#F4EBDC", "#E9B42F"];
    const pieces = Array.from({ length: 160 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: innerHeight * 0.45,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 16 - 6,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[(Math.random() * colors.length) | 0],
    }));
    const start = performance.now();
    const frame = (t) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      pieces.forEach((p) => {
        p.vy += 0.38;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - elapsed / 3800);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)));
        ctx.restore();
      });
      if (elapsed < 3800) requestAnimationFrame(frame);
      else canvas.remove();
    };
    requestAnimationFrame(frame);
  }

  $$("[data-reveal], [data-stagger]").forEach(reveal);
})();
