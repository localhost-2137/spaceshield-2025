import { motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { dronesAtom } from "../../../atoms";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  List,
  PlusCircle,
  Route,
  Search,
  Warehouse,
  Weight,
} from "lucide-react";
import { useEffect, useState } from "react";
import DroneSheet from "@/components/DroneSheet";
import { drone } from "interfaces";
import droneImage from "../../assets/drone.png";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MarketPlacePage(): JSX.Element {
  const droneData = useAtomValue(dronesAtom);
  const availableDrones = droneData.filter(
    (drone) => drone.isActive && !drone.isOnMission
  );
  const [dronesToMap, setDronesToMap] = useState<drone[]>(availableDrones);
  const [search, setSearch] = useState<string>("");
  const [minMaxLoad, setMinMaxLoad] = useState<number>();
  const [minMaxDistance, setMinMaxDistance] = useState<number>();
  const [type, setType] = useState<string | null>(null);
  const [detailsDroneId, setDetailsDroneId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    let filteredDrones = availableDrones;

    if (search) {
      filteredDrones = filteredDrones.filter((drone) =>
        drone.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (minMaxLoad !== undefined) {
      filteredDrones = filteredDrones.filter(
        (drone) => drone.maxLoadKg >= minMaxLoad
      );
    }

    if (minMaxDistance !== undefined) {
      filteredDrones = filteredDrones.filter(
        (drone) => drone.maxDistanceKm >= minMaxDistance
      );
    }

    if (type) {
      filteredDrones = filteredDrones.filter((drone) => drone.type === type);
    }

    // Dodaj warunek, by uniknąć niepotrzebnych aktualizacji stanu
    if (JSON.stringify(filteredDrones) !== JSON.stringify(dronesToMap)) {
      setDronesToMap(filteredDrones);
    }
  }, [search, minMaxLoad, minMaxDistance, availableDrones, type, dronesToMap]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="h-screen overflow-y-auto w-full flex gap-8 flex-col relative items-center justify-center pt-96 pb-24"
    >
      <h2 className="text-2xl font-poppins font-semibold">
        Szukaj dostępnych bezzałogowców
      </h2>
      <div className="flex items-center gap-8">
        <div className="flex w-full max-w-sm items-center border rounded-lg px-2.5 py-1.5">
          <Search className="h-4 w-4 mr-2.5" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full border-0 focus:!outline-none active:!outline-none focus:!ring-0"
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
        </div>
        <div className="flex w-full max-w-sm items-center border rounded-lg px-2.5 py-1.5">
          <Weight className="h-4 w-4 mr-2.5" />
          <Input
            type="number"
            placeholder="Minimalna ładowność"
            className="w-full border-0 focus:!outline-none active:!outline-none focus:!ring-0"
            onChange={(e) => {
              setMinMaxLoad(+e.target.value);
            }}
          />
        </div>
        <div className="flex w-full max-w-sm items-center border rounded-lg px-2.5 py-1.5">
          <Route className="h-4 w-4 mr-2.5" />
          <Input
            type="number"
            placeholder="Minimalny zasięg"
            className="w-full border-0 focus:!outline-none active:!outline-none focus:!ring-0"
            onChange={(e) => {
              setMinMaxDistance(+e.target.value);
            }}
          />
        </div>
        <div className="flex w-full max-w-sm items-center border rounded-lg px-2.5 py-1.5">
          <Warehouse className="h-4 w-4 mr-2.5" />
          <Select
            onValueChange={(e) => {
              setType(e === "" ? null : e);
            }}
          >
            <SelectTrigger className="w-full border-none">
              <SelectValue placeholder="Wybierz typ drona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="land">Lądowy</SelectItem>
              <SelectItem value="water">Wodny</SelectItem>
              <SelectItem value="air">Powietrzny</SelectItem>
              <SelectItem value="space">Kosmiczny</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-evenly w-[70%] flex-wrap">
        {dronesToMap.length > 0 ? (
          dronesToMap.map((drone, i) => (
            <motion.div
              key={drone.id}
              initial={{ opacity: 0, translateY: -5 }}
              animate={{
                opacity: 1,
                translateY: 0,
                transition: { duration: 0.2, delay: 1 + 0.1 * i },
              }}
              className="m-4 w-[30%]"
            >
              <Card key={drone.id} className="relative overflow-hidden">
                <img src={droneImage} className="peer" alt="" />
                <div className="absolute z-20 -bottom-40 peer-hover:bottom-0 hover:bottom-0 bg-black/60 transition-all w-full">
                  <CardHeader>
                    <CardTitle>{drone.name}</CardTitle>
                    <CardDescription>{drone.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">
                      Domena: {drone.specialization}
                    </p>
                    <p className="text-gray-400">Typ: {drone.type}</p>
                    <p className="text-gray-400">
                      Maks. dystans {drone.maxDistanceKm}km
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center gap-2">
                    <Button
                      className="flex-1"
                      variant={"default"}
                      onClick={() => {
                        //TODO: NAVIGACJA DO MISJI DRONA
                        // navigate(`/app/drone/${drone.id}`);
                      }}
                    >
                      <PlusCircle className="mr-2 w-4 h-4" />
                      Utwórz misję
                    </Button>
                    <Button
                      variant={"ghost"}
                      onClick={() => {
                        setDetailsDroneId(drone.id);
                        setIsOpen(true);
                      }}
                    >
                      <List className="mr-2 w-4 h-4" />
                    </Button>
                  </CardFooter>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="w-full flex items-center justify-center p-8">
            <p className="text-lg font-semibold">
              Nie znaleziono bezzałogowców.
            </p>
          </div>
        )}
      </div>
      <DroneSheet
        droneId={detailsDroneId}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </motion.div>
  );
}
