/**
 * Shared layout micro-components used across multiple pages.
 * Extracted to eliminate copy-paste duplication.
 */
import { motion } from "framer-motion";
import React from "react";

/**
 * Soft radial gradient backdrop used for atmospheric depth.
 * Place once at the top of a page layout.
 */
export const AtmosphericGlow = () => (
  <div
    className="fixed inset-0 z-[-1] pointer-events-none"
    style={{
      background:
        "radial-gradient(ellipse at 15% 30%, rgba(139,92,246,0.05) 0%, transparent 45%), " +
        "radial-gradient(ellipse at 85% 70%, rgba(59,130,246,0.04) 0%, transparent 40%)",
    }}
  />
);

/**
 * Scroll-triggered fade-in animation wrapper.
 * Uses framer-motion's whileInView for performance.
 */
export const FadeIn = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);
