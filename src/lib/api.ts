// Client de l'API officielle des prix carburants en France
// Source : Ministère de l'Économie — data.economie.gouv.fr (Opendatasoft)
// Dataset : prix-des-carburants-en-france-flux-instantane-v2
// Mise à jour : toutes les 10 minutes — Licence Ouverte / Open Licence

import type { FuelType, Station, Position } from "../types";

const BASE =
  "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/" +
  "prix-des-carburants-en-france-flux-instantane-v2/records";

/** Mapping carburant interne ↔ champ API */
const PRICE_FIELDS: Record<FuelType, { price: string; maj: string; nom: string }> = {
  Gazole: { price: "gazole_prix", maj: "gazole_maj", nom: "Gazole" },
  SP95: { price: "sp95_prix", maj: "sp95_maj", nom: "SP95" },
  SP98: { price: "sp98_prix", maj: "sp98_maj", nom: "SP98" },
  E10: { price: "e10_prix", maj: "e10_maj", nom: "E10" },
  GPL: { price: "gplc_prix", maj: "gplc_maj", nom: "GPLc" },
  E85: { price: "e85_prix", maj: "e85_maj", nom: "E85" },
};

interface ApiRecord {
  id: number | string;
  cp?: string;
  adresse?: string;
  ville?: string;
  geom?: { lon: number; lat: number };
  gazole_prix?: number | null;
  gazole_maj?: string | null;
  sp95_prix?: number | null;
  sp95_maj?: string | null;
  sp98_prix?: number | null;
  sp98_maj?: string | null;
  e10_prix?: number | null;
  e10_maj?: string | null;
  gplc_prix?: number | null;
  gplc_maj?: string | null;
  e85_prix?: number | null;
  e85_maj?: string | null;
  departement?: string;
}

interface ApiResponse {
  total_count: number;
  results: ApiRecord[];
}

/** Convertit un enregistrement API en Station interne. */
function toStation(r: ApiRecord): Station | null {
  if (!r.geom || typeof r.geom.lat !== "number" || typeof r.geom.lon !== "number") {
    return null;
  }
  const fuels = [];
  for (const t of Object.keys(PRICE_FIELDS) as FuelType[]) {
    const { price, maj } = PRICE_FIELDS[t];
    const p = r[price as keyof ApiRecord] as number | null | undefined;
    const m = r[maj as keyof ApiRecord] as string | null | undefined;
    if (typeof p === "number" && p > 0) {
      fuels.push({
        type: t,
        price: p,
        updatedAt: m ? String(m).substring(0, 10) : "",
      });
    }
  }
  if (fuels.length === 0) return null;

  // Pas de marque/enseigne dans l'opendata officiel — on affiche le département
  const brand = r.departement ? `Station · ${r.departement}` : "Station-service";

  return {
    id: String(r.id),
    brand,
    address: r.adresse || "Adresse non communiquée",
    city: r.ville
      ? r.ville
          .toLowerCase()
          .replace(/(^|[\s\-'])([\p{L}])/gu, (_, sep, c) => sep + c.toUpperCase())
      : "",
    postalCode: r.cp || "",
    lat: r.geom.lat,
    lng: r.geom.lon,
    fuels,
  };
}

/** Échappe une chaîne pour la clause `where` ODSQL. */
const num = (n: number) => n.toFixed(6);

/**
 * Récupère les stations autour d'une position dans un rayon donné (km).
 * Pagine si nécessaire.
 *
 * @param origin Position centrale
 * @param radiusKm Rayon de recherche
 * @param fuelFilter Si défini, ne retourne que les stations qui proposent ce carburant
 * @param signal AbortSignal pour annuler une requête en cours
 * @param maxResults Plafond (défaut 300) — l'API limite à 100 par page
 */
export async function fetchStationsAround(
  origin: Position,
  radiusKm: number,
  fuelFilter: FuelType | "all",
  signal?: AbortSignal,
  maxResults = 300
): Promise<Station[]> {
  const whereParts: string[] = [
    `distance(geom, GEOM'POINT(${num(origin.lng)} ${num(origin.lat)})', ${Math.round(
      radiusKm
    )}km)`,
  ];
  if (fuelFilter !== "all") {
    whereParts.push(`${PRICE_FIELDS[fuelFilter].price} IS NOT NULL`);
  }
  const where = whereParts.join(" AND ");

  const all: Station[] = [];
  const pageSize = 100;
  let offset = 0;
  let total = Infinity;

  while (offset < total && all.length < maxResults) {
    const url =
      `${BASE}?where=${encodeURIComponent(where)}` +
      `&limit=${pageSize}&offset=${offset}` +
      // tri par ordre alphabétique d'id (stable) — on tri par distance/prix côté client
      `&order_by=id`;
    const res = await fetch(url, { signal });
    if (!res.ok) {
      throw new Error(`API officielle : HTTP ${res.status}`);
    }
    const data = (await res.json()) as ApiResponse;
    total = data.total_count ?? 0;
    for (const r of data.results) {
      const s = toStation(r);
      if (s) all.push(s);
    }
    if (data.results.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}
