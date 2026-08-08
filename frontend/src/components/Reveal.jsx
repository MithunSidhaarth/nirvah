import React, { useEffect, useRef, useState } from "react";

/**
 * Wraps children and fades/slides them in once they enter the viewport.
 * Purely presentational, no external dependencies.
 */
export default function Reveal({ children, className = "", delay = 0, as = "div", ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={`nv-reveal ${visible ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
