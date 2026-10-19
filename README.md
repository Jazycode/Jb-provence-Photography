# JB Provence Photography

Site vitrine de **JB Provence Photography**, photographe à Aix-en-Provence (Jayson Bernardet).

C'est un site **100 % statique** (HTML, CSS, JavaScript) : il n'a besoin d'aucun serveur, d'aucune base de données et d'aucune installation. Il peut être hébergé gratuitement sur GitHub Pages, Netlify, Vercel ou Cloudflare Pages.

## Aperçu en local

Double-cliquez simplement sur `index.html`.

Ou, pour un rendu identique à la mise en ligne, lancez un petit serveur depuis le dossier du projet :

```bash
python -m http.server 8000
```

puis ouvrez <http://localhost:8000>.

## Organisation des fichiers

```
├── index.html              Page d'accueil (portfolio, fitness, à propos…)
├── contact.html            Page « Me contacter » et formulaire
├── mentions-legales.html   Mentions légales et confidentialité
├── 404.html                Page « introuvable »
├── robots.txt
├── sitemap.xml          Plan du site pour Google
└── assets/
    ├── css/
    │   ├── base.css        Couleurs, en-tête, menu, pied de page (toutes les pages)
    │   ├── home.css        Page d'accueil
    │   ├── contact.css     Page contact
    │   └── legal.css       Mentions légales
    ├── js/
    │   ├── main.js         Menu, en-tête, animations (toutes les pages)
    │   ├── galleries.js    ★ Liste des photos de chaque galerie
│   ├── avis.js         ★ Avis clients (la section s’affiche dès qu’il y en a un)
    │   ├── home.js         Galeries et visionneuse
    │   └── contact.js      Formulaire de contact
    ├── images/
    │   ├── galeries/       Photos des galeries (animalier, sport, paysage)
    │   ├── fitness/        Photos de la section fitness
    │   └── univers/        Images des 3 tuiles du portfolio
    └── docs/
        └── tarifs-fitness-2026.pdf
```

## Ajouter une photo dans une galerie

1. Préparez la photo : JPEG, **2000 px maximum** sur le plus grand côté, idéalement moins de 500 Ko.
   Pensez à retirer la géolocalisation (Lightroom : *Exporter → Métadonnées → Supprimer les informations de lieu*).
2. Déposez-la dans `assets/images/galeries/<galerie>/`.
3. Ouvrez `assets/js/galleries.js` et ajoutez une ligne dans la liste de la galerie :

   ```js
   { src: "ma-photo.jpg", alt: "Description de la photo", caption: "Animalier · Légende" },
   ```

Le compteur « Découvrir la série · X photos » se met à jour tout seul.

## Partager une galerie

Chaque galerie a son propre lien, pratique pour Instagram ou WhatsApp :

- `…/#galerie-animalier`
- `…/#galerie-sport`
- `…/#galerie-paysage`

## Mettre le site en ligne avec GitHub Pages

1. Créez un dépôt sur GitHub (par exemple `jb-provence-photography`).
2. Envoyez-y le contenu de ce dossier :

   ```bash
   git init
   git add .
   git commit -m "Site JB Provence Photography"
   git branch -M main
   git remote add origin https://github.com/<votre-compte>/jb-provence-photography.git
   git push -u origin main
   ```

   (Ou, sans ligne de commande : sur github.com, *Add file → Upload files* et glissez tout le contenu du dossier.)
3. Sur GitHub : **Settings → Pages → Source : Deploy from a branch → `main` / `(root)`** puis *Save*.
4. Après une minute, le site est en ligne à l'adresse `https://<votre-compte>.github.io/jb-provence-photography/`.

### Nom de domaine personnalisé (ex. `jbprovencephotography.fr`)

Dans **Settings → Pages → Custom domain**, saisissez votre domaine, puis suivez les instructions DNS de GitHub. La page `404.html` s’adapte automatiquement à l’adresse GitHub Pages comme à un domaine personnalisé.

## À faire avant l'ouverture au public

- [ ] Renseigner le médiateur de la consommation dans `mentions-legales.html` (section 06), puis supprimer le bloc « Information à compléter ».
- [ ] Si le site est hébergé ailleurs que sur GitHub Pages, mettre à jour la section « Hébergement ».
- [ ] En cas de nom de domaine personnalisé, remplacer l’adresse `jazycode.github.io/Jb-provence-Photography` dans `sitemap.xml`, `robots.txt` et les balises `canonical` / `og:` des pages.
- [ ] Ajouter de vrais avis clients dans `assets/js/avis.js` et une photo de Jayson dans la section « À propos ».
- [ ] Ajouter le lien vers le site de Soleia dans la section « Collaborateurs » lorsqu'il sera en ligne.

## Droits

© JB Provence Photography — Tous droits réservés.
Les photographies et le logo ne sont pas libres de droits : toute réutilisation sans autorisation écrite est interdite.
