import { useState, useEffect } from "react";
import { fetchStationsAround } from "../lib/api";
import type { Station, FuelType, Position } from "../types";

const FUEL_TYPES: FuelType[] = ["SP95", "SP98", "E10", "Gazole", "GPL", "E85"];

export default function Comparator() {
  const [station1, setStation1] = useState<Station | null>(null);
  const [station2, setStation2] = useState<Station | null>(null);
  const [fuel, setFuel] = useState<FuelType>("SP95");
  const [volume, setVolume] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [selectingFor, setSelectingFor] = useState<1 | 2 | null>(null);
  const [loading, setLoading] = useState(false);

  // Rechercher des stations quand on tape une ville
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setStations([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        // Géocoder la ville
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
            searchQuery
          )}&type=municipality&limit=1`
        );
        const data = await res.json();
        const city = data.features?.[0];
        if (!city) {
          setStations([]);
          setLoading(false);
          return;
        }

        const [lng, lat] = city.geometry.coordinates;
        const pos: Position = { lat, lng };

        // Chercher les stations autour
        const list = await fetchStationsAround(pos, 20, "all");
        setStations(list.slice(0, 50));
      } catch (e) {
        console.error(e);
        setStations([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const selectStation = (s: Station) => {
    if (selectingFor === 1) setStation1(s);
    if (selectingFor === 2) setStation2(s);
    setSelectingFor(null);
    setSearchQuery("");
    setStations([]);
  };

  const getPrice = (s: Station | null, f: FuelType): number | null => {
    if (!s) return null;
    const fuelObj = s.fuels.find((x) => x.type === f);
    return fuelObj?.price ?? null;
  };

  const price1 = getPrice(station1, fuel);
  const price2 = getPrice(station2, fuel);

  const diff = price1 !== null && price2 !== null ? Math.abs(price1 - price2) : 0;
  const savings = diff * volume;
  const cheaper = price1 !== null && price2 !== null ? (price1 < price2 ? 1 : 2) : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#00E676] mb-4">
          Comparateur
        </p>
        <h2 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight">
          Comparez 2 stations.
        </h2>
      </div>

      {/* Sélecteurs de stations */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Station 1 */}
        <div>
          <label className="block text-xs text-white/60 mb-2">Station 1</label>
          {station1 ? (
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="font-semibold text-white text-sm mb-1">
                {station1.brand}
              </div>
              <div className="text-xs text-white/70">{station1.address}</div>
              <div className="text-[11px] text-white/50">
                {station1.postalCode} {station1.city}
              </div>
              <button
                onClick={() => setStation1(null)}
                className="mt-2 text-xs text-white/40 hover:text-white transition-colors"
              >
                ✕ Changer
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSelectingFor(1)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-left text-sm text-white/40 hover:border-[#00E676]/40 transition-colors"
            >
              + Choisir une station
            </button>
          )}
        </div>

        {/* Station 2 */}
        <div>
          <label className="block text-xs text-white/60 mb-2">Station 2</label>
          {station2 ? (
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="font-semibold text-white text-sm mb-1">
                {station2.brand}
              </div>
              <div className="text-xs text-white/70">{station2.address}</div>
              <div className="text-[11px] text-white/50">
                {station2.postalCode} {station2.city}
              </div>
              <button
                onClick={() => setStation2(null)}
                className="mt-2 text-xs text-white/40 hover:text-white transition-colors"
              >
                ✕ Changer
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSelectingFor(2)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-left text-sm text-white/40 hover:border-[#00E676]/40 transition-colors"
            >
              + Choisir une station
            </button>
          )}
        </div>
      </div>

      {/* Modal de sélection */}
      {selectingFor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold mb-4">
                Sélectionner Station {selectingFor}
              </h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tapez une ville (ex: Lyon, Paris, Bordeaux…)"
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#00E676]/50"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loading && (
                <div className="text-center text-white/50 py-8">
                  <span className="inline-block w-5 h-5 border-2 border-[#00E676] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loading && stations.length === 0 && searchQuery.length > 0 && (
                <div className="text-center text-white/50 py-8">
                  Aucune station trouvée
                </div>
              )}
              {!loading && stations.length > 0 && (
                <div className="space-y-2">
                  {stations.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectStation(s)}
                      className="w-full text-left bg-white/[0.02] border border-white/10 rounded-lg p-3 hover:border-[#00E676]/40 transition-colors"
                    >
                      <div className="font-medium text-white text-sm">
                        {s.brand}
                      </div>
                      <div className="text-xs text-white/70">{s.address}</div>
                      <div className="text-[11px] text-white/50">
                        {s.postalCode} {s.city}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => {
                  setSelectingFor(null);
                  setSearchQuery("");
                  setStations([]);
                }}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/[0.05] transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paramètres de calcul */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-xs text-white/60 mb-2">Carburant</label>
          <select
            value={fuel}
            onChange={(e) => setFuel(e.target.value as FuelType)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00E676]/50"
          >
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f} className="bg-[#0a0a0b]">
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-2">
            Volume (litres)
          </label>
          <input
            type="number"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            min="1"
            max="200"
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00E676]/50"
          />
        </div>
      </div>

      {/* Résultat */}
      {station1 && station2 && price1 !== null && price2 !== null ? (
        <div className="bg-gradient-to-br from-[#00E676]/5 to-transparent border border-[#00E676]/20 rounded-2xl p-8">
          <div className="text-center mb-6">
            <p className="text-xs text-white/60 uppercase tracking-widest mb-2">
              Économie potentielle
            </p>
            <div className="font-display text-6xl md:text-8xl text-[#00E676] leading-none mb-2">
              {savings.toFixed(2)} €
            </div>
            <p className="text-sm text-white/70">
              pour un plein de {volume}L de {fuel}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-6 border-t border-[#00E676]/20">
            <div
              className={`text-center p-4 rounded-xl ${
                cheaper === 1 ? "bg-[#00E676]/10 border border-[#00E676]/30" : ""
              }`}
            >
              <div className="text-xs text-white/60 mb-1">
                {station1.brand}
                {cheaper === 1 && (
                  <span className="ml-2 text-[#00E676]">✓ Moins cher</span>
                )}
              </div>
              <div className="text-2xl font-light text-white tabular-nums">
                {price1.toFixed(3)} €/L
              </div>
            </div>
            <div
              className={`text-center p-4 rounded-xl ${
                cheaper === 2 ? "bg-[#00E676]/10 border border-[#00E676]/30" : ""
              }`}
            >
              <div className="text-xs text-white/60 mb-1">
                {station2.brand}
                {cheaper === 2 && (
                  <span className="ml-2 text-[#00E676]">✓ Moins cher</span>
                )}
              </div>
              <div className="text-2xl font-light text-white tabular-nums">
                {price2.toFixed(3)} €/L
              </div>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-white/50">
            Différence : {diff.toFixed(3)} €/L
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center text-white/40">
          Sélectionnez 2 stations pour comparer les prix
        </div>
      )}
    </div>
  );
}
