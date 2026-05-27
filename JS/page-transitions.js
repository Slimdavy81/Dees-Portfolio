/**

 * Same-origin HTML navigations: slow fade exit, then load;

 * next page runs enter motion (CSS on html.page-transitions).

 * Respects prefers-reduced-motion (no hook, no class).

 */

(function () {

  const root = document.documentElement;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {

    return;

  }



  /** Must match `page-tx-exit` duration in portfolio.css (ms). */

  const EXIT_MS = 920;

  const EXIT_NAME = "page-tx-exit";



  root.classList.add("page-transitions");



  function isSameDocumentUrl(url) {

    try {

      const here = new URL(window.location.href);

      return (

        url.origin === here.origin &&

        url.pathname === here.pathname &&

        url.search === here.search

      );

    } catch {

      return true;

    }

  }



  function shouldAnimateTo(anchor) {

    if (!anchor || anchor.tagName !== "A") return false;

    if (anchor.hasAttribute("download")) return false;



    const raw = anchor.getAttribute("href");

    if (!raw || raw === "#" || raw.startsWith("#")) return false;

    if (/^(mailto:|tel:|javascript:)/i.test(raw)) return false;



    const target = anchor.getAttribute("target");

    if (target && target !== "_self") return false;



    let url;

    try {

      url = new URL(raw, window.location.href);

    } catch {

      return false;

    }



    if (url.protocol !== window.location.protocol) return false;

    if (url.protocol === "http:" || url.protocol === "https:") {

      if (url.host !== window.location.host) return false;

    }



    const path = url.pathname.toLowerCase();

    const isLocalHtml =

      path.endsWith(".html") ||

      path === "/" ||

      path.endsWith("/");



    if (!isLocalHtml) return false;

    if (isSameDocumentUrl(url)) return false;



    return true;

  }



  document.addEventListener(

    "click",

    function (e) {

      const anchor = e.target.closest("a");

      if (!shouldAnimateTo(anchor)) return;

      if (e.defaultPrevented) return;

      if (e.button !== 0) return;

      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;



      e.preventDefault();



      const dest = anchor.href;

      root.classList.add("is-exiting");



      const main = document.querySelector("main");

      let done = false;



      function cleanup() {

        window.clearTimeout(fallback);

        if (main) main.removeEventListener("animationend", onAnimEnd);

      }



      function go() {

        if (done) return;

        done = true;

        cleanup();

        window.location.assign(dest);

      }



      const fallback = window.setTimeout(go, EXIT_MS + 140);



      function onAnimEnd(ev) {

        if (ev.animationName !== EXIT_NAME) return;

        if (main && ev.target !== main) return;

        go();

      }



      if (main) {

        main.addEventListener("animationend", onAnimEnd);

      } else {

        window.setTimeout(go, EXIT_MS);

      }

    },

    true

  );



  window.addEventListener("pageshow", function (ev) {

    if (ev.persisted) {

      root.classList.remove("is-exiting");

    }

  });

})();

