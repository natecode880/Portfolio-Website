// jukebox.js — persistent background music player.
//
// How this works: normal links between separate HTML files fully reload the
// browser tab, which would kill any audio instantly. To avoid that, this
// script intercepts clicks on internal links (index.html / projects.html /
// music.html), fetches the target page in the background, and swaps only
// the #page-content region — the <div id="jukebox-widget"> and this script
// live outside that region, so the Spotify player is never destroyed while
// browsing the site. Opening a page directly (a bookmark, a shared link)
// still works fine as a normal page — it just starts the player fresh.

(function () {
  var PLAYLIST_URI = 'spotify:playlist:0R2MPSdrSHAwZ9jvWIswEx';
  var POS_KEY = 'nd_jukebox_pos';
  var SIZE_KEY = 'nd_jukebox_width';
  var ROUTES = ['index.html', 'projects.html', 'music.html', ''];

  // The Spotify iframe is created ONCE at this native size and never resized
  // or recreated — resizing it would mean destroying and rebuilding the
  // iframe, which would restart playback. Instead every visual size (the
  // full-size docked player, the compact mini widget, and any size the user
  // drags it to) is done with a CSS transform: scale() on a wrapper around
  // the iframe, which is purely visual and never touches the iframe itself.
  var BASE_W = 760;
  var BASE_H = 640;
  var MINI_DEFAULT_W = 360;
  var MINI_MIN_W = 220;
  var MINI_MAX_W = BASE_W;

  var widgetEl, mountEl, handleEl, scaleWrapEl, resizeHandleEl;
  var handleH = 30;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------- Widget chrome ----------------
  function buildWidgetChrome() {
    widgetEl = document.getElementById('jukebox-widget');
    if (!widgetEl) return;
    widgetEl.innerHTML =
      '<div class="jb-handle" id="jbHandle">' +
        '<span class="jb-dot"></span> now playing <span class="jb-drag-hint">⠿ drag me</span>' +
      '</div>' +
      '<div class="jb-scale-wrap" id="jbScaleWrap">' +
        '<div class="jb-mount" id="jbMount"></div>' +
      '</div>' +
      '<div class="jb-resize-handle" id="jbResize" title="drag to resize"></div>';
    handleEl = document.getElementById('jbHandle');
    scaleWrapEl = document.getElementById('jbScaleWrap');
    mountEl = document.getElementById('jbMount');
    resizeHandleEl = document.getElementById('jbResize');

    scaleWrapEl.style.width = BASE_W + 'px';
    scaleWrapEl.style.height = BASE_H + 'px';
    scaleWrapEl.style.transformOrigin = 'top left';

    handleH = handleEl.offsetHeight || 30;

    enableDrag();
    enableResize();
  }

  function setWidth(px) {
    if (!widgetEl) return;
    var w = Math.max(MINI_MIN_W, Math.min(MINI_MAX_W, px));
    var scale = w / BASE_W;
    scaleWrapEl.style.transform = 'scale(' + scale + ')';
    widgetEl.style.width = w + 'px';
    widgetEl.style.height = (handleH + BASE_H * scale) + 'px';
    return w;
  }

  // ---------------- Spotify iFrame API ----------------
  var playbackStarted = false;

  function attemptPlay() {
    if (playbackStarted || !window._jukeboxController) return;
    try { window._jukeboxController.play(); } catch (e) { /* ignore */ }
  }

  function armFirstInteractionAutoplay() {
    ['click', 'keydown', 'touchstart'].forEach(function (evt) {
      document.addEventListener(evt, attemptPlay, { once: true, passive: true });
    });
  }

  function loadSpotifyApiScript() {
    if (window._spotifyApiScriptAdded) return;
    window._spotifyApiScriptAdded = true;
    var s = document.createElement('script');
    s.src = 'https://open.spotify.com/embed/iframe-api/v1';
    s.async = true;
    document.body.appendChild(s);
  }

  function mountPlayer() {
    if (window._jukeboxMounted || !mountEl) return;
    window._jukeboxMounted = true;

    window.onSpotifyIframeApiReady = function (IFrameAPI) {
      IFrameAPI.createController(mountEl, {
        uri: PLAYLIST_URI,
        width: '100%',
        height: BASE_H
      }, function (EmbedController) {
        window._jukeboxController = EmbedController;
        EmbedController.addListener('playback_update', function (e) {
          if (e && e.data && e.data.isPaused === false) playbackStarted = true;
        });
        // Browsers block audio until the visitor has interacted with the
        // page at least once — this attempt only succeeds if that's
        // already true (e.g. they clicked a nav link before this loaded).
        attemptPlay();
      });
    };

    armFirstInteractionAutoplay();
    loadSpotifyApiScript();
  }

  // ---------------- Dock state (Music page vs everywhere else) ----------------
  function positionDockedWidget() {
    if (!widgetEl || !widgetEl.classList.contains('docked')) return;
    var spacer = document.getElementById('dockSpacer');
    if (!spacer) return;

    var available = spacer.offsetWidth || MINI_DEFAULT_W;
    var w = setWidth(Math.min(available, BASE_W));

    var left = spacer.offsetLeft + (spacer.offsetWidth - w) / 2;
    widgetEl.style.top = spacer.offsetTop + 'px';
    widgetEl.style.left = Math.max(0, left) + 'px';

    spacer.style.minHeight = widgetEl.offsetHeight + 'px';
  }

  function applyDockState(page) {
    if (!widgetEl) return;
    if (page === 'music') {
      widgetEl.classList.add('docked');
      widgetEl.classList.remove('mini');
      widgetEl.style.right = '';
      widgetEl.style.bottom = '';
      // Wait a tick for the music page's layout (fonts, spacer) to settle before measuring.
      requestAnimationFrame(positionDockedWidget);
      setTimeout(positionDockedWidget, 150);
    } else {
      widgetEl.classList.remove('docked');
      widgetEl.classList.add('mini');
      widgetEl.style.top = '';
      widgetEl.style.left = '';
      restoreSize();
      restorePosition();
    }
  }

  window.addEventListener('resize', function () {
    positionDockedWidget();
  });
  window.addEventListener('load', function () {
    positionDockedWidget();
  });

  // ---------------- Saved position / size (mini mode only) ----------------
  function restorePosition() {
    if (!widgetEl || widgetEl.classList.contains('docked')) return;
    try {
      var saved = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
      if (saved && typeof saved.right === 'number' && typeof saved.bottom === 'number') {
        widgetEl.style.right = saved.right + 'px';
        widgetEl.style.bottom = saved.bottom + 'px';
        return;
      }
    } catch (e) { /* ignore corrupt storage */ }
    widgetEl.style.right = '20px';
    widgetEl.style.bottom = '20px';
  }

  function restoreSize() {
    if (!widgetEl || widgetEl.classList.contains('docked')) return;
    var savedW = MINI_DEFAULT_W;
    try {
      var raw = localStorage.getItem(SIZE_KEY);
      if (raw) savedW = parseInt(raw, 10) || MINI_DEFAULT_W;
    } catch (e) { /* ignore */ }
    setWidth(Math.min(savedW, window.innerWidth - 40));
  }

  // ---------------- Drag to move (mini mode only) ----------------
  function enableDrag() {
    if (!handleEl) return;
    var dragging = false;
    var startX, startY, startRight, startBottom;

    function pointerDown(e) {
      if (!widgetEl.classList.contains('mini')) return;
      dragging = true;
      widgetEl.classList.add('dragging');
      var p = 'touches' in e ? e.touches[0] : e;
      startX = p.clientX;
      startY = p.clientY;
      var rect = widgetEl.getBoundingClientRect();
      startRight = window.innerWidth - rect.right;
      startBottom = window.innerHeight - rect.bottom;
      document.addEventListener('mousemove', pointerMove);
      document.addEventListener('touchmove', pointerMove, { passive: false });
      document.addEventListener('mouseup', pointerUp);
      document.addEventListener('touchend', pointerUp);
    }

    function pointerMove(e) {
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();
      var p = 'touches' in e ? e.touches[0] : e;
      var dx = p.clientX - startX;
      var dy = p.clientY - startY;
      var newRight = Math.max(4, Math.min(window.innerWidth - 60, startRight - dx));
      var newBottom = Math.max(4, Math.min(window.innerHeight - 40, startBottom - dy));
      widgetEl.style.right = newRight + 'px';
      widgetEl.style.bottom = newBottom + 'px';
    }

    function pointerUp() {
      if (!dragging) return;
      dragging = false;
      widgetEl.classList.remove('dragging');
      try {
        localStorage.setItem(POS_KEY, JSON.stringify({
          right: parseInt(widgetEl.style.right, 10) || 20,
          bottom: parseInt(widgetEl.style.bottom, 10) || 20
        }));
      } catch (e) { /* ignore */ }
      document.removeEventListener('mousemove', pointerMove);
      document.removeEventListener('touchmove', pointerMove);
      document.removeEventListener('mouseup', pointerUp);
      document.removeEventListener('touchend', pointerUp);
    }

    handleEl.addEventListener('mousedown', pointerDown);
    handleEl.addEventListener('touchstart', pointerDown, { passive: true });
  }

  // ---------------- Drag to resize (mini mode only) ----------------
  function enableResize() {
    if (!resizeHandleEl) return;
    var resizing = false;
    var startX, startWidth, startRight;

    function pointerDown(e) {
      if (!widgetEl.classList.contains('mini')) return;
      e.stopPropagation();
      resizing = true;
      widgetEl.classList.add('dragging');
      var p = 'touches' in e ? e.touches[0] : e;
      startX = p.clientX;
      startWidth = widgetEl.offsetWidth;
      startRight = parseInt(widgetEl.style.right, 10) || 20;
      document.addEventListener('mousemove', pointerMove);
      document.addEventListener('touchmove', pointerMove, { passive: false });
      document.addEventListener('mouseup', pointerUp);
      document.addEventListener('touchend', pointerUp);
    }

    function pointerMove(e) {
      if (!resizing) return;
      if (e.cancelable) e.preventDefault();
      var p = 'touches' in e ? e.touches[0] : e;
      var dx = p.clientX - startX;
      // Dragging the bottom-right corner right/down grows the widget; since
      // it's anchored by `right`, growing width means `right` must shrink
      // by the same amount so the corner tracks the cursor.
      var newWidth = startWidth + dx;
      var applied = setWidth(newWidth);
      var widthDelta = applied - startWidth;
      widgetEl.style.right = Math.max(4, startRight - widthDelta) + 'px';
    }

    function pointerUp() {
      if (!resizing) return;
      resizing = false;
      widgetEl.classList.remove('dragging');
      try {
        localStorage.setItem(SIZE_KEY, String(widgetEl.offsetWidth));
        localStorage.setItem(POS_KEY, JSON.stringify({
          right: parseInt(widgetEl.style.right, 10) || 20,
          bottom: parseInt(widgetEl.style.bottom, 10) || 20
        }));
      } catch (e) { /* ignore */ }
      document.removeEventListener('mousemove', pointerMove);
      document.removeEventListener('touchmove', pointerMove);
      document.removeEventListener('mouseup', pointerUp);
      document.removeEventListener('touchend', pointerUp);
    }

    resizeHandleEl.addEventListener('mousedown', pointerDown);
    resizeHandleEl.addEventListener('touchstart', pointerDown, { passive: true });
  }

  // ---------------- Nav "current page" highlight ----------------
  function highlightNav(page) {
    document.querySelectorAll('.page-nav a').forEach(function (a) {
      a.classList.toggle('current', a.dataset.page === page);
    });
  }

  // ---------------- Router ----------------
  function currentFile() {
    var f = location.pathname.split('/').pop();
    return f || 'index.html';
  }

  function isRoutable(url) {
    if (url.origin !== location.origin) return false;
    var file = url.pathname.split('/').pop();
    return ROUTES.indexOf(file) !== -1;
  }

  function navigateTo(path, push) {
    var main = document.getElementById('page-content');
    if (main) main.classList.add('swapping');

    fetch(path)
      .then(function (r) {
        if (!r.ok) throw new Error('fetch failed');
        return r.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var newMain = doc.getElementById('page-content');
        var curMain = document.getElementById('page-content');
        if (!newMain || !curMain) { location.href = path; return; }

        var page = newMain.getAttribute('data-page') || 'home';

        setTimeout(function () {
          curMain.innerHTML = newMain.innerHTML;
          curMain.setAttribute('data-page', page);
          curMain.classList.remove('swapping');
          document.body.setAttribute('data-page', page);
          document.title = doc.title;
          if (push) history.pushState({ page: page }, '', path);
          applyDockState(page);
          highlightNav(page);
          window.scrollTo({ top: 0, behavior: 'auto' });
          if (window.PageInit && window.PageInit[page]) window.PageInit[page]();
        }, reduceMotion ? 0 : 130);
      })
      .catch(function () {
        location.href = path;
      });
  }

  function initRouter() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      var url;
      try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
      if (!isRoutable(url)) return;
      if (url.pathname === location.pathname && url.search === location.search) { e.preventDefault(); return; }
      e.preventDefault();
      navigateTo(url.pathname + url.search, true);
    });

    window.addEventListener('popstate', function () {
      navigateTo(location.pathname + location.search, false);
    });
  }

  // ---------------- Boot ----------------
  document.addEventListener('DOMContentLoaded', function () {
    buildWidgetChrome();
    mountPlayer();

    var main = document.getElementById('page-content');
    var page = (main && main.getAttribute('data-page')) || 'home';
    applyDockState(page);
    highlightNav(page);
    initRouter();

    if (window.PageInit && window.PageInit[page]) window.PageInit[page]();
  });
})();
