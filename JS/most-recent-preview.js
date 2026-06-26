(function () {
  "use strict";

  var section = document.getElementById("most-recent");
  if (!section) return;

  var cards = section.querySelectorAll(".home-most-recent-card--preview[data-preview-target]");
  if (!cards.length) return;

  var hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var activeCard = null;

  function getPreview(card) {
    var id = card.getAttribute("data-preview-target");
    return id ? document.getElementById(id) : null;
  }

  function setPreviewOpen(card, isOpen) {
    var preview = getPreview(card);
    if (!preview) return;

    preview.classList.toggle("is-visible", isOpen);
    preview.setAttribute("aria-hidden", isOpen ? "false" : "true");
    if (isOpen) activeCard = card;
    else if (activeCard === card) activeCard = null;
  }

  function closeAll() {
    cards.forEach(function (card) {
      setPreviewOpen(card, false);
    });
    activeCard = null;
  }

  function isInside(node, container) {
    return node && container.contains(node);
  }

  function bindPair(card, preview) {
    card.addEventListener("mouseenter", function () {
      if (!hoverCapable) return;
      closeAll();
      setPreviewOpen(card, true);
    });

    card.addEventListener("mouseleave", function (event) {
      if (!hoverCapable) return;
      if (isInside(event.relatedTarget, preview)) return;
      setPreviewOpen(card, false);
    });

    preview.addEventListener("mouseenter", function () {
      if (!hoverCapable) return;
      setPreviewOpen(card, true);
    });

    preview.addEventListener("mouseleave", function (event) {
      if (!hoverCapable) return;
      if (isInside(event.relatedTarget, card) || isInside(event.relatedTarget, preview)) return;
      setPreviewOpen(card, false);
    });

    if (!hoverCapable) {
      card.addEventListener("click", function (event) {
        if (event.target.closest(".most-recent-preview__link")) return;

        var isOpen = preview.classList.contains("is-visible");
        closeAll();
        if (!isOpen) setPreviewOpen(card, true);
      });

      preview.addEventListener("click", function (event) {
        if (event.target.closest(".most-recent-preview__link")) return;
        setPreviewOpen(card, false);
      });
    }

    card.addEventListener("focusin", function () {
      closeAll();
      setPreviewOpen(card, true);
    });

    card.addEventListener("focusout", function (event) {
      if (isInside(event.relatedTarget, card) || isInside(event.relatedTarget, preview)) return;
      setPreviewOpen(card, false);
    });
  }

  cards.forEach(function (card) {
    var preview = getPreview(card);
    if (preview) bindPair(card, preview);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeAll();
  });
})();
