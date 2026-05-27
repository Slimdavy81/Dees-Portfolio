/**
 * Illustrations gallery index only (gallery/index.html).
 * Viewport scaling for the panel menu — does not affect root portfolio index.html.
 */
(function (window) {
  "use strict";

  var STORAGE_KEY = "gallery-index-layout-v1";

  var DEFAULT_LAYOUT = {
    padV: 56,
    padH: 118,
    baseH: 600,
    baseMenuW: 700,
    minScale: 0.52,
  };

  function readPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return Object.assign({}, DEFAULT_LAYOUT);
      }
      var saved = JSON.parse(raw);
      return Object.assign({}, DEFAULT_LAYOUT, saved);
    } catch (e) {
      return Object.assign({}, DEFAULT_LAYOUT);
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      /* ignore */
    }
  }

  function computeScale(prefs) {
    return Math.max(
      prefs.minScale,
      Math.round(
        Math.min(
          (window.innerHeight - prefs.padV) / prefs.baseH,
          (window.innerWidth - prefs.padH) / prefs.baseMenuW
        ) * 1000
      ) / 1000
    );
  }

  function applyFitScale(body) {
    if (!body || !body.classList.contains("gallery-index")) {
      return null;
    }

    var prefs = readPrefs();
    var scale = computeScale(prefs);

    body.style.setProperty("--cc-scale", String(scale));
    body.style.setProperty("--cc-chrome-v", prefs.padV + "px");
    body.style.setProperty("--cc-chrome-h", prefs.padH + "px");

    savePrefs(Object.assign({}, prefs, { lastScale: scale }));

    return scale;
  }

  window.GalleryLayout = {
    DEFAULT_LAYOUT: DEFAULT_LAYOUT,
    applyFitScale: applyFitScale,
  };
})(window);
