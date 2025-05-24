import { useLocation, useRoutes } from "react-router-dom";
import Header from "./Layout/Header";
import { cloneElement } from "react";
import LandingPage from "./Sites/LandingPage/LandingPage";
import { AnimatePresence } from "framer-motion";
import MissionsPage from "./Sites/Missions/MissionsPage";
import AppLandingPage from "./Sites/AppLandingPage/AppLandingPage";

export default function App(): JSX.Element | null {
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
      ],
    },
  ]);

  const location = useLocation();
  if (!element) return null;

  return (
    <AnimatePresence mode="wait">
      {cloneElement(element, { key: location.pathname })}
    </AnimatePresence>
  );
}
