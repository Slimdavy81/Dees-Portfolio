(function () {
  "use strict";

  /** Folder at site root containing rendered AE exports (sorted A–Z). */
  var AE_DIR = "After effects/";
  /** Synced from `After effects/` (case-sensitive on some hosts). */
  var FILES = [
    "ahha.mp4",
    "butterfly animation.mp4",
    "Dark Rose.mp4",
    "EDMemory.mp4",
    "fire&ice.mp4",
    "growgood.mp4",
    "hey joe.mp4",
    "IIB.mp4",
    "Irredescent.mp4",
    "Islandinthe.mp4",
    "jimi_1.mp4",
    "KS.mp4",
    "light_1.mp4",
    "lonely view.mp4",
    "lonewolf.mp4",
    "LOTWorld.mp4",
    "Matrix rain.mp4",
    "MELT_1.mp4",
    "midnight oil.mp4",
    "mikey.mp4",
    "moon.mp4",
    "MTVG2.mp4",
    "obvious.mp4",
    "OSCloser.mp4",
    "passenger.mp4",
    "Pepsi.mp4",
    "progress.mp4",
    "sballs.mp4",
    "scrap_1.mp4",
    "SickBFly.mp4",
    "SIMM_1459.mp4",
    "snowglobe.mp4",
    "solar.mp4",
    "sweetshadow.mp4",
    "WTWA.mp4",
    "YFZ.mp4",
  ];

  function mimeFor(name) {
    var ext = name.split(".").pop();
    ext = ext ? ext.toLowerCase() : "";
    if (ext === "mp4") return "video/mp4";
    if (ext === "webm") return "video/webm";
    if (ext === "ogg" || ext === "ogv") return "video/ogg";
    if (ext === "avi") return "video/x-msvideo";
    if (ext === "wmv") return "video/x-ms-wmv";
    return "";
  }

  function isLikelyLimitedSupport(name) {
    var ext = name.split(".").pop();
    ext = ext ? ext.toLowerCase() : "";
    return ext === "avi" || ext === "wmv";
  }

  function labelFromFilename(name) {
    return name.replace(/\.[^/.]+$/, "");
  }

  function initPlaylist(rootEl) {
    var video = rootEl.querySelector(".animations-playlist__video");
    var listEl = rootEl.querySelector(".animations-playlist__list");
    var statusEl =
      rootEl.querySelector(".animations-playlist__status") ||
      rootEl.querySelector("#ae-playlist-status");
    if (!video || !listEl || FILES.length === 0) return;

    var currentIndex = -1;
    var buttons = [];

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text || "";
    }

    function refreshVideoSources(name) {
      while (video.firstChild) video.removeChild(video.firstChild);
      var src = document.createElement("source");
      src.src = AE_DIR + encodeURIComponent(name);
      var type = mimeFor(name);
      if (type) src.type = type;
      video.appendChild(src);
      video.load();
    }

    function syncCurrentClass() {
      buttons.forEach(function (btn, i) {
        var on = i === currentIndex;
        btn.classList.toggle("is-current", on);
        btn.setAttribute("aria-current", on ? "true" : "false");
      });
      setStatus(
        currentIndex >= 0
          ? "Now playing clip " +
              (currentIndex + 1) +
              " of " +
              FILES.length +
              ": " +
              labelFromFilename(FILES[currentIndex])
          : ""
      );
    }

    function loadTrack(index, autoplay) {
      index = Math.max(0, Math.min(FILES.length - 1, index));
      currentIndex = index;
      refreshVideoSources(FILES[currentIndex]);
      syncCurrentClass();
      if (!autoplay) return;
      var playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () {});
      }
    }

    function initDashboardScroller() {
      if (!rootEl.classList.contains("animations-playlist--dashboard")) return;

      var listPanel = rootEl.querySelector(".animations-playlist__list-panel");
      if (!listPanel || listPanel.querySelector(".animations-playlist__scroll-rail")) return;

      var rail = document.createElement("div");
      rail.className = "animations-playlist__scroll-rail";
      rail.setAttribute("aria-hidden", "true");

      var thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "animations-playlist__scroll-thumb";
      thumb.tabIndex = -1;
      thumb.setAttribute("aria-label", "Scroll animation clips");
      rail.appendChild(thumb);
      listPanel.appendChild(rail);

      var dragStartY = 0;
      var dragStartScroll = 0;
      var dragging = false;
      var syncFrame = 0;

      function syncScroller() {
        syncFrame = 0;

        var railHeight = listEl.clientHeight;
        var maxScroll = listEl.scrollHeight - listEl.clientHeight;
        var canScroll = maxScroll > 1 && railHeight > 0;
        rootEl.classList.toggle("has-scrollbar", canScroll);

        rail.style.top = listEl.offsetTop + "px";
        rail.style.height = railHeight + "px";

        if (!canScroll) {
          thumb.style.height = "100%";
          thumb.style.transform = "translate(-50%, 0)";
          return;
        }

        var thumbHeight = Math.max(32, (listEl.clientHeight / listEl.scrollHeight) * railHeight);
        thumbHeight = Math.min(railHeight, thumbHeight);
        var maxThumbTop = railHeight - thumbHeight;
        var thumbTop = (listEl.scrollTop / maxScroll) * maxThumbTop;

        thumb.style.height = thumbHeight + "px";
        thumb.style.transform = "translate(-50%, " + thumbTop + "px)";
      }

      function scheduleSync() {
        if (syncFrame) return;
        syncFrame = window.requestAnimationFrame(syncScroller);
      }

      function scrollFromPointer(clientY) {
        var rect = rail.getBoundingClientRect();
        var thumbRect = thumb.getBoundingClientRect();
        var maxScroll = listEl.scrollHeight - listEl.clientHeight;
        var maxThumbTop = rect.height - thumbRect.height;
        if (maxScroll <= 0 || maxThumbTop <= 0) return;

        var nextThumbTop = Math.max(
          0,
          Math.min(maxThumbTop, clientY - rect.top - thumbRect.height / 2)
        );
        listEl.scrollTop = (nextThumbTop / maxThumbTop) * maxScroll;
      }

      listEl.addEventListener("scroll", scheduleSync, { passive: true });
      rail.addEventListener("click", function (event) {
        if (event.target === thumb) return;
        scrollFromPointer(event.clientY);
      });

      thumb.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        dragging = true;
        dragStartY = event.clientY;
        dragStartScroll = listEl.scrollTop;
        thumb.setPointerCapture(event.pointerId);
      });

      thumb.addEventListener("pointermove", function (event) {
        if (!dragging) return;

        var railHeight = rail.clientHeight;
        var thumbHeight = thumb.offsetHeight;
        var maxScroll = listEl.scrollHeight - listEl.clientHeight;
        var maxThumbTop = railHeight - thumbHeight;
        if (maxScroll <= 0 || maxThumbTop <= 0) return;

        listEl.scrollTop = dragStartScroll + ((event.clientY - dragStartY) / maxThumbTop) * maxScroll;
      });

      thumb.addEventListener("pointerup", function (event) {
        dragging = false;
        thumb.releasePointerCapture(event.pointerId);
      });

      thumb.addEventListener("pointercancel", function () {
        dragging = false;
      });

      if (typeof ResizeObserver === "function") {
        var resizeObserver = new ResizeObserver(scheduleSync);
        resizeObserver.observe(listEl);
        resizeObserver.observe(listPanel);
      } else {
        window.addEventListener("resize", scheduleSync);
      }

      rootEl.syncPlaylistScroller = scheduleSync;
      scheduleSync();
    }

    FILES.forEach(function (name, i) {
      var li = document.createElement("li");
      li.className = "animations-playlist__item";
      if (isLikelyLimitedSupport(name)) {
        li.classList.add("animations-playlist__item--limited");
        li.title = "AVI / WMV may not play in the browser — try downloading the file.";
      }

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "animations-playlist__btn";
      btn.textContent = labelFromFilename(name);
      btn.setAttribute("aria-label", "Play " + labelFromFilename(name));
      btn.addEventListener("click", function () {
        loadTrack(i, true);
      });

      buttons.push(btn);
      li.appendChild(btn);
      listEl.appendChild(li);
    });

    initDashboardScroller();

    video.addEventListener("ended", function () {
      if (currentIndex < FILES.length - 1) loadTrack(currentIndex + 1, true);
    });

    video.addEventListener("error", function () {
      if (currentIndex < 0) return;
      setStatus(
        "Could not load " +
          labelFromFilename(FILES[currentIndex]) +
          " in this browser. Try another clip or download the original file."
      );
    });

    rootEl.pausePlaylist = function () {
      video.pause();
    };

    loadTrack(0, false);
  }

  function initDashboardToggle() {
    var toggle = document.querySelector("[data-animations-toggle]");
    var panel = document.querySelector("[data-animations-panel]");
    if (!toggle || !panel) return;

    var workRoot = panel.closest("[data-work-slider]");
    var dashboardWrap = panel.closest(".home-dashboard__wrap");
    var projectsToggle = workRoot ? workRoot.querySelector(".work-showcase__projects-toggle") : null;
    var projectsPanel = workRoot ? workRoot.querySelector("#work-projects-panel") : null;
    var freelanceToggle = workRoot ? workRoot.querySelector("[data-freelance-toggle]") : null;
    var freelancePanel = workRoot ? workRoot.querySelector("#work-freelance-panel") : null;
    var LAYOUT_MS = 480;
    var previewRevealTimer = null;

    function closePanel(targetPanel, targetToggle) {
      if (!targetPanel || !targetToggle) return;
      var video = targetPanel.querySelector("video");
      var playerShell = targetPanel.querySelector("[data-freelance-player-shell]");
      var reveal = targetPanel.querySelector("[data-freelance-reveal]");

      targetPanel.classList.remove("is-open");
      targetPanel.classList.remove("is-preview-open");
      targetPanel.classList.remove("has-player-open");
      targetToggle.setAttribute("aria-expanded", "false");
      if (video) video.pause();
      if (playerShell) playerShell.classList.remove("is-open");
      if (reveal) reveal.setAttribute("aria-expanded", "false");
      window.setTimeout(function () {
        if (!targetPanel.classList.contains("is-open")) {
          targetPanel.hidden = true;
          if (playerShell) playerShell.hidden = true;
        }
      }, LAYOUT_MS + 80);
    }

    function setOpen(open) {
      if (open) {
        clearTimeout(previewRevealTimer);
        panel.classList.remove("is-preview-open");
        closePanel(projectsPanel, projectsToggle);
        closePanel(freelancePanel, freelanceToggle);
        panel.hidden = false;
        requestAnimationFrame(function () {
          panel.classList.add("is-open");
          var playlist = panel.querySelector("[data-animations-playlist]");
          if (playlist && playlist.syncPlaylistScroller) playlist.syncPlaylistScroller();
          previewRevealTimer = window.setTimeout(function () {
            panel.classList.add("is-preview-open");
            if (playlist && playlist.syncPlaylistScroller) playlist.syncPlaylistScroller();
          }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 230);
        });
        toggle.setAttribute("aria-expanded", "true");
        document.body.classList.add("animations-bg-active");
        var bgVideo = document.querySelector(".page-bg__animations-video");
        if (bgVideo) {
          var bgPlay = bgVideo.play();
          if (bgPlay && typeof bgPlay.catch === "function") {
            bgPlay.catch(function () {});
          }
        }
        if (workRoot) workRoot.classList.add("work-showcase--projects-open");
        if (dashboardWrap) dashboardWrap.classList.add("home-dashboard--projects-open");
        return;
      }

      clearTimeout(previewRevealTimer);
      panel.classList.remove("is-preview-open");
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("animations-bg-active");
      var bgVideo = document.querySelector(".page-bg__animations-video");
      if (bgVideo) bgVideo.pause();
      var playlist = panel.querySelector("[data-animations-playlist]");
      if (playlist && playlist.pausePlaylist) playlist.pausePlaylist();
      if (workRoot) workRoot.classList.remove("work-showcase--projects-open");
      if (dashboardWrap) dashboardWrap.classList.remove("home-dashboard--projects-open");
      window.setTimeout(function () {
        if (!panel.classList.contains("is-open")) {
          panel.hidden = true;
        }
      }, LAYOUT_MS + 80);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
  }

  var roots = document.querySelectorAll("[data-animations-playlist], #animations-ae-playlist");
  roots.forEach(initPlaylist);
  initDashboardToggle();
})();
