import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Controls from "./components/Controls";
import StationList from "./components/StationList";
import Map from "./components/Map";
import { fetchStationsAround } from "./lib/api";
import { distanceKm, geocodeCity } from "./lib/geo";
import type { FuelType, Position, SortMode, Station } from "./types";

// Centre par défaut : Paris (changera dès qu'on a l'autorisation de géoloc)
const DEFAULT_CENTER: Position = { lat: 48.8566, lng: 2.3522 };

// Rayon de recherche par défaut
const DEFAULT_RADIUS_KM = 10;

// Nombre maximum de stations affichées dans la liste de gauche
const LIST_LIMIT = 80;

export default function App() {
  const [center, setCenter] = useState<Position>(DEFAULT_CENTER);
  const [centerLabel, setCenterLabel] = useState<string>(
    "Paris (par défaut) — géolocalisez-vous ou cherchez une ville"
  );
  const [origin, setOrigin] = useState<Position | undefined>(undefined);
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM);
  const [fuelFilter, setFuelFilter] = useState<FuelType | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("distance");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Pour annuler une requête API obsolète quand l'utilisateur bouge
  const abortRef = useRef<AbortController | null>(null);

  // Géolocalisation au démarrage (silencieuse)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(p);
        setCenter(p);
        setCenterLabel("📍 Ma position");
      },
      () => {
        // Pas d'autorisation → on garde Paris en attendant une action utilisateur
      },
      { timeout: 6000, maximumAge: 60_000 }
    );
  }, []);

  // Charger les stations autour du centre (avec annulation)
  const loadStations = useCallback(
    async (
      pos: Position,
      radius: number,
      fuel: FuelType | "all"
    ): Promise<void> => {
      // Annuler la requête précédente
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);
      setError(null);
      try {
        const list = await fetchStationsAround(pos, radius, fuel, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setStations(list);
        setLastUpdate(new Date());
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(
          `Impossible de charger les stations : ${
            (e as Error).message || "erreur réseau"
          }`
        );
        setStations([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    },
    []
  );

  // (Re)charger quand le centre / rayon / carburant change
  useEffect(() => {
    loadStations(center, radiusKm, fuelFilter);
  }, [center.lat, center.lng, radiusKm, fuelFilter, loadStations]);

  const handleLocate = () => {
    setLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée par ce navigateur.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(p);
        setCenter(p);
        setCenterLabel("📍 Ma position");
        setLocating(false);
      },
      (err) => {
        setError(`Impossible de vous localiser : ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchCity = async (city: string) => {
    setSearching(true);
    setError(null);
    const pos = await geocodeCity(city);
    if (!pos) {
      setError(`Ville introuvable : « ${city} »`);
      setSearching(false);
      return;
    }
    setCenter(pos);
    setOrigin(pos);
    setCenterLabel(city);
    setSearching(false);
  };

  const handleRefresh = () => loadStations(center, radiusKm, fuelFilter);

  // Calcul distance + tri + cap à LIST_LIMIT
  const visibleStations = useMemo(() => {
    const ref = origin ?? center;
    const withDistance = stations.map((s) => ({
      ...s,
      distanceKm: distanceKm(ref, { lat: s.lat, lng: s.lng }),
    }));

    const sorted = [...withDistance];
    if (sortMode === "price") {
      sorted.sort((a, b) => {
        const pa =
          fuelFilter === "all"
            ? Math.min(...a.fuels.map((f) => f.price))
            : a.fuels.find((f) => f.type === fuelFilter)?.price ?? Infinity;
        const pb =
          fuelFilter === "all"
            ? Math.min(...b.fuels.map((f) => f.price))
            : b.fuels.find((f) => f.type === fuelFilter)?.price ?? Infinity;
        return pa - pb;
      });
    } else {
      sorted.sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return sorted.slice(0, LIST_LIMIT);
  }, [stations, origin, center, sortMode, fuelFilter]);

  const totalFound = stations.length;
  const lastUpdateLabel = lastUpdate
    ? lastUpdate.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⛽</span>
          <div>
            <h1 className="font-bold text-lg leading-none">Essence Malin</h1>
            <p className="text-[11px] text-emerald-100 leading-tight mt-0.5">
              Prix officiels en temps réel · data.economie.gouv.fr
            </p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs text-emerald-100">
            {totalFound} station{totalFound > 1 ? "s" : ""} dans {radiusKm} km
          </div>
          <div className="text-[10px] text-emerald-200">
            MàJ {lastUpdateLabel}
          </div>
        </div>
      </header>

      {/* Contrôles */}
      <Controls
        fuelFilter={fuelFilter}
        setFuelFilter={setFuelFilter}
        sortMode={sortMode}
        setSortMode={setSortMode}
        radiusKm={radiusKm}
        setRadiusKm={setRadiusKm}
        onLocate={handleLocate}
        onSearchCity={handleSearchCity}
        onRefresh={handleRefresh}
        locating={locating}
        searching={searching}
        loading={loading}
        centerLabel={centerLabel}
      />

      {/* Erreur éventuelle */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-sm text-red-700 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Corps : carte + liste (responsive) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Carte */}
        <div className="flex-1 min-h-[40vh] md:min-h-0 relative">
          <Map
            center={center}
            stations={visibleStations}
            selectedId={selectedId}
            origin={origin}
            fuelFilter={fuelFilter}
            radiusKm={radiusKm}
            onSelect={setSelectedId}
          />
          {loading && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-md text-xs text-slate-700 flex items-center gap-2 border border-slate-200">
              <span className="inline-block w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              Chargement des prix officiels…
            </div>
          )}
        </div>

        {/* Liste */}
        <aside className="md:w-96 md:max-w-sm border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50 overflow-hidden flex flex-col">
          <StationList
            stations={visibleStations}
            totalFound={totalFound}
            listLimit={LIST_LIMIT}
            origin={origin}
            fuelFilter={fuelFilter}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
          />
        </aside>
      </div>

      {/* Footer */}
      <footer className="px-4 py-2 text-[11px] text-slate-500 bg-white border-t border-slate-200 text-center">
        Données :{" "}
        <a
          href="https://www.prix-carburants.gouv.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 hover:underline"
        >
          prix-carburants.gouv.fr
        </a>{" "}
        (Licence Ouverte) · Carte © OpenStreetMap · Géocodage :{" "}
        <a
          href="https://adresse.data.gouv.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 hover:underline"
        >
          adresse.data.gouv.fr
        </a>
      </footer>
    </div>
  );
}
