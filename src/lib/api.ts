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
  pop?: string; // R = routier, A = autoroutier
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

// Cache des marques (ID station -> marque)
const brandCache = new Map<string, string>();
let brandCacheLoaded = false;

/** Charge les marques depuis le flux XML officiel (une seule fois) */
async function loadBrands(): Promise<void> {
  if (brandCacheLoaded) return;
  try {
    // On essaie plusieurs proxies CORS pour maximiser les chances de succès
    const proxies = [
      "https://corsproxy.io/?",
      "https://api.allorigins.win/raw?url=",
      "https://cors-anywhere.herokuapp.com/",
    ];
    
    const targetUrl = "https://donnees.roulez-eco.fr/opendata/instantane";
    let buffer: ArrayBuffer | null = null;
    
    for (const proxyUrl of proxies) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const url = proxyUrl === "https://cors-anywhere.herokuapp.com/" 
          ? proxyUrl + targetUrl
          : proxyUrl + encodeURIComponent(targetUrl);
        
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (res.ok) {
          buffer = await res.arrayBuffer();
          console.log(`✅ Proxy ${proxyUrl} a fonctionné`);
          break;
        }
      } catch (e) {
        console.log(`❌ Proxy ${proxyUrl} a échoué`);
        continue;
      }
    }
    
    if (!buffer) throw new Error("Tous les proxies ont échoué");
    
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    const xmlFile = Object.values(zip.files).find((f: any) => f.name.endsWith(".xml"));
    if (!xmlFile) throw new Error("No XML in zip");
    
    const xmlText = await (xmlFile as any).async("text");
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "text/xml");
    const pdvs = xml.querySelectorAll("pdv");
    
    pdvs.forEach(pdv => {
      const id = pdv.getAttribute("id");
      const marqueEl = pdv.querySelector("marque");
      if (id && marqueEl?.textContent) {
        const brand = marqueEl.textContent.trim();
        if (brand) brandCache.set(id, brand);
      }
    });
    
    brandCacheLoaded = true;
    console.log(`✅ ${brandCache.size} marques chargées depuis le XML officiel`);
  } catch (e) {
    console.warn("⚠️ Marques non chargées, utilisation du fallback:", e);
    brandCacheLoaded = true;
  }
}

interface ApiResponse {
  total_count: number;
  results: ApiRecord[];
}

/** Patterns de détection de marques (clé -> nom normalisé) */
const BRAND_PATTERNS: [RegExp, string][] = [
  // Pétroliers
  [/TOTAL\s*ACCESS/i, "Total Access"],
  [/TOTAL\s*ENERG/i, "TotalEnergies"],
  [/\bTOTAL\b/i, "TotalEnergies"],
  [/\bELF\b/i, "Elf"],
  [/\bBP\b/, "BP"],
  [/ESSO\s*EXPRESS/i, "Esso Express"],
  [/\bESSO\b/i, "Esso"],
  [/\bSHELL\b/i, "Shell"],
  [/\bAVIA\b/i, "Avia"],
  [/\bAGIP\b/i, "Agip"],
  [/\bENI\b/i, "Eni"],
  [/DYNEFF/i, "Dyneff"],
  [/PICOTY/i, "Picoty"],
  [/VITO/i, "Vito"],
  
  // Grande distribution
  [/CARREFOUR\s*MARKET/i, "Carrefour Market"],
  [/CARREFOUR\s*CONTACT/i, "Carrefour Contact"],
  [/CARREFOUR\s*EXPRESS/i, "Carrefour Express"],
  [/\bCARREFOUR\b/i, "Carrefour"],
  [/\bE\.?\s*LECLERC\b/i, "E.Leclerc"],
  [/\bLECLERC\b/i, "E.Leclerc"],
  [/INTERMARCHE\s*CONTACT/i, "Intermarché Contact"],
  [/INTERMARCHE\s*EXPRESS/i, "Intermarché Express"],
  [/INTER\s*MARCHE/i, "Intermarché"],
  [/\bINTERMARCHE\b/i, "Intermarché"],
  [/HYPER\s*U\b/i, "Hyper U"],
  [/SUPER\s*U\b/i, "Super U"],
  [/U\s*EXPRESS/i, "U Express"],
  [/SYSTEME?\s*U/i, "Système U"],
  [/\bAUCHAN\b/i, "Auchan"],
  [/\bCASINO\b/i, "Casino"],
  [/GEANT\b/i, "Géant Casino"],
  [/\bCORA\b/i, "Cora"],
  [/\bMATCH\b/i, "Match"],
  [/\bNETTO\b/i, "Netto"],
  [/\bLIDL\b/i, "Lidl"],
  [/\bMONOPRIX\b/i, "Monoprix"],
  
  // Autoroutes
  [/AIRE\s*DE\b/i, "Station autoroutière"],
  [/AUTOROUTE/i, "Station autoroutière"],
];

/** Essaie de deviner la marque depuis l'adresse, la ville, ou le type de station */
function guessBrand(address: string, city: string, pop?: string): string {
  const text = `${address} ${city}`;
  
  // Chercher dans les patterns
  for (const [pattern, brand] of BRAND_PATTERNS) {
    if (pattern.test(text)) return brand;
  }
  
  // Fallback basé sur le type de station (R = routier, A = autoroutier)
  if (pop === "A") return "Station autoroutière";
  
  return "Station-service";
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

  const address = r.adresse || "Adresse non communiquée";
  const city = r.ville || "";
  const id = String(r.id);
  
  // 1. Chercher dans le cache des vraies marques (chargé depuis XML officiel)
  let brand = brandCache.get(id);
  
  // 2. Sinon, essayer de deviner depuis l'adresse
  if (!brand) {
    brand = guessBrand(address, city, r.pop);
  }

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
  // Charger les marques en arrière-plan (non bloquant)
  loadBrands().catch(() => {});
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
