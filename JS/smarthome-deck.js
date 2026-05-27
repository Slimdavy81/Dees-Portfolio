(function () {
  "use strict";

  var roots = document.querySelectorAll("[data-smarthome-deck]");
  if (!roots.length) return;

  var DEFAULT_IMAGES = [
    { file: "logo.jpg", label: "Smarthome 2076 logo", slot: "logo" },
    { file: "dashboard.jpg", label: "Smarthome 2076 dashboard", slot: "dashboard" },
    { file: "home.jpg", label: "Smarthome 2076 home screen", slot: "home" },
    { file: "layouts.jpg", label: "Smarthome 2076 layouts", slot: "layouts" },
  ];

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobileLinks = window.matchMedia("(max-width: 720px)");
  var SLOTS = ["logo", "dashboard", "home", "layouts"];

  function labelFromFile(file) {
    return file
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, function (match) {
        return match.toUpperCase();
      });
  }

  function imagesFor(root) {
    var dataImages = root.getAttribute("data-images");
    if (!dataImages) {
      return DEFAULT_IMAGES;
    }

    return dataImages
      .split("|")
      .map(function (file, i) {
        file = file.trim();
        return file
          ? {
              file: file,
              label: labelFromFile(file),
              slot: SLOTS[i] || "layouts",
            }
          : null;
      })
      .filter(Boolean);
  }

  function initDeck(root) {
    var stack = root.querySelector(".smarthome-deck__stack");
    if (!stack) return;

    var base = root.getAttribute("data-base") || "Smarthome/";
    var prototypeLink = root.querySelector(".smarthome-deck__prototype-link");
    var prototypeHref = prototypeLink ? prototypeLink.href : "";
    var spread = false;

    function srcFor(file) {
      return base + encodeURIComponent(file);
    }

    function runSpread() {
      if (spread) return;
      spread = true;
      stack.classList.add("is-spread");
      root.classList.add("is-spread");
      stack.setAttribute("tabindex", "0");
    }

    imagesFor(root).forEach(function (item, i) {
      var card = document.createElement("figure");
      card.className = "smarthome-deck__card smarthome-deck__card--" + item.slot;
      card.style.setProperty("--deal-index", String(i));

      var img = document.createElement("img");
      img.src = srcFor(item.file);
      img.alt = item.label;
      img.decoding = "async";
      img.loading = i === 0 ? "eager" : "lazy";
      img.draggable = false;

      card.appendChild(img);
      stack.appendChild(card);
    });

    function applyMobileLinkState() {
      if (mobileLinks.matches && prototypeHref) {
        stack.setAttribute("role", "link");
        stack.setAttribute("aria-label", "Open " + (root.getAttribute("aria-label") || "project") + " prototype");
        stack.classList.add("smarthome-deck__stack--mobile-link");
      } else {
        stack.removeAttribute("role");
        stack.removeAttribute("aria-label");
        stack.classList.remove("smarthome-deck__stack--mobile-link");
      }
    }

    stack.addEventListener("click", function (e) {
      if (!mobileLinks.matches || !prototypeHref) return;
      if (e.target.closest && e.target.closest("a")) return;
      window.open(prototypeHref, "_blank", "noopener");
    });

    stack.addEventListener("keydown", function (e) {
      if (!mobileLinks.matches || !prototypeHref) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      window.open(prototypeHref, "_blank", "noopener");
    });

    mobileLinks.addEventListener("change", applyMobileLinkState);
    applyMobileLinkState();

    if (reduced.matches) {
      runSpread();
      return;
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              runSpread();
              observer.disconnect();
            }
          });
        },
        { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.2 }
      );
      observer.observe(root);
    } else {
      window.setTimeout(runSpread, 400);
    }
  }

  roots.forEach(initDeck);
})();
