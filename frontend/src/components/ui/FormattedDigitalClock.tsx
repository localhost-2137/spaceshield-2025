import { useState, useEffect } from "react";

const padZero = (num: number) => num.toString().padStart(2, "0");

const FormattedClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = padZero(time.getHours());
  const minutes = padZero(time.getMinutes());
  const seconds = padZero(time.getSeconds());

  return (
    <p
        className="text-2xl font-poppins font-bold"
    >
      {hours}:{minutes}:{seconds}
    </p>
  );
};

export default FormattedClock;
