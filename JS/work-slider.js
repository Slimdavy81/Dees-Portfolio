(function () {
  "use strict";

  var root = document.querySelector("[data-work-slider]");
  if (!root) return;

  var track = root.querySelector(".work-slider__track");
  var slides = root.querySelectorAll(".work-slider__slide");
  var viewport = root.querySelector(".work-slider__viewport");
  var btnPrev = root.querySelector(".work-slider__btn--prev");
  var btnNext = root.querySelector(".work-slider__btn--next");
  var dots = root.querySelectorAll(".work-slider__dot");
  var statusEl = root.querySelector("#work-slider-status");

  var total = slides.length;
  if (!track || !viewport || total === 0) return;

  var index = 0;
  var touchStartX = null;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var resizeTimer = null;

  function slideTitle(i) {
    var slide = slides[i];
    if (!slide) return "";
    var t = slide.querySelector(".work-slider__title");
    return t ? t.textContent.trim() : "";
  }

  function trackGapPx() {
    var cs = window.getComputedStyle(track);
    var g = cs.gap || cs.columnGap;
    if (!g || g === "normal") return 0;
    var n = parseFloat(g);
    return isNaN(n) ? 0 : n;
  }

  function getStepPx() {
    var first = slides[0];
    if (!first) return 0;
    return first.getBoundingClientRect().width + trackGapPx();
  }

  function setTransform() {
    var step = getStepPx();
    if (step <= 0) return;
    track.style.transform = "translate3d(" + -index * step + "px, 0, 0)";
  }

  function scheduleLayout() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeTimer = null;
      setTransform();
    }, 80);
  }

  function applyMotionPreference() {
    if (reducedMotion.matches) {
      track.style.transition = "none";
    } else {
      track.style.transition = "";
    }
  }

  function updateButtons() {
    if (btnPrev) btnPrev.disabled = index <= 0;
    if (btnNext) btnNext.disabled = index >= total - 1;
  }

  function updateDots() {
    dots.forEach(function (dot, i) {
      var selected = i === index;
      dot.setAttribute("aria-selected", selected ? "true" : "false");
      dot.tabIndex = selected ? 0 : -1;
    });
  }

  function updateSlidesAria() {
    slides.forEach(function (slide, i) {
      var active = i === index;
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      if (active) {
        slide.removeAttribute("inert");
      } else {
        slide.setAttribute("inert", "");
      }
    });
  }

  function announce() {
    if (!statusEl) return;
    statusEl.textContent =
      "Slide " + (index + 1) + " of " + total + ": " + slideTitle(index);
  }

  function goTo(i) {
    var next = Math.max(0, Math.min(total - 1, i));
    if (next === index) return;
    index = next;
    if (window.PortfolioSounds && typeof PortfolioSounds.playSlide === "function") {
      PortfolioSounds.playSlide();
    }
    setTransform();
    updateButtons();
    updateDots();
    updateSlidesAria();
    announce();
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  var keyTarget = root.querySelector(".work-slider") || root;

  if (btnPrev) btnPrev.addEventListener("click", prev);
  if (btnNext) btnNext.addEventListener("click", next);

  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      goTo(i);
    });
  });

  keyTarget.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(total - 1);
    }
  });

  if (viewport) {
    viewport.addEventListener(
      "touchstart",
      function (e) {
        touchStartX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    viewport.addEventListener(
      "touchend",
      function (e) {
        if (touchStartX == null) return;
        var endX = e.changedTouches[0].clientX;
        var diff = touchStartX - endX;
        if (Math.abs(diff) > 48) {
          if (diff > 0) next();
          else prev();
        }
        touchStartX = null;
      },
      { passive: true }
    );
  }

  slides.forEach(function (slide) {
    var img = slide.querySelector("img");
    if (img) img.addEventListener("load", scheduleLayout);
  });

  window.addEventListener("resize", scheduleLayout);

  applyMotionPreference();
  updateButtons();
  updateDots();
  updateSlidesAria();
  announce();

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      setTransform();
    });
  });

  var sliderRoot = root.querySelector(".work-slider");
  var copyPanel = sliderRoot ? sliderRoot.querySelector("#work-slider-copy-panel") : null;
  var copyTitle = sliderRoot ? sliderRoot.querySelector("#work-slider-copy-title") : null;
  var copyProse = sliderRoot ? sliderRoot.querySelector(".work-slider__copy-panel__prose") : null;
  var copyHideTimer = null;
  var COPY_HIDE_MS = 300;

  function isInsideCopyPanel(el) {
    if (!el || !copyPanel) return false;
    return el === copyPanel || (copyPanel.contains && copyPanel.contains(el));
  }

  function isSliderHoverTarget(el) {
    if (!el || !root.contains(el)) return false;
    return (
      (el.closest && el.closest(".work-slider__card")) ||
      (el.closest && el.closest(".work-slider__dot"))
    );
  }

  function hideCopyPanel() {
    if (!copyPanel || !copyProse) return;
    copyPanel.classList.remove("is-open");
    copyPanel.setAttribute("aria-hidden", "true");
    copyProse.innerHTML = "";
    if (copyTitle) copyTitle.textContent = "";
  }

  function scheduleHideCopy() {
    clearTimeout(copyHideTimer);
    copyHideTimer = setTimeout(function () {
      copyHideTimer = null;
      hideCopyPanel();
    }, COPY_HIDE_MS);
  }

  function cancelHideCopy() {
    clearTimeout(copyHideTimer);
    copyHideTimer = null;
  }

  function showCopyPanel(i) {
    if (!copyPanel || !copyProse) return;
    var slide = slides[i];
    if (!slide) return;
    var bodyId = slide.getAttribute("data-slider-body");
    if (!bodyId) return;
    var tmpl = document.getElementById(bodyId);
    if (!tmpl || !tmpl.content) return;
    var titleEl = slide.querySelector(".work-slider__title");
    if (copyTitle && titleEl) {
      copyTitle.textContent = titleEl.textContent.trim();
    }
    copyProse.innerHTML = "";
    copyProse.appendChild(document.importNode(tmpl.content, true));
    copyPanel.classList.add("is-open");
    copyPanel.setAttribute("aria-hidden", "false");
  }

  if (copyPanel && copyProse) {
    slides.forEach(function (slide, i) {
      var card = slide.querySelector(".work-slider__card");
      if (!card) return;
      card.addEventListener("mouseenter", function () {
        cancelHideCopy();
        showCopyPanel(i);
      });
      card.addEventListener("mouseleave", function (e) {
        if (isInsideCopyPanel(e.relatedTarget)) return;
        scheduleHideCopy();
      });
    });

    dots.forEach(function (dot, i) {
      dot.addEventListener("mouseenter", function () {
        cancelHideCopy();
        goTo(i);
        showCopyPanel(i);
      });
      dot.addEventListener("mouseleave", function (e) {
        if (isInsideCopyPanel(e.relatedTarget)) return;
        scheduleHideCopy();
      });
    });

    var copyInner = copyPanel.querySelector(".work-slider__copy-panel__inner");
    if (copyInner) {
      copyInner.addEventListener("mouseenter", cancelHideCopy);
      copyInner.addEventListener("mouseleave", function (e) {
        if (isSliderHoverTarget(e.relatedTarget)) return;
        scheduleHideCopy();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && copyPanel.classList.contains("is-open")) {
        cancelHideCopy();
        hideCopyPanel();
      }
    });
  }

  reducedMotion.addEventListener("change", applyMotionPreference);

  var projectsPanel = root.querySelector(".work-showcase__projects-panel");
  var projectsToggle = root.querySelector(".work-showcase__projects-toggle");
  var animationsPanel = root.querySelector("#work-animations-panel");
  var animationsToggle = root.querySelector("[data-animations-toggle]");
  var freelancePanel = root.querySelector("#work-freelance-panel");
  var freelanceToggle = root.querySelector("[data-freelance-toggle]");
  var dashboardWrap = root.closest(".home-dashboard__wrap");
  var LAYOUT_MS = 480;
  var mediaStack = root.closest(".home-dashboard__media-stack");
  var previewRevealTimer = null;

  function afterLayoutStep(fn) {
    if (reducedMotion.matches) {
      fn();
    } else {
      window.setTimeout(fn, LAYOUT_MS);
    }
  }

  function pinStackHeight() {
    if (!mediaStack) return;
    mediaStack.classList.add("is-pinning");
    mediaStack.style.minHeight = mediaStack.offsetHeight + "px";
  }

  function releaseStackHeight() {
    if (!mediaStack) return;
    var anchor =
      root.querySelector(".home-dashboard__projects-panel-bar") || projectsToggle;
    var anchorTop = anchor ? anchor.getBoundingClientRect().top : 0;
    var scrollY = window.scrollY;

    mediaStack.style.minHeight = "";
    mediaStack.classList.remove("is-pinning");

    if (!anchor) return;

    requestAnimationFrame(function () {
      var drift = anchor.getBoundingClientRect().top - anchorTop;
      if (Math.abs(drift) > 1) {
        window.scrollTo(0, scrollY + drift);
      }
      setTransform();
    });
  }

  function setPanelOpen(open) {
    if (open) {
      clearTimeout(previewRevealTimer);
      projectsPanel.classList.remove("is-preview-open");
      projectsPanel.hidden = false;
      void projectsPanel.offsetHeight;
      projectsPanel.classList.add("is-open");
      previewRevealTimer = window.setTimeout(function () {
        projectsPanel.classList.add("is-preview-open");
      }, reducedMotion.matches ? 0 : 230);
      return;
    }

    clearTimeout(previewRevealTimer);
    projectsPanel.classList.remove("is-preview-open");
    projectsPanel.classList.remove("is-open");

    function finishClose() {
      if (root.classList.contains("work-showcase--projects-open")) return;
      projectsPanel.hidden = true;
    }

    projectsPanel.addEventListener(
      "transitionend",
      function (e) {
        if (e.propertyName === "max-height") finishClose();
      },
      { once: true }
    );
    window.setTimeout(finishClose, LAYOUT_MS + 80);
  }

  function closeFreelancePanel() {
    if (!freelancePanel || !freelanceToggle) return;
    var freelanceVideo = freelancePanel.querySelector("video");
    var freelanceReveal = freelancePanel.querySelector("[data-freelance-reveal]");
    var freelancePlayer = freelancePanel.querySelector("[data-freelance-player-shell]");
    freelancePanel.classList.remove("is-open");
    freelanceToggle.setAttribute("aria-expanded", "false");
    if (freelanceReveal) {
      freelanceReveal.setAttribute("aria-expanded", "false");
    }
    if (freelancePlayer) {
      freelancePlayer.classList.remove("is-open");
    }
    if (freelanceVideo) {
      freelanceVideo.pause();
    }
    window.setTimeout(function () {
      if (!freelancePanel.classList.contains("is-open")) {
        freelancePanel.hidden = true;
        if (freelancePlayer) {
          freelancePlayer.hidden = true;
        }
      }
    }, LAYOUT_MS + 80);
  }

  function closeAnimationsPanel() {
    if (!animationsPanel || !animationsToggle) return;
    var animationsVideo = animationsPanel.querySelector("video");
    animationsPanel.classList.remove("is-open");
    animationsToggle.setAttribute("aria-expanded", "false");
    if (animationsVideo) {
      animationsVideo.pause();
    }
    document.body.classList.remove("animations-bg-active");
    var animationsBgVideo = document.querySelector(".page-bg__animations-video");
    if (animationsBgVideo) {
      animationsBgVideo.pause();
    }
    window.setTimeout(function () {
      if (!animationsPanel.classList.contains("is-open")) {
        animationsPanel.hidden = true;
      }
    }, LAYOUT_MS + 80);
  }

  if (projectsPanel && projectsToggle) {
    projectsToggle.addEventListener("click", function () {
      var open = projectsToggle.getAttribute("aria-expanded") !== "true";

      if (open) {
        closeAnimationsPanel();
        closeFreelancePanel();
        projectsToggle.setAttribute("aria-expanded", "true");
        root.classList.add("work-showcase--projects-open");
        pinStackHeight();
        if (dashboardWrap) {
          dashboardWrap.classList.add("home-dashboard--projects-open");
        }
        afterLayoutStep(function () {
          setPanelOpen(true);
          scheduleLayout();
          releaseStackHeight();
        });
        return;
      }

      projectsToggle.setAttribute("aria-expanded", "false");
      root.classList.remove("work-showcase--projects-open");
      if (projectsPanel.contains(document.activeElement)) {
        projectsToggle.focus();
      }
      pinStackHeight();
      setPanelOpen(false);
      afterLayoutStep(function () {
        if (dashboardWrap) {
          dashboardWrap.classList.remove("home-dashboard--projects-open");
        }
        scheduleLayout();
        releaseStackHeight();
      });
    });
  }
})();
