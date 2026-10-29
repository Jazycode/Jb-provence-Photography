/* ==========================================================================
   Page « Me contacter » : formulaire de demande.
   Le site étant statique (sans serveur), la demande est transmise par le
   service gratuit FormSubmit (formsubmit.co) directement dans la boîte Gmail.
   Si l'envoi échoue (service indisponible, pas encore activé…), le formulaire
   ouvre l'application e-mail du visiteur avec le message déjà rédigé : aucune
   demande n'est perdue.
   ========================================================================== */

(() => {
  const EMAIL = "jbprovencephotography@gmail.com";
  const ENDPOINT = `https://formsubmit.co/ajax/${EMAIL}`;
  const form = document.querySelector("#contact-form");
  if (!form) return;
  const status = form.querySelector(".form-status");

  // Pré-remplissage depuis les boutons des formules fitness (?projet=Fitness&formule=Confort)
  const params = new URLSearchParams(window.location.search);
  const project = params.get("projet");
  if (project && [...form.elements.projet.options].some((option) => option.value === project || option.text === project)) {
    form.elements.projet.value = project;
  }
  if (project === "Mini-séance découverte") {
    form.elements.message.value = "Bonjour, je souhaite réserver une mini-séance découverte (30 min, 59 € au tarif de lancement).\nSujet (portrait, animal, sport…) : \nLieu souhaité : \nDate souhaitée : ";
  }
  const formula = params.get("formule");
  if (project === "Fitness" && ["Essentiel", "Confort", "Premium"].includes(formula)) {
    form.elements.message.value = `Bonjour, je souhaite réserver un shooting fitness, formule ${formula}.\nDate souhaitée : `;
  }

  // ---------- Disponibilités : mercredi et dimanche, samedi sur demande ----------
  const dateField = form.elements.date;
  const dateHint = form.querySelector(".date-hint");
  const defaultHint = dateHint ? dateHint.textContent : "";
  const today = new Date();
  dateField.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const checkDay = () => {
    dateField.setCustomValidity("");
    if (!dateField.value) { if (dateHint) { dateHint.textContent = defaultHint; dateHint.classList.remove("is-warning"); } return; }
    const day = new Date(`${dateField.value}T12:00:00`).getDay(); // 0 = dimanche
    if (day === 0 || day === 3) {
      dateHint.textContent = "Bon choix : ce jour fait partie de mes disponibilités.";
      dateHint.classList.remove("is-warning");
    } else if (day === 6) {
      dateHint.textContent = "Le samedi est sur demande : je vous confirme sous 24 h.";
      dateHint.classList.remove("is-warning");
    } else {
      dateField.setCustomValidity("Je suis disponible le mercredi et le dimanche (samedi sur demande).");
      dateHint.textContent = "Ce jour n’est pas disponible : choisissez un mercredi, un dimanche ou un samedi (sur demande).";
      dateHint.classList.add("is-warning");
    }
  };
  dateField.addEventListener("change", checkDay);
  dateField.addEventListener("input", checkDay);

  // ---------- Agenda Google (créneaux occupés) : chargé seulement au clic ----------
  const agendaToggle = document.querySelector(".availability-toggle");
  const agenda = document.querySelector("#agenda");
  if (agendaToggle && agenda) {
    agendaToggle.addEventListener("click", () => {
      const open = agenda.hidden;
      agenda.hidden = !open;
      agendaToggle.setAttribute("aria-expanded", String(open));
      const frame = agenda.querySelector(".agenda-frame");
      if (open && !frame.querySelector("iframe")) {
        const iframe = document.createElement("iframe");
        iframe.title = "Créneaux déjà réservés";
        iframe.loading = "lazy";
        iframe.src = "https://calendar.google.com/calendar/embed?src=jbprovencephotography%40gmail.com&ctz=Europe%2FParis&mode=WEEK&hl=fr&showTitle=0&showPrint=0&showCalendars=0&showTz=0";
        frame.append(iframe);
      }
      if (open) agenda.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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

  form.addEventListener("submit", async (event) => {
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
      `Date souhaitée : ${values.date ? new Date(values.date).toLocaleDateString("fr-FR") : "Non précisée"}`,
      `Connu via : ${values.source || "Non précisé"}`,
      "",
      "Message :",
      values.message || "Non précisé",
    ].join("\n");

    // Champ piège invisible : rempli uniquement par les robots
    if (values._honey) return;

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = "Envoi de votre demande…";

    // L'envoi peut être lent (jusqu'à ~40 s) : on rassure le visiteur et on coupe après 60 s
    const slowNotice = setTimeout(() => {
      status.textContent = "Envoi en cours… cela peut prendre jusqu’à 30 secondes, merci de ne pas fermer la page.";
    }, 4000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(ENDPOINT, {
        signal: controller.signal,
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: subject,
          _template: "table",
          _replyto: values.email,
          Nom: values.nom,
          Prénom: values.prenom,
          "E-mail": values.email,
          Téléphone: values.telephone || "Non précisé",
          "Type de projet": values.projet,
          "Lieu envisagé": values.lieu || "Non précisé",
          "Date souhaitée": values.date ? new Date(values.date).toLocaleDateString("fr-FR") : "Non précisée",
          "Connu via": values.source || "Non précisé",
          Message: values.message || "Non précisé",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || String(result.success) !== "true") throw new Error(result.message || "Envoi impossible");

      form.reset();
      form.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
      status.textContent = "Merci ! Votre demande est bien envoyée. Je vous réponds personnellement très vite.";
    } catch {
      // Solution de secours : message pré-rempli dans l'application e-mail
      status.innerHTML = `Votre application e-mail va s’ouvrir avec votre demande déjà rédigée. Si rien ne se passe, écrivez-moi à <a href="mailto:${EMAIL}">${EMAIL}</a> ou au 07 60 83 32 29.`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } finally {
      clearTimeout(slowNotice);
      clearTimeout(timeout);
      button.disabled = false;
    }
  });
})();
