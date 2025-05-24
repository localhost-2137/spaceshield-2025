import { motion } from "framer-motion";

function LoadingCircleSpinner() {
  return (
    <div className="
        flex items-center justify-center p-10 rounded-xl
    ">
      <motion.div
        className="w-12 h-12 border-4 border-t-4 rounded-[50%] border-t-blue-500"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

export default LoadingCircleSpinner;
