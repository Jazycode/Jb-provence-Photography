"""Met à jour assets/js/avis.js avec les avis Google publiés (API Places, nouvelle version).

Lancé chaque jour par GitHub Actions (.github/workflows/avis-google.yml).
Variables d'environnement :
  GOOGLE_PLACES_API_KEY  clé d'API Google (secret GitHub, obligatoire)
  GOOGLE_PLACE_ID        identifiant de la fiche (facultatif : trouvé automatiquement sinon)
Les avis déjà présents dans avis.js (ajoutés à la main) sont conservés s'ils ne
sont pas encore renvoyés par Google.
"""
import json, os, re, sys, urllib.error, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AVIS_JS = os.path.join(ROOT, "assets", "js", "avis.js")
KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "").strip()
PLACE_ID = os.environ.get("GOOGLE_PLACE_ID", "").strip() or "ChIJs6bPczgQbEgR3f-SU6hw1oU"  # fiche JB Provence Photography
QUERY = "Jb Provence photography Venelles"


def call(url, body=None, fields=""):
    headers = {"X-Goog-Api-Key": KEY, "X-Goog-FieldMask": fields, "Content-Type": "application/json"}
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method="POST" if body is not None else "GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")[:500].replace("\n", " ")
        fail(f"Google a répondu {err.code} : {detail}")


def fail(message):
    # « ::error:: » affiche le message directement dans l'onglet Actions de GitHub
    print(f"::error::{message}")
    sys.exit(1)


def find_place_id():
    res = call("https://places.googleapis.com/v1/places:searchText",
               {"textQuery": QUERY, "languageCode": "fr",
                "locationBias": {"circle": {"center": {"latitude": 43.598, "longitude": 5.483}, "radius": 30000}}},
               "places.id,places.displayName")
    for p in res.get("places", []):
        if "provence" in p.get("displayName", {}).get("text", "").lower():
            return p["id"]
    fail("Fiche introuvable : renseignez GOOGLE_PLACE_ID.")


# Noms Google écrits « Nom Prénom » : on indique ici l'affichage voulu
NOMS = {"Merard Gabriel": "Gabriel M.", "Sean DENIAU BOUVET": "Sean D.", "Laury Bnrd": "Laury B."}
# Avis à ne jamais afficher sur le site (ex. avis laissé depuis un compte de l'entreprise)
EXCLUS = {"byReaaZn", "byReaaZn (byReaaZn)"}


def short_name(full):
    full = full.strip()
    if full in NOMS:
        return NOMS[full]
    parts = [p for p in re.split(r"\s+", full) if p]
    if not parts:
        return "Client Google"
    if len(parts) == 1:
        return parts[0].capitalize()
    return f"{parts[0].capitalize()} {parts[-1][0].upper()}."


def read_existing():
    src = open(AVIS_JS, encoding="utf-8").read()
    m = re.search(r"window\.AVIS = (\[.*?\]);", src, re.S)
    existing = []
    if m:
        for obj in re.finditer(r"\{(.*?)\},?\n", m.group(1), re.S):
            item = {}
            for k, v in re.findall(r'(\w+): ("(?:[^"\\]|\\.)*"|\d+)', obj.group(1)):
                item[k] = json.loads(v) if v.startswith('"') else int(v)
            if item.get("texte"):
                existing.append(item)
    return existing


def main():
    if not KEY:
        fail("GOOGLE_PLACES_API_KEY manquante.")
    place = PLACE_ID or find_place_id()
    data = call(f"https://places.googleapis.com/v1/places/{urllib.parse.quote(place)}?languageCode=fr",
                fields="rating,userRatingCount,reviews")
    google = []
    for r in data.get("reviews", []):
        text = (r.get("originalText") or r.get("text") or {}).get("text", "").strip()
        auteur = r.get("authorAttribution", {}).get("displayName", "").strip()
        if not text or auteur in EXCLUS:
            continue
        google.append({"texte": text, "nom": short_name(r.get("authorAttribution", {}).get("displayName", "")),
                       "prestation": "", "etoiles": int(r.get("rating", 5))})
    key = lambda t: re.sub(r"\W+", "", t.lower())[:60]
    seen = {key(g["texte"]) for g in google}
    manual = [e for e in read_existing() if key(e.get("texte", "")) not in seen]
    # on réutilise la prestation saisie à la main pour un même client
    by_name = {e.get("nom"): e for e in read_existing()}
    for g in google:
        if g["nom"] in by_name and by_name[g["nom"]].get("prestation"):
            g["prestation"] = by_name[g["nom"]]["prestation"]
    avis = google + manual
    note = round(float(data.get("rating", 5)), 1)
    nombre = int(data.get("userRatingCount", len(avis)))

    lines = ",\n".join("  " + json.dumps({k: v for k, v in a.items() if v != ""}, ensure_ascii=False)
                       .replace('{"', "{ ").replace('": ', ": ").replace(', "', ", ").replace("}", " }") for a in avis)
    out = f'''/* ==========================================================================
   AVIS GOOGLE — mis à jour automatiquement chaque jour (tools/maj_avis_google.py)
   --------------------------------------------------------------------------
   Vous pouvez aussi ajouter un avis à la main dans la liste ; il sera conservé.
   Format : {{ texte: "…", nom: "Prénom N.", prestation: "…", etoiles: 5 }},
   ========================================================================== */

window.NOTE_GOOGLE = {{ note: {note:g}, nombre: {nombre} }};

window.AVIS = [
{lines}{"," if lines else ""}
];
'''
    old = open(AVIS_JS, encoding="utf-8").read()
    if out != old:
        open(AVIS_JS, "w", encoding="utf-8").write(out)
        print(f"avis.js mis à jour : note {note}, {nombre} avis, {len(avis)} affichés")
    else:
        print("Aucun changement")


if __name__ == "__main__":
    main()
