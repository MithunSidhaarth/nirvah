import React, { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

/**
 * Animates from 0 to `value` once scrolled into view. Renders the
 * formatted string, not raw digits, so it can carry suffixes like
 * "+", "min" etc. straight through.
 */
export default function CountUp({ value, prefix = "", suffix = "", decimals = 0, duration = 1.6 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      setDisplay(v.toFixed(decimals));
    });
    return unsub;
  }, [spring, decimals]);

  return (
    <span ref={ref}>
      {prefix}
      {Number(display).toLocaleString()}
      {suffix}
    </span>
  );
}
