/**
 * Procedural sliding-door hover sound (Web Audio). No DOM hooks — safe for menu clicks.
 */
var GallerySounds = (function () {
	var ctx = null;
	var unlocked = false;
	var lastPanelPlay = 0;
	var lastTabPlay = 0;
	var lastPreviewPlay = 0;
	var minPanelGapMs = 400;
	var minTabGapMs = 160;
	var minPreviewGapMs = 220;
	var panelVolume = 0.09;
	var tabVolume = 0.075;
	var previewVolume = 0.14;

	function prefersQuiet() {
		if (window.matchMedia) {
			return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
		if (!c || unlocked) {
			return;
		}
		if (c.state === 'suspended' && c.resume) {
			c.resume();
		}
		unlocked = true;
	}

	function makeNoiseBuffer(c, seconds) {
		var len = Math.floor(c.sampleRate * seconds);
		var buf = c.createBuffer(1, len, c.sampleRate);
		var data = buf.getChannelData(0);
		var last = 0;
		var i;
		for (i = 0; i < len; i++) {
			var white = Math.random() * 2 - 1;
			last = last * 0.92 + white * 0.08;
			data[i] = last;
		}
		return buf;
	}

	function playPanelSlide() {
		if (window.GallerySettings && !GallerySettings.isSoundEnabled()) {
			return;
		}
		if (prefersQuiet()) {
			return;
		}
		var now = new Date().getTime();
		if (now - lastPanelPlay < minPanelGapMs) {
			return;
		}
		lastPanelPlay = now;

		var c = getContext();
		if (!c) {
			return;
		}
		if (c.state === 'suspended' && c.resume) {
			c.resume();
		}

		var t0 = c.currentTime;
		var dur = 0.44;
		var slideEnd = t0 + dur * 0.82;

		var master = c.createGain();
		master.gain.setValueAtTime(0.0001, t0);
		master.gain.linearRampToValueAtTime(panelVolume, t0 + 0.02);
		master.gain.setValueAtTime(panelVolume * 0.85, slideEnd);
		master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
		master.connect(c.destination);

		// Track rumble — door mass on rails
		var rumble = c.createOscillator();
		rumble.type = 'triangle';
		rumble.frequency.setValueAtTime(68, t0);
		rumble.frequency.linearRampToValueAtTime(52, slideEnd);
		var rumbleGain = c.createGain();
		rumbleGain.gain.setValueAtTime(0.0001, t0);
		rumbleGain.gain.linearRampToValueAtTime(0.42, t0 + 0.04);
		rumbleGain.gain.setValueAtTime(0.38, slideEnd);
		rumbleGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
		rumble.connect(rumbleGain);
		rumbleGain.connect(master);

		// Friction scrape — bandpass sweeps along the slide
		var scrapeSrc = c.createBufferSource();
		scrapeSrc.buffer = makeNoiseBuffer(c, dur + 0.05);
		scrapeSrc.loop = false;
		var scrapeFilter = c.createBiquadFilter();
		scrapeFilter.type = 'bandpass';
		scrapeFilter.Q.setValueAtTime(0.65, t0);
		scrapeFilter.frequency.setValueAtTime(220, t0);
		scrapeFilter.frequency.linearRampToValueAtTime(780, t0 + dur * 0.55);
		scrapeFilter.frequency.linearRampToValueAtTime(340, slideEnd);
		var scrapeGain = c.createGain();
		scrapeGain.gain.setValueAtTime(0.0001, t0);
		scrapeGain.gain.linearRampToValueAtTime(0.7, t0 + 0.06);
		scrapeGain.gain.setValueAtTime(0.55, slideEnd);
		scrapeGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.95);
		scrapeSrc.connect(scrapeFilter);
		scrapeFilter.connect(scrapeGain);
		scrapeGain.connect(master);

		// Low scrape body
		var bodySrc = c.createBufferSource();
		bodySrc.buffer = makeNoiseBuffer(c, dur);
		var bodyFilter = c.createBiquadFilter();
		bodyFilter.type = 'lowpass';
		bodyFilter.frequency.setValueAtTime(420, t0);
		bodyFilter.frequency.linearRampToValueAtTime(260, slideEnd);
		var bodyGain = c.createGain();
		bodyGain.gain.setValueAtTime(0.0001, t0);
		bodyGain.gain.linearRampToValueAtTime(0.35, t0 + 0.05);
		bodyGain.gain.exponentialRampToValueAtTime(0.0001, slideEnd);
		bodySrc.connect(bodyFilter);
		bodyFilter.connect(bodyGain);
		bodyGain.connect(master);

		// Opening puff / air seal at start
		var puffSrc = c.createBufferSource();
		puffSrc.buffer = makeNoiseBuffer(c, 0.12);
		var puffFilter = c.createBiquadFilter();
		puffFilter.type = 'highpass';
		puffFilter.frequency.setValueAtTime(900, t0);
		var puffGain = c.createGain();
		puffGain.gain.setValueAtTime(0.0001, t0);
		puffGain.gain.linearRampToValueAtTime(0.22, t0 + 0.012);
		puffGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
		puffSrc.connect(puffFilter);
		puffFilter.connect(puffGain);
		puffGain.connect(master);

		// Start thunk — door engages
		var thunk = c.createOscillator();
		thunk.type = 'sine';
		thunk.frequency.setValueAtTime(165, t0);
		thunk.frequency.exponentialRampToValueAtTime(72, t0 + 0.07);
		var thunkGain = c.createGain();
		thunkGain.gain.setValueAtTime(0.0001, t0);
		thunkGain.gain.linearRampToValueAtTime(0.28, t0 + 0.006);
		thunkGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
		thunk.connect(thunkGain);
		thunkGain.connect(master);

		// End latch — door seats
		var latchT = t0 + dur * 0.86;
		var latch = c.createOscillator();
		latch.type = 'square';
		latch.frequency.setValueAtTime(380, latchT);
		latch.frequency.exponentialRampToValueAtTime(210, latchT + 0.04);
		var latchGain = c.createGain();
		latchGain.gain.setValueAtTime(0.0001, latchT);
		latchGain.gain.linearRampToValueAtTime(0.12, latchT + 0.004);
		latchGain.gain.exponentialRampToValueAtTime(0.0001, latchT + 0.055);
		var latchFilter = c.createBiquadFilter();
		latchFilter.type = 'lowpass';
		latchFilter.frequency.value = 1200;
		latch.connect(latchFilter);
		latchFilter.connect(latchGain);
		latchGain.connect(master);

		rumble.start(t0);
		rumble.stop(t0 + dur);
		scrapeSrc.start(t0);
		scrapeSrc.stop(t0 + dur);
		bodySrc.start(t0);
		bodySrc.stop(slideEnd);
		puffSrc.start(t0);
		puffSrc.stop(t0 + 0.12);
		thunk.start(t0);
		thunk.stop(t0 + 0.1);
		latch.start(latchT);
		latch.stop(latchT + 0.06);
	}

	function playMysticalChime(config) {
		var c = getContext();
		if (!c) {
			return;
		}
		if (c.state === 'suspended' && c.resume) {
			c.resume();
		}

		var t0 = c.currentTime;
		var dur = config.duration;
		var vol = config.volume;
		var chimeFreqs = config.chimeFreqs;
		var chimeDelays = config.chimeDelays;
		var chimeVols = config.chimeVols;
		var bellDecay = config.bellDecay;
		var shimmerEnd = config.shimmerEnd;
		var pingEnd = config.pingEnd;
		var padLevel = config.padLevel;
		var shimmerLevel = config.shimmerLevel;
		var pingLevel = config.pingLevel;
		var ci;

		var master = c.createGain();
		master.gain.setValueAtTime(0.0001, t0);
		master.gain.linearRampToValueAtTime(vol, t0 + 0.015);
		master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
		master.connect(c.destination);

		var pad = c.createOscillator();
		pad.type = 'sine';
		pad.frequency.setValueAtTime(196, t0);
		pad.frequency.linearRampToValueAtTime(207.65, t0 + dur * 0.55);
		var padGain = c.createGain();
		padGain.gain.setValueAtTime(0.0001, t0);
		padGain.gain.linearRampToValueAtTime(padLevel, t0 + 0.08);
		padGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.9);
		pad.connect(padGain);
		padGain.connect(master);

		for (ci = 0; ci < chimeFreqs.length; ci++) {
			var ct = t0 + chimeDelays[ci];
			var base = chimeFreqs[ci];
			var decay = bellDecay - ci * 0.05;

			var bell = c.createOscillator();
			bell.type = 'sine';
			bell.frequency.setValueAtTime(base, ct);
			bell.frequency.exponentialRampToValueAtTime(base * 1.002, ct + 0.1);

			var detune = c.createOscillator();
			detune.type = 'triangle';
			detune.frequency.setValueAtTime(base * 1.007, ct);

			var bellGain = c.createGain();
			bellGain.gain.setValueAtTime(0.0001, ct);
			bellGain.gain.linearRampToValueAtTime(chimeVols[ci], ct + 0.008);
			bellGain.gain.exponentialRampToValueAtTime(0.0001, ct + decay);

			var detuneGain = c.createGain();
			detuneGain.gain.setValueAtTime(0.0001, ct);
			detuneGain.gain.linearRampToValueAtTime(chimeVols[ci] * 0.35, ct + 0.01);
			detuneGain.gain.exponentialRampToValueAtTime(0.0001, ct + decay * 0.85);

			bell.connect(bellGain);
			detune.connect(detuneGain);
			bellGain.connect(master);
			detuneGain.connect(master);

			bell.start(ct);
			bell.stop(ct + decay + 0.08);
			detune.start(ct);
			detune.stop(ct + decay);
		}

		var shimmer = c.createBufferSource();
		shimmer.buffer = makeNoiseBuffer(c, shimmerEnd);
		var shimmerFilter = c.createBiquadFilter();
		shimmerFilter.type = 'bandpass';
		shimmerFilter.frequency.setValueAtTime(2200, t0 + 0.05);
		shimmerFilter.frequency.exponentialRampToValueAtTime(5600, t0 + shimmerEnd * 0.65);
		shimmerFilter.Q.value = 2.5;
		var shimmerGain = c.createGain();
		shimmerGain.gain.setValueAtTime(0.0001, t0 + 0.05);
		shimmerGain.gain.linearRampToValueAtTime(shimmerLevel, t0 + 0.14);
		shimmerGain.gain.exponentialRampToValueAtTime(0.0001, t0 + shimmerEnd);
		shimmer.connect(shimmerFilter);
		shimmerFilter.connect(shimmerGain);
		shimmerGain.connect(master);

		var ping = c.createOscillator();
		ping.type = 'sine';
		ping.frequency.setValueAtTime(880, t0);
		ping.frequency.exponentialRampToValueAtTime(1760, t0 + pingEnd * 0.45);
		var pingGain = c.createGain();
		pingGain.gain.setValueAtTime(0.0001, t0);
		pingGain.gain.linearRampToValueAtTime(pingLevel, t0 + 0.02);
		pingGain.gain.exponentialRampToValueAtTime(0.0001, t0 + pingEnd);
		ping.connect(pingGain);
		pingGain.connect(master);

		pad.start(t0);
		pad.stop(t0 + dur);
		shimmer.start(t0 + 0.05);
		shimmer.stop(t0 + shimmerEnd);
		ping.start(t0);
		ping.stop(t0 + pingEnd);
	}

	function playTabMystical() {
		if (window.GallerySettings && !GallerySettings.isSoundEnabled()) {
			return;
		}
		if (prefersQuiet()) {
			return;
		}
		var now = new Date().getTime();
		if (now - lastTabPlay < minTabGapMs) {
			return;
		}
		lastTabPlay = now;

		playMysticalChime({
			volume: tabVolume,
			duration: 0.72,
			chimeFreqs: [392, 493.88, 587.33, 783.99],
			chimeDelays: [0, 0.045, 0.09, 0.16],
			chimeVols: [0.35, 0.42, 0.38, 0.28],
			bellDecay: 0.55,
			shimmerEnd: 0.55,
			pingEnd: 0.4,
			padLevel: 0.2,
			shimmerLevel: 0.18,
			pingLevel: 0.15
		});
	}

	function playPreviewMystical() {
		if (window.GallerySettings && !GallerySettings.isSoundEnabled()) {
			return;
		}
		if (prefersQuiet()) {
			return;
		}
		var now = new Date().getTime();
		if (now - lastPreviewPlay < minPreviewGapMs) {
			return;
		}
		lastPreviewPlay = now;

		playMysticalChime({
			volume: previewVolume,
			duration: 1.25,
			chimeFreqs: [392, 493.88, 587.33, 783.99, 987.77],
			chimeDelays: [0, 0.07, 0.14, 0.26, 0.4],
			chimeVols: [0.42, 0.5, 0.48, 0.4, 0.34],
			bellDecay: 0.95,
			shimmerEnd: 0.95,
			pingEnd: 0.62,
			padLevel: 0.32,
			shimmerLevel: 0.28,
			pingLevel: 0.24
		});
	}

	return {
		unlock: unlock,
		playPanelSlide: playPanelSlide,
		playTabMystical: playTabMystical,
		playPreviewMystical: playPreviewMystical
	};
}());
