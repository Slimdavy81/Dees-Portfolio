/**
 * Gallery preferences (localStorage). Quiet mode: no sound + subtle slideshow glow.
 */
var GallerySettings = (function () {
	var KEY_QUIET = "gallery-quiet-mode";
	var KEY_THEME = "gallery-neon-theme";
	var KEY_HINT_DISMISSED = "gallery-settings-hint-dismissed";
	var KEY_SLIDESHOW_MUSIC = "gallery-slideshow-music";

	function isQuiet() {
		try {
			return localStorage.getItem(KEY_QUIET) === "1";
		} catch (e) {
			return false;
		}
	}

	function setQuiet(on) {
		try {
			localStorage.setItem(KEY_QUIET, on ? "1" : "0");
		} catch (e) {}
		apply();
	}

	function isSlideshowMusicEnabled() {
		try {
			return localStorage.getItem(KEY_SLIDESHOW_MUSIC) !== "0";
		} catch (e) {
			return true;
		}
	}

	function setSlideshowMusic(on) {
		try {
			localStorage.setItem(KEY_SLIDESHOW_MUSIC, on ? "1" : "0");
		} catch (e) {}
		apply();
	}

	function getTheme() {
		try {
			var t = localStorage.getItem(KEY_THEME);
			if (
				t === "blue" ||
				t === "green" ||
				t === "default" ||
				t === "synthwave" ||
				t === "future" ||
				t === "portfolio"
			) {
				return t === "default" ? "synthwave" : t;
			}
		} catch (e) {}
		if (document.body && !document.body.classList.contains("gallery-index")) {
			return "portfolio";
		}
		return "default";
	}

	function setTheme(theme) {
		if (theme === "default") {
			theme = "synthwave";
		}

		try {
			localStorage.setItem(KEY_THEME, theme);
		} catch (e) {}
		apply();
	}

	function isSoundEnabled() {
		return !isQuiet();
	}

	function getGlowMode() {
		return isQuiet() ? "subtle" : "intense";
	}

	function apply() {
		var html = document.documentElement;
		var quiet = isQuiet();
		var theme = getTheme();
		html.setAttribute("data-quiet", quiet ? "1" : "0");
		html.setAttribute("data-glow", getGlowMode());
		html.setAttribute("data-neon-theme", theme);
		if (quiet && window.SlideshowSounds && SlideshowSounds.stopElectricalHum) {
			SlideshowSounds.stopElectricalHum();
		}
		if (
			(quiet || !isSlideshowMusicEnabled()) &&
			window.SlideshowSounds &&
			SlideshowSounds.stopSoftMusic
		) {
			SlideshowSounds.stopSoftMusic();
		}
		if (
			!quiet &&
			isSlideshowMusicEnabled() &&
			window.SlideshowSounds &&
			SlideshowSounds.syncSoftMusic
		) {
			SlideshowSounds.syncSoftMusic();
		}
		syncPanelUI();
	}

	function syncPanelUI() {
		var panel = document.getElementById("gallery-settings-panel");
		if (!panel) {
			return;
		}
		var quietBtn = document.getElementById("settings-quiet-toggle");
		var musicBtn = document.getElementById("settings-music-toggle");
		var themeInputs = panel.querySelectorAll('input[name="neon-theme"]');
		var i;

		if (quietBtn) {
			var on = isQuiet();
			quietBtn.setAttribute("aria-pressed", on ? "true" : "false");
			quietBtn.textContent = on ? "Quiet mode: ON" : "Quiet mode: OFF";
			quietBtn.classList.toggle("is-active", on);
		}

		if (musicBtn) {
			var musicOn = isSlideshowMusicEnabled();
			musicBtn.setAttribute("aria-pressed", musicOn ? "true" : "false");
			musicBtn.textContent = musicOn ? "Slideshow music: ON" : "Slideshow music: OFF";
			musicBtn.classList.toggle("is-active", musicOn);
		}

		for (i = 0; i < themeInputs.length; i++) {
			themeInputs[i].checked = themeInputs[i].value === getTheme();
		}
	}

	function isHintDismissed() {
		try {
			return localStorage.getItem(KEY_HINT_DISMISSED) === "1";
		} catch (e) {
			return false;
		}
	}

	function dismissSettingsHint(tab) {
		var hint = document.getElementById("settings-hint");
		if (!hint) {
			return;
		}
		hint.classList.remove("is-visible");
		hint.hidden = true;
		if (tab) {
			tab.classList.remove("settings-tab--hint");
			tab.removeAttribute("aria-describedby");
		}
		try {
			localStorage.setItem(KEY_HINT_DISMISSED, "1");
		} catch (e) {}
	}

	function initSettingsHint(tab) {
		if (
			!(
				document.body.classList.contains("gallery-index") ||
				document.body.classList.contains("portfolio-index")
			) ||
			!tab ||
			isHintDismissed()
		) {
			return;
		}

		var hint = document.getElementById("settings-hint");
		var dismissBtn = document.getElementById("settings-hint-dismiss");
		if (!hint) {
			return;
		}

		function showHint() {
			hint.hidden = false;
			hint.classList.add("is-visible");
			tab.classList.add("settings-tab--hint");
			tab.setAttribute("aria-describedby", "settings-hint-text");
		}

		window.setTimeout(showHint, 700);

		if (dismissBtn) {
			dismissBtn.addEventListener("click", function () {
				dismissSettingsHint(tab);
			});
		}
	}

	function initPanel() {
		var tab = document.getElementById("settings-tab");
		var panel = document.getElementById("gallery-settings-panel");
		var backdrop = document.getElementById("settings-backdrop");
		var quietBtn = document.getElementById("settings-quiet-toggle");
		var musicBtn = document.getElementById("settings-music-toggle");

		if (!tab || !panel) {
			return;
		}

		initSettingsHint(tab);

		function openPanel() {
			dismissSettingsHint(tab);
			panel.classList.add("is-open");
			tab.setAttribute("aria-expanded", "true");
			if (backdrop) {
				backdrop.classList.add("is-visible");
			}
		}

		function closePanel() {
			panel.classList.remove("is-open");
			tab.setAttribute("aria-expanded", "false");
			if (backdrop) {
				backdrop.classList.remove("is-visible");
			}
		}

		function togglePanel() {
			dismissSettingsHint(tab);
			if (panel.classList.contains("is-open")) {
				closePanel();
			} else {
				openPanel();
			}
		}

		tab.addEventListener("click", togglePanel);

		if (backdrop) {
			backdrop.addEventListener("click", closePanel);
		}

		if (quietBtn) {
			quietBtn.addEventListener("click", function () {
				setQuiet(!isQuiet());
			});
		}

		if (musicBtn) {
			musicBtn.addEventListener("click", function () {
				setSlideshowMusic(!isSlideshowMusicEnabled());
			});
		}

		panel.addEventListener("change", function (e) {
			var target = e.target;
			if (target && target.name === "neon-theme" && target.checked) {
				setTheme(target.value);
			}
		});

		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape" && panel.classList.contains("is-open")) {
				closePanel();
			}
		});

		syncPanelUI();
	}

	apply();

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initPanel);
	} else {
		initPanel();
	}

	return {
		apply: apply,
		isQuiet: isQuiet,
		setQuiet: setQuiet,
		isSoundEnabled: isSoundEnabled,
		isSlideshowMusicEnabled: isSlideshowMusicEnabled,
		setSlideshowMusic: setSlideshowMusic,
		getGlowMode: getGlowMode,
		getTheme: getTheme,
		setTheme: setTheme,
		initPanel: initPanel
	};
})();
