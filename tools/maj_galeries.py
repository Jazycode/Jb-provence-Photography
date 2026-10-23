"""Met à jour automatiquement les galeries à partir des photos déposées.

Il suffit de déposer des photos dans assets/images/galeries/<galerie>/ (sur
github.com : « Add file > Upload files »). Ce script, lancé par GitHub Actions
(.github/workflows/galeries.yml) :
  1. renomme proprement les fichiers (minuscules, sans espaces ni accents) ;
  2. convertit en JPEG (HEIC d'iPhone, PNG, WebP…), réduit à 1800 px maximum
     et supprime les métadonnées (dont la position GPS) ;
  3. crée la miniature du bandeau (840 px de haut) dans assets/images/miniatures/ ;
  4. réécrit assets/js/galleries.js : les photos déjà présentes gardent leur
     description, les nouvelles sont ajoutées en tête avec une description tirée
     du nom du fichier, les photos supprimées disparaissent ;
  5. retire du bandeau de l'accueil les miniatures de photos supprimées.
"""
import json, os, re, subprocess, sys, unicodedata

from PIL import Image, ImageOps

try:  # photos HEIC envoyées depuis un iPhone
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAL_DIR = os.path.join(ROOT, "assets", "images", "galeries")
MINI_DIR = os.path.join(ROOT, "assets", "images", "miniatures")
GAL_JS = os.path.join(ROOT, "assets", "js", "galleries.js")
INDEX = os.path.join(ROOT, "index.html")
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".tif", ".tiff"}
MAX_SIDE, MINI_H, QUALITY = 1800, 840, 84
GENERIC = re.compile(r"^(img|dsc|dscn|dji|pxl|photo|image|p|_?mg|dcim|screenshot|capture)?[ _-]*[ _-]?[0-9a-f _-]*$", re.I)

HEADER = """/* ==========================================================================
   CONTENU DES GALERIES — fichier mis à jour automatiquement
   --------------------------------------------------------------------------
   Pour ajouter une photo : déposez-la simplement dans
   assets/images/galeries/<nom-de-la-galerie>/ (sur github.com : Add file >
   Upload files). La liste ci-dessous, les miniatures et le compteur des tuiles
   se mettent à jour tout seuls en 1 à 2 minutes.

   Pour retirer une photo : supprimez son fichier.
   Vous pouvez modifier ici le titre, le sous-titre, l'ordre des photos ou
   leurs descriptions (alt) et légendes (caption) : vos changements sont gardés.
   ========================================================================== */

"""


def slug(name):
    base = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    base = re.sub(r"[^a-zA-Z0-9]+", "-", base).strip("-").lower()
    return base or "photo"


def label(stem):
    words = stem.replace("-", " ").replace("_", " ").strip()
    words = re.sub(r"\s+\d+$", "", words)  # « chien 2 » -> « chien »
    return words[:1].upper() + words[1:] if words else "Photo"


