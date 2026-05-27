var iSlideIndex = 1;
var iOldIndex = 0;
var iPlaybackTimerId = 0;
var iStopAnimateTimerId = 0;
var iImageLoadingTimerId = 0;
var iSlideshowMouseMoveTimerId = 0;
var bLoaded = false;
var bPlay = false;
var bFullscreen = false;
var bLoop = true;
var bImageLoaded = true;
var iHoveredElem = 0;

var images = ["html/Image_0.png", "html/Evolution.jpg", "html/Avalanch.jpg", "html/warrior.jpg", "html/Warrior2.jpg", "html/beautiful face.jpg", "html/Scarletangel.jpg", "html/royo2.jpg", "html/sexy2.jpg", "html/SOO.jpg", "html/Memoryin....jpg", "html/Lost.jpg", "html/XGirlzero.jpg", "html/The World Is A Circle.jpg", ];
var slideDurations = [5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000];
var transitionDurations = [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 0];

// Exit fullscreen by Esc key
if (document.addEventListener) {
   document.addEventListener('fullscreenchange', exitFullscreen);
   document.addEventListener('webkitfullscreenchange', exitFullscreen);
   document.addEventListener('mozfullscreenchange', exitFullscreen);
   document.addEventListener('MSFullscreenChange', exitFullscreen);
}

function exitFullscreen() {
   if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
      if (bFullscreen) ToggleFullscreen();
   }
}

function LoadFirstSlideHiRes() {
   var img = new Image();
   img.onload = function () {
      var first_slide = document.getElementsByClassName("slide")[0];
      var first_image = first_slide.getElementsByTagName("IMG")[0];
      first_image.src = images[0];
   }
   img.src = images[0];
}

function LoadNthImage(callback, old_n) {
   var slides = document.getElementsByClassName("slide");
   if (iSlideIndex > slides.length) {
      if (bLoop) {
         iSlideIndex = 1;
      } else {
         iSlideIndex -= 1;
         return;
      }
   }
   if (iSlideIndex < 1) {
      if (bLoop) iSlideIndex = slides.length;
      else {
         iSlideIndex += 1;
         return;
      }
   }

   var first_slide = document.getElementsByClassName("slide")[iSlideIndex-1];
   var first_image = first_slide.getElementsByTagName("IMG")[0];
   if (first_image.src != "") {
      callback(old_n, iSlideIndex, true);
      return;
   }

   bImageLoaded = false;
   var img = new Image();
   img.onload = function () { 
      callback(old_n, iSlideIndex, true);
   }
   img.src = images[iSlideIndex-1];
}

function PrevSlide() {
   if (!bImageLoaded) return;
   CancelCurrentAnimation();
   if (iImageLoadingTimerId != 0) {
      clearTimeout(iImageLoadingTimerId);
      iImageLoadingTimerId = 0;
   }
   if (bPlay && (iPlaybackTimerId != 0)) {
      clearTimeout(iPlaybackTimerId);
      iPlaybackTimerId = 0;
   }
   var old_n = iSlideIndex;
   iSlideIndex -= 1;
   LoadNthImage(ShowSlide, old_n);
   ShowSlide(old_n, iSlideIndex, false);
}

function NextSlide() {
   if (!bImageLoaded) return;
   CancelCurrentAnimation();
   if (iImageLoadingTimerId != 0) {
      clearTimeout(iImageLoadingTimerId);
      iImageLoadingTimerId = 0;
   }
   if (bPlay && (iPlaybackTimerId != 0)) {
      clearTimeout(iPlaybackTimerId);
      iPlaybackTimerId = 0;
   }
   var old_n = iSlideIndex;
   iSlideIndex += 1;
   LoadNthImage(ShowSlide, old_n);
   ShowSlide(old_n, iSlideIndex, false);
}

function MoveSlide(n) {
   if (!bImageLoaded) return;
   CancelCurrentAnimation();
   if (iImageLoadingTimerId != 0) {
      clearTimeout(iImageLoadingTimerId);
      iImageLoadingTimerId = 0;
   }
   if (bPlay && (iPlaybackTimerId != 0)) {
      clearTimeout(iPlaybackTimerId);
      iPlaybackTimerId = 0;
   }
   var old_n = iSlideIndex;
   iSlideIndex = n;
   LoadNthImage(ShowSlide, old_n);
   ShowSlide(old_n, iSlideIndex, false);
}

