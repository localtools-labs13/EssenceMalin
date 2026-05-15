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
    <div className="flex flex-col gap-3 p-4 bg-white border-b border-slate-200">
      {/* Ligne 1 : recherche + géoloc + refresh */}
      <form onSubmit={submitCity} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Rechercher une ville (ex : Lyon)"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {searching ? "…" : "Chercher"}
        </button>
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          title="Ma position"
          className="px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
        >
          {locating ? "…" : "📍"}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title="Actualiser les prix"
          className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 disabled:opacity-50"
        >
          {loading ? "…" : "🔄"}
        </button>
      </form>

      {/* Ligne 2 : centre actuel */}
      <div className="text-xs text-slate-500 flex items-center gap-1 truncate">
        <span className="shrink-0">📌</span>
        <span className="truncate">{centerLabel}</span>
      </div>

      {/* Ligne 3 : filtres carburant */}
      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5 font-medium">
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

      {/* Ligne 4 : rayon + tri */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[180px]">
          <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5 font-medium">
            Rayon
          </div>
          <div className="flex gap-1">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium border transition ${
                  radiusKm === r
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5 font-medium">
            Trier par
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setSortMode("distance")}
              className={`px-3 py-1 rounded text-xs font-medium border transition ${
                sortMode === "distance"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
              }`}
            >
              📏 Distance
            </button>
            <button
              onClick={() => setSortMode("price")}
              className={`px-3 py-1 rounded text-xs font-medium border transition ${
                sortMode === "price"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
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
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:text-emerald-700"
      }`}
    >
      {label}
    </button>
  );
}
