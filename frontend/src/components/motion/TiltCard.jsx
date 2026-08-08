import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Wraps a card and gives it a light 3D tilt that follows the cursor,
 * plus a moving highlight. Springs are soft so it reads as glossy
 * rather than jittery.
 */
export default function TiltCard({ children, className = "", style = {}, maxTilt = 8 }) {
  const ref = useRef(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spx = useSpring(px, { stiffness: 150, damping: 18 });
  const spy = useSpring(py, { stiffness: 150, damping: 18 });

  const rotateX = useTransform(spy, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(spx, [0, 1], [-maxTilt, maxTilt]);
  const glowX = useTransform(spx, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(spy, [0, 1], ["0%", "100%"]);

  function handleMouseMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      className={`nv-tilt-card ${className}`}
      style={{ ...style, rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="nv-tilt-glow"
        style={{
          background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(110,231,183,0.16), transparent 55%)`,
        }}
        aria-hidden="true"
      />
      {children}
    </motion.div>
  );
}
