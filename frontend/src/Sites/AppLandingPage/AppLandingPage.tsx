import { LayoutGrid } from "@/components/ui/layout-grid";
import { motion } from "framer-motion";
import { AnalogClock } from "@hoseinh/react-analog-clock";
import FormattedClock from "@/components/ui/FormattedDigitalClock";
import MissionTable from "@/components/ui/MissionTable";
import GlobeComponent from "@/components/ui/GlobeComponent";

export default function AppLandingPage(): JSX.Element {


  const cards = [
    {
      id: 1,
      content: <></>,
      className: "md:col-span-2",
      thumbnail: (
        <div className="h-full max-h-[360px] p-4 flex relative flex-col gap-4 justify-between pt-16 overflow-y-auto">
          <div className="absolute w-full top-0 left-0 z-20 p-4 bg-black">
            <p className="text-2xl font-semibold">Twoje misje</p>
          </div>
          <MissionTable />
        </div>
      ),
    },
    {
      id: 2,
      content: <></>,
      className: "col-span-1",
      thumbnail: (
        <div className="h-full flex flex-col justify-between">
          <div className="w-full h-full flex flex-col items-center justify-center">
            <AnalogClock />
          </div>
          <p className="font-bold font-poppins md:text-4xl mb-4 text-xl text-white">
            <FormattedClock />
          </p>
          <p className="font-bold font-poppins md:text-4xl mb-4 text-xl text-white">
            Czas UTC
          </p>
        </div>
      ),
    },
    {
      id: 3,
      content: <></>,
      className: "col-span-1",
      thumbnail: (
        <div className="h-full flex flex-col justify-between">
          <GlobeComponent size="small"/>
        </div>
      ),
    },
    {
      id: 4,
      content: <></>,
      className: "md:col-span-2",
      thumbnail: (
        <div className="h-full max-h-[360px] p-4 flex relative flex-col gap-4 justify-between pt-16 overflow-y-auto">
          <div className="absolute w-full top-0 left-0 z-20 p-4 bg-black">
            <p className="text-2xl font-semibold">
              Statystyki (ostatnie 30 dni)
            </p>
          </div>
          <div className="flex w-full h-full justify-between items-center px-8">
            <div className="flex items-center flex-col flex-1 justify-center gap-4 font-poppins font-bold">
              <p className="text-center text-2xl">Ilość misji</p>
              <p className="text-xl">5</p>
            </div>
            <div className="h-2/3 w-0.5 bg-border"></div>
            <div className="flex items-center flex-col justify-center flex-1 gap-4 font-poppins font-bold">
              <p className="text-center text-2xl">Łączna długość misji</p>
              <p className="text-xl">12km</p>
            </div>
            <div className="h-2/3 w-0.5 bg-border"></div>
            <div className="flex items-center flex-col justify-center gap-4 flex-1 font-poppins font-bold">
              <p className="text-center text-2xl">Łączne wydatki</p>
              <p className="text-xl">128zł 16gr</p>
            </div>
          </div>
        </div>
      ),
    },
  ];


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="w-screen h-screen mt-12 flex flex-col items-center justify-center gap-8"
    >
      <LayoutGrid cards={cards} />
    </motion.div>
  );
}