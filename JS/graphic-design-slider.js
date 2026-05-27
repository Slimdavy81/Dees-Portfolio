(function () {
  "use strict";

  var root = document.querySelector("[data-graphic-design-carousel]");
  if (!root) return;

  var track = root.querySelector(".graphic-design-carousel__track");
  var viewport = root.querySelector(".graphic-design-carousel__viewport");
  var status = document.getElementById("graphic-design-carousel-status");
  if (!track || !viewport) return;

  var IMAGES = [
    { file: "dreaming of electric sheep.jpg", label: "Dreaming of electric sheep" },
    { file: "Propaganda2.jpg", label: "Propaganda design" },
    { file: "FTpaints.jpg", label: "FT Paints graphic design" },
    { file: "Seaforde Brochure.jpg", label: "Seaforde brochure design" },
    { file: "Tattooportfolio.jpg", label: "Tattoo portfolio design" },
    { file: "Web Design CPT.jpg", label: "Web design CPT project" },
  ];

  var BASE = "Graphic Design/";
  var ENTER_MS = 300;
  var ALL_HOLD_MS = 2800;
  var SHUFFLE_ANIM_MS = 340;
  var SHUFFLE_STAGGER_MS = 35;
  var SHUFFLE_MAX_STAGGER = SHUFFLE_STAGGER_MS * 5;
  var SHUFFLE_HALF = SHUFFLE_ANIM_MS + SHUFFLE_MAX_STAGGER;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var slides = [];
  var timer = null;
  var running = false;
  var lightbox;
  var lightboxImg;
  var previewIndex = -1;

  function srcFor(file) {
    return encodeURI(BASE + file);
  }

  function buildLightbox() {
    lightbox = document.createElement("div");
    lightbox.className = "graphic-design-lightbox";
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-label", "Image preview");

    lightboxImg = document.createElement("img");
    lightboxImg.className = "graphic-design-lightbox__img";
    lightboxImg.alt = "";
    lightbox.appendChild(lightboxImg);
    document.body.appendChild(lightbox);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") hidePreview();
    });
  }

  function showPreview(imageIndex) {
    if (!lightbox || !IMAGES[imageIndex]) return;
    previewIndex = imageIndex;
    lightboxImg.src = srcFor(IMAGES[imageIndex].file);
    lightboxImg.alt = IMAGES[imageIndex].label;
    lightbox.classList.add("is-visible");
    lightbox.setAttribute("aria-hidden", "false");
    stop();
  }

  function hidePreview() {
    if (!lightbox) return;
    previewIndex = -1;
    lightbox.classList.remove("is-visible");
    lightbox.setAttribute("aria-hidden", "true");
  }

  function bindSlide(slide, imageIndex) {
    slide.addEventListener("mouseenter", function () {
      if (!slide.classList.contains("is-revealed")) return;
      showPreview(imageIndex);
    });

    slide.addEventListener("mouseleave", function () {
      hidePreview();
      resumeCarousel();
    });

    slide.addEventListener("focusin", function () {
      if (!slide.classList.contains("is-revealed")) return;
      showPreview(imageIndex);
    });

    slide.addEventListener("focusout", function (e) {
      if (lightbox && lightbox.contains(e.relatedTarget)) return;
      hidePreview();
      resumeCarousel();
    });
  }

  function buildSlides() {
    track.textContent = "";
    slides = [];

    IMAGES.forEach(function (item, i) {
      var slide = document.createElement("figure");
      slide.className = "graphic-design-carousel__slide";
      slide.setAttribute("data-image-index", String(i));
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", item.label);
      slide.setAttribute("aria-hidden", "true");

      var img = document.createElement("img");
      img.src = srcFor(item.file);
      img.alt = item.label;
      img.decoding = "async";
      img.loading = i < 2 ? "eager" : "lazy";
      img.draggable = false;

      var inner = document.createElement("div");
      inner.className = "graphic-design-carousel__slide-inner";
      inner.appendChild(img);
      slide.appendChild(inner);
      track.appendChild(slide);
      slides.push(slide);
      bindSlide(slide, i);
    });
  }

  function shuffleSlides() {
    var i;
    var j;
    var tmp;

    for (i = slides.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      tmp = slides[i];
      slides[i] = slides[j];
      slides[j] = tmp;
    }

    slides.forEach(function (slide) {
      track.appendChild(slide);
    });
  }

  function resetSlides() {
    slides.forEach(function (slide) {
      slide.classList.remove("is-revealed", "is-sliding-in");
      slide.style.removeProperty("--slide-from");
      slide.setAttribute("aria-hidden", "true");
    });
    track.setAttribute("data-revealed", "0");
  }

  function revealAll() {
    slides.forEach(function (slide) {
      slide.classList.add("is-revealed");
      slide.setAttribute("aria-hidden", "false");
    });
    track.setAttribute("data-revealed", String(slides.length));

    void track.offsetWidth;

    var vp = viewport.getBoundingClientRect();
    slides.forEach(function (slide) {
      var sr = slide.getBoundingClientRect();
      var fromX = Math.max(0, vp.right - sr.left);
      slide.style.setProperty("--slide-from", fromX + "px");
      slide.classList.add("is-sliding-in");
    });

    if (status) {
      status.textContent =
        "All " + slides.length + " graphic design images — shuffled order";
    }
  }

  function stop() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    running = false;
    root.classList.remove("is-shuffling");
    slides.forEach(function (slide) {
      slide.classList.remove("is-3d-out", "is-3d-in");
    });
  }

  function resumeCarousel() {
    if (!root.classList.contains("is-inview")) return;
    if (previewIndex >= 0 || running || !slides.length) return;

    running = true;
    if (slides[0].classList.contains("is-revealed")) {
      timer = setTimeout(run3DShuffle, ALL_HOLD_MS);
    } else {
      runCycle();
    }
  }

  function run3DShuffle() {
    if (!running) return;

    if (reduced.matches) {
      shuffleSlides();
      timer = setTimeout(run3DShuffle, ALL_HOLD_MS);
      return;
    }

    root.classList.add("is-shuffling");
    slides.forEach(function (slide) {
      slide.classList.remove("is-sliding-in");
      slide.classList.add("is-3d-out");
    });

    timer = setTimeout(function () {
      if (!running) return;
      shuffleSlides();
      slides.forEach(function (slide) {
        slide.classList.remove("is-3d-out");
        slide.classList.add("is-3d-in");
      });

      timer = setTimeout(function () {
        if (!running) return;
        slides.forEach(function (slide) {
          slide.classList.remove("is-3d-in");
        });
        root.classList.remove("is-shuffling");
        if (status) {
          status.textContent =
            "All " + slides.length + " graphic design images — shuffled order";
        }
        timer = setTimeout(run3DShuffle, ALL_HOLD_MS);
      }, SHUFFLE_HALF);
    }, SHUFFLE_HALF);
  }

  function runCycle() {
    if (!running) return;

    shuffleSlides();
    resetSlides();

    timer = setTimeout(function () {
      if (!running) return;
      revealAll();

      var hold = reduced.matches ? ALL_HOLD_MS : ENTER_MS + ALL_HOLD_MS;
      timer = setTimeout(function () {
        if (!running) return;
        run3DShuffle();
      }, hold);
    }, reduced.matches ? 0 : 40);
  }

  function start() {
    stop();
    if (!slides.length) return;
    running = true;
    runCycle();
  }

  function startInView() {
    if (root.classList.contains("is-inview")) return;
    root.classList.add("is-inview");
    start();
  }

  root.style.setProperty(
    "--gd-shuffle-half",
    (SHUFFLE_ANIM_MS / 1000).toFixed(3) + "s"
  );

  buildLightbox();
  buildSlides();

  root.addEventListener("mouseenter", function (e) {
    if (e.target.closest(".graphic-design-carousel__slide.is-revealed")) return;
    stop();
  });

  root.addEventListener("mouseleave", function (e) {
    if (lightbox && lightbox.contains(e.relatedTarget)) return;
    hidePreview();
    resumeCarousel();
  });

  reduced.addEventListener("change", function () {
    if (reduced.matches) stop();
    else if (root.classList.contains("is-inview")) start();
  });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startInView();
            observer.disconnect();
          }
        });
      },
      { root: null, rootMargin: "0px 0px -5% 0px", threshold: 0.12 }
    );
    observer.observe(root);
  } else {
    startInView();
  }
})();
