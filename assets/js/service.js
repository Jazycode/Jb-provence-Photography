/* Pages prestations : barre de contact mobile visible après le haut de page. */
(() => {
  const bar = document.querySelector(".mobile-cta");
  const hero = document.querySelector(".page-hero");
  if (!bar || !hero || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(([entry]) => bar.classList.toggle("is-visible", !entry.isIntersecting)).observe(hero);
})();
