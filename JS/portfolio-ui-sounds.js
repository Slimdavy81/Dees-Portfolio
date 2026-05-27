(function () {
  "use strict";

  var ctx = null;
  var unlocked = false;
  var last = Object.create(null);

  function isQuiet() {
    if (window.GallerySettings && typeof GallerySettings.isSoundEnabled === "function") {
      return !GallerySettings.isSoundEnabled();
    }
    return document.documentElement.getAttribute("data-quiet") === "1";
  }

  function getContext() {
    if (ctx) return ctx;
    var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    ctx = new AudioContextCtor();
    return ctx;
  }

  function unlock() {
    var c = getContext();
    if (!c || unlocked) return;
    if (c.state === "suspended" && c.resume) {
      c.resume();
    }
    unlocked = true;
  }

  function canPlay(name, gap) {
    if (isQuiet()) return false;
    var now = Date.now();
    if (last[name] && now - last[name] < gap) return false;
    last[name] = now;
    return true;
  }

  function blip(options) {
    var c = getContext();
    if (!c) return;
    if (c.state === "suspended" && c.resume) {
      c.resume();
    }

    var t0 = c.currentTime;
    var dur = options.duration || 0.16;
    var master = c.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.linearRampToValueAtTime(options.volume || 0.035, t0 + 0.01);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    master.connect(c.destination);

    var osc = c.createOscillator();
    osc.type = options.type || "sine";
    osc.frequency.setValueAtTime(options.from || 440, t0);
    osc.frequency.exponentialRampToValueAtTime(options.to || options.from || 660, t0 + dur * 0.75);

    var filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(options.filter || 1800, t0);

    osc.connect(filter);
    filter.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  function sweep(options) {
    var c = getContext();
    if (!c) return;
    if (c.state === "suspended" && c.resume) {
      c.resume();
    }

    var t0 = c.currentTime;
    var dur = options.duration || 0.32;
    var master = c.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.linearRampToValueAtTime(options.volume || 0.05, t0 + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    master.connect(c.destination);

    var low = c.createOscillator();
    low.type = "triangle";
    low.frequency.setValueAtTime(options.lowFrom || 84, t0);
    low.frequency.exponentialRampToValueAtTime(options.lowTo || 46, t0 + dur);
    var high = c.createOscillator();
    high.type = "sine";
    high.frequency.setValueAtTime(options.highFrom || 520, t0);
    high.frequency.exponentialRampToValueAtTime(options.highTo || 980, t0 + dur * 0.72);

    var lowGain = c.createGain();
    lowGain.gain.setValueAtTime(0.22, t0);
    var highGain = c.createGain();
    highGain.gain.setValueAtTime(0.16, t0);

    low.connect(lowGain);
    high.connect(highGain);
    lowGain.connect(master);
    highGain.connect(master);
    low.start(t0);
    high.start(t0 + 0.025);
    low.stop(t0 + dur);
    high.stop(t0 + dur);
  }

  function playHover() {
    if (!canPlay("hover", 90)) return;
    blip({ from: 620, to: 880, duration: 0.095, volume: 0.018, filter: 2200 });
  }

  function playSelect() {
    if (!canPlay("select", 120)) return;
    blip({ from: 440, to: 760, duration: 0.18, volume: 0.034, type: "triangle" });
  }

  function playSlide() {
    if (!canPlay("slide", 260)) return;
    sweep({ duration: 0.34, volume: 0.045 });
  }

  function playPanel() {
    if (window.GallerySounds && typeof GallerySounds.playPanelSlide === "function") {
      GallerySounds.playPanelSlide();
      return;
    }
    if (!canPlay("panel", 320)) return;
    sweep({ duration: 0.42, volume: 0.055, lowFrom: 78, lowTo: 52, highFrom: 360, highTo: 720 });
  }

  function bindGlobalUI() {
    var hoverSelector = [
      "a",
      "button",
      ".work-slider__card",
      ".graphic-design-carousel__slide",
      ".smarthome-deck__stack",
      ".freelance-player__playlist-btn",
      ".animations-playlist__btn"
    ].join(",");

    document.addEventListener("pointerdown", unlock, { passive: true });
    document.addEventListener("keydown", unlock);

    document.addEventListener(
      "mouseover",
      function (event) {
        var target = event.target.closest(hoverSelector);
        if (!target || !document.documentElement.contains(target)) return;
        if (event.relatedTarget && target.contains(event.relatedTarget)) return;
        playHover();
      },
      true
    );

    document.addEventListener(
      "focusin",
      function (event) {
        if (event.target.closest(hoverSelector)) {
          playHover();
        }
      },
      true
    );

    document.addEventListener(
      "click",
      function (event) {
        var target = event.target.closest("button, a, [role='button']");
        if (!target) return;
        if (
          target.matches(
            ".work-slider__btn, .work-slider__dot, .freelance-player__nav, .freelance-player__playlist-btn, .animations-playlist__btn, .graphic-design-carousel__slide"
          )
        ) {
          playSlide();
          return;
        }
        if (
          target.matches(
            ".work-showcase__projects-toggle, [data-freelance-toggle], [data-animations-toggle], [data-freelance-reveal], .settings-tab"
          )
        ) {
          playPanel();
          return;
        }
        playSelect();
      },
      true
    );

    document.addEventListener(
      "change",
      function (event) {
        if (event.target && event.target.matches('input[name="neon-theme"]')) {
          playSelect();
        }
      },
      true
    );
  }

  window.PortfolioSounds = {
    unlock: unlock,
    playHover: playHover,
    playSelect: playSelect,
    playSlide: playSlide,
    playPanel: playPanel
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindGlobalUI);
  } else {
    bindGlobalUI();
  }
})();