function StartAnimate(old_n, duration) {
   var durationSeconds = duration / 1000;
   var slides = document.getElementsByClassName("slide");
   slides[old_n-1].className += " make-invisible";
   slides[old_n-1].style.animationDuration = durationSeconds + "s";
   slides[old_n-1].style.webkitAnimationDuration  = durationSeconds + "s";
   slides[iSlideIndex-1].className += " make-visible";
   slides[iSlideIndex-1].style.animationDuration = durationSeconds + "s";
   slides[iSlideIndex-1].style.webkitAnimationDuration  = durationSeconds + "s";
}

function CancelCurrentAnimation(decrease = true) {
   if (bPlay && (iPlaybackTimerId != 0)) {
      if (decrease) {
         iSlideIndex -= 1;
         if (iSlideIndex < 1) {
            if (bLoop) {
               var slides = document.getElementsByClassName("slide");
               iSlideIndex = slides.length;
            } else {
               iSlideIndex += 1;
            }
         }
      }
   }

   var iIndexToRemove = iSlideIndex;
   if (!decrease) {
      iIndexToRemove -= 1;
      if (iIndexToRemove < 1) {
         if (bLoop) {
            var slides = document.getElementsByClassName("slide");
            iIndexToRemove = slides.length;
         } else {
            iIndexToRemove += 1;
         }
      }
   }

   if (iStopAnimateTimerId != 0) {
      clearTimeout(iStopAnimateTimerId);
      RemoveAnimate(iOldIndex, iIndexToRemove);
   }
}

function RemoveAnimate(old_n, n) {
   iStopAnimateTimerId = 0;
   iOldIndex = 0;
   var slides = document.getElementsByClassName("slide");
   slides[old_n-1].className = slides[old_n-1].className.replace(" make-invisible", "");
   slides[n-1].className = slides[n-1].className.replace(" make-visible", "");
   slides[old_n-1].style.display = "none";
   var slide_style = slides[n-1].style;
   if (!bFullscreen) {
      slide_style.removeProperty("top");
      slide_style.removeProperty("left");
      slide_style.removeProperty("transform");
      slide_style.removeProperty("position");
   }
}

function ShowCrossFadingSlides(old_n) {
   var i;
   var slides = document.getElementsByClassName("slide");
   for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
   }

   slides[old_n-1].style.display = "block";
   slides[iSlideIndex-1].style.display = "block";
   if (bFullscreen) {
      slides[iSlideIndex-1].style.top = "50%";
      slides[iSlideIndex-1].style.left = "50%";
      slides[iSlideIndex-1].style.transform = "translate(-50%, -50%)";
   } else {
      slides[iSlideIndex-1].style.left = "0px";
      slides[iSlideIndex-1].style.top = "0px";
      slides[iSlideIndex-1].style.removeProperty("transform");

      var visible = document.getElementsByClassName("make-visible")[0];
      visible.style.width = "100%";
      visible.style.height = "auto";
   }

   slides[iSlideIndex-1].style.margin = "auto";
   slides[iSlideIndex-1].style.position = "absolute";

   var selectors = document.getElementsByClassName("slide-selector");
   for (i = 0; i < selectors.length; i++) {
      selectors[i].className = selectors[i].className.replace(" active", "");
   }
   selectors[iSlideIndex-1].className += " active";
}

