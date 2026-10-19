/* ==========================================================================
   Page d'accueil : galeries, visionneuse et bandeau défilant.
   Les photos sont définies dans assets/js/galleries.js.
   ========================================================================== */

(() => {
  const galleries = window.GALLERIES || {};
  const gallerySection = document.querySelector("#galerie");
  const galleryTitle = document.querySelector("#gallery-title");
  const gallerySubtitle = document.querySelector("#gallery-subtitle");
  const photoGrid = document.querySelector("#photo-grid");
  const tiles = [...document.querySelectorAll(".tile[data-gallery]")];
  let activeTile = null;

  // Nombre de photos sur chaque tuile
  tiles.forEach((tile) => {
    const count = galleries[tile.dataset.gallery]?.photos.length || 0;
    const status = tile.querySelector("[data-gallery-count]");
    status.textContent = count ? `Découvrir la série · ${count} photo${count > 1 ? "s" : ""}` : "Bientôt disponible";
    status.classList.toggle("is-soon", !count);
  });

  const renderGallery = (slug) => {
    const gallery = galleries[slug];
    if (!gallery) return;
    galleryTitle.textContent = gallery.title;
    gallerySubtitle.textContent = gallery.subtitle;
    photoGrid.replaceChildren();

    if (!gallery.photos.length) {
      const empty = document.createElement("p");
      empty.className = "gallery-empty";
      empty.textContent = "Cette galerie sera bientôt disponible.";
      photoGrid.append(empty);
      return;
    }

    gallery.photos.forEach((photo, index) => {
      const figure = document.createElement("figure");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "photo-button";
      button.setAttribute("aria-label", `${photo.alt} — ouvrir en grand`);
      button.addEventListener("click", () => openLightbox(gallery, index));

      const image = document.createElement("img");
      image.src = gallery.folder + photo.src;
      image.alt = photo.alt;
      image.loading = "lazy";
      image.decoding = "async";

      const caption = document.createElement("figcaption");
      caption.textContent = photo.caption;

      window.fadeInImage?.(image);
      button.append(image);
      figure.append(button, caption);
      photoGrid.append(figure);
    });
  };

  const openGallery = (slug) => {
    if (!galleries[slug]) return;
    activeTile?.setAttribute("aria-expanded", "false");
    activeTile = tiles.find((tile) => tile.dataset.gallery === slug) || null;
    activeTile?.setAttribute("aria-expanded", "true");
    renderGallery(slug);
    gallerySection.hidden = false;
    gallerySection.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  document.querySelectorAll("[data-gallery]").forEach((trigger) => {
    trigger.addEventListener("click", () => openGallery(trigger.dataset.gallery));
  });

  document.querySelector("#gallery-close").addEventListener("click", () => {
    gallerySection.hidden = true;
    if (!activeTile) return;
    activeTile.setAttribute("aria-expanded", "false");
    activeTile.scrollIntoView({ behavior: "smooth", block: "center" });
    activeTile.focus({ preventScroll: true });
  });

  // ---------- Visionneuse ----------
  const lightbox = document.querySelector("#lightbox");
  const lightboxImage = lightbox.querySelector("img");
  const lightboxCaption = lightbox.querySelector(".lightbox-caption");
  const closeButton = lightbox.querySelector(".lightbox-close");
  let current = { gallery: null, index: 0 };
  let returnFocus = null;

  const showPhoto = (index) => {
    const { photos, folder } = current.gallery;
    current.index = (index + photos.length) % photos.length;
    const photo = photos[current.index];
    lightboxImage.src = folder + photo.src;
    lightboxImage.alt = photo.alt;
    lightboxCaption.textContent = `${current.index + 1} / ${photos.length} · ${photo.caption}`;
  };

  function openLightbox(gallery, index) {
    returnFocus = document.activeElement;
    current = { gallery, index };
    showPhoto(index);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    returnFocus?.focus();
  };

  closeButton.addEventListener("click", closeLightbox);
  lightbox.querySelector(".lightbox-prev").addEventListener("click", () => showPhoto(current.index - 1));
  lightbox.querySelector(".lightbox-next").addEventListener("click", () => showPhoto(current.index + 1));
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });

  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showPhoto(current.index - 1);
    if (event.key === "ArrowRight") showPhoto(current.index + 1);
    // Garde le focus clavier dans la visionneuse
    if (event.key === "Tab") {
      const focusable = [...lightbox.querySelectorAll("button")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  // Balayage gauche/droite sur mobile
  let touchStartX = null;
  lightbox.addEventListener("touchstart", (event) => { touchStartX = event.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) showPhoto(current.index + (delta < 0 ? 1 : -1));
    touchStartX = null;
  });

  // ---------- Bandeau défilant : boucle continue ----------
  const showcaseGroup = document.querySelector(".showcase-group");
  if (showcaseGroup) {
    const copy = showcaseGroup.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    copy.querySelectorAll("img").forEach((image) => {
      image.classList.remove("is-loading", "is-ready");
      window.fadeInImage?.(image);
    });
    copy.querySelectorAll("button").forEach((button) => {
      button.tabIndex = -1;
      button.addEventListener("click", () => openGallery(button.dataset.gallery));
    });
    showcaseGroup.after(copy);
  }
})();
