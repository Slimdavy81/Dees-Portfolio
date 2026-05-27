/**
 * Electrical ambience while slideshow hover preview is open.
 */
var SlideshowSounds = (function () {
	var ctx = null;
	var active = false;
	var musicActive = false;
	var musicRequested = false;
	var nodes = null;
	var musicNodes = null;
	var sparkTimer = null;

	function prefersQuiet() {
		if (window.matchMedia) {
			return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		}
		return false;
	}

	function getContext() {
		if (ctx) {
			return ctx;
		}
		var AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) {
			return null;
		}
		ctx = new AC();
		return ctx;
	}

	function unlock() {
		var c = getContext();
		if (!c) {
			return;
		}
		if (c.state === "suspended" && c.resume) {
			c.resume();
		}
	}

	function makeNoiseBuffer(c, seconds) {
		var len = Math.floor(c.sampleRate * seconds);
		var buf = c.createBuffer(1, len, c.sampleRate);
		var data = buf.getChannelData(0);
		var i;
		for (i = 0; i < len; i++) {
			data[i] = Math.random() * 2 - 1;
		}
		return buf;
	}

	function shouldPlayMusic() {
		if (prefersQuiet()) {
			return false;
		}
		if (window.GallerySettings) {
			if (!GallerySettings.isSoundEnabled()) {
				return false;
			}
			if (
				GallerySettings.isSlideshowMusicEnabled &&
				!GallerySettings.isSlideshowMusicEnabled()
			) {
				return false;
			}
		}
		return true;
	}

	function playSpark() {
		if (!active || !nodes || !ctx) {
			return;
		}
		var c = ctx;
		var t = c.currentTime;
		var sparkGain = c.createGain();
		sparkGain.gain.setValueAtTime(0.0001, t);
		sparkGain.gain.linearRampToValueAtTime(0.09 + Math.random() * 0.06, t + 0.003);
		sparkGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08 + Math.random() * 0.05);
		sparkGain.connect(nodes.master);

		var zap = c.createOscillator();
		zap.type = "sawtooth";
		var startF = 2200 + Math.random() * 3600;
		zap.frequency.setValueAtTime(startF, t);
		zap.frequency.exponentialRampToValueAtTime(180 + Math.random() * 260, t + 0.06);
		zap.connect(sparkGain);
		zap.start(t);
		zap.stop(t + 0.12);

		var crackle = c.createBufferSource();
		crackle.buffer = makeNoiseBuffer(c, 0.08);
		var crackFilter = c.createBiquadFilter();
		crackFilter.type = "highpass";
		crackFilter.frequency.value = 1800;
		crackle.connect(crackFilter);
		crackFilter.connect(sparkGain);
		crackle.start(t);
		crackle.stop(t + 0.1);
	}

	function scheduleSparks() {
		clearInterval(sparkTimer);
		sparkTimer = setInterval(function () {
			if (!active) {
				return;
			}
			playSpark();
			if (Math.random() > 0.45) {
				setTimeout(playSpark, 40 + Math.floor(Math.random() * 60));
			}
		}, 90 + Math.floor(Math.random() * 180));
	}

	function startElectricalHum() {
		if (window.GallerySettings && !GallerySettings.isSoundEnabled()) {
			return;
		}
		if (prefersQuiet() || active) {
			return;
		}
		var c = getContext();
		if (!c) {
			return;
		}
		if (c.state === "suspended" && c.resume) {
			c.resume();
		}

		stopElectricalHum();
		active = true;

		var t0 = c.currentTime;
		var master = c.createGain();
		master.gain.setValueAtTime(0.0001, t0);
		master.gain.linearRampToValueAtTime(0.15, t0 + 0.12);
		master.connect(c.destination);

		var humMix = c.createGain();
		humMix.gain.value = 0.72;
		humMix.connect(master);

		var buzz = c.createOscillator();
		buzz.type = "sawtooth";
		buzz.frequency.setValueAtTime(62, t0);
		var buzzGain = c.createGain();
		buzzGain.gain.value = 0.22;
		buzz.connect(buzzGain);
		buzzGain.connect(humMix);

		var hum2 = c.createOscillator();
		hum2.type = "square";
		hum2.frequency.setValueAtTime(124, t0);
		var hum2Gain = c.createGain();
		hum2Gain.gain.value = 0.1;
		hum2.connect(hum2Gain);
		hum2Gain.connect(humMix);

		var arc = c.createOscillator();
		arc.type = "triangle";
		arc.frequency.setValueAtTime(248, t0);
		arc.frequency.linearRampToValueAtTime(272, t0 + 1.5);
		var arcGain = c.createGain();
		arcGain.gain.value = 0.08;
		arc.connect(arcGain);
		arcGain.connect(humMix);

		var sub = c.createOscillator();
		sub.type = "sine";
		sub.frequency.setValueAtTime(42, t0);
		var subGain = c.createGain();
		subGain.gain.value = 0.12;
		sub.connect(subGain);
		subGain.connect(humMix);

		var noise = c.createBufferSource();
		noise.buffer = makeNoiseBuffer(c, 2);
		noise.loop = true;
		var noiseFilter = c.createBiquadFilter();
		noiseFilter.type = "bandpass";
		noiseFilter.frequency.value = 4200;
		noiseFilter.Q.value = 2.2;
		var noiseGain = c.createGain();
		noiseGain.gain.value = 0.22;
		noise.connect(noiseFilter);
		noiseFilter.connect(noiseGain);
		noiseGain.connect(master);

		var crackle = c.createBufferSource();
		crackle.buffer = makeNoiseBuffer(c, 1.5);
		crackle.loop = true;
		var crackleFilter = c.createBiquadFilter();
		crackleFilter.type = "highpass";
		crackleFilter.frequency.value = 5200;
		var crackleGain = c.createGain();
		crackleGain.gain.value = 0.08;
		crackle.connect(crackleFilter);
		crackleFilter.connect(crackleGain);
		crackleGain.connect(master);

		var lfo = c.createOscillator();
		lfo.type = "sine";
		lfo.frequency.value = 14;
		var lfoDepth = c.createGain();
		lfoDepth.gain.value = 0.085;
		lfo.connect(lfoDepth);
		lfoDepth.connect(noiseGain.gain);

		var lfo2 = c.createOscillator();
		lfo2.type = "sine";
		lfo2.frequency.value = 23;
		var lfo2Depth = c.createGain();
		lfo2Depth.gain.value = 0.04;
		lfo2.connect(lfo2Depth);
		lfo2Depth.connect(crackleGain.gain);

		var wobble = c.createOscillator();
		wobble.type = "sine";
		wobble.frequency.value = 0.55;
		var wobbleDepth = c.createGain();
		wobbleDepth.gain.value = 0.045;
		wobble.connect(wobbleDepth);
		wobbleDepth.connect(buzz.frequency);

		buzz.start(t0);
		hum2.start(t0);
		arc.start(t0);
		sub.start(t0);
		noise.start(t0);
		crackle.start(t0);
		lfo.start(t0);
		lfo2.start(t0);
		wobble.start(t0);

		nodes = {
			master: master,
			oscillators: [buzz, hum2, arc, sub, lfo, lfo2, wobble],
			sources: [noise, crackle]
		};

		scheduleSparks();
		playSpark();
		setTimeout(playSpark, 70);
	}

	function stopElectricalHum() {
		clearInterval(sparkTimer);
		sparkTimer = null;

		if (!active || !nodes || !ctx) {
			active = false;
			nodes = null;
			return;
		}

		active = false;
		var c = ctx;
		var t = c.currentTime;
		var master = nodes.master;

		master.gain.cancelScheduledValues(t);
		master.gain.setValueAtTime(master.gain.value, t);
		master.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

		var i;
		for (i = 0; i < nodes.oscillators.length; i++) {
			try {
				nodes.oscillators[i].stop(t + 0.24);
			} catch (e) {}
		}
		for (i = 0; i < nodes.sources.length; i++) {
			try {
				nodes.sources[i].stop(t + 0.24);
			} catch (e) {}
		}

		nodes = null;
	}

	function startSoftMusic() {
		musicRequested = true;
		if (!shouldPlayMusic() || musicActive) {
			return;
		}

		var c = getContext();
		if (!c) {
			return;
		}
		if (c.state === "suspended" && c.resume) {
			c.resume();
		}

		var t0 = c.currentTime;
		var master = c.createGain();
		master.gain.setValueAtTime(0.0001, t0);
		master.gain.linearRampToValueAtTime(0.052, t0 + 1.8);
		master.connect(c.destination);

		var toneFilter = c.createBiquadFilter();
		toneFilter.type = "lowpass";
		toneFilter.frequency.setValueAtTime(1850, t0);
		toneFilter.Q.value = 0.7;

		var airFilter = c.createBiquadFilter();
		airFilter.type = "highpass";
		airFilter.frequency.setValueAtTime(160, t0);

		var delay = c.createDelay(1.2);
		delay.delayTime.setValueAtTime(0.34, t0);
		var delayGain = c.createGain();
		delayGain.gain.setValueAtTime(0.18, t0);
		var feedback = c.createGain();
		feedback.gain.setValueAtTime(0.16, t0);

		toneFilter.connect(airFilter);
		airFilter.connect(master);
		airFilter.connect(delay);
		delay.connect(delayGain);
		delayGain.connect(master);
		delay.connect(feedback);
		feedback.connect(delay);

		var strings = [];
		var timers = [];
		var chordStep = 0;
		var chordProgression = [
			[196, 246.94, 293.66, 392],
			[174.61, 220, 261.63, 329.63],
			[146.83, 196, 246.94, 293.66],
			[164.81, 196, 246.94, 329.63]
		];
		var pattern = [0, 2, 1, 3, 2, 1];

		function pluck(freq, when, level) {
			var voice = c.createGain();
			voice.gain.setValueAtTime(0.0001, when);
			voice.gain.exponentialRampToValueAtTime(level, when + 0.018);
			voice.gain.exponentialRampToValueAtTime(0.0001, when + 1.35);
			voice.connect(toneFilter);

			var osc = c.createOscillator();
			osc.type = "triangle";
			osc.frequency.setValueAtTime(freq, when);
			osc.detune.setValueAtTime(-4 + Math.random() * 8, when);
			osc.connect(voice);

			var bright = c.createOscillator();
			bright.type = "sine";
			bright.frequency.setValueAtTime(freq * 2.01, when);
			var brightGain = c.createGain();
			brightGain.gain.setValueAtTime(level * 0.18, when);
			brightGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
			bright.connect(brightGain);
			brightGain.connect(voice);

			var pick = c.createBufferSource();
			pick.buffer = makeNoiseBuffer(c, 0.04);
			var pickFilter = c.createBiquadFilter();
			pickFilter.type = "bandpass";
			pickFilter.frequency.setValueAtTime(2600 + Math.random() * 700, when);
			pickFilter.Q.value = 2.2;
			var pickGain = c.createGain();
			pickGain.gain.setValueAtTime(level * 0.28, when);
			pickGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.055);
			pick.connect(pickFilter);
			pickFilter.connect(pickGain);
			pickGain.connect(voice);

			osc.start(when);
			bright.start(when);
			pick.start(when);
			osc.stop(when + 1.45);
			bright.stop(when + 0.38);
			pick.stop(when + 0.06);
			strings.push(osc, bright);
			strings.push(pick);
		}

		function scheduleBar() {
			if (!musicActive || !musicNodes) {
				return;
			}
			var now = c.currentTime + 0.08;
			var chord = chordProgression[chordStep % chordProgression.length];
			var beat = 0.58;
			var i;
			for (i = 0; i < pattern.length; i++) {
				var note = chord[pattern[i] % chord.length];
				var octaveLift = i === 3 ? 2 : 1;
				pluck(note * octaveLift, now + i * beat, i === 0 ? 0.23 : 0.16);
			}
			chordStep++;
			timers.push(setTimeout(scheduleBar, Math.floor(pattern.length * beat * 1000)));
		}

		musicActive = true;
		musicNodes = {
			master: master,
			oscillators: [],
			sources: strings,
			timers: timers
		};
		scheduleBar();
	}

	function stopSoftMusic(clearRequest) {
		if (clearRequest !== false) {
			musicRequested = false;
		}
		if (!musicActive || !musicNodes || !ctx) {
			musicActive = false;
			musicNodes = null;
			return;
		}

		musicActive = false;
		var c = ctx;
		var t = c.currentTime;
		var master = musicNodes.master;
		master.gain.cancelScheduledValues(t);
		master.gain.setValueAtTime(master.gain.value, t);
		master.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);

		var i;
		if (musicNodes.timers) {
			for (i = 0; i < musicNodes.timers.length; i++) {
				clearTimeout(musicNodes.timers[i]);
			}
		}
		for (i = 0; i < musicNodes.oscillators.length; i++) {
			try {
				musicNodes.oscillators[i].stop(t + 0.9);
			} catch (e) {}
		}
		for (i = 0; i < musicNodes.sources.length; i++) {
			try {
				musicNodes.sources[i].stop(t + 0.9);
			} catch (e) {}
		}
		musicNodes = null;
	}

	function syncSoftMusic() {
		if (musicRequested) {
			startSoftMusic();
		} else {
			stopSoftMusic();
		}
	}

	return {
		unlock: unlock,
		startElectricalHum: startElectricalHum,
		stopElectricalHum: stopElectricalHum,
		startSoftMusic: startSoftMusic,
		stopSoftMusic: stopSoftMusic,
		syncSoftMusic: syncSoftMusic
	};
})();

