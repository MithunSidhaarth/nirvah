import React from "react";
import { motion } from "framer-motion";

/**
 * Seamless infinite marquee: renders children twice back to back and
 * animates the whole track left by exactly one copy's width, looping.
 */
export default function Marquee({ children, speed = 28, className = "" }) {
  return (
    <div className={`nv-marquee ${className}`}>
      <motion.div
        className="nv-marquee-track"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      >
        <div className="nv-marquee-set">{children}</div>
        <div className="nv-marquee-set" aria-hidden="true">{children}</div>
      </motion.div>
    </div>
  );
}
