import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Battery,
  ChevronsDown,
  DollarSign,
  MapPin,
  Ruler,
  Route as RouteIcon,
  Warehouse,
  Volume2,
  Weight,
  Hammer,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAtomValue } from "jotai";
import { dronesAtom } from "../../atoms";
import { useNavigate } from "react-router-dom";

export default function DroneSheet({
  droneId,
  isOpen,
  setIsOpen,
}: {
  droneId: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}): JSX.Element {
  const droneData = useAtomValue(dronesAtom);
  const navigate = useNavigate();

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Dane drona</SheetTitle>
        </SheetHeader>
        {droneId ? (
          droneData
            .filter((drone) => drone.id === droneId)
            .map((drone) => (
              <div
                key={drone.id}
                className="flex flex-col gap-4 text-lg font-medium mt-8"
              >
                <h2 className="text-xl text-center font-bold">{drone.name}</h2>
                <p className="text-center">{drone.description}</p>
                <p className="flex items-center gap-2">
                  <Hammer /> Specjalizacja: {drone.specialization}
                </p>
                <p className="flex items-center gap-2">
                  <Warehouse /> Typ pojazdu: {drone.type}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin />
                  Obecna lokacja:{" "}
                  {`${drone.currentLatitude}, ${drone.currentLongitude}`}
                </p>
                <p className="flex items-center gap-2">
                  <Battery />
                  Poziom baterii: {drone.fuelOrBatteryLevel}%
                </p>
                <p className="flex items-center gap-2">
                  <ChevronsDown />
                  Maksymalna prędkość: {drone.maxSpeedKmh} km/h
                </p>
                <p className="flex items-center gap-2">
                  <RouteIcon />
                  Maksymalny zasięg: {drone.maxDistanceKm} km
                </p>
                <p className="flex items-center gap-2">
                  <DollarSign />
                  Cena za godzinę: ${drone.pricePerHourUSD} USD
                </p>
                <p className="flex items-center gap-2">
                  <Volume2 />
                  Poziom hałasu: {drone.noiseLevelDb} dB
                </p>
                <p className="flex items-center gap-2">
                  <Ruler />
                  Wymiary: {drone.widthCm}x{drone.lengthCm}x{drone.heightCm}{" "}
                  (cm)
                </p>
                <p className="flex items-center gap-2">
                  <Weight />
                  Maksymalne obciążenie: {drone.maxLoadKg} kg
                </p>
                <Button
                  variant={"default"}
                  onClick={() => {
                    //TODO: NAVIGACJA DO MISJI DRONA
                    // navigate(`/app/drone/${drone.id}`);
                  }}
                >
                  <PlusCircle className="mr-2 w-4 h-4" />
                  Utwórz misję
                </Button>
              </div>
            ))
        ) : (
          <p>Wybierz drona</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
