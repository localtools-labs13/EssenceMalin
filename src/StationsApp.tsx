import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Controls from "./components/Controls";
import StationList from "./components/StationList";
import Map from "./components/Map";
import { fetchStationsAround } from "./lib/api";
import { distanceKm, geocodeCity } from "./lib/geo";
import type { FuelType, Position, SortMode, Station } from "./types";

const DEFAULT_CENTER: Position = { lat: 48.8566, lng: 2.3522 };
const DEFAULT_RADIUS_KM = 10;
const LIST_LIMIT = 80;

interface Props {
  initialCity?: string;
  onBack: () => void;
}

export default function StationsApp({ initialCity, onBack }: Props) {
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

  const abortRef = useRef<AbortController | null>(null);

  // Géolocalisation au démarrage
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(p);
        setCenter(p);
        setCenterLabel("📍 Ma position");
      },
      () => {},
      { timeout: 6000, maximumAge: 60_000 }
    );
  }, []);

  // Si une ville a été passée depuis la landing, on géocode
  useEffect(() => {
    if (!initialCity) return;
    (async () => {
      const pos = await geocodeCity(initialCity);
      if (pos) {
        setCenter(pos);
        setOrigin(pos);
        setCenterLabel(initialCity);
      }
    })();
  }, [initialCity]);

  const loadStations = useCallback(
    async (pos: Position, radius: number, fuel: FuelType | "all"): Promise<void> => {
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

  useEffect(() => {
    loadStations(center, radiusKm, fuelFilter);
  }, [center.lat, center.lng, radiusKm, fuelFilter, loadStations]);

  const handleLocate = () => {
    setLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée.");
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
        setError(`Localisation impossible : ${err.message}`);
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
    ? lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0b] text-white">
      {/* Header dark premium */}
      <header className="bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <span className="w-8 h-8 rounded-full border border-[#00E676]/40 flex items-center justify-center">
            <span className="font-display text-[#00E676] text-lg leading-none">o</span>
          </span>
          <span className="text-sm font-medium hidden sm:inline">Retour à l'accueil</span>
        </button>
        <div className="text-right">
          <div className="text-xs text-white/70">
            {totalFound} station{totalFound > 1 ? "s" : ""} · {radiusKm} km
          </div>
          <div className="text-[10px] text-white/40">
            MàJ {lastUpdateLabel} · données officielles
          </div>
        </div>
      </header>

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

      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-sm text-red-300 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-300 text-xs">✕</button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
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
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-full text-xs text-white flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-[#00E676] border-t-transparent rounded-full animate-spin" />
              Chargement des prix officiels…
            </div>
          )}
        </div>

        <aside className="md:w-96 md:max-w-sm border-t md:border-t-0 md:border-l border-white/10 bg-[#0a0a0b] overflow-hidden flex flex-col">
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

      <footer className="px-4 py-2 text-[11px] text-white/40 bg-[#0a0a0b] border-t border-white/10 text-center">
        Données :{" "}
        <a
          href="https://www.prix-carburants.gouv.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00E676]/80 hover:text-[#00E676]"
        >
          prix-carburants.gouv.fr
        </a>{" "}
        · Licence Ouverte · Carte © OpenStreetMap
      </footer>
    </div>
  );
}
