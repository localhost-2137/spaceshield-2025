import { motion } from "framer-motion";

export default function MissionsPage(): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="w-screen h-screen flex flex-col items-center justify-center gap-8"
    >
      
    </motion.div>
  );
}
