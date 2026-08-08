import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";

/**
 * Seamless infinite marquee: renders children twice back to back and
 * animates the whole track left by exactly one copy's width, looping.
 *
 * Speed is expressed in pixels-per-second (not a fixed duration), and the
 * loop duration is derived from the *measured* width of one copy. This
 * keeps the perceived speed identical on a 375px phone and a 1440px
 * desktop -- a fixed-second tween looks noticeably slower on narrow
 * viewports because far fewer items pass by per loop.
 */
export default function Marquee({ children, speed = 90, className = "" }) {
  const setRef = useRef(null);
  const controls = useAnimationControls();
  const [duration, setDuration] = useState(20);

  useEffect(() => {
    const el = setRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setDuration(w / speed);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [speed]);

  useEffect(() => {
    controls.start({
      x: ["0%", "-50%"],
      transition: { duration, ease: "linear", repeat: Infinity },
    });
  }, [duration, controls]);

  return (
    <div className={`nv-marquee ${className}`}>
      <motion.div className="nv-marquee-track" animate={controls}>
        <div className="nv-marquee-set" ref={setRef}>{children}</div>
        <div className="nv-marquee-set" aria-hidden="true">{children}</div>
      </motion.div>
    </div>
  );
}
