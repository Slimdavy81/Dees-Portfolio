(function () {
  "use strict";

  var root = document.querySelector("[data-blender-deck]");
  if (!root) return;

  var buttons = Array.prototype.slice.call(root.querySelectorAll("[data-blender-view]"));
  var panels = Array.prototype.slice.call(root.querySelectorAll("[data-blender-panel]"));
  var videoPlayer = root.querySelector("[data-blender-video-player]");
  var videoRender = root.querySelector("[data-blender-video-render]");
  var videoClips = Array.prototype.slice.call(root.querySelectorAll("[data-video-src]"));
  var playAllButton = root.querySelector("[data-blender-play-all]");
  var isPlayingAll = false;

  function getVideoMimeType(src) {
    if (/\.mkv(?:\?|$)/i.test(src)) return "video/x-matroska";
    return "video/mp4";
  }

  function setActiveView(view) {
    root.classList.add("has-active-view");
    root.classList.toggle("is-videos-view", view === "videos");

    buttons.forEach(function (button) {
      var isActive = button.getAttribute("data-blender-view") === view;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-expanded", isActive ? "true" : "false");
    });

    panels.forEach(function (panel) {
      var panelView = panel.getAttribute("data-blender-panel");
      var isActive = panelView === view;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;

      if (panelView !== view) {
        panel.querySelectorAll("video").forEach(function (video) {
          video.pause();
        });
      }
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      setActiveView(button.getAttribute("data-blender-view"));
    });
  });

  function setPlayAllState(isActive) {
    isPlayingAll = isActive;

    if (playAllButton) {
      playAllButton.classList.toggle("is-active", isActive);
      playAllButton.setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  }

  function setActiveClip(clip, shouldPlay) {
    var src = clip.getAttribute("data-video-src");
    var renderSrc = clip.getAttribute("data-render-src");
    var renderAlt = clip.getAttribute("data-render-alt") || "";
    if (!videoPlayer || !src) return;

    if (videoPlayer.currentSrc.indexOf(src) === -1) {
      var source = videoPlayer.querySelector("source");
      videoPlayer.pause();
      source.src = src;
      source.type = getVideoMimeType(src);
      videoPlayer.load();
    }

    if (videoRender && renderSrc) {
      videoRender.src = renderSrc;
      videoRender.alt = renderAlt;
    }

    videoClips.forEach(function (item) {
      var isActive = item === clip;
      item.classList.toggle("is-active", isActive);
      if (isActive) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    });

    if (shouldPlay) {
      try {
        videoPlayer.currentTime = 0;
      } catch (error) {}

      var playAttempt = videoPlayer.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () {
          setPlayAllState(false);
        });
      }
    }
  }

  videoClips.forEach(function (clip) {
    clip.addEventListener("click", function () {
      setPlayAllState(false);
      setActiveClip(clip, false);
    });
  });

  if (playAllButton && videoPlayer) {
    playAllButton.addEventListener("click", function () {
      if (!videoClips.length) return;

      setPlayAllState(true);
      setActiveClip(videoClips[0], true);
    });

    videoPlayer.addEventListener("ended", function () {
      if (!isPlayingAll) return;

      var activeIndex = videoClips.findIndex(function (clip) {
        return clip.classList.contains("is-active");
      });
      var nextClip = videoClips[activeIndex + 1];

      if (nextClip) {
        setActiveClip(nextClip, true);
      } else {
        setPlayAllState(false);
      }
    });
  }
})();
