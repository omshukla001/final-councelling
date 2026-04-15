import { Link } from "react-router-dom";
import {
  ArrowRight, BrainCircuit, Clock, ShieldCheck, TrendingDown, FileText,
  Layers, GraduationCap, BarChart, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FadeIn } from "./Animations";

export const HeroSection = () => (
  <section className="relative min-h-[95vh] flex items-center overflow-hidden mb-0">
    <div className="absolute inset-0">
      <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80&auto=format" alt="Students collaborating" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(28,18,10,0.88) 0%, rgba(28,18,10,0.75) 35%, rgba(28,18,10,0.5) 60%, rgba(28,18,10,0.35) 100%)" }} />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-orange-900/10" />
    </div>

    <motion.div animate={{ scale: [1, 1.2, 1], x: [0, 25, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-16 right-1/4 w-72 h-72 rounded-full bg-amber-500/10 blur-[100px]" />
    <motion.div animate={{ scale: [1, 0.85, 1], y: [0, -20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-20 left-16 w-80 h-80 rounded-full bg-orange-400/8 blur-[100px]" />
    <motion.div animate={{ x: [0, -15, 0], y: [0, 15, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/3 left-1/2 w-48 h-48 rounded-full bg-violet-400/5 blur-[70px]" />

    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 md:px-24 pt-28 pb-20 relative z-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 relative">
          <FadeIn>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-7 mx-auto lg:mx-0 flex">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-sm font-semibold text-white/80">Trusted by <strong className="text-amber-400">10,000+</strong> JEE aspirants</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] font-extrabold tracking-tight leading-[1.08] mb-5 text-white text-center lg:text-left">
              Find Your{" "}
              <span className="relative inline-block">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">Perfect College</span>
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }} className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full origin-left" />
              </span>
              {" "}After JEE
            </h1>
          </FadeIn>

          <FadeIn delay={0.1}>
            <p className="text-base sm:text-lg text-white/60 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed text-center lg:text-left">
              We crunch <strong className="text-white/90">1.2 million data points</strong> from <strong className="text-white/90">10 years of JoSAA cutoffs</strong> across 130+ IITs, NITs & IIITs — so you don't have to.
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start mb-10 w-full">
              <Link to="/predictor" className="w-full sm:w-auto">
                <Button className="w-full sm:w-[220px] h-14 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-900 font-bold text-[15px] shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-1 transition-all border-0 group btn-glow">
                  Find My Colleges <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/ai-counsellor" className="w-full sm:w-auto">
                <Button className="w-full sm:w-[220px] h-14 px-8 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-[15px] transition-all hover:-translate-y-0.5 backdrop-blur-md shadow-lg group">
                  <BrainCircuit className="mr-2 w-5 h-5 text-amber-400" /> AI Counsellor
                </Button>
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-8">
              {[
                { icon: <Clock className="w-3.5 h-3.5" />, text: "Results in seconds" },
                { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: "Safe / Target / Dream" },
                { icon: <TrendingDown className="w-3.5 h-3.5" />, text: "10-year trend analysis" },
                { icon: <FileText className="w-3.5 h-3.5" />, text: "JoSAA-ready PDF" },
              ].map((chip, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white/8 border border-white/15 text-white/70">
                  {chip.icon} {chip.text}
                </motion.div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.25}>
            <div className="flex flex-wrap justify-center lg:justify-start gap-8">
              {[
                { value: "1.2M+", label: "Data Points", icon: <Layers className="w-5 h-5 text-amber-400" /> },
                { value: "130+", label: "Colleges", icon: <GraduationCap className="w-5 h-5 text-orange-400" /> },
                { value: "10 Yrs", label: "Cutoff Data", icon: <BarChart className="w-5 h-5 text-emerald-400" /> },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">{stat.icon}</div>
                  <div>
                    <div className="text-lg font-extrabold text-white">{stat.value}</div>
                    <div className="text-[10px] text-white/40 font-medium">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* Right - Floating interactive cards */}
        <div className="hidden lg:flex lg:col-span-5 relative h-[540px] w-full items-center justify-center">
          <FadeIn delay={0.2}>
            <motion.div animate={{ y: [0, -12, 0], x: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 right-0 z-30">
              <div className="w-[270px] rounded-2xl bg-white/95 backdrop-blur-md shadow-xl shadow-black/20 border border-white/80 hover:shadow-2xl transition-shadow overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md"><Target className="w-5 h-5 text-white" /></div>
                    <div><h4 className="text-sm font-bold text-stone-800">College Predictor</h4><p className="text-[11px] text-orange-600 font-semibold">Your chances, ranked</p></div>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: "Safe", pct: 85, color: "bg-emerald-500" },
                      { label: "Target", pct: 60, color: "bg-amber-500" },
                      { label: "Dream", pct: 35, color: "bg-violet-500" },
                    ].map((bar) => (
                      <div key={bar.label} className="flex items-center gap-2.5">
                        <span className="text-[11px] font-semibold text-stone-500 w-12">{bar.label}</span>
                        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${bar.pct}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 }}
                            className={`h-full ${bar.color} rounded-full`} />
                        </div>
                        <span className="text-[11px] font-bold text-stone-600 w-8 text-right">{bar.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <motion.div animate={{ y: [0, 10, 0], x: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-40 -left-6 z-20">
              <div className="w-[240px] p-5 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl shadow-black/20 border border-white/80 hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md"><FileText className="w-5 h-5 text-white" /></div>
                  <div><h4 className="text-sm font-bold text-stone-800">Counsellor Sheet</h4><p className="text-[11px] text-amber-600 font-semibold">JoSAA ready</p></div>
                </div>
                <div className="space-y-1.5">
                  {["1. IIT Delhi — CSE", "2. NIT Trichy — ECE", "3. IIIT Hyd — CSE"].map((t, i) => (
                    <div key={t} className="flex items-center gap-2 bg-stone-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-[10px] text-stone-600 flex-1">{t}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${i === 0 ? "bg-emerald-100 text-emerald-600" : i === 1 ? "bg-amber-100 text-amber-600" : "bg-orange-100 text-orange-600"}`}>
                        {i === 0 ? "SAFE" : i === 1 ? "TARGET" : "SAFE"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <motion.div animate={{ y: [0, -9, 0], x: [0, 8, 0], rotate: [0, 1, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-16 right-4 z-40">
              <div className="w-[260px] p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl shadow-black/20 border border-white/80 hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center"><BrainCircuit className="w-3.5 h-3.5 text-amber-400" /></div>
                  <span className="text-xs font-bold text-stone-700">AI Counsellor</span>
                  <span className="ml-auto flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] text-emerald-600 font-medium">Online</span></span>
                </div>
                <div className="space-y-2">
                  <div className="bg-stone-100 rounded-xl px-3 py-2 text-xs text-stone-600 max-w-[180px]">NIT CSE or IIT Mech?</div>
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-xs text-stone-700 ml-auto max-w-[210px]">NIT CSE has <strong>2x</strong> better median package at ₹18L vs ₹9L...</div>
                </div>
              </div>
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.45}>
            <motion.div animate={{ y: [0, 6, 0], x: [0, -4, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-0 left-0 z-10">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/95 backdrop-blur-md shadow-lg shadow-black/15 border border-white/80">
                <div className="flex -space-x-2">
                  {["bg-orange-200", "bg-amber-200", "bg-emerald-200"].map((c, i) => (
                    <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white flex items-center justify-center text-[9px] font-bold text-stone-600`}>
                      {["R", "P", "A"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-700">10K+ students</div>
                  <div className="text-[10px] text-stone-400">already using CounsellorWala</div>
                </div>
              </div>
            </motion.div>
          </FadeIn>

          {/* Orbital rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px]">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-full h-full rounded-full" style={{ border: "2px solid transparent", borderTopColor: "rgba(249,115,22,0.3)", borderRightColor: "rgba(255,255,255,0.1)" }}>
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
            </motion.div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px]">
            <motion.div animate={{ rotate: [0, -360] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="w-full h-full rounded-full" style={{ border: "1px dashed transparent", borderTopColor: "rgba(255,255,255,0.12)", borderLeftColor: "rgba(245,158,11,0.15)" }}>
              <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.7)]" />
            </motion.div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px]">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 45, repeat: Infinity, ease: "linear" }} className="w-full h-full rounded-full" style={{ border: "1px solid transparent", borderTopColor: "rgba(249,115,22,0.2)", borderBottomColor: "rgba(255,255,255,0.05)" }}>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-orange-300/60 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
