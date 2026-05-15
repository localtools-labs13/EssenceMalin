export type FuelType = "SP95" | "SP98" | "E10" | "Gazole" | "GPL" | "E85";

export const FUEL_TYPES: FuelType[] = ["SP95", "SP98", "E10", "Gazole", "GPL", "E85"];

export interface FuelPrice {
  type: FuelType;
  price: number; // €/L
  updatedAt: string; // ISO date
}

export interface Station {
  id: string;
  brand: string;
  address: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
  fuels: FuelPrice[];
}

export type SortMode = "price" | "distance";

export interface Position {
  lat: number;
  lng: number;
}
