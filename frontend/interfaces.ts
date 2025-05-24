interface drone {
  id: string;
  name: string;
  description: string;
  type: "land" | "water" | "air" | "space";
  engineType: "fuel" | "electric";
  fuelOrBatteryLevel: number;
  currentLatitude: number;
  currentLongitude: number;
  maxSpeedKmh: number;
  maxDistanceKm: number;
  pricePerHourUSD: number;
  noiseLevelDb: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  maxLoadKg: number;
  specialization:
    | "rescue"
    | "reconnaissance"
    | "assault"
    | "transport"
    | "agriculture"
    | "delivery";
  isActive?: boolean;
  isOnMission?: boolean;
}

export type { drone };