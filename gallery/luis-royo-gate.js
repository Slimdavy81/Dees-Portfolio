/**
 * Password gate for Luis Royo slideshow (session unlock).
 */
(function () {
	var STORAGE_KEY = "gallery-royo-unlocked";
	var PASS_HASH = "0ca52e43236170bff54f207774ad4a7e827c3f0f5b69cf171f80359a12e3301b";

	function isUnlocked() {
		try {
			return sessionStorage.getItem(STORAGE_KEY) === "1";
		} catch (e) {
			return false;
		}
	}

	function setUnlocked() {
		try {
			sessionStorage.setItem(STORAGE_KEY, "1");
		} catch (e) {}
	}

	function hashPassword(value) {
		if (!window.crypto || !crypto.subtle) {
			return Promise.resolve(null);
		}
		var encoded = new TextEncoder().encode(value);
		return crypto.subtle.digest("SHA-256", encoded).then(function (buf) {
			var bytes = new Uint8Array(buf);
			var hex = "";
			var i;
			for (i = 0; i < bytes.length; i++) {
				hex += bytes[i].toString(16).padStart(2, "0");
			}
			return hex;
		});
	}

	function loadSlideshowScripts() {
		if (window.__royoScriptsLoaded) {
			return;
		}
		window.__royoScriptsLoaded = true;

		var carousel = document.createElement("script");
		carousel.src = "slideshow-carousel.js";
		carousel.onload = function () {
			var gallery = document.createElement("script");
			gallery.src = "luis-royo.js";
			document.body.appendChild(gallery);
		};
		document.body.appendChild(carousel);
	}

	function hideGate() {
		var gate = document.getElementById("royo-gate");
		if (gate) {
			gate.remove();
		}
		document.documentElement.classList.remove("royo-locked");
	}

	function unlock() {
		setUnlocked();
		hideGate();
		loadSlideshowScripts();
	}

	function showError(message) {
		var err = document.getElementById("royo-gate-error");
		if (err) {
			err.textContent = message;
			err.hidden = false;
		}
	}

	function clearError() {
		var err = document.getElementById("royo-gate-error");
		if (err) {
			err.textContent = "";
			err.hidden = true;
		}
	}

	function initGateForm() {
		var form = document.getElementById("royo-gate-form");
		var input = document.getElementById("royo-gate-password");
		if (!form || !input) {
			return;
		}

		form.addEventListener("submit", function (e) {
			e.preventDefault();
			clearError();

			var value = input.value;
			hashPassword(value).then(function (digest) {
				if (digest === PASS_HASH) {
					unlock();
					return;
				}
				if (digest === null && value === "Royo101") {
					unlock();
					return;
				}
				showError("Incorrect password. Please try again.");
				input.value = "";
				input.focus();
			});
		});
	}

	function init() {
		if (isUnlocked()) {
			document.documentElement.classList.remove("royo-locked");
			hideGate();
			loadSlideshowScripts();
			return;
		}

		document.documentElement.classList.add("royo-locked");
		initGateForm();
		var input = document.getElementById("royo-gate-password");
		if (input) {
			input.focus();
		}
	}

	if (!isUnlocked()) {
		document.documentElement.classList.add("royo-locked");
	}

	window.RoyoGate = {
		isUnlocked: isUnlocked,
		unlock: unlock
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