window.initGallerySlideshow = function (config) {
	var IMAGE_DIR = config.imageDir;
	var images = config.images;
	var AUTOPLAY_MS = 4500;
	var INITIAL_AUTOPLAY_MS = 1500;
	var TRANSITION_MS = 600;
	var SLIDE_RATIO = 0.34;
	var GAP_RATIO = 0.018;
	var ALIGN_RATIO = 0.34;

	var index = 0;
	var playing = true;
	var autoplayTimer = null;
	var touchStartX = 0;
	var isAnimating = false;
	var transitionFallback = null;
	var slides = [];
	var hideHoverPreview = function () {};

	var stage = document.getElementById("slideshow-stage");
	var frame = document.getElementById("slideshow-frame");
	var track = document.getElementById("carousel-track");
	var dots = document.getElementById("carousel-dots");
	var counter = document.getElementById("slide-counter");
	var thumbs = document.getElementById("slideshow-thumbs");
	var btnPlayPause = document.getElementById("btn-playpause");

	function setupGalleryNav(nav) {
		if (!nav || (!nav.prev && !nav.next)) return;
		var header = document.querySelector(".slideshow-header");
		if (!header) return;

		var el = document.createElement("nav");
		el.className = "gallery-chain-nav";
		el.setAttribute("aria-label", "Browse galleries");

		if (nav.prev) {
			var prevLink = document.createElement("a");
			prevLink.href = nav.prev.href;
			prevLink.className = "gallery-chain-link gallery-chain-link--prev";
			prevLink.textContent = "\u2039 " + nav.prev.label;
			el.appendChild(prevLink);
		}

		if (nav.prev && nav.next) {
			var sep = document.createElement("span");
			sep.className = "gallery-chain-sep";
			sep.setAttribute("aria-hidden", "true");
			sep.textContent = "|";
			el.appendChild(sep);
		}

		if (nav.next) {
			var nextLink = document.createElement("a");
			nextLink.href = nav.next.href;
			nextLink.className = "gallery-chain-link gallery-chain-link--next";
			nextLink.textContent = nav.next.label + " \u203a";
			el.appendChild(nextLink);
		}

		header.insertAdjacentElement("afterend", el);
	}

	function src(file) {
		var base = /^(?:\.\.?\/|\/|[a-z]+:)/i.test(file) ? "" : IMAGE_DIR;
		return base + encodeURIComponent(file).replace(/%2F/g, "/");
	}

	function label(file) {
		return file.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
	}

	function metrics() {
		var frameW = frame.clientWidth;
		var slideW = Math.round(frameW * SLIDE_RATIO);
		var gap = Math.round(frameW * GAP_RATIO);
		return { frameW: frameW, slideW: slideW, gap: gap };
	}

	function applyLayout() {
		var m = metrics();
		slides.forEach(function (slide) {
			slide.style.width = m.slideW + "px";
			slide.style.flexBasis = m.slideW + "px";
		});
		track.style.gap = m.gap + "px";
		return m;
	}

	function relPos(i, center) {
		var n = images.length;
		var d = i - center;
		if (d > n / 2) d -= n;
		if (d < -n / 2) d += n;
		return d;
	}

	function applySlideClasses(centerIndex) {
		slides.forEach(function (slide, i) {
			slide.classList.remove(
				"is-active",
				"is-prev",
				"is-next",
				"is-follow-2",
				"is-follow-3",
				"is-before-2",
				"is-far",
				"is-far-left",
				"is-far-right",
				"is-approaching",
				"from-left",
				"from-right"
			);

			var r = relPos(i, centerIndex);
			if (r === 0) {
				slide.classList.add("is-active");
			} else if (r === -1) {
				slide.classList.add("is-prev");
			} else if (r === 1) {
				slide.classList.add("is-next");
			} else if (r === 2) {
				slide.classList.add("is-follow-2");
			} else if (r === 3) {
				slide.classList.add("is-follow-3");
			} else if (r === -2) {
				slide.classList.add("is-before-2");
			} else if (r <= -3) {
				slide.classList.add("is-far", "is-far-left");
			} else if (r >= 4) {
				slide.classList.add("is-far", "is-far-right");
			}
		});
	}

	function buildCarousel() {
		images.forEach(function (file, i) {
			var slide = document.createElement("div");
			slide.className = "carousel-slide";
			slide.setAttribute("role", "group");
			slide.setAttribute("aria-roledescription", "slide");
			slide.setAttribute("aria-label", (i + 1) + " of " + images.length);

			var media = document.createElement("div");
			media.className = "slide-media";

			var img = document.createElement("img");
			img.src = src(file);
			img.alt = label(file);
			img.loading = i < 6 ? "eager" : "lazy";
			img.decoding = "async";
			img.draggable = false;

			var caption = document.createElement("div");
			caption.className = "slideshow-caption";
			caption.textContent = label(file);

			media.appendChild(img);
			media.appendChild(caption);
			slide.appendChild(media);
			track.appendChild(slide);
			slides.push(slide);

			var dot = document.createElement("button");
			dot.type = "button";
			dot.className = "dot";
			dot.setAttribute("aria-label", "Go to slide " + (i + 1));
			dot.dataset.index = String(i);
			dots.appendChild(dot);

			var thumb = document.createElement("button");
			thumb.type = "button";
			thumb.className = "thumb";
			thumb.setAttribute("aria-label", "Go to slide " + (i + 1));
			thumb.dataset.index = String(i);

			var thumbImg = document.createElement("img");
			thumbImg.src = src(file);
			thumbImg.alt = "";
			thumbImg.decoding = "async";
			thumbImg.draggable = false;
			thumb.appendChild(thumbImg);
			thumbs.appendChild(thumb);
		});
	}

	function trackOffsetFor(slideIndex, m) {
		return m.frameW * ALIGN_RATIO - slideIndex * (m.slideW + m.gap) - m.slideW / 2;
	}

	function setTrackPosition(animate, relayout, slideIndex) {
		var m = relayout !== false ? applyLayout() : metrics();
		var targetIndex = slideIndex != null ? slideIndex : index;
		var offset = trackOffsetFor(targetIndex, m);

		if (!animate) {
			track.classList.add("no-transition");
		}
		track.style.transform = "translate3d(" + offset + "px, 0, 0)";

		if (!animate) {
			track.offsetHeight;
			track.classList.remove("no-transition");
		}

		return m;
	}

	function updateSlideStates() {
		applySlideClasses(index);
	}

	function updateChrome(scrollThumb) {
		var dotBtns = dots.querySelectorAll(".dot");
		var thumbBtns = thumbs.querySelectorAll(".thumb");

		dotBtns.forEach(function (btn, i) {
			btn.classList.toggle("is-active", i === index);
		});
		thumbBtns.forEach(function (btn, i) {
			btn.classList.toggle("is-active", i === index);
			if (scrollThumb && i === index) {
				btn.scrollIntoView({ block: "nearest", inline: "center" });
			}
		});
		counter.textContent = index + 1 + " / " + images.length;
	}

	function updateUI(animate, scrollThumb) {
		track.classList.remove("is-moving");
		setTrackPosition(animate !== false, true);
		updateSlideStates();
		updateChrome(scrollThumb);
	}

	function clearTransitionWatch() {
		track.removeEventListener("transitionend", onTrackTransitionEnd);
		clearTimeout(transitionFallback);
		transitionFallback = null;
	}

	function finishTransition() {
		if (!isAnimating) return;
		clearTransitionWatch();
		isAnimating = false;
		track.classList.remove("is-moving");
		updateSlideStates();
		scheduleAutoplay();
	}

	function isTransformProperty(name) {
		return !name || name === "transform" || name.indexOf("transform") !== -1;
	}

	function onTrackTransitionEnd(e) {
		if (e.target !== track) return;
		if (!isTransformProperty(e.propertyName)) return;
		finishTransition();
	}

	function beginTransition() {
		hideHoverPreview();
		clearTransitionWatch();
		isAnimating = true;
		track.classList.add("is-moving");
		track.addEventListener("transitionend", onTrackTransitionEnd);
		transitionFallback = setTimeout(finishTransition, TRANSITION_MS);
	}

	function goTo(i, fromUser) {
		var newIndex = (i + images.length) % images.length;
		if (newIndex === index && !isAnimating) return;

		if (isAnimating) {
			finishTransition();
		}

		clearAutoplayTimers();
		var previousIndex = index;
		index = newIndex;
		updateChrome(fromUser);
		beginTransition();

		track.classList.add("no-transition");
		setTrackPosition(false, false, previousIndex);
		track.offsetHeight;
		track.classList.remove("no-transition");
		setTrackPosition(true, false, newIndex);
	}

	function next(fromUser) {
		goTo(index + 1, fromUser);
	}

	function prev(fromUser) {
		goTo(index - 1, fromUser);
	}

	function goToInstant(newIndex) {
		clearTransitionWatch();
		isAnimating = false;
		track.classList.remove("is-moving");
		index = (newIndex + images.length) % images.length;
		updateUI(false, false);
	}

	function clearAutoplayTimers() {
		clearTimeout(autoplayTimer);
		autoplayTimer = null;
	}

	function scheduleAutoplay(delay) {
		if (!playing || isAnimating) return;
		clearAutoplayTimers();
		autoplayTimer = setTimeout(function () {
			next(false);
		}, delay != null ? delay : AUTOPLAY_MS);
	}

	function startAutoplay(shortFirstDelay) {
		playing = true;
		btnPlayPause.classList.remove("is-paused");
		btnPlayPause.setAttribute("aria-label", "Pause slideshow");
		btnPlayPause.textContent = "❚❚";
		if (window.SlideshowSounds) {
			SlideshowSounds.startSoftMusic();
		}
		scheduleAutoplay(shortFirstDelay ? INITIAL_AUTOPLAY_MS : AUTOPLAY_MS);
	}

	function stopAutoplay() {
		playing = false;
		clearAutoplayTimers();
		if (window.SlideshowSounds) {
			SlideshowSounds.stopSoftMusic();
		}
		btnPlayPause.classList.add("is-paused");
		btnPlayPause.setAttribute("aria-label", "Play slideshow");
		btnPlayPause.textContent = "▶";
	}

	function toggleAutoplay() {
		if (playing) {
			stopAutoplay();
		} else {
			startAutoplay(false);
		}
	}

	function setupHoverPreview() {
		var preview = document.createElement("div");
		preview.id = "slide-hover-preview";
		preview.className = "slide-hover-preview";
		preview.setAttribute("aria-hidden", "true");

		var frame = document.createElement("div");
		frame.className = "slide-hover-preview__frame";

		var inner = document.createElement("div");
		inner.className = "slide-hover-preview__inner";

		var previewImg = document.createElement("img");
		previewImg.alt = "";

		var previewCaption = document.createElement("div");
		previewCaption.className = "slide-hover-preview__caption";

		inner.appendChild(previewImg);
		frame.appendChild(inner);
		frame.appendChild(previewCaption);
		preview.appendChild(frame);
		document.body.appendChild(preview);

		var hideTimer = null;
		var currentMedia = null;

		function showPreview(media) {
			var img = media.querySelector("img");
			var captionEl = media.querySelector(".slideshow-caption");
			if (!img || !img.src) {
				return;
			}
			currentMedia = media;
			previewImg.src = img.src;
			previewImg.alt = img.alt || "";
			previewCaption.textContent = captionEl ? captionEl.textContent : "";
			preview.classList.add("is-visible");
			preview.setAttribute("aria-hidden", "false");
			if (window.SlideshowSounds) {
				SlideshowSounds.unlock();
				SlideshowSounds.startElectricalHum();
			}
		}

		function hidePreview() {
			currentMedia = null;
			clearTimeout(hideTimer);
			preview.classList.remove("is-visible");
			preview.setAttribute("aria-hidden", "true");
			if (window.SlideshowSounds) {
				SlideshowSounds.stopElectricalHum();
			}
		}

		hideHoverPreview = hidePreview;

		track.addEventListener("mouseover", function (e) {
			if (isAnimating) {
				return;
			}
			var media = e.target.closest ? e.target.closest(".slide-media") : null;
			if (!media || !track.contains(media)) {
				return;
			}
			if (media === currentMedia) {
				return;
			}
			clearTimeout(hideTimer);
			showPreview(media);
		});

		track.addEventListener("mouseout", function (e) {
			var media = e.target.closest ? e.target.closest(".slide-media") : null;
			if (!media || media !== currentMedia) {
				return;
			}
			var related = e.relatedTarget;
			if (related && (media.contains(related) || preview.contains(related))) {
				return;
			}
			hideTimer = setTimeout(hidePreview, 50);
		});

		stage.addEventListener("mouseleave", function (e) {
			var related = e.relatedTarget;
			if (related && (stage.contains(related) || preview.contains(related))) {
				return;
			}
			hidePreview();
		});
	}

	setupGalleryNav(config.galleryNav);
	buildCarousel();
	setupHoverPreview();

	requestAnimationFrame(function () {
		var start = new URLSearchParams(window.location.search).get("start");
		if (start) {
			var found = images.indexOf(start);
			if (found >= 0) goToInstant(found);
		}
		updateUI(false, false);
		startAutoplay(true);
	});

	window.addEventListener("resize", function () {
		if (isAnimating) finishTransition();
		updateUI(false, false);
	});

	document.getElementById("btn-prev").addEventListener("click", function () {
		prev(true);
	});
	document.getElementById("btn-next").addEventListener("click", function () {
		next(true);
	});
	btnPlayPause.addEventListener("click", toggleAutoplay);
	document.addEventListener(
		"pointerdown",
		function () {
			if (!window.SlideshowSounds) return;
			SlideshowSounds.unlock();
			if (playing) {
				SlideshowSounds.startSoftMusic();
			}
		},
		{ passive: true }
	);

	dots.addEventListener("click", function (e) {
		var btn = e.target.closest(".dot");
		if (!btn) return;
		goTo(parseInt(btn.dataset.index, 10), true);
	});

	thumbs.addEventListener("click", function (e) {
		var btn = e.target.closest(".thumb");
		if (!btn) return;
		goTo(parseInt(btn.dataset.index, 10), true);
	});

	document.addEventListener("keydown", function (e) {
		if (e.key === "ArrowRight") next(true);
		else if (e.key === "ArrowLeft") prev(true);
		else if (e.key === " ") {
			e.preventDefault();
			toggleAutoplay();
		}
	});

	stage.addEventListener("mouseenter", clearAutoplayTimers);
	stage.addEventListener("mouseleave", function () {
		if (playing) scheduleAutoplay();
	});

	stage.addEventListener(
		"touchstart",
		function (e) {
			touchStartX = e.changedTouches[0].screenX;
		},
		{ passive: true }
	);

	stage.addEventListener(
		"touchend",
		function (e) {
			var dx = e.changedTouches[0].screenX - touchStartX;
			if (Math.abs(dx) < 50) return;
			if (dx < 0) next(true);
			else prev(true);
		},
		{ passive: true }
	);

	document.addEventListener("visibilitychange", function () {
		if (document.hidden) {
			clearAutoplayTimers();
			if (window.SlideshowSounds) {
				SlideshowSounds.stopSoftMusic(false);
			}
		} else if (playing) {
			scheduleAutoplay();
			if (window.SlideshowSounds) {
				SlideshowSounds.startSoftMusic();
			}
		}
	});
};
