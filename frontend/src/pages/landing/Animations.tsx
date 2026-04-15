import React from "react";
import { motion } from "framer-motion";

export const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
    {children}
  </motion.div>
);

export const ScaleIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
    {children}
  </motion.div>
);
