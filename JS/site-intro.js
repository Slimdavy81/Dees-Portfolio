(function () {
  "use strict";

  var body = document.body;
  if (!body || !body.classList.contains("has-site-intro")) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var overlay = document.getElementById("site-intro");
  var video = document.getElementById("site-intro-video");
  var playButton = document.getElementById("site-intro-play");
  var skip = document.getElementById("site-intro-skip");
  var isComplete = false;
  var fallbackTimer = null;
  var hasStarted = false;
  var storageKey = "portfolioIntroSeen";

  function hasSeenIntro() {
    try {
      return window.sessionStorage.getItem(storageKey) === "true";
    } catch (error) {
      return false;
    }
  }

  function rememberIntro() {
    try {
      window.sessionStorage.setItem(storageKey, "true");
    } catch (error) {
      // Storage can be unavailable in strict privacy modes.
    }
  }

  function cameFromPortfolioPage() {
    if (!document.referrer) return false;

    try {
      var referrerUrl = new URL(document.referrer);
      var currentUrl = new URL(window.location.href);
      var currentFolder = currentUrl.pathname.replace(/\/[^/]*$/, "/");

      return referrerUrl.origin === currentUrl.origin && referrerUrl.pathname.indexOf(currentFolder) === 0;
    } catch (error) {
      return false;
    }
  }

  function finishIntro(shouldRemember) {
    if (isComplete) return;
    isComplete = true;

    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
    }

    if (shouldRemember !== false) {
      rememberIntro();
    }
    body.classList.add("site-intro-complete");
    body.classList.remove("has-site-intro");
    document.dispatchEvent(new CustomEvent("portfolio:intro-complete"));

    if (overlay) {
      overlay.setAttribute("aria-hidden", "true");
      window.setTimeout(function () {
        overlay.remove();
      }, 700);
    }
  }

  if (hasSeenIntro() || cameFromPortfolioPage() || reduceMotion || !overlay || !video) {
    finishIntro(false);
    return;
  }

  function scheduleFallback() {
    if (fallbackTimer || !Number.isFinite(video.duration)) return;
    fallbackTimer = window.setTimeout(finishIntro, Math.min(video.duration * 1000 + 1200, 45000));
  }

  function showStartPrompt() {
    overlay.classList.add("site-intro--needs-start");
  }

  function playIntroWithSound() {
    overlay.classList.remove("site-intro--needs-start");
    video.muted = false;
    video.volume = 1;

    var playAttempt = video.play();
    if (playAttempt && typeof playAttempt.then === "function") {
      playAttempt
        .then(function () {
          hasStarted = true;
          scheduleFallback();
        })
        .catch(showStartPrompt);
    }
  }

  if (playButton) {
    playButton.addEventListener("click", playIntroWithSound);
  }

  if (skip) {
    skip.addEventListener("click", finishIntro);
  }

  video.addEventListener("ended", finishIntro);
  video.addEventListener("error", finishIntro);
  video.addEventListener("playing", function () {
    hasStarted = true;
    if (!video.muted) {
      overlay.classList.remove("site-intro--needs-start");
    }
    scheduleFallback();
  });

  video.addEventListener("loadedmetadata", function () {
    if (hasStarted) scheduleFallback();
  });

  var playAttempt = video.play();
  if (playAttempt && typeof playAttempt.then === "function") {
    playAttempt
      .then(function () {
        hasStarted = true;
        scheduleFallback();
      })
      .catch(showStartPrompt);
  }
})();
