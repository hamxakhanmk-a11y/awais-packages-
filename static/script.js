// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Show the page after the first paint instead of waiting for below-fold images.
const dismissLoader = () => requestAnimationFrame(() => requestAnimationFrame(() => {
  document.getElementById('loader')?.classList.add('done');
}));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dismissLoader, {once: true});
else dismissLoader();

// Prepare galleries before they enter view, including photos hidden in a stage.
const imagePrep = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('img').forEach(img => {
      img.loading = 'eager';
      img.decoding = 'async';
    });
    imagePrep.unobserve(entry.target);
  });
}, {rootMargin: '1400px 0px'});
document.querySelectorAll('[data-home-products], [data-home-clients], [data-home-process], [data-home-quality], [data-services-section], .proc, .proc-mob__step').forEach(section => imagePrep.observe(section));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Shared by Home and the automatic Services card sequence.
const cardMotion = Object.freeze({ reveal: 1100, hold: 100, slide: 1100, gap: 100, easing: "cubic-bezier(.16,1,.3,1)" });

// Mobile nav — hamburger toggle
(function () {
  const header = document.querySelector('.site-header');
  const toggle = header && header.querySelector('.nav-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  header.querySelectorAll('.nav-links a').forEach((a) => {
    a.addEventListener('click', () => {
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// On phones, navigate to About first; tapping About on that page toggles its submenu.
(function () {
  const wraps = [...document.querySelectorAll('.has-dropdown')];
  const desktop = () => window.matchMedia('(min-width: 1025px)').matches;
  const pagePath = url => new URL(url, window.location.href).pathname.replace(/\/$/, '').replace(/\.html$/, '');
  function close(wrap) {
    wrap.classList.remove('dropdown-open');
    wrap.querySelector(':scope > a')?.setAttribute('aria-expanded', 'false');
  }
  wraps.forEach(wrap => {
    const trigger = wrap.querySelector(':scope > a');
    trigger?.setAttribute('aria-haspopup', 'true');
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.addEventListener('click', event => {
      if (desktop() || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (pagePath(trigger.href) !== pagePath(window.location.href)) return;
      event.preventDefault();
      const open = !wrap.classList.contains('dropdown-open');
      wraps.forEach(close);
      wrap.classList.toggle('dropdown-open', open);
      trigger.setAttribute('aria-expanded', String(open));
    });
    wrap.querySelectorAll('.dropdown a').forEach(link => link.addEventListener('click', () => close(wrap)));
  });
  document.addEventListener('click', event => {
    wraps.forEach(wrap => { if (!wrap.contains(event.target)) close(wrap); });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') wraps.forEach(close);
  });
})();

/* ============================================================
   Scroll story: paper → print → die-cut → folded carton
   ============================================================ */
const scrolly = document.getElementById('story');
const stage = document.getElementById('stage');
const scene = document.getElementById('scene');
const landing = document.getElementById('landing');
const printHead = document.getElementById('printHead');
const captions = [...document.querySelectorAll('.caption')];
const dots = [...document.querySelectorAll('.dots span')];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const norm = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
// ease for the fold so panels settle gently
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function setVars(p) {
  const intro = norm(p, 0.02, 0.14);
  const print = norm(p, 0.17, 0.45);
  const cut   = norm(p, 0.49, 0.64);
  const waste = norm(p, 0.64, 0.72);
  const fold  = norm(p, 0.74, 0.95);
  const foldA = easeInOut(norm(fold, 0, 0.6));
  const foldB = easeInOut(norm(fold, 0.45, 1));
  const view  = easeInOut(norm(p, 0.72, 0.98));

  stage.style.setProperty('--intro', intro);
  stage.style.setProperty('--print', print);
  stage.style.setProperty('--cut', cut);
  stage.style.setProperty('--waste', waste);
  stage.style.setProperty('--foldA', foldA);
  stage.style.setProperty('--foldB', foldB);
  stage.style.setProperty('--view', view);

  // landing headline fades out as the story starts
  const landingOut = norm(p, 0.01, 0.08);
  landing.style.opacity = 1 - landingOut;
  landing.style.transform = `translateY(${landingOut * -40}px)`;
  landing.style.visibility = landingOut >= 1 ? 'hidden' : 'visible';

  // print head only visible mid-pass
  printHead.classList.toggle('on', print > 0 && print < 1);

  // captions + dots
  let step = -1;
  if (p > 0.06 && p <= 0.17) step = 0;
  else if (p > 0.17 && p <= 0.49) step = 1;
  else if (p > 0.49 && p <= 0.74) step = 2;
  else if (p > 0.74) step = 3;
  captions.forEach((c) => c.classList.toggle('active', +c.dataset.step === step));
  dots.forEach((d) => d.classList.toggle('active', +d.dataset.step === step));
}

if (!reducedMotion && scrolly) {
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const total = scrolly.offsetHeight - window.innerHeight;
      const p = clamp(-scrolly.getBoundingClientRect().top / total, 0, 1);
      setVars(p);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
} else if (scrolly) {
  // reduced motion: show the finished state, all captions visible via CSS
  landing.style.opacity = 1;
  printHead.classList.remove('on');
}

// Scale the 700x460 scene down on small screens
function fitScene() {
  if (!scene) return;
  const s = Math.min(1, (window.innerWidth - 32) / 700, (window.innerHeight - 220) / 460);
  scene.style.transform = `scale(${s})`;
}
window.addEventListener('resize', fitScene);
fitScene();

/* ============================================================
   Generic niceties
   ============================================================ */
// Scroll reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Assign photos to .media placeholders based on their caption label
(function () {
  var map = [
    ['tablet', 'images/p-tablet.jpg'],
    ['syrup', 'images/p-syrup.jpg'],
    ['blister', 'images/p-blister.jpg'],
    ['ointment', 'images/p-ointment.jpg'],
    ['vial', 'images/p-vial.jpg'],
    ['ampoule', 'images/p-vial.jpg'],
    ['leaflet', 'images/p-leaflet.jpg'],
    ['insert', 'images/p-leaflet.jpg'],
    ['die-cut', 'images/diecutting.jpg'],
    ['folder-gluer', 'images/foldergluer.jpg'],
    ['pressroom', 'images/pressroom.jpg'],
    ['press', 'images/pressroom.jpg'],
    ['finished cartons', 'images/cartons.jpg'],
    ['carton', 'images/cartons.jpg'],
    ['factory', 'images/factory.jpg'],
    ['building', 'images/factory.jpg'],
    ['quality', 'images/quality.jpg'],
    ['inspection', 'images/quality.jpg'],
    ['team', 'images/team.jpg'],
    ['floor', 'images/team.jpg']
  ];
  document.querySelectorAll('.media').forEach(function (m) {
    var chip = m.querySelector('.media__chip');
    if (!chip) return;
    var t = chip.textContent.toLowerCase();
    for (var i = 0; i < map.length; i++) {
      if (t.indexOf(map[i][0]) > -1) {
        m.style.backgroundImage = "url('" + map[i][1] + "')";
        m.classList.add('media--has-photo');
        chip.textContent = chip.textContent.replace('📷', '').trim();
        break;
      }
    }
  });
})();

// Animated stat counters
const countIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = +el.dataset.count;
    const dur = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))).toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countIO.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

/* Homepage three-stage scroll story */
(function () {
  const story = document.querySelector('.home-story');
  if (!story) return;

  const scenes = [...story.querySelectorAll('[data-home-stage]')];
  const dots = [...story.querySelectorAll('.home-story__progress span')];
  const header = document.querySelector('.site-header');
  let activeStage = -1;
  let ticking = false;

  function showStage(index) {
    index = Math.max(0, Math.min(scenes.length - 1, index));
    if (index === activeStage) return;
    activeStage = index;
    story.dataset.activeStage = String(index);
    scenes.forEach((sceneEl, sceneIndex) => sceneEl.classList.toggle('is-active', sceneIndex === index));
    dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === index));
  }

  function updateStory() {
    const rect = story.getBoundingClientRect();
    const travel = Math.max(1, story.offsetHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / travel));
    showStage(Math.round(progress * (scenes.length - 1)));
    header?.classList.toggle('is-over-hero', rect.bottom > 68 && rect.top < 68);
    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateStory);
  }

  showStage(0);
  updateStory();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);

})();

