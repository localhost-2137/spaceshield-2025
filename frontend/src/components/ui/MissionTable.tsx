import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./button";
import { List } from "lucide-react";
import { useEffect, useState } from "react";
import LoadingCircleSpinner from "./LoadingSpinner";

interface Mission {
  id: string;
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
  name: string;
  description: string;
  locationLongitude: number;
  locationLatitude: number;
  startTime: string;
  expectedEndTime: string;
  goal: string;
  endTime: any;
  drones: any[];
}

export default function MissionTable({
  raports = false,
}: {
  raports?: boolean;
}): JSX.Element {
  const [data, setData] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await fetch("http://localhost:3000/missions")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          setData(data);
        });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return data && data.length > 0 ? (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Id Misji</TableHead>
          <TableHead>Lok. początkowa</TableHead>
          <TableHead>Lok. końcowa</TableHead>
          <TableHead>Status</TableHead>
          {raports && <TableHead>Raport</TableHead>}
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.slice(0, 4).map((mission, i) => (
          <TableRow key={mission.id}>
            <TableCell>{i + 1}</TableCell>
            <TableCell>Londyn</TableCell>
            <TableCell>
              Stalowa Wola
            </TableCell>
            <TableCell>
              {i !== data.length - 1 ? "Zakończona" : "W trakcie"}
            </TableCell>
            {raports && (
              <TableCell>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Handle report generation logic here
                    alert(`Generowanie raportu dla misji ${mission.id}`);
                  }}
                >
                  Generuj Raport
                </Button>
              </TableCell>
            )}
            <TableCell>
              <Dialog>
                <DialogTrigger>
                  <Button variant={"ghost"}>
                    <List className="w-6 h-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Więcej informacji</DialogTitle>
                    <DialogDescription>
                      <p>
                        <strong>Id Drona:</strong> 1
                      </p>
                      <p>
                        <strong>Lokacja początkowa:</strong> Stalowa Wola
                      </p>
                      <p>
                        <strong>Lokacja końcowa:</strong> Kraków (
                        {mission.locationLatitude}, {mission.locationLongitude})
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {i !== data.length - 1 ? "Zakończona" : "W trakcie"}
                      </p>
                      <p>
                        <strong>Czas rozpoczęcia:</strong>{" "}
                        {new Date(mission.startTime).toLocaleString()}
                      </p>
                      <p>
                        <strong>Czas zakończenia:</strong>{" "}
                        {new Date(mission.expectedEndTime).toLocaleString()}
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {data.length > 3 && (
        <div className="mt-4 -ml-8 text-center">
          <Button variant="outline" onClick={() => {}}>
            Pokaż więcej misji
          </Button>
        </div>
      )}
    </Table>
  ) : isLoading ? (
    <LoadingCircleSpinner />
  ) : (
    <p>Brak Danych</p>
  );
}
