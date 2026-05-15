# ⛽ Essence Malin

Application web pour trouver le **carburant le moins cher** autour de soi en France,
avec les **prix officiels en temps réel** des ~10 000 stations-service françaises.

Construite avec **React + Vite + TypeScript + Tailwind CSS** et **Leaflet**.

## ✨ Fonctionnalités

- 🇫🇷 **Toutes les stations de France** (≈ 10 000) — Métropole + DROM
- ⏱️ **Prix officiels en temps réel** — données mises à jour toutes les 10 min
  via l'API ouverte du Ministère de l'Économie
- 📍 **Géolocalisation** automatique au chargement + bouton de relocalisation
- 🔎 **Recherche par ville** via l'API
  [adresse.data.gouv.fr](https://adresse.data.gouv.fr)
- 🗺️ **Carte interactive Leaflet** (OpenStreetMap) avec :
  - cercle vert indiquant le **rayon de recherche** courant
  - marqueur **jaune** pour les stations, **vert foncé** pour la moins chère 🏆
  - point bleu pour la position de l'utilisateur
- ⛽ **Filtres carburant** : SP95, SP98, E10, Gazole, GPL, E85
- 📏 **Rayon ajustable** : 2 / 5 / 10 / 20 / 50 km
- 🔄 **Tri par prix** ou **par distance**
- 📋 **Liste de gauche adaptée à votre position** — les 80 stations les plus
  proches, recalculées dès que vous bougez le centre
- 🏷️ **Fiche station** : adresse, code postal, tous les prix, date de
  dernière mise à jour, distance
- 🧭 **Bouton « Itinéraire »** : ouvre Google Maps depuis votre position vers
  la station
- 📱 **Responsive** : mobile, tablette, desktop

## 🚀 Lancer le projet

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production → dist/
npm run preview  # prévisualiser le build
```

L'application fonctionne **sans backend** : elle interroge directement l'API
publique du Ministère de l'Économie depuis le navigateur (CORS activé).

## 🔌 Source officielle des données

Les prix sont récupérés en direct depuis l'API Opendatasoft du Ministère :

**Endpoint** :
```
https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/
  prix-des-carburants-en-france-flux-instantane-v2/records
```

**Filtre spatial** (utilisé par l'app pour ne charger que ce qui est utile) :
```
where=distance(geom, GEOM'POINT(<lng> <lat>)', <rayon>km)
```

**Caractéristiques** :
- Mise à jour toutes les **10 minutes**
- ~10 000 stations référencées (toutes les stations ouvertes en France)
- Licence : **Licence Ouverte / Open Licence** (Etalab)
- Source amont : `donnees.roulez-eco.fr/opendata/instantane`
  (= `prix-carburants.gouv.fr`)

L'app fait une requête à chaque changement de **centre**, de **rayon** ou
de **filtre carburant**, et **annule** les requêtes obsolètes (AbortController)
si vous bougez avant la fin du chargement.

## 🧠 Comment la liste est triée

1. L'API renvoie les stations dans un rayon autour du centre (géoloc ou ville)
2. L'app calcule la **distance à vol d'oiseau** (formule de Haversine)
3. Les stations sont triées selon votre choix :
   - **📏 Distance** : de la plus proche à la plus lointaine
   - **💶 Prix** : du moins cher au plus cher pour le carburant sélectionné
     (ou pour le carburant le moins cher de chaque station si « Tous »)
4. La liste de gauche affiche les **80 premières** (le reste reste visible
   sur la carte)

## 🗂️ Structure du projet

```
├── index.html
├── package.json
├── README.md
├── src/
│   ├── main.tsx
│   ├── index.css                   # Tailwind + styles Leaflet
│   ├── App.tsx                     # Composant racine, orchestration
│   ├── types.ts                    # Types TypeScript
│   ├── lib/
│   │   ├── api.ts                  # Client de l'API officielle (CORS)
│   │   └── geo.ts                  # Haversine, géocodage ville, itinéraire
│   └── components/
│       ├── Controls.tsx            # Recherche + filtres + rayon + tri
│       ├── Map.tsx                 # Carte Leaflet + cercle de rayon
│       ├── StationList.tsx         # Liste scrollable des 80 plus proches
│       └── StationCard.tsx         # Fiche station avec bouton itinéraire
```

## 🔐 Vie privée

- La géolocalisation HTML5 demande l'autorisation explicite de l'utilisateur.
- Aucune donnée personnelle n'est envoyée à un serveur tiers : les seuls
  appels sortants sont vers :
  - `data.economie.gouv.fr` (API officielle des prix)
  - `api-adresse.data.gouv.fr` (géocodage des villes)
  - `tile.openstreetmap.org` (tuiles de la carte)
- L'ouverture d'un itinéraire se fait via `google.com/maps` dans un nouvel onglet.

## ⚖️ Crédits & licences

- **Prix carburants** : © Ministère de l'Économie, des Finances et de la
  Souveraineté industrielle et numérique — Licence Ouverte / Open Licence v2.0
- **Carte** : © Contributeurs d'OpenStreetMap (ODbL)
- **Géocodage** : © Base Adresse Nationale — Licence Ouverte
- **Code applicatif** : libre
