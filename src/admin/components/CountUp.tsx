import { useEffect, useRef, useState } from "react";

export default function CountUp({ value, duration = 1100, format }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [n, setN] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = ref.current;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = from + (value - from) * eased;
      setN(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
      else ref.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{format ? format(n) : Math.round(n).toLocaleString("fr-FR")}</>;
}
