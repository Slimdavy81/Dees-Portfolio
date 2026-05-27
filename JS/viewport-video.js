(function () {
  "use strict";

  var videos = document.querySelectorAll("[data-play-when-visible]");
  if (!videos.length || !("IntersectionObserver" in window)) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          if (video.ended) {
            video.currentTime = 0;
          }
          var playAttempt = video.play();
          if (playAttempt && typeof playAttempt.catch === "function") {
            playAttempt.catch(function () {});
          }
          return;
        }

        video.pause();
        video.currentTime = 0;
      });
    },
    {
      threshold: 0.45,
    }
  );

  videos.forEach(function (video) {
    observer.observe(video);
  });
})();
