/* ==========================================================================
   Page « Me contacter » : formulaire qui prépare un e-mail.
   Le site étant statique (sans serveur), le formulaire ouvre l'application
   e-mail du visiteur avec un message pré-rempli.
   ========================================================================== */

(() => {
  const EMAIL = "jbprovencephotography@gmail.com";
  const form = document.querySelector("#contact-form");
  if (!form) return;
  const status = form.querySelector(".form-status");

  // Pré-remplissage depuis les boutons des formules fitness (?projet=Fitness&formule=Confort)
  const params = new URLSearchParams(window.location.search);
  const project = params.get("projet");
  if (project && [...form.elements.projet.options].some((option) => option.value === project || option.text === project)) {
    form.elements.projet.value = project;
  }
  const formula = params.get("formule");
  if (project === "Fitness" && ["Essentiel", "Confort", "Premium"].includes(formula)) {
    form.elements.message.value = `Bonjour, je souhaite réserver un shooting fitness, formule ${formula}.\nDate souhaitée : `;
  }

  // Marque visuellement les champs invalides après une tentative d'envoi
  const markFields = () => {
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.setAttribute("aria-invalid", String(!field.checkValidity()));
    });
  };
  form.addEventListener("input", (event) => {
    if (event.target.hasAttribute("aria-invalid")) event.target.setAttribute("aria-invalid", String(!event.target.checkValidity()));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    markFields();
    const firstInvalid = form.querySelector(":invalid");
    if (firstInvalid) {
      status.textContent = "Merci de compléter les champs obligatoires.";
      status.classList.add("is-error");
      firstInvalid.focus();
      return;
    }
    status.classList.remove("is-error");

    const values = Object.fromEntries(new FormData(form));
    const subject = `Demande de séance — ${values.projet}`;
    const body = [
      `Nom : ${values.nom}`,
      `Prénom : ${values.prenom}`,
      `E-mail : ${values.email}`,
      `Téléphone : ${values.telephone || "Non précisé"}`,
      `Type de projet : ${values.projet}`,
      `Lieu envisagé : ${values.lieu || "Non précisé"}`,
      "",
      "Message :",
      values.message || "Non précisé",
    ].join("\n");

    status.innerHTML = `Votre application e-mail va s’ouvrir. Si rien ne se passe, écrivez-moi directement à <a href="mailto:${EMAIL}">${EMAIL}</a>.`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
