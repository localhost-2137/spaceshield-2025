import GlobeComponent from "@/components/ui/GlobeComponent";
import { motion } from "framer-motion";

export default function MapPage(): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="h-full w-full flex flex-col relative items-center justify-center mt-24"
    >
      <div className="absolute z-30 bg-black/40 p-4 rounded-xl flex flex-col items-center justify-center top-0 gap-4">
        <h1 className="text-3xl font-bold mb-4">Mapa Dronów</h1>
        <p className="text-lg mb-8">
          Tutaj możesz zobaczyć lokalizacje dronów na mapie.
        </p>
      </div>
      <GlobeComponent size="large" />
    </motion.div>
  );
}
