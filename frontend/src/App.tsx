import { useLocation, useRoutes } from "react-router-dom";
import Header from "./Layout/Header";
import { cloneElement, useEffect, useRef } from "react";
import LandingPage from "./Sites/LandingPage/LandingPage";
import { AnimatePresence } from "framer-motion";
import MissionsPage from "./Sites/Missions/MissionsPage";
import AppLandingPage from "./Sites/AppLandingPage/AppLandingPage";
import MapPage from "./Sites/Map/MapPage";
import MarketPlacePage from "./Sites/MarketPlacePage/MarketPlacePage";
import NewMissionPage from "./Sites/Missions/NewMissionPagte";
import { useSetAtom } from "jotai";
import { dronesAtom } from "../atoms";
import { drone } from "interfaces";

export default function App(): JSX.Element | null {
  const setDronesProperties = useSetAtom(dronesAtom);
  const element = useRoutes([
    {
      path: "/",
      element: <LandingPage />,
    },
    {
      path: "/app",
      element: <Header />,
      children: [
        {
          path: "",
          element: <AppLandingPage />,
        },
        {
          path: "missions",
          element: <MissionsPage />,
        },
        {
          path: "missions/new",
          element: <NewMissionPage />,
        },
        {
          path: "globe",
          element: <MapPage />,
        },
        {
          path: "marketplace",
          element: <MarketPlacePage />,
        },
      ],
    },
  ]);

  const location = useLocation();
  if (!element) return null;
  const socketRef = useRef<WebSocket | null>(null);

  
  useEffect(() => {
    // Tworzymy połączenie WebSocket
    socketRef.current = new WebSocket("ws://localhost:3000/front");

    socketRef.current.onopen = () => {
      console.log("Połączono z WebSocket na ws://localhost:3000/front");
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.length < 1) return;
      setDronesProperties(data.data as drone[]);
    };

    socketRef.current.onerror = (error) => {
      //TODO: handle error
      console.error("Błąd WebSocket:", error);
    };

    socketRef.current.onclose = () => {
      console.log("Połączenie WebSocket zostało zamknięte");
    };

    return () => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {cloneElement(element, { key: location.pathname })}
    </AnimatePresence>
  );
}