function ShowSlide(old_n, n, from_callback) {
   if (from_callback) {
      var first_slide = document.getElementsByClassName("slide")[n-1];
      var first_image = first_slide.getElementsByTagName("IMG")[0];
      first_image.src = images[n-1];
      bImageLoaded = true;
      return;
   } else {
      iImageLoadingTimerId = 0;
   }

   if (!bImageLoaded) {
      iImageLoadingTimerId = setTimeout(ShowSlide, 200, old_n, n, false);
      return;
   }

   var bStartTimeout = true;
   var slides = document.getElementsByClassName("slide");
   if (old_n != n) {
      if (n > slides.length) {
         if (bLoop) {
            iSlideIndex = 1;
         } else {
            StopPlayback();
            iSlideIndex -= 1;
            bStartTimeout = false;
            return;
         }
      }
      if (n < 1) {
         if (bLoop) iSlideIndex = slides.length;
         else {
            iSlideIndex += 1;
            return;
         }
      }

      if (bLoaded) {
         var transitionDuration = transitionDurations[old_n-1];
         StartAnimate(old_n, transitionDuration);
         ShowCrossFadingSlides(old_n);
         iOldIndex = old_n;
         iStopAnimateTimerId = setTimeout(RemoveAnimate, transitionDuration, old_n, iSlideIndex);
      } else {
         var selectors = document.getElementsByClassName("slide-selector");
         selectors[iSlideIndex-1].className += " active";
         bLoaded = true;
      }
   } else if ((!bLoop) && (iSlideIndex == slides.length)) {
      StopPlayback();
      bStartTimeout = false;
      return;
   }

   if (bPlay && (iPlaybackTimerId != 0)) {
      clearTimeout(iPlaybackTimerId);
      iPlaybackTimerId = 0;
   }

   if (bPlay && bStartTimeout) {
      var old_index = iSlideIndex;
      iSlideIndex += 1;
      LoadNthImage(ShowSlide, old_index);
      var timeout = (((old_n != n) ? (transitionDurations[old_n-1] / 2) : 0) + slideDurations[n-1]) - (transitionDurations[n-1] / 2);
      iPlaybackTimerId = setTimeout(ShowSlide, timeout, old_index, iSlideIndex, false);
   }
}

function StopPlayback() {
   var play = document.getElementById("play");
   var pause = document.getElementById("pause");

   play.style.display = "block";
   pause.style.display = "none";

   if (iPlaybackTimerId != 0) {
      clearTimeout(iPlaybackTimerId);
      iPlaybackTimerId = 0;
   }
   bPlay = false;
}

function TogglePlay() {
   var slides = document.getElementsByClassName("slide");
   if ((iSlideIndex >= slides.length) && (!bLoop)) return;

   bPlay = !bPlay;
   var play = document.getElementById("play");
   var pause = document.getElementById("pause");

   if (bPlay) {
      play.style.display = "none";
      pause.style.display = "block";
   } else {
      play.style.display = "block";
      pause.style.display = "none";
   }

   PlaySlideshow();
}

function ShowFullscreen(bShowFullscreen) {
   if (bShowFullscreen) {
      var overall_container = document.getElementsByClassName("overall-container")[0];
      if (overall_container.requestFullscreen) {
         overall_container.requestFullscreen();
      } else if (overall_container.mozRequestFullScreen) {
         overall_container.mozRequestFullScreen();
      } else if (overall_container.webkitRequestFullscreen) {
         overall_container.webkitRequestFullscreen();
      } else if (overall_container.msRequestFullscreen) {
         overall_container.msRequestFullscreen();
      }
   } else {
      if (document.exitFullscreen) {
         document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
         document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
         document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
         document.msExitFullscreen();
      }
   }
}

