import Globe from "react-globe.gl";
import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { dronesAtom } from "../../../atoms";
import { useNavigate } from "react-router-dom";
import DroneSheet from "../DroneSheet";

export default function GlobeComponent({
  size = "small",
}: {
  size: "small" | "large";
}): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [choosenDroneId, setChoosenDroneId] = useState<string | null>(null);
  const navigate = useNavigate();
  const globeEl = useRef<any>();
  const droneData = useAtomValue(dronesAtom);
  const droneLocationData = droneData.map((drone) => ({
    lat: drone.currentLatitude,
    lng: drone.currentLongitude,
    color:
      drone.type === "air" ? "blue" : drone.type === "land" ? "green" : "red",
    size: 24,
    id: drone.id,
  }));

  const markerSvg = `<svg viewBox="-4 0 36 36">
    <path fill="currentColor" d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"></path>
    <circle fill="black" cx="14" cy="14" r="7"></circle>
  </svg>`;

  useEffect(() => {
    globeEl.current.pointOfView({ lat: 0, lng: 0, altitude: 2 });
    size === "small"
      ? () => {
          globeEl.current.controls().autoRotateSpeed = 1.4;
          globeEl.current.controls().autoRotate = true;
          globeEl.current.controls().enableZoom = false;
        }
      : () => {
          globeEl.current.controls().autoRotateSpeed = 0;
          globeEl.current.controls().autoRotate = false;
          globeEl.current.controls().enableZoom = true;
        };

    globeEl.current.controls().autoRotate = true;
    globeEl.current.controls().autoRotateSpeed = 0.35;
  }, []);

  return (
    <>
      <Globe
        ref={globeEl}
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
        width={size === "large" ? 1920 : 400}
        height={size === "large" ? 1080 : 400}
        htmlElementsData={droneLocationData}
        htmlElement={(d: any) => {
          const el = document.createElement("div");
          el.innerHTML = markerSvg;
          el.style.color = d.color;
          el.style.width = `${d.size}px`;
          el.style.transition = "opacity 250ms";
          //@ts-ignore
          el.style["pointer-events"] = "auto";
          el.style.cursor = "pointer";

          if (size === "small") {
            el.onclick = () => navigate(`/app/globe`);
          } else {
            el.onclick = () => {
              setIsOpen(true);
              setChoosenDroneId(d.id);
            };
          }
          return el;
        }}
        htmlElementVisibilityModifier={(el, isVisible) =>
          (el.style.opacity = isVisible ? "1" : "0")
        }
      />
      <DroneSheet
        droneId={choosenDroneId}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </>
  );
}
