/* ==========================================================================
   Scripts communs à toutes les pages : en-tête, menu mobile, menu
   « Prestations », année du pied de page, animations d'apparition.
   ========================================================================== */

(() => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const servicesMenu = document.querySelector(".services-menu");
  const servicesButton = servicesMenu?.querySelector(".services-trigger");

  // En-tête qui se réduit au défilement
  if (header) {
    const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 36);
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
  }

  // Menu « Prestations »
  const setServicesOpen = (open) => {
    if (!servicesMenu) return;
    servicesMenu.classList.toggle("is-open", open);
    servicesButton.setAttribute("aria-expanded", String(open));
  };

  if (servicesMenu) {
    // Ouverture au survol sur ordinateur
    const canHover = window.matchMedia("(hover: hover) and (min-width: 1181px)");
    servicesButton.addEventListener("click", (event) => {
      // Avec la souris sur ordinateur, le survol a déjà ouvert le menu : le clic ne doit pas le refermer.
      const mouseClickOnDesktop = canHover.matches && event.detail > 0;
      setServicesOpen(mouseClickOnDesktop ? true : !servicesMenu.classList.contains("is-open"));
    });
    servicesMenu.addEventListener("mouseenter", () => { if (canHover.matches) setServicesOpen(true); });
    servicesMenu.addEventListener("mouseleave", () => { if (canHover.matches) setServicesOpen(false); });
    document.addEventListener("click", (event) => {
      if (!servicesMenu.contains(event.target)) setServicesOpen(false);
    });
  }

  // Menu mobile
  const setMenuOpen = (open) => {
    if (!nav || !menuButton) return;
    nav.classList.toggle("is-open", open);
    menuButton.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    if (!open) setServicesOpen(false);
  };

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => setMenuOpen(!nav.classList.contains("is-open")));
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuOpen(false)));
    window.addEventListener("resize", () => { if (window.innerWidth > 1180) setMenuOpen(false); });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (servicesMenu?.classList.contains("is-open")) {
      setServicesOpen(false);
      servicesButton.focus();
    } else if (nav?.classList.contains("is-open")) {
      setMenuOpen(false);
      menuButton.focus();
    }
  });

  // Fondu des photos : elles apparaissent une fois entièrement chargées
  const fadeIn = (image) => {
    if (image.complete && image.naturalWidth) return;
    image.classList.add("is-loading");
    const show = () => {
      image.classList.add("is-ready");
      image.classList.remove("is-loading");
    };
    image.addEventListener("load", show, { once: true });
    image.addEventListener("error", show, { once: true });
  };
  window.fadeInImage = fadeIn;
  document.querySelectorAll("main img").forEach(fadeIn);

  // Année du copyright
  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  // Âge calculé automatiquement à partir de la date de naissance (data-age="AAAA-MM-JJ")
  document.querySelectorAll("[data-age]").forEach((element) => {
    const [year, month, day] = element.dataset.age.split("-").map(Number);
    const today = new Date();
    let age = today.getFullYear() - year;
    if (today < new Date(today.getFullYear(), month - 1, day)) age -= 1;
    element.textContent = age;
  });

  // Apparition douce des blocs au défilement
  const revealItems = document.querySelectorAll("[data-reveal], .section-heading, .tile, .about-logo, .about-copy, .collaborators-heading, .collaborator");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item, index) => {
      item.classList.add("reveal");
      item.style.transitionDelay = `${(index % 3) * 70}ms`;
      observer.observe(item);
    });
  }
  // ---------- Bulle « Mini-séance découverte » visible sur toutes les pages ----------
  (() => {
    const onHome = !!document.querySelector("#decouverte");
    if (document.querySelector("form#demande, #demande form, .contact-form")) return; // pas sur la page de contact (l'offre est dans le formulaire)
    let dismissed = false;
    try { dismissed = sessionStorage.getItem("bulle-mini-fermee") === "1"; } catch (e) { /* stockage indisponible */ }
    if (dismissed) return;
    const bubble = document.createElement("div");
    bubble.className = "mini-bubble";
    if (document.querySelector(".mobile-cta")) bubble.classList.add("has-cta");
    bubble.innerHTML = `
      <a class="mini-bubble-link" href="${onHome ? "#decouverte" : "index.html#decouverte"}">
        <span class="mini-bubble-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></span>
        <span class="mini-bubble-text"><strong>Mini-séance découverte</strong><span>Offre de lancement · 59&nbsp;€</span></span>
      </a>
      <button class="mini-bubble-close" type="button" aria-label="Masquer l’offre mini-séance">×</button>`;
    document.body.appendChild(bubble);
    bubble.querySelector(".mini-bubble-close").addEventListener("click", () => {
      bubble.remove();
      try { sessionStorage.setItem("bulle-mini-fermee", "1"); } catch (e) { /* stockage indisponible */ }
    });
    // Sur l'accueil, la bulle s'efface quand le bloc de l'offre est à l'écran
    const block = document.querySelector("#decouverte");
    if (block && "IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => bubble.classList.toggle("is-hidden", entry.isIntersecting), { threshold: 0.2 }).observe(block);
    }
    requestAnimationFrame(() => setTimeout(() => bubble.classList.add("is-shown"), 900));
  })();
})();
