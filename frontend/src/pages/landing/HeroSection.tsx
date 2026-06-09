import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight, BrainCircuit, FileText, Target, Layers, GraduationCap,
  BarChart, Sparkles, TrendingUp, Award, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  motion, useMotionValue, useSpring, useTransform,
  AnimatePresence, useInView,
} from "framer-motion";
import { FadeIn } from "./Animations";

// Animated counter — counts up from 0 when the element enters the viewport.
const Counter = ({ value, className = "" }: { value: string; className?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView) return;
    const match = value.match(/^([\d.]+)(.*)$/);
    if (!match) { setDisplay(value); return; }
    const target = parseFloat(match[1]);
    const tail = match[2] || "";
    const isInt = target % 1 === 0;
    const duration = 1300;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = target * eased;
      setDisplay(`${isInt ? Math.floor(v).toString() : v.toFixed(1)}${tail}`);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return <span ref={ref} className={className}>{display}</span>;
};

const ROTATING_WORDS = ["Perfect College", "Dream College", "Best-fit College", "Right College"];

// Mouse-parallax hook — returns spring-smoothed x/y in [-1, 1]
const useParallax = (strength = 1) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 60, damping: 18, mass: 0.6 });
  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2 * strength;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2 * strength;
    x.set(nx);
    y.set(ny);
  };
  const reset = () => { x.set(0); y.set(0); };
  return { sx, sy, onMouseMove, reset };
};

