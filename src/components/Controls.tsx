import { useState } from "react";
import { FUEL_TYPES, type FuelType, type SortMode } from "../types";

interface Props {
  fuelFilter: FuelType | "all";
  setFuelFilter: (v: FuelType | "all") => void;
  sortMode: SortMode;
  setSortMode: (v: SortMode) => void;
  radiusKm: number;
  setRadiusKm: (v: number) => void;
  onLocate: () => void;
  onSearchCity: (city: string) => Promise<void>;
  onRefresh: () => void;
  locating: boolean;
  searching: boolean;
  loading: boolean;
  centerLabel: string;
}

const RADIUS_OPTIONS = [2, 5, 10, 20, 50];

export default function Controls({
  fuelFilter,
  setFuelFilter,
  sortMode,
  setSortMode,
  radiusKm,
  setRadiusKm,
  onLocate,
  onSearchCity,
  onRefresh,
  locating,
  searching,
  loading,
  centerLabel,
}: Props) {
  const [cityInput, setCityInput] = useState("");

  const submitCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cityInput.trim()) await onSearchCity(cityInput.trim());
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#0a0a0b] border-b border-white/10">
      <form onSubmit={submitCity} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            🔍
          </span>
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Rechercher une ville (ex : Lyon)"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#00E676]/50 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2 text-sm font-medium text-black bg-[#00E676] rounded-lg hover:bg-[#00E676]/90 disabled:opacity-50 transition"
        >
          {searching ? "…" : "Chercher"}
        </button>
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          title="Ma position"
          className="px-3 py-2 text-sm font-medium text-white bg-white/[0.03] border border-white/10 rounded-lg hover:border-white/20 disabled:opacity-50 transition"
        >
          {locating ? "…" : "📍"}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title="Actualiser"
          className="px-3 py-2 text-sm font-medium text-white bg-white/[0.03] border border-white/10 rounded-lg hover:border-white/20 disabled:opacity-50 transition"
        >
          {loading ? "…" : "🔄"}
        </button>
      </form>

      <div className="text-xs text-white/50 flex items-center gap-1 truncate">
        <span className="shrink-0">📌</span>
        <span className="truncate">{centerLabel}</span>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1.5 font-medium">
          Carburant
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={fuelFilter === "all"}
            onClick={() => setFuelFilter("all")}
            label="Tous"
          />
          {FUEL_TYPES.map((f) => (
            <FilterChip
              key={f}
              active={fuelFilter === f}
              onClick={() => setFuelFilter(f)}
              label={f}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[180px]">
          <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1.5 font-medium">
            Rayon
          </div>
          <div className="flex gap-1">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium border transition ${
                  radiusKm === r
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.03] text-white/70 border-white/10 hover:border-white/20"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1.5 font-medium">
            Trier
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setSortMode("distance")}
              className={`px-3 py-1 rounded text-xs font-medium border transition ${
                sortMode === "distance"
                  ? "bg-white text-black border-white"
                  : "bg-white/[0.03] text-white/70 border-white/10 hover:border-white/20"
              }`}
            >
              📏 Distance
            </button>
            <button
              onClick={() => setSortMode("price")}
              className={`px-3 py-1 rounded text-xs font-medium border transition ${
                sortMode === "price"
                  ? "bg-white text-black border-white"
                  : "bg-white/[0.03] text-white/70 border-white/10 hover:border-white/20"
              }`}
            >
              💶 Prix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
        active
          ? "bg-[#00E676] text-black border-[#00E676]"
          : "bg-white/[0.03] text-white/70 border-white/10 hover:border-[#00E676]/40 hover:text-[#00E676]"
      }`}
    >
      {label}
    </button>
  );
}