def load_galleries():
    if not os.path.exists(GAL_JS):
        return {}
    code = "global.window={};require(process.argv[1]);console.log(JSON.stringify(window.GALLERIES||{}))"
    out = subprocess.run(["node", "-e", code, GAL_JS], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def process_photo(folder, filename):
    """Normalise une photo ; renvoie le nom de fichier final (JPEG)."""
    path = os.path.join(folder, filename)
    stem, ext = os.path.splitext(filename)
    target = slug(stem) + ".jpg"
    target_path = os.path.join(folder, target)
    n = 2
    while target != filename and os.path.exists(target_path):  # évite d'écraser une autre photo
        target = f"{slug(stem)}-{n}.jpg"
        target_path = os.path.join(folder, target)
        n += 1

    im = Image.open(path)
    has_meta = bool(im.info.get("exif")) or bool(getattr(im, "getexif", lambda: {})())
    needs = (ext.lower() not in (".jpg",) or target != filename or max(im.size) > MAX_SIDE or has_meta)
    if needs:
        im = ImageOps.exif_transpose(im).convert("RGB")
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        im.save(target_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        if target_path != path:
            os.remove(path)
        print(f"  photo traitée : {filename} -> {target}")
    return target


def make_mini(folder, filename):
    mini = os.path.join(MINI_DIR, filename)
    src = os.path.join(folder, filename)
    if os.path.exists(mini) and os.path.getmtime(mini) >= os.path.getmtime(src):
        return
    im = Image.open(src).convert("RGB")
    h = min(MINI_H, im.height)
    im.resize((round(im.width * h / im.height), h), Image.LANCZOS).save(
        mini, "JPEG", quality=82, optimize=True, progressive=True)
    print(f"  miniature : {filename}")


def js_string(value):
    return json.dumps(value, ensure_ascii=False)


def write_galleries(galleries):
    lines = [HEADER, "window.GALLERIES = {\n"]
    for key, g in galleries.items():
        lines.append(f"  {key}: {{\n")
        lines.append(f"    title: {js_string(g['title'])},\n")
        lines.append(f"    subtitle: {js_string(g.get('subtitle', ''))},\n")
        lines.append(f"    folder: {js_string(g['folder'])},\n")
        lines.append("    photos: [\n")
        for p in g["photos"]:
            lines.append(f"      {{ src: {js_string(p['src'])}, alt: {js_string(p['alt'])}, caption: {js_string(p['caption'])} }},\n")
        lines.append("    ],\n  },\n\n")
    lines.append("};\n")
    content = "".join(lines).replace("  },\n\n};", "  },\n};")
    old = open(GAL_JS, encoding="utf-8").read() if os.path.exists(GAL_JS) else ""
    if content != old:
        open(GAL_JS, "w", encoding="utf-8").write(content)
        return True
    return False


def clean_showcase(valid_minis):
    """Retire du bandeau de l'accueil les miniatures dont la photo n'existe plus."""
    html = open(INDEX, encoding="utf-8").read()
    pattern = re.compile(r'\n\s*<button class="showcase-card[^\n]*?miniatures/([^"]+)"[^\n]*</button>')
    new = pattern.sub(lambda m: m.group(0) if m.group(1) in valid_minis else "", html)
    if new != html:
        open(INDEX, "w", encoding="utf-8").write(new)
        print("  bandeau de l'accueil nettoyé")


def main():
    os.makedirs(MINI_DIR, exist_ok=True)
    galleries = load_galleries()
    all_files = set()

    for key in sorted(os.listdir(GAL_DIR)):
        folder = os.path.join(GAL_DIR, key)
        if not os.path.isdir(folder):
            continue
        print(f"Galerie « {key} »")
        files = sorted(f for f in os.listdir(folder)
                       if os.path.splitext(f)[1].lower() in EXTS and not f.startswith("."))
        final, names = [], {}
        for f in files:
            try:
                t = process_photo(folder, f)
                final.append(t)
                names[t] = label(os.path.splitext(f)[0])  # garde les accents du nom d'origine
            except Exception as err:  # fichier illisible : on le signale sans tout bloquer
                print(f"  ⚠ impossible de lire {f} : {err}", file=sys.stderr)
        for f in final:
            make_mini(folder, f)
            all_files.add(f)

        g = galleries.get(key) or {
            "title": label(key), "subtitle": "", "folder": f"assets/images/galeries/{key}/", "photos": []}
        known = {p["src"]: p for p in g["photos"]}
        kept = [p for p in g["photos"] if p["src"] in final]
        def describe(f):
            # Photos envoyées depuis l'iPhone (IMG_1234, DSC…) : description générique
            if GENERIC.match(names[f]):
                return f"{g['title']} · Photographie de Jayson Bernardet, JB Provence Photography"
            return names[f]
        added = [{"src": f, "alt": describe(f), "caption": f"{g['title']} · {describe(f) if not GENERIC.match(names[f]) else 'JB Provence Photography'}"}
                 for f in final if f not in known]
        g["photos"] = added + kept
        galleries[key] = g

    # galeries dont le dossier a disparu
    galleries = {k: v for k, v in galleries.items() if os.path.isdir(os.path.join(GAL_DIR, k))}

    # miniatures orphelines (photo supprimée) — les autres miniatures du site sont gardées
    for f in os.listdir(MINI_DIR):
        if f not in all_files and f.lower().endswith(".jpg"):
            os.remove(os.path.join(MINI_DIR, f))
            print(f"  miniature supprimée : {f}")

    clean_showcase(set(os.listdir(MINI_DIR)))
    print("galleries.js mis à jour" if write_galleries(galleries) else "galleries.js inchangé")


if __name__ == "__main__":
    main()
