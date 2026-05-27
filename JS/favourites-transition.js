(function () {
  "use strict";

  var trigger = document.querySelector("[data-favourites-trigger]");
  var transition = document.querySelector("[data-favourites-transition]");
  var video = document.querySelector("[data-favourites-transition-video]");
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!trigger || !transition || !video || prefersReducedMotion) return;

  var isTransitioning = false;
  var fallbackTimer = null;
  var revealTimer = null;
  var hasRevealedFavourites = false;

  function revealFavourites() {
    if (hasRevealedFavourites) return;

    hasRevealedFavourites = true;
    window.location.hash = "favourites-overlay";
  }

  function finishTransition() {
    revealFavourites();
    transition.classList.remove("is-active");
    isTransitioning = false;
  }

  trigger.addEventListener("click", function (event) {
    if (isTransitioning) return;

    event.preventDefault();
    isTransitioning = true;
    hasRevealedFavourites = false;
    transition.classList.add("is-active");

    try {
      video.currentTime = 0;
    } catch (error) {}

    var playAttempt = video.play();
    clearTimeout(fallbackTimer);
    clearTimeout(revealTimer);
    revealTimer = window.setTimeout(revealFavourites, 3200);
    fallbackTimer = window.setTimeout(finishTransition, 4500);

    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(finishTransition);
    }
  });

  video.addEventListener("timeupdate", function () {
    if (!isTransitioning || !video.duration) return;

    if (video.duration - video.currentTime <= 1.35) {
      revealFavourites();
    }
  });

  video.addEventListener("ended", function () {
    clearTimeout(fallbackTimer);
    clearTimeout(revealTimer);
    finishTransition();
  });
})();
