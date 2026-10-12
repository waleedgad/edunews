/* ==========================================================
   EduNews — main.js
   Trimmed down from a copied theme file: this now only keeps
   the pieces that match EduNews's own markup and the vendor
   libraries actually loaded in base.njk (Swiper, PureCounter,
   Typed.js, Isotope + imagesLoaded).

   NOT included here (on purpose):
   - Header drawer + live date logic → lives at the bottom of
     this file (IIFE). Don't duplicate it in the header
     partials, or the drawer will double-toggle.
   - Multi-language routing, theme (dark/light) toggle, VR/
     Kuula tours, Instagram embeds, portfolio/photography/AI
     JSON feeds, video overlays, social-share floating bar —
     none of these have matching elements or vendor scripts
     anywhere in this project. Ask if you actually want any
     of these rebuilt for EduNews and I'll wire them up
     against your real markup instead of copying them as-is.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Generic Swiper init ----------
     Any slider marked up as:
       <div class="init-swiper">
         <script type="application/json" class="swiper-config">{ ... }</script>
         <div class="swiper-wrapper">...</div>
       </div>
     gets initialized automatically. */
  if (typeof Swiper !== 'undefined') {
    document.querySelectorAll('.init-swiper').forEach(el => {
      const cfg = el.querySelector('.swiper-config');
      if (!cfg) return;
      try {
        const config = JSON.parse(cfg.innerHTML.trim());
        el.swiper = new Swiper(el, config);
      } catch (e) {
        console.error('Invalid swiper-config JSON:', e);
      }
    });
  }

  /* ---------- Hero: counter, progress lines, pause-on-link ----------
     - Counter ("01 / 06") stays in step with the slider and ticks on change.
     - Progress lines: lines before the active one stay filled; the active
       one is driven by Swiper's real autoplay clock (autoplayTimeLeft), so it
       always matches the timer, including when paused.
     - Autoplay pauses ONLY while a link inside the hero is hovered or
       keyboard-focused. Hovering the image/empty space does not pause it.
       (index.njk must keep "pauseOnMouseEnter": false.) */
  document.querySelectorAll('.hero-cine-swiper').forEach(el => {
    const swiper = el.swiper;
    if (!swiper) return;

    const counter = el.querySelector('.hero-cine-count b');
    const pad = n => String(n).padStart(2, '0');

    const syncUI = animate => {
      const i = swiper.realIndex;
      if (counter) {
        counter.textContent = pad(i + 1);
        if (animate) {
          counter.classList.remove('is-ticking');
          void counter.offsetWidth;            // restart the CSS animation
          counter.classList.add('is-ticking');
        }
      }
      el.querySelectorAll('.hero-cine-lines .swiper-pagination-bullet')
        .forEach((b, n) => b.classList.toggle('is-done', n < i));
    };
    swiper.on('slideChange', () => syncUI(true));
    syncUI(false);

    // Progress line follows the real autoplay timer
    swiper.on('autoplayTimeLeft', (s, time, progress) => {
      el.classList.add('is-synced');
      el.style.setProperty('--hero-p', (1 - progress).toFixed(4));
    });

    // Pause only on links
    const ap = swiper.autoplay;
    if (!ap) return;
    let hovering = false, focused = false, held = false;

    const update = () => {
      const want = hovering || focused;
      if (want === held) return;
      held = want;
      el.classList.toggle('is-holding', held);
      if (held) { (ap.pause || ap.stop).call(ap); }
      else      { (ap.resume || ap.start).call(ap); }
    };

    el.addEventListener('mouseover', e => {
      if (e.target.closest('a')) { hovering = true; update(); }
    });
    el.addEventListener('mouseout', e => {
      const link = e.target.closest('a');
      if (link && !link.contains(e.relatedTarget)) { hovering = false; update(); }
    });
    el.addEventListener('focusin',  e => { if (e.target.closest('a')) { focused = true;  update(); } });
    el.addEventListener('focusout', e => { if (e.target.closest('a')) { focused = false; update(); } });

    // Swiper resumes autoplay itself when a fade finishes; re-pause if a link is still held
    swiper.on('slideChangeTransitionEnd', () => {
      if (held) setTimeout(() => { if (held) (ap.pause || ap.stop).call(ap); }, 0);
    });
  });

  /* ---------- Breaking bar: label, pause rules, progress ----------
     The Swiper itself is created by the generic .init-swiper code above.
     Here we add what Swiper does not do on its own:
     - Label turns red + reads "عاجل" only while a breaking item is on screen.
     - Autoplay pauses on hover (mouse devices only) and on KEYBOARD focus.
       Starts paused if the visitor prefers reduced motion.
       (index.njk keeps "pauseOnMouseEnter": false.)
     - Thin progress line follows Swiper's real autoplay clock (--tk-p).
     - Slides that are off screen are hidden from screen readers and tab order. */
  document.querySelectorAll('.breaking-bar').forEach(bar => {
    const el = bar.querySelector('.breaking-swiper');
    const swiper = el && el.swiper;
    if (!swiper) return;

    const labelText = bar.querySelector('.breaking-label-text');

    // Label colour/text, and keeping off-screen slides out of reach
    const sync = () => {
      const active = swiper.slides[swiper.activeIndex];
      const isBreaking = !!(active && active.dataset.breaking === 'true');
      bar.classList.toggle('is-breaking', isBreaking);
      if (labelText) labelText.textContent = isBreaking ? labelText.dataset.breaking : labelText.dataset.latest;
      swiper.slides.forEach(s => {
        const on = s === active;
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        s.querySelectorAll('a').forEach(a => { a.tabIndex = on ? 0 : -1; });
      });
    };
    swiper.on('slideChange', sync);
    sync();

    // Progress line follows the real autoplay timer
    swiper.on('autoplayTimeLeft', (s, time, progress) => {
      bar.style.setProperty('--tk-p', (1 - progress).toFixed(4));
    });

    // Pause rules
    const ap = swiper.autoplay;
    if (!ap || !swiper.params.autoplay) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canHover = window.matchMedia('(hover: hover)');
    let manual = reduceMotion.matches, hovering = false, focused = false, held = false;

    const update = () => {
      const want = manual || hovering || focused;
      bar.classList.toggle('is-paused', want);
      if (want === held) return;
      held = want;
      if (held) { (ap.pause || ap.stop).call(ap); }
      else      { (ap.resume || ap.start).call(ap); }
    };

    bar.addEventListener('mouseenter', () => { if (canHover.matches) { hovering = true; update(); } });
    bar.addEventListener('mouseleave', () => { hovering = false; update(); });
    // Keyboard focus only: a tapped/clicked button must not leave the bar paused
    bar.addEventListener('focusin',  e => { if (e.target.matches(':focus-visible')) { focused = true; update(); } });
    bar.addEventListener('focusout', () => { focused = false; update(); });

    // Swiper resumes autoplay itself when a slide transition ends; re-pause if we are holding
    swiper.on('slideChangeTransitionEnd', () => {
      if (held) setTimeout(() => { if (held) (ap.pause || ap.stop).call(ap); }, 0);
    });

    update();
  });

  /* ---------- Stat counters (PureCounter) ---------- */
  if (typeof PureCounter !== 'undefined') {
    new PureCounter();
  }

  /* ---------- Typed.js tagline ----------
     <span class="typed" data-typed-items="أخبار,منح دراسية,تقارير"></span> */
  const typedEl = document.querySelector('.typed');
  if (typedEl && typeof Typed !== 'undefined') {
    const strings = typedEl.getAttribute('data-typed-items').split(',');
    new Typed('.typed', {
      strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  /* ---------- Filterable / infinite-scroll article grid ----------
     For an archive or category page laid out as:
       <div class="isotope-layout" data-layout="masonry">
         <ul class="isotope-filters">
           <li data-filter="*" class="filter-active">All</li>
           <li data-filter=".filter-schools">Schools</li>
         </ul>
         <div class="isotope-container">
           <div class="isotope-item filter-schools">...</div>
         </div>
       </div>
       <div id="scroll-sentinel"></div>
     Loads items in batches as the sentinel scrolls into view. */
  if (typeof Isotope !== 'undefined' && typeof imagesLoaded !== 'undefined') {
    document.querySelectorAll('.isotope-layout').forEach(layout => {
      if (layout.hasAttribute('data-isotope-disabled')) return;

      const container = layout.querySelector('.isotope-container');
      const sentinel = document.getElementById('scroll-sentinel');
      const filterButtons = layout.querySelectorAll('.isotope-filters li');
      if (!container) return;

      imagesLoaded(container, () => {
        const iso = new Isotope(container, {
          itemSelector: '.isotope-item',
          layoutMode: layout.dataset.layout || 'masonry'
        });

        const items = Array.from(container.querySelectorAll('.isotope-item'));
        const ITEMS_PER_BATCH = 6;
        let activeFilter = '*';

        if (window.location.hash) {
          const targetFilter = '.filter-' + window.location.hash.replace('#', '');
          const matchingBtn = Array.from(filterButtons).find(btn => btn.dataset.filter === targetFilter);
          if (matchingBtn) {
            activeFilter = targetFilter;
            layout.querySelector('.filter-active')?.classList.remove('filter-active');
            matchingBtn.classList.add('filter-active');
          }
        }

        function getMatchingItems() {
          if (activeFilter === '*') return items;
          const className = activeFilter.replace('.', '');
          return items.filter(item => item.classList.contains(className));
        }

        function showNextBatch() {
          const matching = getMatchingItems();
          const hidden = matching.filter(i => i.classList.contains('is-hidden'));
          if (hidden.length === 0) return;
          hidden.slice(0, ITEMS_PER_BATCH).forEach(i => i.classList.remove('is-hidden'));
          iso.arrange({ filter: activeFilter });
        }

        items.forEach(item => item.classList.add('is-hidden'));
        showNextBatch();

        if (sentinel) {
          const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) showNextBatch();
          }, { rootMargin: '300px' });
          observer.observe(sentinel);
        }

        filterButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            layout.querySelector('.filter-active')?.classList.remove('filter-active');
            btn.classList.add('filter-active');
            activeFilter = btn.dataset.filter;
            items.forEach(item => item.classList.add('is-hidden'));
            showNextBatch();
          });
        });
      });
    });
  }

  /* ---------- Author page: show 25 articles, then "Show more" ----------
     Works on the .feed-grid inside .author-page. Items beyond the first 25
     are hidden; the button reveals the next 25 each click and removes
     itself when everything is visible. Without JS, all articles still show. */
  document.querySelectorAll('.author-page .feed-grid').forEach(grid => {
    const PAGE = 25;
    const items = Array.from(grid.querySelectorAll(':scope > .feed-item'));
    if (items.length <= PAGE) return;

    const ar = document.documentElement.lang.slice(0, 2).toLowerCase() === 'ar';
    let shown = PAGE;
    items.slice(PAGE).forEach(i => { i.hidden = true; });

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pill-btn feed-more';
    btn.textContent = ar ? 'عرض المزيد' : 'Show more';
    grid.insertAdjacentElement('afterend', btn);

    btn.addEventListener('click', () => {
      const next = items.slice(shown, shown + PAGE);
      next.forEach(i => { i.hidden = false; });
      shown += next.length;
      const firstLink = next[0] && next[0].querySelector('a');
      if (firstLink) firstLink.focus({ preventScroll: true });
      if (shown >= items.length) btn.remove();
    });
  });

  /* ---------- Force LTR runs of Latin text/numbers inside RTL footer copy ----------
     Add class="footer-text" to any Arabic paragraph that may contain an
     email, URL, phone number, or brand name, e.g.:
       <p class="footer-text">تواصل معنا: info@edunews.example</p> */
  document.querySelectorAll('.footer-text').forEach(el => {
    if (!/[+@a-zA-Z0-9]/.test(el.textContent)) return;
    Array.from(el.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
        const span = document.createElement('span');
        span.setAttribute('dir', 'ltr');
        span.textContent = node.textContent;
        el.replaceChild(span, node);
      }
    });
  });

  /* ---------- Back to Top Button ---------- */
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    const toggleBackToTop = () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    };
    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    toggleBackToTop();
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /* ---------- Dynamic Active Navigation Links ---------- */
  // 1. Get the current URL, ignoring query parameters (?q=) or hash anchors (#sec)
  const currentUrl = window.location.href.split(/[?#]/)[0].replace(/\/$/, "");

  // 2. Select both desktop and side-drawer navigation links
  const navLinks = document.querySelectorAll('.primary-nav .nav-link, .drawer-nav-list .drawer-link');

  navLinks.forEach(link => {
      // 3. Normalize the link's URL to compare it accurately
      const linkUrl = link.href.split(/[?#]/)[0].replace(/\/$/, "");

      // 4. If the URLs match, apply the active class and accessibility attributes
      if (currentUrl === linkUrl) {
          link.classList.add('active');
          
          // Add screen-reader context to the drawer links
          if (link.classList.contains('drawer-link')) {
              link.setAttribute('aria-current', 'page');
          }
      }
  });

(function () {
    'use strict';

    // 1. Live Date & Time Updater
    function updateLiveDateTime() {
        var now = new Date();

        // English Formatter
        var enDateElem = document.querySelector('#todayDateEn .date-text');
        var enDrawerDate = document.getElementById('drawerDateEn');
        if (enDateElem || enDrawerDate) {
            var optionsEn = {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };
            var formattedEn = now.toLocaleString('en-US', optionsEn);
            if (enDateElem) enDateElem.textContent = formattedEn;
            if (enDrawerDate) enDrawerDate.textContent = formattedEn;
        }

        // Arabic Formatter
        var arDateElem = document.querySelector('#todayDateAr .date-text');
        var arDrawerDate = document.getElementById('drawerDateAr');
        if (arDateElem || arDrawerDate) {
            var optionsAr = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };
            var formattedAr = now.toLocaleString('ar-EG', optionsAr);
            if (arDateElem) arDateElem.textContent = formattedAr;
            if (arDrawerDate) arDrawerDate.textContent = formattedAr;
        }
    }

    updateLiveDateTime();
    setInterval(updateLiveDateTime, 1000);

    // 2. Side Drawer Controls
    var menuToggle = document.querySelector('[data-menu-toggle]');
    var sideDrawer = document.querySelector('[data-side-drawer]');
    var closeBtn   = document.querySelector('[data-drawer-close]');
    var backdrop   = document.querySelector('[data-drawer-backdrop]');
    var body       = document.body;

    function isOpen() { return sideDrawer && sideDrawer.classList.contains('is-open'); }

    function openDrawer() {
        if (!sideDrawer || isOpen()) return;
        sideDrawer.classList.add('is-open');
        if (backdrop) backdrop.classList.add('is-open');
        body.classList.add('drawer-open');
        if (menuToggle) {
            menuToggle.classList.add('is-active');
            menuToggle.setAttribute('aria-expanded', 'true');
        }
        sideDrawer.setAttribute('aria-hidden', 'false');
        if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    function closeDrawer() {
        if (!isOpen()) return;
        sideDrawer.classList.remove('is-open');
        if (backdrop) backdrop.classList.remove('is-open');
        body.classList.remove('drawer-open');
        if (menuToggle) {
            menuToggle.classList.remove('is-active');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.focus({ preventScroll: true });
        }
        sideDrawer.setAttribute('aria-hidden', 'true');
    }

    if (menuToggle) menuToggle.addEventListener('click', function () { isOpen() ? closeDrawer() : openDrawer(); });
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', function (e) {
        if (!isOpen()) return;
        if (e.key === 'Escape') { closeDrawer(); return; }
        if (e.key !== 'Tab') return;
        // Keep keyboard focus inside the open drawer
        var f = sideDrawer.querySelectorAll('a[href], button:not([disabled])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // 2b. Header shrink on scroll (drives .site-header.scrolled in main.css)
    var siteHeader = document.getElementById('siteHeader');
    if (siteHeader) {
        var ticking = false;
        var onScroll = function () {
            ticking = false;
            siteHeader.classList.toggle('scrolled', window.scrollY > 40);
        };
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
        }, { passive: true });
        onScroll();
    }

    // 3. Dynamic Translation URL handling
    var langSwitches = document.querySelectorAll('[data-translation-url]');
    var altMeta = document.querySelector('[data-translation-url-meta]');
    if (altMeta) {
        var url = altMeta.getAttribute('data-translation-url-meta');
        langSwitches.forEach(function (btn) { btn.setAttribute('href', url); });
    }
})();
});

/* ==========================================================
   Search: header dropdown (quick preview) + full results page
   Powered by Pagefind.

   REPLACE the old "Header search (powered by Pagefind)" block at the
   end of main.js with this whole file (keep it after the last "});").

   - Header dropdown: shows the top 5 matches while typing, plus a
     "view all results" link. Pressing Enter opens the results page.
   - Results page: runs on any page that contains #searchPage
     (see search-ar.njk / search-en.njk) and reads ?q= from the URL.
   - Pagefind reads <html lang> and searches that language's index.
   ========================================================== */
(function () {
  'use strict';

  /* ---- Load Pagefind once, on demand (shared by both parts) ---- */
  let loading = null;
  function loadPagefind() {
    if (!loading) {
      loading = import('/pagefind/pagefind.js')
        .then(async pf => {
          // Shorter snippets: the title already tells the reader what the story is.
          try { await pf.options({ excerptLength: 22 }); } catch (e) { /* older Pagefind: ignore */ }
          return pf;
        })
        .catch(err => {
          loading = null;          // allow a retry next time
          throw err;
        });
    }
    return loading;
  }

  /* Language of the current page (ar / en). Used to keep the two
     languages' search results completely separate. */
  const LANG = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  const SEARCH_OPTIONS = { filters: { lang: LANG } };

  /* Small line under a result title: "Category · 8 Oct 2026".
     Uses ONLY the data-pagefind-meta fields "category" and "date" set on the article page.
     Photo credits, captions and author names are never shown in results. */
  function metaLine(meta) {
    if (!meta) return '';
    const parts = [];
    if (meta.category) parts.push(meta.category);
    if (meta.date) {
      const d = new Date(meta.date);
      if (!isNaN(d)) {
        parts.push(d.toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
      }
    }
    return parts.join(' · ');
  }

  function make(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  /* ==========================================================
     1. HEADER DROPDOWN
     ========================================================== */
  function initHeaderSearch() {
    const trigger = document.querySelector('.search-trigger');
    const panel   = document.getElementById('searchPanel');
    if (!trigger || !panel) return;

    const form     = panel.querySelector('.search-box');
    const input    = panel.querySelector('.search-input');
    const results  = panel.querySelector('.search-results');
    const closeBtn = panel.querySelector('.search-close');
    const ar = document.documentElement.lang === 'ar';
    const searchUrl = form.getAttribute('action') || (ar ? '/ar/search/' : '/en/search/');
    const msg = {
      none:  panel.dataset.msgNone  || (ar ? 'لا توجد نتائج لـ' : 'No results for'),
      error: panel.dataset.msgError || (ar ? 'البحث غير متاح حاليًا، حاول مرة أخرى لاحقًا.' : 'Search is unavailable right now. Please try again later.'),
      all:   panel.dataset.msgAll   || (ar ? 'عرض كل النتائج' : 'View all results')
    };
    const PREVIEW = 5;

    trigger.setAttribute('aria-controls', 'searchPanel');
    trigger.setAttribute('aria-expanded', 'false');

    /* ---- Open / close ---- */
    const isOpen = () => panel.classList.contains('is-open');

    const open = () => {
      panel.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      input.focus({ preventScroll: true });
      loadPagefind().catch(() => {});   // warm up; errors are shown when searching
    };

    const close = (returnFocus = true) => {
      panel.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) trigger.focus({ preventScroll: true });
    };

    trigger.addEventListener('click', () => (isOpen() ? close() : open()));
    closeBtn.addEventListener('click', () => close());

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen()) close();
    });

    // Click anywhere outside the panel / button closes it
    document.addEventListener('click', e => {
      if (isOpen() && !panel.contains(e.target) && !trigger.contains(e.target)) close(false);
    });

    /* ---- Enter / submit: go to the results page (ignore empty) ---- */
    const goToResults = () => {
      const q = input.value.trim();
      if (q) window.location.href = `${searchUrl}?q=${encodeURIComponent(q)}`;
    };
    form.addEventListener('submit', e => { e.preventDefault(); goToResults(); });
    input.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      goToResults();
    });

    /* ---- Rendering ---- */
    const showMessage = text => {
      const p = make('p', 'search-msg');
      p.textContent = text;
      results.replaceChildren(p);
    };

    const render = (items, query) => {
      if (!items.length) { showMessage(`${msg.none} “${query}”`); return; }

      const list = make('ul', 'search-list');
      items.forEach(item => {
        const li = make('li', 'search-item');

        const a = make('a', 'search-link');
        a.href = item.url;
        a.textContent = (item.meta && item.meta.title) || item.url;

        const p = make('p', 'search-excerpt');
        p.innerHTML = item.excerpt;     // Pagefind returns escaped text with <mark> tags only

        li.append(a);
        const line = metaLine(item.meta);
        if (line) {
          const m = make('p', 'search-meta');
          m.textContent = line;
          li.append(m);
        }
        li.append(p);
        list.append(li);
      });

      const all = make('a', 'search-all');
      all.href = `${searchUrl}?q=${encodeURIComponent(query)}`;
      const icon = make('i', 'bi ' + (document.documentElement.dir === 'rtl' ? 'bi-arrow-left' : 'bi-arrow-right'));
      icon.setAttribute('aria-hidden', 'true');
      all.append(msg.all, icon);

      results.replaceChildren(list, all);
    };

    /* ---- Searching ---- */
    let lastQuery = '';

    const run = async raw => {
      const query = raw.trim();
      if (query === lastQuery) return;
      lastQuery = query;

      if (!query) { results.replaceChildren(); return; }

      try {
        const pagefind = await loadPagefind();
        const search = await pagefind.debouncedSearch(query, SEARCH_OPTIONS, 200);
        if (search === null) return;    // a newer keystroke replaced this search
        const items = await Promise.all(search.results.slice(0, PREVIEW).map(r => r.data()));
        render(items, query);
      } catch (err) {
        console.error('Search failed:', err);
        showMessage(msg.error);
      }
    };

    input.addEventListener('input', () => run(input.value));
  }

  /* ==========================================================
     2. FULL RESULTS PAGE  (/ar/search/?q=...  and  /en/search/?q=...)
     ========================================================== */
  function initResultsPage() {
    const page = document.getElementById('searchPage');
    if (!page) return;

    const form   = page.querySelector('.search-page-form');
    const input  = page.querySelector('.search-page-input');
    const status = page.querySelector('.search-page-status');
    const list   = page.querySelector('.search-page-list');
    const more   = page.querySelector('.search-page-more');
    const d = page.dataset;
    const PAGE_SIZE = 10;

    const query = (new URLSearchParams(window.location.search).get('q') || '').trim();
    input.value = query;

    form.addEventListener('submit', e => {
      if (!input.value.trim()) e.preventDefault();
    });

    const say = text => { status.textContent = text; };

    if (!query) { say(d.msgPrompt); return; }

    let results = [];
    let shown = 0;

    const card = item => {
      const li = make('li', 'search-card');

      const h = make('h2', 'search-card-title');
      const a = make('a');
      a.href = item.url;
      a.textContent = (item.meta && item.meta.title) || item.url;
      h.append(a);

      const p = make('p', 'search-card-excerpt');
      p.innerHTML = item.excerpt;       // Pagefind returns escaped text with <mark> tags only

      li.append(h);
      const line = metaLine(item.meta);
      if (line) {
        const m = make('p', 'search-card-meta');
        m.textContent = line;
        li.append(m);
      }
      li.append(p);
      return li;
    };

    const showMore = async () => {
      more.disabled = true;
      const slice = results.slice(shown, shown + PAGE_SIZE);
      const items = await Promise.all(slice.map(r => r.data()));
      items.forEach(item => list.append(card(item)));
      shown += slice.length;
      more.hidden = shown >= results.length;
      more.disabled = false;
    };

    more.addEventListener('click', () => {
      showMore().catch(err => {
        console.error('Search failed:', err);
        say(d.msgError);
      });
    });

    (async () => {
      try {
        const pagefind = await loadPagefind();
        const search = await pagefind.search(query, SEARCH_OPTIONS);
        results = search.results;

        if (!results.length) { say(`${d.msgNone} “${query}”`); return; }

        say(d.msgCount.replace('{q}', () => query).replace('{n}', () => String(results.length)));
        await showMore();
      } catch (err) {
        console.error('Search failed:', err);
        say(d.msgError);
      }
    })();
  }

  /* ---- Start ---- */
  function init() {
    initHeaderSearch();
    initResultsPage();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();