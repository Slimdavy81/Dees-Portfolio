(function () {
  "use strict";

  var form = document.querySelector("[data-contact-form]");
  if (!form) return;

  var recipient = "davidlgambledesigns@outlook.com";

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var data = new FormData(form);
    var name = (data.get("name") || "").trim();
    var email = (data.get("email") || "").trim();
    var subject = (data.get("subject") || "Portfolio enquiry").trim();
    var message = (data.get("message") || "").trim();

    var body = [
      message,
      "",
      name ? "Name: " + name : "",
      email ? "Reply email: " + email : "",
    ].filter(Boolean).join("\n");

    var mailto = "mailto:" + recipient +
      "?subject=" + encodeURIComponent(subject || "Portfolio enquiry") +
      "&body=" + encodeURIComponent(body);

    window.location.href = mailto;
  });
})();
