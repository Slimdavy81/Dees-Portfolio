(function () {
  "use strict";

  var root = document.querySelector("[data-freelance-player]");
  var toggle = document.querySelector("[data-freelance-toggle]");
  var panel = document.querySelector("[data-freelance-panel]");
  var reveal = document.querySelector("[data-freelance-reveal]");
  var playerShell = document.querySelector("[data-freelance-player-shell]");
  if (!root) return;

  var BASE = "Freelance/";
  var VIDEOS = [
    {
      file: "blink2.mp4",
      title: "Blink",
      summary: "A short motion piece built around fast visual rhythm, graphic timing, and atmospheric impact.",
    },
    {
      file: "coffee&comics.mp4",
      title: "Coffee & Comics",
      summary: "A promotional freelance video combining playful illustration energy with a coffee-shop tone.",
    },
    {
      file: "dfdesigns.mp4",
      title: "DF Designs",
      summary: "A branded motion clip focused on design identity, clean transitions, and portfolio-style presentation.",
    },
    {
      file: "freshgraphics.mp4",
      title: "Fresh Graphics",
      summary: "A graphics-led motion piece with bright promotional energy and quick visual hooks.",
    },
    {
      file: "voodoosoup.mp4",
      title: "Voodoo Soup",
      summary: "A stylised freelance edit with a stronger character and atmosphere-driven visual direction.",
    },
  ];

  var video = root.querySelector(".freelance-player__video");
  var playlist = root.querySelector(".freelance-player__playlist");
  var title = root.querySelector(".freelance-player__title");
  var summary = root.querySelector(".freelance-player__summary");
  var prev = root.querySelector(".freelance-player__nav--prev");
  var next = root.querySelector(".freelance-player__nav--next");
  var buttons = [];
  var current = 0;
  var workRoot = root.closest("[data-work-slider]");
  var dashboardWrap = root.closest(".home-dashboard__wrap");
  var projectsToggle = workRoot ? workRoot.querySelector(".work-showcase__projects-toggle") : null;
  var projectsPanel = workRoot ? workRoot.querySelector("#work-projects-panel") : null;
  var animationsToggle = workRoot ? workRoot.querySelector("[data-animations-toggle]") : null;
  var animationsPanel = workRoot ? workRoot.querySelector("#work-animations-panel") : null;
  var LAYOUT_MS = 480;
  var previewRevealTimer = null;

  if (!video || !playlist) return;

  function closeProjectsPanel() {
    if (!workRoot || !projectsToggle || !projectsPanel) return;

    projectsToggle.setAttribute("aria-expanded", "false");
    workRoot.classList.remove("work-showcase--projects-open");
    projectsPanel.classList.remove("is-open");
    projectsPanel.classList.remove("is-preview-open");

    window.setTimeout(function () {
      if (projectsToggle.getAttribute("aria-expanded") !== "true") {
        projectsPanel.hidden = true;
      }
    }, LAYOUT_MS + 80);
  }

  function closeAnimationsPanel() {
    if (!workRoot || !animationsToggle || !animationsPanel) return;
    var animationsVideo = animationsPanel.querySelector("video");

    animationsToggle.setAttribute("aria-expanded", "false");
    animationsPanel.classList.remove("is-open");
    if (animationsVideo) {
      animationsVideo.pause();
    }
    document.body.classList.remove("animations-bg-active");
    var animationsBgVideo = document.querySelector(".page-bg__animations-video");
    if (animationsBgVideo) {
      animationsBgVideo.pause();
    }

    window.setTimeout(function () {
      if (animationsToggle.getAttribute("aria-expanded") !== "true") {
        animationsPanel.hidden = true;
      }
    }, LAYOUT_MS + 80);
  }

  function setPanelOpen(open) {
    if (!panel || !toggle) return;

    if (open) {
      clearTimeout(previewRevealTimer);
      panel.classList.remove("is-preview-open");
      closeProjectsPanel();
      closeAnimationsPanel();
      panel.hidden = false;
      requestAnimationFrame(function () {
        panel.classList.add("is-open");
        previewRevealTimer = window.setTimeout(function () {
          panel.classList.add("is-preview-open");
        }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 230);
      });
      toggle.setAttribute("aria-expanded", "true");
      if (workRoot) {
        workRoot.classList.add("work-showcase--projects-open");
      }
      if (dashboardWrap) {
        dashboardWrap.classList.add("home-dashboard--projects-open");
      }
      return;
    }

    clearTimeout(previewRevealTimer);
    panel.classList.remove("is-preview-open");
    panel.classList.remove("is-open");
    panel.classList.remove("has-player-open");
    toggle.setAttribute("aria-expanded", "false");
    if (reveal) {
      reveal.setAttribute("aria-expanded", "false");
    }
    if (playerShell) {
      playerShell.classList.remove("is-open");
    }
    if (workRoot) {
      workRoot.classList.remove("work-showcase--projects-open");
    }
    if (dashboardWrap) {
      dashboardWrap.classList.remove("home-dashboard--projects-open");
    }
    video.pause();
    window.setTimeout(function () {
      if (!panel.classList.contains("is-open")) {
        panel.hidden = true;
        panel.classList.remove("has-player-open");
        if (playerShell) {
          playerShell.hidden = true;
        }
      }
    }, 360);
  }

  function revealPlayer() {
    if (!playerShell || !reveal) return;

    if (panel) {
      panel.classList.remove("is-preview-open");
      panel.classList.add("has-player-open");
    }
    playerShell.hidden = false;
    requestAnimationFrame(function () {
      playerShell.classList.add("is-open");
    });
    reveal.setAttribute("aria-expanded", "true");
  }

  function srcFor(file) {
    return BASE + encodeURIComponent(file);
  }

  function loadVideo(index, autoplay) {
    current = Math.max(0, Math.min(VIDEOS.length - 1, index));
    var item = VIDEOS[current];

    while (video.firstChild) video.removeChild(video.firstChild);

    var source = document.createElement("source");
    source.src = srcFor(item.file);
    source.type = "video/mp4";
    video.appendChild(source);
    video.load();

    if (title) title.textContent = item.title;
    if (summary) summary.textContent = item.summary;

    buttons.forEach(function (button, i) {
      var selected = i === current;
      button.classList.toggle("is-current", selected);
      button.setAttribute("aria-current", selected ? "true" : "false");
    });

    if (prev) prev.disabled = current === 0;
    if (next) next.disabled = current === VIDEOS.length - 1;

    if (autoplay) {
      var playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () {});
      }
    }
  }

  VIDEOS.forEach(function (item, index) {
    var li = document.createElement("li");
    var button = document.createElement("button");

    button.type = "button";
    button.className = "freelance-player__playlist-btn";
    button.textContent = item.title;
    button.setAttribute("aria-label", "Play " + item.title);
    button.addEventListener("click", function () {
      loadVideo(index, true);
    });

    buttons.push(button);
    li.appendChild(button);
    playlist.appendChild(li);
  });

  if (prev) {
    prev.addEventListener("click", function () {
      loadVideo(current - 1, true);
    });
  }

  if (next) {
    next.addEventListener("click", function () {
      loadVideo(current + 1, true);
    });
  }

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      setPanelOpen(open);
    });
  }

  if (reveal && playerShell) {
    reveal.addEventListener("click", revealPlayer);
  }

  video.addEventListener("ended", function () {
    if (current < VIDEOS.length - 1) {
      loadVideo(current + 1, true);
    }
  });

  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      loadVideo(current - 1, true);
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      loadVideo(current + 1, true);
    }
  });

  loadVideo(0, false);
})();