export const HeroSection = () => {
  const { sx, sy, onMouseMove, reset } = useParallax(1);
  const sectionRef = useRef<HTMLElement>(null);

  // Rotating headline word
  const [wordIdx, setWordIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setWordIdx((i) => (i + 1) % ROTATING_WORDS.length), 3200);
    return () => clearInterval(id);
  }, []);

  // Mobile preview carousel (swipes/auto-advances between 3 product previews)
  const [mobileCard, setMobileCard] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMobileCard((i) => (i + 1) % 3), 4500);
    return () => clearInterval(id);
  }, []);

  // Parallax transforms for foreground layers (pixels)
  const tx1 = useTransform(sx, [-1, 1], [-10, 10]);
  const ty1 = useTransform(sy, [-1, 1], [-8, 8]);
  const tx2 = useTransform(sx, [-1, 1], [14, -14]);
  const ty2 = useTransform(sy, [-1, 1], [12, -12]);
  const tx3 = useTransform(sx, [-1, 1], [-8, 8]);
  const ty3 = useTransform(sy, [-1, 1], [8, -8]);

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onMouseLeave={reset}
      className="relative min-h-[82vh] lg:min-h-[86vh] flex items-center overflow-hidden"
      style={{
        paddingTop: "80px",
        paddingBottom: "100px",
      }}
    >
      {/* ─── Background stack — light, warm, premium ─── */}
      <div className="absolute inset-0">
        {/* Cream → peach gradient base (Option A) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #FFF9F3 0%, #FFE8D6 55%, #FFD4B5 100%)",
          }}
        />

        {/* Soft animated gradient mesh — low opacity blobs */}
        <motion.div
          className="absolute -top-24 -left-16 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(255,107,53,0.22), transparent 70%)", filter: "blur(40px)" }}
          animate={{ x: [0, 30, -10, 0], y: [0, -20, 10, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -right-20 w-[560px] h-[560px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(236,64,122,0.18), transparent 70%)", filter: "blur(50px)" }}
          animate={{ x: [0, -24, 12, 0], y: [0, 18, -8, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 left-1/4 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(124,58,237,0.14), transparent 70%)", filter: "blur(60px)" }}
          animate={{ x: [0, 18, -14, 0], y: [0, -14, 10, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Soft grid overlay for texture (5% opacity) */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.9) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          }}
        />

        {/* Subtle bottom fade into page background */}
        <div
          className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
          style={{ background: "linear-gradient(to top, #FFF9F3, transparent)" }}
        />
      </div>

      <div className="site-container relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 items-center">
          {/* ─────────────── LEFT COLUMN ─────────────── */}
          <div className="lg:col-span-7 relative">
            {/* Badge pills */}
            <FadeIn>
              <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white"
                  style={{
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[12px] font-semibold tracking-wide" style={{ color: "#1A1A1A" }}>
                    <strong className="font-extrabold">10,000+</strong> JEE aspirants
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white"
                  style={{
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <span className="inline-flex rounded-full h-2 w-2" style={{ background: "#7C3AED" }} />
                  <span className="text-[12px] font-semibold tracking-wide" style={{ color: "#1A1A1A" }}>
                    2026 Season Live
                  </span>
                  <Sparkles className="w-3 h-3" style={{ color: "#FF6B35" }} />
                </motion.div>
              </div>
            </FadeIn>

            {/* Main heading */}
            <FadeIn delay={0.08}>
              <h1
                className="tracking-tight text-center lg:text-left mb-6"
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: "#1A1A1A",
                  fontSize: "clamp(36px, 6.2vw, 72px)",
                }}
              >
                Find Your{" "}
                <span className="relative inline-block align-baseline">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={ROTATING_WORDS[wordIdx]}
                      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -18, filter: "blur(6px)" }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="inline-block bg-clip-text text-transparent"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, #FF6B35 0%, #F7B267 50%, #EC407A 100%)",
                      }}
                    >
                      {ROTATING_WORDS[wordIdx]}
                    </motion.span>
                  </AnimatePresence>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.9, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full origin-left"
                    style={{
                      background: "linear-gradient(90deg, #FF6B35 0%, #F7B267 50%, #EC407A 100%)",
                    }}
                  />
                </span>
                <br className="hidden sm:block" /> After JEE
              </h1>
            </FadeIn>

            {/* Subheading */}
            <FadeIn delay={0.14}>
              <p
                className="max-w-xl mx-auto lg:mx-0 mb-8 text-center lg:text-left"
                style={{
                  color: "#4A4A4A",
                  lineHeight: 1.6,
                  fontSize: "clamp(16px, 1.6vw, 18px)",
                }}
              >
                We crunch{" "}
                <span
                  className="font-semibold"
                  style={{ background: "rgba(255, 107, 53, 0.12)", padding: "1px 6px", borderRadius: 6, color: "#1A1A1A" }}
                >
                  1.2 million data points
                </span>{" "}
                from{" "}
                <span
                  className="font-semibold"
                  style={{ background: "rgba(255, 107, 53, 0.12)", padding: "1px 6px", borderRadius: 6, color: "#1A1A1A" }}
                >
                  10 years of JoSAA cutoffs
                </span>{" "}
                across 130+ IITs, NITs &amp; IIITs — so you don't have to.
              </p>
            </FadeIn>

            {/* CTA buttons */}
            <FadeIn delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start mb-8 w-full">
                <Link to="/predictor" className="w-full sm:w-auto group">
                  <Button
                    className="btn-shine relative w-full sm:w-[220px] h-12 rounded-[14px] border-0 font-bold text-[14px] transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
                      color: "#FFFFFF",
                      padding: "16px 32px",
                      boxShadow: "0 10px 30px rgba(255, 107, 53, 0.25)",
                    }}
                  >
                    Find My Colleges
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/ai-counsellor" className="w-full sm:w-auto group">
                  <Button
                    className="w-full sm:w-[200px] h-12 rounded-[14px] font-bold text-[14px] transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: "#FFFFFF",
                      color: "#1A1A1A",
                      border: "1.5px solid rgba(0,0,0,0.08)",
                      padding: "16px 24px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                    }}
                  >
                    <Sparkles className="mr-2 w-4 h-4 group-hover:rotate-12 transition-transform" style={{ color: "#FF6B35" }} />
                    AI Counsellor
                  </Button>
                </Link>
              </div>
            </FadeIn>

            {/* Free limited-time counsellor-sheet promo */}
            <FadeIn delay={0.23}>
              <Link to="/counsellor-sheet" className="group block mb-8">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="flex flex-col sm:flex-row items-center gap-3 rounded-[16px] px-4 py-3 max-w-xl mx-auto lg:mx-0"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,107,53,0.10), rgba(236,64,122,0.08))",
                    border: "1px solid rgba(255,107,53,0.25)",
                    boxShadow: "0 6px 20px rgba(255,107,53,0.10)",
                  }}
                >
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide shrink-0"
                    style={{ background: "linear-gradient(135deg, #FF6B35, #F7931E)", color: "#FFFFFF" }}
                  >
                    <Sparkles className="w-3 h-3" /> Limited Time · Free
                  </span>
                  <p className="text-[13px] sm:text-[14px] font-bold text-center sm:text-left flex-1" style={{ color: "#1A1A1A" }}>
                    Get your counselling college sheet by rank
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-[13px] font-extrabold whitespace-nowrap transition-all group-hover:scale-[1.03] shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
                      color: "#FFFFFF",
                      boxShadow: "0 6px 18px rgba(255,107,53,0.30)",
                    }}
                  >
                    Get Counsellor Sheet
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </motion.div>
              </Link>
            </FadeIn>

            {/* Stats cards */}
            <FadeIn delay={0.26}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md sm:max-w-none mx-auto lg:mx-0">
                {[
                  { value: "1.2M+", label: "Data Points", icon: Layers, iconBg: "rgba(255, 107, 53, 0.12)", iconColor: "#FF6B35" },
                  { value: "130+", label: "Colleges", icon: GraduationCap, iconBg: "rgba(16, 185, 129, 0.12)", iconColor: "#10B981" },
                  { value: "10 Yrs", label: "Cutoff Data", icon: BarChart, iconBg: "rgba(124, 58, 237, 0.12)", iconColor: "#7C3AED" },
                  { value: "96%", label: "Accuracy", icon: Award, iconBg: "rgba(236, 64, 122, 0.12)", iconColor: "#EC407A" },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ y: -4 }}
                      className="flex items-center gap-3 rounded-[20px] cursor-default select-none"
                      style={{
                        background: "rgba(255,255,255,0.98)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                        padding: "16px",
                        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s cubic-bezier(0.4,0,0.2,1)",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: stat.iconBg }}
                      >
                        <Icon className="w-5 h-5" style={{ color: stat.iconColor }} />
                      </div>
                      <div className="text-left min-w-0">
                        <Counter
                          value={stat.value}
                          className="block font-extrabold leading-none tabular-nums text-[22px] sm:text-[26px] lg:text-[28px]"
                        />
                        <div className="mt-1" style={{ fontSize: 11, color: "#6B6B6B", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600 }}>
                          {stat.label}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </FadeIn>

            {/* Mobile-only swipeable preview carousel */}
            <FadeIn delay={0.32}>
              <div className="lg:hidden mt-8 mx-auto max-w-md">
                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mobileCard}
                      initial={{ opacity: 0, x: 40, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -40, scale: 0.96 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.25}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -60) setMobileCard((i) => (i + 1) % 3);
                        else if (info.offset.x > 60) setMobileCard((i) => (i + 2) % 3);
                      }}
                      className="relative overflow-hidden touch-pan-y"
                      style={{
                        borderRadius: 20,
                        background: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.06)",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
                      }}
                    >
                      {mobileCard === 0 && (
                        <>
                          <div className="h-1" style={{ background: "linear-gradient(90deg, #FF6B35, #F7B267, #EC407A)" }} />
                          <div className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6B35, #F7931E)", boxShadow: "0 6px 18px rgba(255,107,53,0.3)" }}>
                                <Target className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-bold leading-tight" style={{ color: "#1A1A1A" }}>College Predictor</h4>
                                <p className="text-[11px] font-semibold" style={{ color: "#FF6B35" }}>Sample: Rank 3,200, OPEN</p>
                              </div>
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(16,185,129,0.14)", color: "#059669" }}>
                                <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-500" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }} />
                                LIVE
                              </div>
                            </div>
                            <div className="space-y-2">
                              {[
                                { label: "Safe", pct: 85, color: "from-emerald-400 to-emerald-500", text: "#059669" },
                                { label: "Target", pct: 60, color: "from-amber-400 to-amber-500", text: "#D97706" },
                                { label: "Dream", pct: 35, color: "from-violet-400 to-violet-500", text: "#7C3AED" },
                              ].map((bar, i) => (
                                <div key={bar.label} className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold w-11" style={{ color: bar.text }}>{bar.label}</span>
                                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#FFF0E6" }}>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${bar.pct}%` }}
                                      transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: "easeOut" }}
                                      className={`h-full bg-gradient-to-r ${bar.color} rounded-full`}
                                    />
                                  </div>
                                  <span className="text-[10px] font-extrabold w-8 text-right tabular-nums" style={{ color: "#1A1A1A" }}>{bar.pct}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {mobileCard === 1 && (
                        <>
                          <div className="h-1" style={{ background: "linear-gradient(90deg, #F7931E, #FF6B35, #EC407A)" }} />
                          <div className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F7931E, #FF6B35)", boxShadow: "0 6px 18px rgba(247,147,30,0.3)" }}>
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-bold leading-tight" style={{ color: "#1A1A1A" }}>Counsellor Sheet</h4>
                                <p className="text-[11px] font-semibold" style={{ color: "#F7931E" }}>JoSAA-ready preference order</p>
                              </div>
                              <div className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(255,107,53,0.14)", color: "#C2410C" }}>
                                PDF
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              {[
                                { text: "IIT Delhi — CSE", tag: "SAFE", bg: "rgba(16,185,129,0.1)", tc: "#059669", bc: "rgba(16,185,129,0.25)" },
                                { text: "NIT Trichy — ECE", tag: "TARGET", bg: "rgba(245,158,11,0.1)", tc: "#D97706", bc: "rgba(245,158,11,0.25)" },
                                { text: "IIIT Hyd — CSE", tag: "DREAM", bg: "rgba(124,58,237,0.1)", tc: "#7C3AED", bc: "rgba(124,58,237,0.25)" },
                              ].map((row, i) => (
                                <motion.div
                                  key={row.text}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                                  style={{ background: "#FFF9F3", border: "1px solid rgba(0,0,0,0.04)" }}
                                >
                                  <span className="text-[10px] font-bold tabular-nums w-5" style={{ color: "#6B6B6B" }}>#{i + 1}</span>
                                  <span className="text-[11px] flex-1 font-medium" style={{ color: "#4A4A4A" }}>{row.text}</span>
                                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border" style={{ background: row.bg, color: row.tc, borderColor: row.bc }}>
                                    {row.tag}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {mobileCard === 2 && (
                        <>
                          <div className="h-1" style={{ background: "linear-gradient(90deg, #7C3AED, #EC407A, #FF6B35)" }} />
                          <div className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}>
                                <BrainCircuit className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-[12px] font-bold" style={{ color: "#1A1A1A" }}>AI Counsellor</span>
                              <span className="ml-auto flex items-center gap-1">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                </span>
                                <span className="text-[10px] font-bold" style={{ color: "#059669" }}>Online</span>
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="rounded-xl px-3 py-2 text-[11px] max-w-[75%] font-medium" style={{ background: "#FFF0E6", color: "#4A4A4A" }}>
                                NIT CSE or IIT Mech for rank 3,200?
                              </div>
                              <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4, duration: 0.4 }}
                                className="rounded-xl px-3 py-2 text-[11px] ml-auto max-w-[85%]"
                                style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(236,64,122,0.08))", border: "1px solid rgba(255,107,53,0.15)", color: "#1A1A1A" }}
                              >
                                NIT CSE — <strong>2×</strong> better median (₹18L vs ₹9L) with 94% placement.
                              </motion.div>
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Dot indicators + next button */}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <button
                          key={i}
                          onClick={() => setMobileCard(i)}
                          aria-label={`Show preview ${i + 1}`}
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: i === mobileCard ? 24 : 6,
                            background: i === mobileCard ? "#FF6B35" : "rgba(0,0,0,0.15)",
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setMobileCard((i) => (i + 1) % 3)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold active:scale-95 transition-transform"
                      style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", color: "#4A4A4A", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                    >
                      Next <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-center text-[10px] font-semibold mt-2" style={{ color: "#6B6B6B" }}>Swipe to explore</p>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* ─────────────── RIGHT COLUMN ─────────────── */}
          <div className="hidden lg:flex lg:col-span-5 relative h-[460px] w-full items-center justify-center">
            {/* Card 1 — Predictor probability bars */}
            <FadeIn delay={0.2}>
              <motion.div
                style={{ x: tx1, y: ty1 }}
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 z-30"
              >
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="relative w-[290px] overflow-hidden"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 20,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="h-1" style={{ background: "linear-gradient(90deg, #FF6B35, #F7B267, #EC407A)" }} />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6B35, #F7931E)", boxShadow: "0 8px 20px rgba(255,107,53,0.3)" }}>
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold" style={{ color: "#1A1A1A" }}>College Predictor</h4>
                        <p className="text-[11px] font-semibold" style={{ color: "#FF6B35" }}>Your chances, ranked</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold" style={{ background: "rgba(16,185,129,0.14)", color: "#047857" }}>
                        <motion.span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.6, repeat: Infinity }}
                        />
                        LIVE
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: "Safe", pct: 85, color: "from-emerald-400 to-emerald-500", text: "#059669" },
                        { label: "Target", pct: 60, color: "from-amber-400 to-amber-500", text: "#D97706" },
                        { label: "Dream", pct: 35, color: "from-violet-400 to-violet-500", text: "#7C3AED" },
                      ].map((bar, i) => (
                        <div key={bar.label} className="flex items-center gap-2.5">
                          <span className="text-[11px] font-bold w-12" style={{ color: bar.text }}>{bar.label}</span>
                          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "#FFF0E6" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${bar.pct}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                              className={`h-full bg-gradient-to-r ${bar.color} rounded-full shadow-sm`}
                            />
                          </div>
                          <span className="text-[11px] font-extrabold w-9 text-right tabular-nums" style={{ color: "#1A1A1A" }}>
                            {bar.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 flex items-center justify-between text-[10px] font-semibold" style={{ borderTop: "1px solid rgba(0,0,0,0.05)", color: "#6B6B6B" }}>
                      <span>Based on 10-yr JoSAA trends</span>
                      <TrendingUp className="w-3 h-3" style={{ color: "#10B981" }} />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </FadeIn>

            {/* Card 2 — Counsellor sheet mini */}
            <FadeIn delay={0.3}>
              <motion.div
                style={{ x: tx2, y: ty2 }}
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-44 -left-8 z-20"
              >
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="w-[260px] p-5"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 20,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F7931E, #FF6B35)", boxShadow: "0 8px 20px rgba(247,147,30,0.3)" }}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: "#1A1A1A" }}>Counsellor Sheet</h4>
                      <p className="text-[11px] font-semibold" style={{ color: "#F7931E" }}>JoSAA-ready</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { text: "IIT Delhi — CSE", tag: "SAFE", bg: "rgba(16,185,129,0.1)", tc: "#059669", bc: "rgba(16,185,129,0.25)" },
                      { text: "NIT Trichy — ECE", tag: "TARGET", bg: "rgba(245,158,11,0.1)", tc: "#D97706", bc: "rgba(245,158,11,0.25)" },
                      { text: "IIIT Hyd — CSE", tag: "DREAM", bg: "rgba(124,58,237,0.1)", tc: "#7C3AED", bc: "rgba(124,58,237,0.25)" },
                    ].map((row, i) => (
                      <motion.div
                        key={row.text}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors"
                        style={{ background: "#FFF9F3", border: "1px solid rgba(0,0,0,0.04)" }}
                      >
                        <span className="text-[9px] font-bold tabular-nums w-4" style={{ color: "#6B6B6B" }}>#{i + 1}</span>
                        <span className="text-[11px] flex-1 font-medium" style={{ color: "#4A4A4A" }}>{row.text}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold border" style={{ background: row.bg, color: row.tc, borderColor: row.bc }}>
                          {row.tag}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 flex items-center justify-between text-[10px] font-semibold" style={{ borderTop: "1px solid rgba(0,0,0,0.05)", color: "#6B6B6B" }}>
                    <span>Drag-and-drop priority</span>
                    <span className="font-bold" style={{ color: "#FF6B35" }}>→ PDF</span>
                  </div>
                </motion.div>
              </motion.div>
            </FadeIn>

            {/* Card 3 — AI Chat bubble */}
            <FadeIn delay={0.4}>
              <motion.div
                style={{ x: tx3, y: ty3 }}
                animate={{ y: [0, -9, 0], rotate: [0, 0.6, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-12 right-2 z-40"
              >
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="w-[280px] p-4"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 20,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}>
                      <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-bold" style={{ color: "#1A1A1A" }}>AI Counsellor</span>
                    <span className="ml-auto flex items-center gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: "#059669" }}>Online</span>
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-xl px-3 py-2 text-[11px] max-w-[190px] font-medium" style={{ background: "#FFF0E6", color: "#4A4A4A" }}>
                      NIT CSE or IIT Mech for rank 3200?
                    </div>
                    <div className="rounded-xl px-3 py-2 text-[11px] ml-auto max-w-[220px]" style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(236,64,122,0.08))", border: "1px solid rgba(255,107,53,0.15)", color: "#1A1A1A" }}>
                      NIT CSE has <strong>2×</strong> better median (₹18L vs ₹9L) and 94% placement — I'd go CSE unless core is your calling.
                    </div>
                    <div className="flex items-center gap-1 px-3">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{ background: "#FF6B35" }}
                          animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </FadeIn>

            {/* Social proof pill */}
            <FadeIn delay={0.45}>
              <motion.div
                animate={{ y: [0, 6, 0], x: [0, -4, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 left-0 z-10"
              >
                <div
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="flex -space-x-2">
                    {[
                      { bg: "linear-gradient(135deg, #FFD4B5, #FF6B35)", label: "R" },
                      { bg: "linear-gradient(135deg, #FDE68A, #F7931E)", label: "P" },
                      { bg: "linear-gradient(135deg, #A7F3D0, #10B981)", label: "A" },
                    ].map((u, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-extrabold"
                        style={{ background: u.bg, borderColor: "#FFFFFF", color: "#FFFFFF" }}
                      >
                        {u.label}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: "#1A1A1A" }}>10K+ students</div>
                    <div className="text-[10px] font-semibold" style={{ color: "#6B6B6B" }}>on CounsellorWala this season</div>
                  </div>
                </div>
              </motion.div>
            </FadeIn>

            {/* Orbital ring — warm tones */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] pointer-events-none">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="w-full h-full rounded-full"
                style={{
                  border: "1px dashed transparent",
                  borderTopColor: "rgba(255,107,53,0.3)",
                  borderRightColor: "rgba(236,64,122,0.22)",
                  borderBottomColor: "rgba(124,58,237,0.2)",
                }}
              >
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full" style={{ background: "#FF6B35", boxShadow: "0 0 14px rgba(255,107,53,0.6)" }} />
                <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: "#EC407A", boxShadow: "0 0 10px rgba(236,64,122,0.5)" }} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll cue — in normal flow below the grid so it never overlaps the stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="hidden lg:flex flex-col items-center gap-2 mt-12"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: "#6B6B6B" }}>Scroll</span>
          <div className="w-6 h-10 rounded-full flex justify-center pt-2" style={{ border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(6px)" }}>
            <motion.span
              animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-2 rounded-full"
              style={{ background: "#FF6B35" }}
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
};
