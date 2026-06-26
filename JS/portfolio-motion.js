(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var body = document.body;

  if (!body || !body.classList.contains("portfolio-index") || reduceMotion) return;

  var introTargets = [
    [".site-header", "motion-reveal--header"],
    [".settings-tab", "motion-reveal--settings"],
    [".home-dashboard__wrap", "motion-reveal--deck"],
  ];
  var contentSelectors = [
    ".home-page-grid > .sidebar",
    ".home-page-grid > .content",
    ".home-page-grid__project-pair",
    ".graphic-design-band",
    ".blender-band",
    ".home-most-recent-band",
    ".home-phoenix-feature",
    ".home-page-grid__after",
    ".footer-banner",
    ".site-footer",
  ];

  var seen = [];
  var contentTargets = [];

  function addRevealTarget(element, modifier) {
    if (!element || seen.indexOf(element) !== -1) return;
    seen.push(element);
    element.classList.add("motion-reveal");
    if (modifier) element.classList.add(modifier);
    element.style.setProperty("--motion-order", seen.length - 1);
  }

  introTargets.forEach(function (target) {
    document.querySelectorAll(target[0]).forEach(function (element) {
      addRevealTarget(element, target[1]);
    });
  });

  contentSelectors.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (element) {
      addRevealTarget(element, "motion-reveal--content");
      contentTargets.push(element);
    });
  });

  root.classList.add("portfolio-motion-ready");

  function show(element) {
    element.classList.add("is-visible");
  }

  function playIntro(onComplete) {
    var header = document.querySelector(".motion-reveal--header");
    var settings = document.querySelector(".motion-reveal--settings");
    var deck = document.querySelector(".motion-reveal--deck");

    window.setTimeout(function () {
      show(header);
    }, 120);

    window.setTimeout(function () {
      show(settings);
    }, 520);

    window.setTimeout(function () {
      show(deck);
    }, 760);

    window.setTimeout(function () {
      root.classList.add("portfolio-motion-intro-complete");
      if (typeof onComplete === "function") onComplete();
    }, 2300);
  }

  function startMotion() {
    if (!("IntersectionObserver" in window)) {
      playIntro(function () {
        contentTargets.forEach(show);
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    function startContentReveals() {
      contentTargets.forEach(function (element) {
        observer.observe(element);
      });
    }

    playIntro(startContentReveals);
  }

  if (body.classList.contains("has-site-intro") && !body.classList.contains("site-intro-complete")) {
    document.addEventListener("portfolio:intro-complete", startMotion, { once: true });
    return;
  }

  startMotion();
})();

