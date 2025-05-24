import Globe from "react-globe.gl";
import { useEffect, useRef } from "react";

export default function GlobeComponent(): JSX.Element {
  const globeEl = useRef<any>();

  useEffect(() => {
    if (globeEl.current && typeof globeEl.current.controls === "function") {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 1.4;
      globeEl.current.controls().enableZoom = false;

      globeEl.current.pointOfView({ lat: 0, lng: 0, altitude: 2 });
    }

    globeEl.current.controls().autoRotate = true;
    globeEl.current.controls().autoRotateSpeed = 0.35;
  }, []);

  return (
    <Globe
      ref={globeEl}
      globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
      width={400}
      height={400}
    />
  );
}