/* Liquid navigation indicator — shared by every page and mobile menu. */
(function () {
  const header = document.querySelector('.site-header');
  const nav = header?.querySelector('.nav-links');
  const toggle = header?.querySelector('.nav-toggle');
  if (!nav) return;

  const topLinks = [...nav.querySelectorAll(':scope > a, :scope > .has-dropdown > a')];
  const pagePath = new URL(window.location.href).pathname.replace(/index\.html$/, '');
  const matchingLink = [...nav.querySelectorAll('a')].find((link) => {
    const linkPath = new URL(link.href, window.location.href).pathname.replace(/index\.html$/, '');
    return linkPath === pagePath;
  });
  const activeLink = topLevelLink(nav.querySelector('a.current') || matchingLink || topLinks[0]);
  let targetTimer;

  function topLevelLink(link) {
    return link.closest('.has-dropdown')?.querySelector(':scope > a') || link;
  }

  function positionIndicator(link, animate) {
    link = topLevelLink(link);
    if (!link || link.offsetParent === null) return;
    clearTimeout(targetTimer);
    nav.querySelectorAll('.nav-flow-target').forEach((item) => item.classList.remove('nav-flow-target'));
    if (animate && !reducedMotion) {
      targetTimer = setTimeout(() => link.classList.add('nav-flow-target'), 520);
    } else {
      link.classList.add('nav-flow-target');
    }
    const firstPosition = !nav.classList.contains('nav-flow-ready');
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    nav.style.setProperty('--nav-flow-x', `${linkRect.left - navRect.left}px`);
    nav.style.setProperty('--nav-flow-w', `${linkRect.width}px`);
    nav.style.setProperty('--nav-flow-h', `${linkRect.height}px`);

    nav.classList.add('nav-flow-ready');
    if (firstPosition) requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add('nav-flow-initialized')));
    if (animate && !reducedMotion) {
      nav.classList.remove('is-flowing');
      void nav.offsetWidth;
      nav.classList.add('is-flowing');
    }
  }

  function syncIndicator() {
    requestAnimationFrame(() => positionIndicator(activeLink, false));
  }

  function setupDropdownIndicator(dropdown) {
    const dropdownLinks = [...dropdown.querySelectorAll(':scope > a')];
    let subTargetTimer;
    const matched = dropdownLinks.find((link) => {
      const linkPath = new URL(link.href, window.location.href).pathname.replace(/index\.html$/, '');
      return linkPath === pagePath;
    });

    function positionDropdown(link, animate) {
      if (!link) return;
      clearTimeout(subTargetTimer);
      dropdownLinks.forEach((item) => item.classList.remove('sub-flow-target', 'sub-flow-pending'));
      if (animate && !reducedMotion) {
        link.classList.add('sub-flow-pending');
        subTargetTimer = setTimeout(() => {
          link.classList.remove('sub-flow-pending');
          link.classList.add('sub-flow-target');
        }, 400);
      } else {
        link.classList.add('sub-flow-target');
      }
      dropdown.style.setProperty('--sub-flow-y', `${link.offsetTop}px`);
      dropdown.style.setProperty('--sub-flow-h', `${link.offsetHeight}px`);
      dropdown.classList.add('sub-flow-ready');
      if (animate && !reducedMotion) {
        dropdown.classList.remove('is-sub-flowing');
        void dropdown.offsetWidth;
        dropdown.classList.add('is-sub-flowing');
      }
    }

    dropdownLinks.forEach((link) => {
      link.addEventListener('mouseenter', () => positionDropdown(link, true));
      link.addEventListener('focus', () => positionDropdown(link, true));
      link.addEventListener('click', () => positionDropdown(link, true));
    });
    dropdown.addEventListener('mouseleave', () => {
      if (matched) {
        positionDropdown(matched, true);
      } else {
        clearTimeout(subTargetTimer);
        dropdownLinks.forEach((item) => item.classList.remove('sub-flow-target', 'sub-flow-pending'));
        dropdown.classList.remove('sub-flow-ready', 'is-sub-flowing');
      }
    });
    if (matched) requestAnimationFrame(() => positionDropdown(matched, false));
  }

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      // Skip the destination loader before first paint for this navigation only.
      try { sessionStorage.setItem('site-tab-navigation', JSON.stringify({path: url.pathname, time: Date.now()})); } catch {}
      positionIndicator(link, false);
    });
  });

  nav.querySelectorAll('.dropdown').forEach(setupDropdownIndicator);
  toggle?.addEventListener('click', syncIndicator);
  window.addEventListener('resize', syncIndicator);
  syncIndicator();
  // Fonts finishing their swap-in after the first measurement (e.g. loading
  // straight into a page whose current tab is a long label) can leave the
  // indicator a few pixels off - resync once everything has actually settled.
  document.fonts?.ready?.then(syncIndicator);
  window.addEventListener('load', syncIndicator);

  // Match the card reveal and keep the indicator attached throughout resizing.
  if (!reducedMotion) {
    let duration = cardMotion.reveal;
    header.style.setProperty('--nav-resize-duration', duration + 'ms');
    let lastY = window.scrollY, travel = 0, direction = 0;
    let ticking = false, tracking = false, trackUntil = 0;
    const stagedStories = [...document.querySelectorAll('[data-home-process], [data-home-quality]')];
    const staticStages = matchMedia('(prefers-reduced-motion: reduce), (max-height: 540px), (max-width: 1024px) and (max-height: 600px)');
    function isPinned() {
      return !staticStages.matches && stagedStories.some(story => {
        const rect = story.getBoundingClientRect();
        const sticky = story.querySelector('.home-process-story__sticky, .home-quality-story__sticky');
        return sticky && rect.top <= 2 && rect.bottom >= sticky.offsetHeight - 2;
      });
    }
    function setCondensed(condensed) {
      if (header.classList.contains('nav-condensed') === condensed) return;
      const mobile = matchMedia('(max-width: 1024px)').matches;
      duration = mobile && !condensed ? 1500 : cardMotion.reveal;
      header.style.setProperty('--nav-resize-duration', duration + 'ms');
      header.style.setProperty('--nav-resize-easing', mobile ? 'cubic-bezier(.4,0,.2,1)' : 'cubic-bezier(.16,1,.3,1)');
      header.classList.toggle('nav-condensed', condensed);
      nav.classList.add('is-tracking');
      trackUntil = performance.now() + duration + 80;
      if (tracking) return;
      tracking = true;
      const frame = now => {
        positionIndicator(activeLink, false);
        if (now < trackUntil) requestAnimationFrame(frame);
        else { tracking = false; nav.classList.remove('is-tracking'); }
      };
      requestAnimationFrame(frame);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY, delta = y - lastY;
        lastY = y;
        if (y < 80) { travel = 0; direction = 0; setCondensed(false); return; }
        // Pinned chapters own their stage changes; ignore their scroll anchors.
        if (isPinned()) { travel = 0; direction = 0; return; }
        if (Math.abs(delta) < 1) return;
        const nextDirection = Math.sign(delta);
        if (nextDirection !== direction) { travel = 0; direction = nextDirection; }
        travel += Math.abs(delta);
        if (travel >= 48) { setCondensed(direction > 0); travel = 0; }
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('site-stage-change', event => {
      lastY = window.scrollY;
      travel = 0;
      direction = 0;
      setCondensed(event.detail.direction > 0);
    });
  }
})();
/* Homepage continuing scroll chapters */
(function () {
  const overview = document.querySelector('[data-home-overview]');

  if (!overview) return;




  let ticking = false;

  function storyProgress(element) {
    const rect = element.getBoundingClientRect();
    const travel = Math.max(1, element.offsetHeight - window.innerHeight);
    return Math.max(0, Math.min(1, -rect.top / travel));
  }

  function updateOverview() {
    if (!overview) return;
    const progress = storyProgress(overview);
    const revealProgress = Math.min(1, progress / 0.38);
    const eased = 1 - Math.pow(1 - revealProgress, 3);
    overview.style.setProperty('--overview-progress', eased.toFixed(4));
    overview.style.setProperty('--overview-opacity', (0.18 + eased * 0.82).toFixed(4));
    overview.style.setProperty('--overview-y', `${((1 - eased) * 105).toFixed(2)}px`);
    overview.style.setProperty('--overview-copy-y', `${((1 - eased) * 120).toFixed(2)}px`);
    overview.style.setProperty('--overview-scale', (0.72 + eased * 0.28).toFixed(4));
    overview.style.setProperty('--overview-clip-y', `${((1 - eased) * 36).toFixed(2)}%`);
    overview.style.setProperty('--overview-clip-x', `${((1 - eased) * 13).toFixed(2)}%`);
    overview.style.setProperty('--overview-image-scale', (1.13 - eased * 0.13).toFixed(4));
    overview.style.setProperty('--overview-bar-width', `${(progress * 100).toFixed(2)}%`);
  }

  function update() {
    updateOverview();

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }



  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
})();
/* Homepage story stages: one gesture slides, then lifts the stage at center. */
(function () {
  const staticLayout = matchMedia('(prefers-reduced-motion: reduce), (max-height: 540px), (max-width: 1024px) and (max-height: 600px)');
  document.querySelectorAll('[data-home-process], [data-home-quality]').forEach(story => {
    const scenes = [...story.querySelectorAll('.home-process-scene')];
    if (!scenes.length) return;
    const prefix = story.hasAttribute('data-home-quality') ? 'home-quality-story' : 'home-process-story';
    const carousel = story.hasAttribute('data-home-process');
    const sticky = story.querySelector('.' + prefix + '__sticky');
    const counter = story.querySelector('.' + prefix + '__count b');
    const bar = story.querySelector('.' + prefix + '__progress span');
    story.style.setProperty('--stage-count', scenes.length);
    let index = -1, busy = false, frame = 0, lastWheel = -Infinity;
    let touchY = null, touchConsumed = false;
    const ease = t => t * t * (3 - 2 * t);
    function pinned() {
      const rect = story.getBoundingClientRect();
      return !staticLayout.matches && rect.top <= 2 && rect.bottom >= sticky.offsetHeight - 2;
    }
    function position(next) {
      const rect = story.getBoundingClientRect();
      return scrollY + rect.top + (story.offsetHeight - sticky.offsetHeight) * ((next + .5) / scenes.length);
    }
    function paint(card, x, scale, lift, visible) {
      card.classList.toggle('is-rendered', visible);
      card.style.setProperty('--stage-x', x + 'px');
      card.style.setProperty('--stage-scale', scale);
      card.style.setProperty('--stage-lift', lift + 'px');
    }
    function carouselFrame(current) {
      const width = scenes[0].offsetWidth;
      const spacing = Math.min(innerWidth * .55, width * .86);
      scenes.forEach((card, i) => {
        const offset = i - current;
        const distance = Math.abs(offset);
        const prominence = 1 - Math.min(1, distance);
        paint(card, offset * spacing, .68 + .32 * prominence, -12 * prominence, distance < 2);
        card.style.opacity = String(distance <= 1 ? .24 + .76 * prominence : .24 * Math.max(0, 2 - distance));
        card.style.zIndex = String(Math.round(prominence * 10));
        card.style.pointerEvents = distance < .01 ? 'auto' : 'none';
      });
    }
    function resting() {
      scenes.forEach((card, i) => {
        paint(card, 0, 1.045, -8, staticLayout.matches || i === index);
        card.setAttribute('aria-hidden', String(!staticLayout.matches && i !== Math.max(0, index)));
        if (staticLayout.matches) card.style.pointerEvents = 'auto';
      });
      if (carousel && !staticLayout.matches) carouselFrame(Math.max(0, index));
      if (counter) counter.textContent = String(Math.max(1, index + 1)).padStart(2, '0');
      if (bar) bar.style.width = ((index + 1) / scenes.length * 100) + '%';
    }
    function animate(next, direction, anchor = true) {
      const previous = index;
      index = next;
      busy = true;
      if (anchor) scrollTo({top: position(next), behavior: 'instant'});
      if (previous >= 0) dispatchEvent(new CustomEvent('site-stage-change', {detail: {direction}}));
      const started = performance.now();
      scenes.forEach((card, i) => card.setAttribute('aria-hidden', String(i !== next)));
      if (counter) counter.textContent = String(next + 1).padStart(2, '0');
      function tick(now) {
        const elapsed = now - started;
        const slide = ease(Math.min(1, elapsed / 780));
        const lift = ease(Math.max(0, Math.min(1, (elapsed - 780) / 360)));
        const distance = innerWidth;
        if (carousel) carouselFrame(Math.max(0, previous) + (next - Math.max(0, previous)) * ease(Math.min(1, elapsed / 900)));
        else scenes.forEach((card, i) => {
          if (i === next) paint(card, direction * distance * (1 - slide), .94 + .105 * lift, -8 * lift, true);
          else if (i === previous) paint(card, -direction * distance * slide, 1.045 - .105 * slide, -8 * (1 - slide), slide < 1);
          else paint(card, 0, .94, 0, false);
        });
        if (bar) bar.style.width = ((previous + 1 + (next - previous) * Math.min(1, elapsed / 1140)) / scenes.length * 100) + '%';
        if (elapsed < 1140) frame = requestAnimationFrame(tick);
        else { busy = false; frame = 0; resting(); }
      }
      frame = requestAnimationFrame(tick);
    }
    function move(direction, event) {
      if (!pinned()) return false;
      if (busy) { event.preventDefault(); return true; }
      const next = index + direction;
      if (next < 0 || next >= scenes.length) return false;
      event.preventDefault();
      animate(next, direction);
      return true;
    }
    addEventListener('wheel', event => {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || Math.abs(event.deltaY) < 1 || !pinned()) return;
      const now = performance.now(), continuingGesture = now - lastWheel < 200;
      lastWheel = now;
      // Consume trackpad momentum until the gesture ends, including on the last stage.
      if (busy || continuingGesture) { event.preventDefault(); return; }
      move(event.deltaY > 0 ? 1 : -1, event);
    }, {passive: false});
    addEventListener('touchstart', event => {
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
      touchConsumed = false;
    }, {passive: true});
    addEventListener('touchmove', event => {
      if (touchY === null || event.touches.length !== 1 || !pinned()) return;
      if (touchConsumed || busy) { event.preventDefault(); return; }
      const delta = touchY - event.touches[0].clientY;
      if (Math.abs(delta) >= 18) touchConsumed = move(delta > 0 ? 1 : -1, event);
    }, {passive: false});
    addEventListener('touchend', () => { touchY = null; touchConsumed = false; }, {passive: true});
    addEventListener('keydown', event => {
      if (event.target.closest('input, textarea, select, button, a, [contenteditable="true"]') || event.ctrlKey || event.metaKey || event.altKey) return;
      const direction = ['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey) ? 1
        : ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey) ? -1 : 0;
      if (direction) move(direction, event);
    });
    function sync() {
      if (staticLayout.matches) { resting(); return; }
      if (busy || !pinned()) return;
      const progress = -story.getBoundingClientRect().top / Math.max(1, story.offsetHeight - sticky.offsetHeight);
      const target = Math.max(0, Math.min(scenes.length - 1, Math.floor(progress * scenes.length)));
      if (target !== index) animate(target, index < 0 || target > index ? 1 : -1, false);
    }
    function reset() {
      cancelAnimationFrame(frame);
      busy = false;
      lastWheel = -Infinity;
      resting();
      sync();
    }
    scenes.forEach(card => {
      const img = card.querySelector('img');
      if (img) img.decoding = 'async';
    });
    resting();
    sync();
    addEventListener('scroll', sync, {passive: true});
    addEventListener('resize', reset);
    staticLayout.addEventListener('change', reset);
  });
})();
/* Standalone contact scroll reveal */
(function(){const story=document.querySelector('[data-home-contact]');if(!story)return;let ticking=false;function update(){const rect=story.getBoundingClientRect(),travel=Math.max(1,story.offsetHeight-innerHeight),p=Math.max(0,Math.min(1,-rect.top/travel)),e=1-Math.pow(1-p,3);story.style.setProperty('--contact-opacity',e.toFixed(3));story.style.setProperty('--contact-scale',(.78+e*.22).toFixed(3));ticking=false}function request(){if(ticking)return;ticking=true;requestAnimationFrame(update)}update();addEventListener('scroll',request,{passive:true});addEventListener('resize',request)})();
/* Desktop Process / Quality galleries: horizontal trackpad swipe and mouse drag. */
(function () {
  document.querySelectorAll('.proc__stage .proc__shot').forEach(gallery => {
    const photos = [...gallery.querySelectorAll('img')];
    if (photos.length < 2) return;
    const dots = [...gallery.querySelectorAll('.proc__pair-dots i, .quality-gallery__dots i')];
    let selected = null, lastWheel = -Infinity, wheelTotal = 0, wheelUsed = false;
    let pointer = null;
    photos.forEach(photo => { photo.draggable = false; });
    gallery.classList.add('is-swipeable');
    gallery.closest('.proc')?.removeAttribute('aria-hidden');
    dots.forEach((dot, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-dot';
      button.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + photos.length);
      dot.replaceWith(button);
      button.append(dot);
      button.addEventListener('click', () => show(i));
    });
    gallery.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    });
    function current() {
      if (selected !== null) return selected;
      // Start from the photo currently shown by the existing autoplay.
      return photos.reduce((best, photo, i) =>
        Number(getComputedStyle(photo).opacity) > Number(getComputedStyle(photos[best]).opacity) ? i : best, 0);
    }
    function show(next) {
      selected = (next + photos.length) % photos.length;
      gallery.classList.add('is-manual-gallery');
      photos.forEach((photo, i) => photo.classList.toggle('is-selected', i === selected));
      dots.forEach((dot, i) => { dot.classList.toggle('is-selected', i === selected); dot.parentElement.setAttribute('aria-pressed', String(i === selected)); });
    }
    function move(direction) { show(current() + direction); }
    gallery.addEventListener('wheel', event => {
      if (!gallery.classList.contains('on') || event.ctrlKey) return;
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(horizontal) < 1 || event.target.closest('button')) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastWheel > 200) { wheelTotal = 0; wheelUsed = false; }
      lastWheel = now;
      wheelTotal += horizontal * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? gallery.clientWidth : 1);
      if (!wheelUsed && Math.abs(wheelTotal) >= 25) {
        move(wheelTotal > 0 ? 1 : -1);
        wheelUsed = true;
      }
    }, {passive: false});
    gallery.addEventListener('pointerdown', event => {
      if (!gallery.classList.contains('on') || event.button !== 0 || !event.isPrimary || event.target.closest('button')) return;
      pointer = {id: event.pointerId, x: event.clientX, y: event.clientY};
      gallery.setPointerCapture(event.pointerId);
      gallery.classList.add('is-dragging');
    });
    function release(event) {
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (event.type === 'pointerup' && gallery.classList.contains('on') && Math.abs(dx) >= 35 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
      pointer = null;
      gallery.classList.remove('is-dragging');
      if (gallery.hasPointerCapture(event.pointerId)) gallery.releasePointerCapture(event.pointerId);
    }
    gallery.addEventListener('pointerup', release);
    gallery.addEventListener('pointercancel', release);
    gallery.addEventListener('lostpointercapture', () => { pointer = null; gallery.classList.remove('is-dragging'); });
  });
})();
/* Mobile galleries retain native swiping, with visible dots and on-screen autoplay. */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.proc-mob__img').forEach(gallery => {
    const photos = [...gallery.querySelectorAll(':scope > img')];
    if (photos.length < 2) return;
    gallery.querySelector('.proc__pair-dots, .quality-gallery__dots')?.remove();
    const controls = document.createElement('div');
    controls.className = 'mobile-gallery-dots';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Choose photo');
    gallery.after(controls);
    let current = 0, timer, visible = false, touching = false, frame;
    const dots = photos.map((photo, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-dot';
      button.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + photos.length);
      button.append(document.createElement('i'));
      button.addEventListener('click', () => select(i));
      controls.append(button);
      return button;
    });
    function mark() {
      dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === current)));
    }
    function schedule() {
      clearTimeout(timer);
      if (visible && !touching && !document.hidden && !reduced.matches) {
        timer = setTimeout(() => select((current + 1) % photos.length), 4500);
      }
    }
    function select(next) {
      current = next;
      const left = photos[next].getBoundingClientRect().left - gallery.getBoundingClientRect().left + gallery.scrollLeft;
      gallery.scrollTo({left, behavior: reduced.matches ? 'instant' : 'smooth'});
      mark();
      schedule();
    }
    gallery.addEventListener('scroll', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const left = gallery.getBoundingClientRect().left;
        current = photos.reduce((best, photo, i) =>
          Math.abs(photo.getBoundingClientRect().left - left) < Math.abs(photos[best].getBoundingClientRect().left - left) ? i : best, 0);
        mark();
        schedule();
      });
    }, {passive: true});
    gallery.addEventListener('touchstart', () => { touching = true; clearTimeout(timer); }, {passive: true});
    const release = () => { touching = false; schedule(); };
    gallery.addEventListener('touchend', release, {passive: true});
    gallery.addEventListener('touchcancel', release, {passive: true});
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && gallery.getClientRects().length > 0;
      schedule();
    }, {threshold: .15});
    observer.observe(gallery);
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', schedule);
    addEventListener('resize', () => { if (visible) select(current); });
    mark();
  });
})();
// Keep the inner-page glass navigation readable beyond its blue banner.
(function () {
  const banner = document.querySelector('.page-banner');
  const header = document.querySelector('.site-header');
  if (!banner || !header) return;
  const update = () => header.classList.toggle('is-past-banner', banner.getBoundingClientRect().bottom <= header.offsetHeight);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// Let applicants choose a contact channel without sending anything automatically.
(function () {
  const dialog = document.querySelector('#career-contact');
  if (!dialog) return;
  const whatsapp = dialog.querySelector('[data-career-whatsapp]');
  whatsapp.href = 'https://wa.me/' + dialog.dataset.phone.replace(/\D/g, '');
  document.querySelectorAll('a[href="#career-contact"]').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => { event.preventDefault(); dialog.showModal(); });
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
})();

// Glass expansion for the requested page actions.
(() => {
  const page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
  const selectors = {
    careers: '.cta-band .btn, a.btn[href="#career-contact"]',
    about: '.cta-band .btn',
    'company-profile': '.cta-band .btn',
    products: '.cta-band .btn',
    index: '.btn'
  };
  if (!selectors[page]) return;
  document.querySelectorAll(selectors[page]).forEach(button => {
    button.classList.add('glass-action');
    let touch = false;
    let opening = false;
    let replay = false;
    button.addEventListener('pointerdown', event => {
      touch = event.pointerType === 'touch' || event.pointerType === 'pen';
    });
    button.addEventListener('click', event => {
      if (replay) return;
      const mobile = touch || (event.detail > 0 && matchMedia('(hover: none)').matches);
      touch = false;
      if (!mobile && !opening) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (opening) return;
      opening = true;
      button.classList.add('is-expanding');
      setTimeout(() => {
        opening = false;
        replay = true;
        button.click();
        replay = false;
        button.classList.remove('is-expanding');
      }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1100);
    }, true);
  });
})();
