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
import { useState } from "react";
import LoadingCircleSpinner from "./LoadingSpinner";

interface Mission {
  id: number;
  startLocation: string;
  endLocation: string;
  status: "Zakończona" | "W trakcie" | "Anulowana";
  startTime: string;
  endTime?: string;
  droneId: string;
  startLan: number;
  startLon: number;
  endLan: number;
  endLon: number;
}

const sampleData: Mission[] = [
  {
    id: 1,
    startLocation: "Warszawa",
    endLocation: "Kraków",
    status: "W trakcie",
    startTime: "2023-10-01T10:00:00Z",
    endTime: "2023-10-01T12:00:00Z",
    droneId: "DR12345",
    startLan: 52.2297,
    startLon: 21.0122,
    endLan: 50.0647,
    endLon: 19.945,
  },
  {
    id: 2,
    startLocation: "Wrocław",
    endLocation: "Poznań",
    status: "Zakończona",
    startTime: "2023-10-02T09:00:00Z",
    endTime: "2023-10-02T11:00:00Z",
    droneId: "DR67890",
    startLan: 51.1079,
    startLon: 17.0385,
    endLan: 52.4084,
    endLon: 16.9342,
  },
  {
    id: 3,
    startLocation: "Gdańsk",
    endLocation: "Sopot",
    status: "Anulowana",
    startTime: "2023-10-03T08:00:00Z",
    endTime: "2023-10-03T09:30:00Z",
    droneId: "DR54321",
    startLan: 54.352,
    startLon: 18.6466,
    endLan: 54.4416,
    endLon: 18.5605,
  },
];

export default function MissionTable({
  raports = false,
}: {
  raports?: boolean;
}): JSX.Element {
  const [data, _setData] = useState<Mission[]>(sampleData);
  const [isLoading, _setIsLoading] = useState<boolean>(false);

  return data && data.length > 0 ? (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Id Drona</TableHead>
          <TableHead>Lok. początkowa</TableHead>
          <TableHead>Lok. końcowa</TableHead>
          <TableHead>Status</TableHead>
          {raports && <TableHead>Raport</TableHead>}
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.slice(0, 4).map((mission) => (
          <TableRow key={mission.id}>
            <TableCell>{mission.droneId}</TableCell>
            <TableCell>{mission.startLocation}</TableCell>
            <TableCell>{mission.endLocation}</TableCell>
            <TableCell>{mission.status}</TableCell>
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
                        <strong>Id Drona:</strong> {mission.droneId}
                      </p>
                      <p>
                        <strong>Lokacja początkowa:</strong>{" "}
                        {mission.startLocation} ({mission.startLan},{" "}
                        {mission.startLon})
                      </p>
                      <p>
                        <strong>Lokacja końcowa:</strong> {mission.endLocation}{" "}
                        ({mission.endLan}, {mission.endLon})
                      </p>
                      <p>
                        <strong>Status:</strong> {mission.status}
                      </p>
                      <p>
                        <strong>Czas rozpoczęcia:</strong>{" "}
                        {new Date(mission.startTime).toLocaleString()}
                      </p>
                      <p>
                        <strong>Czas zakończenia:</strong>{" "}
                        {mission.status === "Zakończona"
                          ? mission.endTime &&
                            new Date(mission.endTime).toLocaleString()
                          : mission.status === "Anulowana"
                          ? "Misja anulowana"
                          : "N/A"}
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
          <Button variant="outline" onClick={() => _setData(sampleData)}>
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
