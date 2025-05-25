import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  MinusCircle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

export default function NewMissionPage(): JSX.Element {
  const navigate = useNavigate();
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
  const [selectedDronesIds, setSelectedDronesIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    locationLongitude: 0,
    locationLatitude: 0,
    description: "",
    startTime: "",
    expectedEndTime: "",
    goal: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleLocationInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    const [latitude, longitude] = value.split(",").map((v) => v.trim());
    setFormData((prev) => ({
      ...prev,
      locationLatitude: +latitude,
      locationLongitude: +longitude,
    }));
  };

  const handleMissionTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      goal: value,
    }));
  };

  const handleFormSubmit = (e: any) => {
    e.preventDefault();
    const mission = {
      ...formData,
      drones: selectedDronesIds,
    };
    //@ts-ignore
    mission.startTime = new Date(mission.startTime).getTime();
    //@ts-ignore
    mission.expectedEndTime = new Date(mission.expectedEndTime).getTime();
    console.log("Nowa misja:", mission);
    fetch("/api/mission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mission),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Misja została utworzona:", data);
        navigate("/app/missions");
      })
      .catch((error) => {
        console.error("Błąd podczas tworzenia misji:", error);
      });
  };

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

    if (JSON.stringify(filteredDrones) !== JSON.stringify(dronesToMap)) {
      setDronesToMap(filteredDrones);
    }
  }, [search, minMaxLoad, minMaxDistance, availableDrones, type, dronesToMap]);

  function postMission() {
    //TODO: Implement API call to post the mission
    navigate("/app/missions");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="w-screen h-screen flex flex-col items-center overflow-y-auto mt-16 gap-8"
    >
      <form
        className="w-2/3 p-6 rounded-lg shadow-md flex flex-col gap-4"
        onSubmit={handleFormSubmit}
      >
        <h1 className="text-3xl font-bold mb-4">Nowa Misja</h1>
        <div className="flex flex-row gap-4">
          <div className="flex flex-col gap-4 w-1/2">
            <label className="flex flex-col">
              <span className="mb-2">Nazwa misji</span>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Wprowadź nazwę misji"
                className="border rounded-lg p-2"
              />
            </label>
            <label className="flex flex-col">
              <span className="mb-2">Miejsce misji</span>
              <Input
                type="text"
                onChange={handleLocationInputChange}
                placeholder="Wprowadź miejsce misji (lat, long)"
                className="border rounded-lg p-2"
              />
            </label>
            <label className="flex flex-col">
              <span className="mb-2">Opis misji</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Wprowadź opis misji"
                className="border border-input bg-transparent p-4 rounded-xl"
              />
            </label>
          </div>
          <div className="flex flex-col gap-4 w-1/2">
            <label className="flex flex-col">
              <span className="mb-2">Data i godzina startu</span>
              <Input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="border rounded-lg p-2"
              />
            </label>
            <label className="flex flex-col">
              <span className="mb-2">Data i godzina zakończenia</span>
              <Input
                type="datetime-local"
                name="expectedEndTime"
                value={formData.expectedEndTime}
                onChange={handleInputChange}
                className="border rounded-lg p-2"
              />
            </label>
            <label className="flex flex-col">
              <span className="mb-2">Typ misji</span>
              <Select
                onValueChange={handleMissionTypeChange}
                value={formData.goal}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Wybierz typ misji" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reconnaissance">Rozpoznanie</SelectItem>
                  <SelectItem value="rescue">Ratunek</SelectItem>
                  <SelectItem value="assault">Atak</SelectItem>
                  <SelectItem value="agriculture">Rolnictwo</SelectItem>
                  <SelectItem value="delivery">Dostawa</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>
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
              value={type ?? ""}
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
        <div className="flex items-center justify-evenly w-full flex-wrap">
          {dronesToMap.length > 0 ? (
            dronesToMap.map((drone, i) => {
              const isSelected = selectedDronesIds.includes(drone.id);
              return (
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
                    <div className="absolute z-20 -bottom-48 peer-hover:bottom-0 hover:bottom-0 bg-black/60 transition-all w-full">
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
                        <p className="text-gray-400">
                          Cena za godzinę {drone.pricePerHourUSD} USD
                        </p>
                      </CardContent>
                      <CardFooter className="flex items-center gap-2">
                        <Button
                          variant={isSelected ? "outline" : "default"}
                          className="flex-1"
                          type="button"
                          onClick={() => {
                            if (!isSelected) {
                              setSelectedDronesIds((prev) => [
                                ...prev,
                                drone.id,
                              ]);
                            } else {
                              setSelectedDronesIds((prev) =>
                                prev.filter((id) => id !== drone.id)
                              );
                            }
                          }}
                        >
                          {!isSelected ? (
                            <>
                              <PlusCircle className="mr-2 w-4 h-4" />
                              Dodaj do misji
                            </>
                          ) : (
                            <>
                              <MinusCircle className="mr-2 w-4 h-4" />
                              Usuń z misji
                            </>
                          )}
                        </Button>
                        <Button
                          variant={"ghost"}
                          type="button"
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
              );
            })
          ) : (
            <div className="w-full flex items-center justify-center p-8">
              <p className="text-lg font-semibold">
                Nie znaleziono bezzałogowców.
              </p>
            </div>
          )}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="default"
              type="button"
              className="w-fit"
              //   disabled={!Object.values(formData).every((val) => val.length > 0)}
            >
              Zleć misję
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Podsumowanie misji</DialogTitle>
              <DialogDescription>
                Sprawdź dane i kliknij "Zleć", aby potwierdzić.
              </DialogDescription>
            </DialogHeader>
            <div>
              <strong>Nazwa:</strong> {formData.name}
              <br />
              <strong>Cel:</strong> {formData.goal}
              <br />
              <strong>Opis:</strong> {formData.description}
              <br />
              <strong>Start:</strong> {formData.startTime}
              <br />
              <strong>Koniec:</strong> {formData.expectedEndTime}
              <br />
              <strong>Typ:</strong> {formData.goal}
              <br />
              <strong>Drony:</strong> {selectedDronesIds.join(", ")}
              <br />
              <strong>Łączna cena:</strong>{" "}
              {selectedDronesIds.reduce((total, droneId) => {
                const drone = droneData.find((d) => d.id === droneId);
                if (drone) {
                  const hours = Math.ceil(
                    (new Date(formData.expectedEndTime).getTime() -
                      new Date(formData.startTime).getTime()) /
                      (1000 * 60 * 60)
                  );
                  return total + drone.pricePerHourUSD * hours;
                }
                return total;
              }, 0)}
              USD
            </div>
            <DialogFooter>
              <Button type="submit" onClick={postMission}>
                Zleć
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
      <DroneSheet
        droneId={detailsDroneId}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </motion.div>
  );
}