function ToggleFullscreen() {
   bFullscreen = !bFullscreen;
   var fullscreen_controls = document.getElementsByClassName("fullscreen-controls")[0];
   var view_fullscreen = document.getElementById("view-fullscreen");
   var exit_fullscreen = document.getElementById("exit-fullscreen");
   var sequence_controls = document.getElementsByClassName("sequence-controls")[0];
   var selectors = document.getElementsByClassName("slide-selector");
   var watermark = document.getElementsByClassName("wm-free")[0];
   var slides = document.getElementsByClassName("slide");
   var i;

   CancelCurrentAnimation(false);

   if (bFullscreen) {
      for (i = 0; i < slides.length; i++) {
         slides[i].style.top = "50%";
         slides[i].style.left = "50%";
         slides[i].style.transform = "translate(-50%, -50%)";
         slides[i].style.position = "absolute";
      }

      fullscreen_controls.style.bottom = "8px";
      view_fullscreen.style.display = "none";
      exit_fullscreen.style.display = "block";
      sequence_controls.style.bottom = "8px";
      for (i = 0; i < selectors.length; i++) {
         selectors[i].style.opacity = "0.6";
      }
      
   } else {
      for (i = 0; i < slides.length; i++) {
         slides[i].style.removeProperty("top");
         slides[i].style.removeProperty("left");
         slides[i].style.removeProperty("transform");
         slides[i].style.removeProperty("position");
      }

      fullscreen_controls.style.bottom = "11px";
      view_fullscreen.style.display = "block";
      exit_fullscreen.style.display = "none";
      sequence_controls.style.bottom = "-40px";
      for (i = 0; i < selectors.length; i++) {
         selectors[i].style.opacity = "1";
      }
      watermark.style.bottom = "0px";
   }

   ShowFullscreen(bFullscreen);
}

function PlaySlideshow() {
   if (iPlaybackTimerId != 0) {
      clearTimeout(iPlaybackTimerId);
      iPlaybackTimerId = 0;
      iSlideIndex -= 1;
   } else {
      ShowSlide(iSlideIndex, iSlideIndex, false);
   }
}

function MouseOverElem(hoveredElem) {
   clearTimeout(iSlideshowMouseMoveTimerId);
   iSlideshowMouseMoveTimerId = 0;
   iHoveredElem = hoveredElem;

   switch (iHoveredElem) {
      case 1:
         var play_controls = document.getElementsByClassName("play-controls")[0];
         play_controls.style.opacity = "1";
         break;
      case 2:
         var prev_button = document.getElementsByClassName("prev")[0];
         prev_button.style.opacity = "1";
         break;
      case 3:
         var next_button = document.getElementsByClassName("next")[0];
         next_button.style.opacity = "1";
         break;
      case 4:
         var fullscreen_controls = document.getElementsByClassName("fullscreen-controls")[0];
         fullscreen_controls.style.opacity = "1";
         break;
      case 5:
         if (bFullscreen) {
            var selectors = document.getElementsByClassName("slide-selector");
            var i;
            for (i = 0; i < selectors.length; i++) {
               selectors[i].style.opacity = "1";
            }
         }
         break;
   }
}

function MouseOutElem() {
   if ((iHoveredElem == 5) && bFullscreen) {
      var selectors = document.getElementsByClassName("slide-selector");
      var i;
      for (i = 0; i < selectors.length; i++) {
         selectors[i].style.opacity = "0.6";
      }
   }

   iSlideshowMouseMoveTimerId = setTimeout(ShowControls, 1000, false);
   iHoveredElem = 0;
}

function ShowControls(bShowControls) {
   var play_controls = document.getElementsByClassName("play-controls")[0];
   var prev_button = document.getElementsByClassName("prev")[0];
   var next_button = document.getElementsByClassName("next")[0];
   var fullscreen_controls = document.getElementsByClassName("fullscreen-controls")[0];
   var selectors = document.getElementsByClassName("slide-selector");
   var i;

   if (bShowControls) {
      play_controls.style.opacity = "0.6";
      prev_button.style.opacity = "0.6";
      next_button.style.opacity = "0.6";
      fullscreen_controls.style.opacity = "0.6";
      if (bFullscreen) {
         for (i = 0; i < selectors.length; i++) {
            selectors[i].style.opacity = "0.6";
         }
      }
   } else {
      play_controls.style.opacity = "0";
      prev_button.style.opacity = "0";
      next_button.style.opacity = "0";
      fullscreen_controls.style.opacity = "0";
      if (bFullscreen) {
         for (i = 0; i < selectors.length; i++) {
            selectors[i].style.opacity = "0";
         }
      }
   }

   iSlideshowMouseMoveTimerId = 0;
}

function SlideshowMouseMove() {
   clearTimeout(iSlideshowMouseMoveTimerId);
   if (iHoveredElem == 0) {
      ShowControls(true);
      iSlideshowMouseMoveTimerId = setTimeout(ShowControls, 1000, false);
   }
}

