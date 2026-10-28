import { useEffect, useRef, useState } from "react";

export const AnimatedNumber = ({ value, suffix = "" }) => {
  const ref = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let numericValue = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(numericValue)) numericValue = 0;

    let start = 0;
    const duration = 1200;
    const increment = Math.max(1, Math.floor(numericValue / (duration / 20)));

    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
};
