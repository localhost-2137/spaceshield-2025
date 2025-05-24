import UberLESSLogo from "../../assets/UberLESSLogo.svg";
import LandingPageBackgroundImage from "../../assets/LandingBackground.jpg";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage(): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="w-screen h-screen flex flex-col items-center justify-center gap-8"
    >
      <img src={UberLESSLogo} alt="UberLESS Logo" />
      <motion.img
        initial={{ opacity: 0 }}
        animate={{ opacity: .2, transition: { duration: 0.5, delay: 1 } }}
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
        src={LandingPageBackgroundImage}
        className="-z-10 absolute w-screen h-screen left-0 top-0"
        alt=""
      />
      <h2 className="font-poppins text-3xl font-bold">
        Jak uber - ale bez kierowcy
      </h2>
      <Button
        variant="ghost"
        asChild
        className="px-8 text-xl py-4 font-bold font-poppins border-2 rounded-full border-white"
      >
        <Link to="/app">Zaczynajmy</Link>
      </Button>
    </motion.div>
  );
}
