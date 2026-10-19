/* ==========================================================================
   CONTENU DES GALERIES
   --------------------------------------------------------------------------
   Pour ajouter une photo :
     1. Déposez le fichier dans assets/images/galeries/<nom-de-la-galerie>/
        (JPEG de 2000 px de large maximum, idéalement moins de 500 Ko).
     2. Ajoutez une ligne dans la liste « photos » de la galerie ci-dessous :
        { src: "nom-du-fichier.jpg", alt: "Description de la photo", caption: "Légende" },

   Le nombre de photos affiché sur chaque tuile se met à jour tout seul.
   ========================================================================== */

window.GALLERIES = {
  animalier: {
    title: "Animalier",
    subtitle: "La beauté du vivant, saisie naturellement.",
    folder: "assets/images/galeries/animalier/",
    photos: [
      { src: "border-collie.jpg", alt: "Border collie noir et blanc dans l’herbe", caption: "Animalier · Portrait canin" },
      { src: "chat-tricolore.jpg", alt: "Chat tricolore à poil long assis en extérieur", caption: "Animalier · Portrait félin" },
    ],
  },

  sport: {
    title: "Sport",
    subtitle: "Force, mouvement, dépassement.",
    folder: "assets/images/galeries/sport/",
    photos: [
      { src: "coach-seance-1.jpg", alt: "Sportif en plein effort sur une machine de musculation", caption: "Sport · L’effort" },
      { src: "coach-seance-2.jpg", alt: "Portrait du sportif pendant sa séance de fitness", caption: "Sport · Le regard" },
      { src: "coach-seance-3.jpg", alt: "Effort intense pendant un exercice de musculation", caption: "Sport · L’intensité" },
      { src: "coach-seance-4.jpg", alt: "Portrait de dos du coach sportif dans la salle", caption: "Sport · Le coach" },
      { src: "coach-seance-5.jpg", alt: "Le coach observe le sportif dans le miroir", caption: "Sport · L’accompagnement" },
      { src: "coach-seance-6.jpg", alt: "Le coach et le sportif avancent ensemble dans la salle", caption: "Sport · Le duo" },
    ],
  },

  paysage: {
    title: "Paysages & monuments",
    subtitle: "Architecture et horizons.",
    folder: "assets/images/galeries/paysage/",
    photos: [
      { src: "monument-rome-1.jpg", alt: "Église historique et sa coupole à Rome", caption: "Monument · Rome" },
      { src: "monument-rome-2.jpg", alt: "Clocher ancien en contre-plongée sous un ciel bleu", caption: "Architecture · Clocher historique" },
      { src: "monument-rome-3.jpg", alt: "Statue religieuse ornant la façade d’un monument historique", caption: "Monument · Détail architectural" },
      { src: "colisee-rome.jpg", alt: "Le Colisée vu depuis une rue pavée de Rome à la lumière dorée", caption: "Monument · Le Colisée, Rome" },
      { src: "ape-italie.jpg", alt: "Triporteur italien vert stationné dans une rue animée", caption: "Voyage · Scène de rue en Italie" },
      { src: "avion-montagne.jpg", alt: "Avion léger jaune sur une piste devant les montagnes", caption: "Paysage · Aviation en montagne" },
      { src: "detail-facade.jpg", alt: "Détail coloré d’une façade ancienne avec une image religieuse", caption: "Architecture · Mémoire des façades" },
    ],
  },
};
