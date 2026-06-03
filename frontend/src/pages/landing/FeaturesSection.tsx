import { Link } from "react-router-dom";
import {
  Target, BarChart3, Columns, BrainCircuit, FileText, ShieldCheck,
  Sparkles, ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { FadeIn } from "./Animations";

export const FeaturesSection = () => {
  const features = [
    {
      icon: <Target className="w-6 h-6" />, title: "Smart Predictor", desc: "Enter your JEE rank and get Safe, Target & Dream recommendations instantly.",
      iconBg: "bg-gradient-to-br from-violet-500 to-purple-600", link: "/predictor", accent: "group-hover:shadow-violet-200/50",
      img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80&auto=format",
      overlay: "from-violet-600/80 to-purple-700/70",
      preview: (
        <div className="space-y-1.5">
          {["Safe — 12 colleges", "Target — 8 colleges", "Dream — 5 colleges"].map((t, i) => (
            <div key={t} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-emerald-400" : i === 1 ? "bg-amber-400" : "bg-violet-400"}`} />
              <span className="text-[11px] text-white/80">{t}</span>
              <div className={`flex-1 h-1 rounded-full ${i === 0 ? "bg-emerald-400/40" : i === 1 ? "bg-amber-400/40" : "bg-violet-400/40"}`}><div className={`h-full rounded-full ${i === 0 ? "bg-emerald-400" : i === 1 ? "bg-amber-400" : "bg-violet-400"}`} style={{ width: `${90 - i * 25}%` }} /></div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <BarChart3 className="w-6 h-6" />, title: "Cutoff Trends", desc: "Interactive charts showing how branch cutoffs changed over the last decade.",
      iconBg: "bg-gradient-to-br from-orange-500 to-amber-600", link: "/colleges", accent: "group-hover:shadow-orange-200/50",
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format",
      overlay: "from-orange-600/80 to-amber-700/70",
      preview: (
        <div className="flex items-end gap-1 h-10">
          {[65, 45, 55, 35, 50, 30, 40, 25].map((h, i) => (
            <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
              className={`flex-1 rounded-t ${i % 2 === 0 ? "bg-amber-400/60" : "bg-orange-400/60"}`} />
          ))}
        </div>
      ),
    },
    {
      icon: <Columns className="w-6 h-6" />, title: "College Comparison", desc: "Compare up to 3 colleges side-by-side on fees, placements, NIRF & more.",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600", link: "/compare", accent: "group-hover:shadow-amber-200/50",
      img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80&auto=format",
      overlay: "from-amber-600/80 to-orange-700/70",
      preview: (
        <div className="grid grid-cols-3 gap-1.5">
          {["IIT-B", "NIT-T", "IIIT-H"].map((c) => (
            <div key={c} className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
              <div className="text-[9px] text-white/50">{c}</div>
              <div className="text-[11px] font-bold text-white/90">#{Math.floor(Math.random() * 20 + 1)}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <BrainCircuit className="w-6 h-6" />, title: "AI Counsellor", desc: "Chat with AI that understands JoSAA counselling. Get personalized guidance.",
      iconBg: "bg-gradient-to-br from-purple-500 to-indigo-600", link: "/ai-counsellor", accent: "group-hover:shadow-purple-200/50",
      img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80&auto=format",
      overlay: "from-purple-600/80 to-indigo-700/70",
      preview: (
        <div className="space-y-1.5">
          <div className="bg-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white/70 max-w-[70%]">Which NIT for CSE?</div>
          <div className="bg-white/15 rounded-lg px-2.5 py-1.5 text-[10px] text-white/80 ml-auto max-w-[80%]">NIT Trichy has the best placement record for CSE...</div>
        </div>
      ),
    },
    {
      icon: <FileText className="w-6 h-6" />, title: "Counsellor Sheet", desc: "Generate a priority-ordered college list. Export as a JoSAA-ready PDF.",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600", link: "/counsellor-sheet", accent: "group-hover:shadow-amber-200/50",
      img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80&auto=format",
      overlay: "from-amber-600/80 to-orange-700/70",
      preview: (
        <div className="space-y-1">
          {["1. IIT Delhi — CSE", "2. IIT Bombay — ECE", "3. NIT Trichy — CSE"].map((t, i) => (
            <div key={t} className="flex items-center gap-2 bg-white/10 rounded px-2 py-1">
              <span className="text-[10px] text-white/80">{t}</span>
              {i === 0 && <span className="ml-auto text-[8px] bg-emerald-400/30 text-emerald-300 px-1.5 py-0.5 rounded font-bold">SAFE</span>}
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />, title: "Safe / Target / Dream", desc: "Every recommendation is mathematically classified with confidence levels.",
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-600", link: "/predictor", accent: "group-hover:shadow-emerald-200/50",
      img: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&q=80&auto=format",
      overlay: "from-emerald-600/80 to-green-700/70",
      preview: (
        <div className="flex gap-2">
          {[
            { label: "Safe", pct: "92%", color: "bg-emerald-400/30 text-emerald-300" },
            { label: "Target", pct: "65%", color: "bg-amber-400/30 text-amber-300" },
            { label: "Dream", pct: "28%", color: "bg-violet-400/30 text-violet-300" },
          ].map((t) => (
            <div key={t.label} className={`flex-1 text-center rounded-lg py-2 ${t.color}`}>
              <div className="text-xs font-bold">{t.pct}</div>
              <div className="text-[9px] opacity-80">{t.label}</div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section className="site-section bg-section-cream">
      <div className="site-container">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto site-section-header">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 bg-white"
              style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#FF6B35" }} />
              <span className="text-xs font-bold" style={{ color: "#1A1A1A" }}>Powerful Tools</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: "#1A1A1A", lineHeight: 1.15 }}>
              Everything You Need for{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #FF6B35 0%, #F7B267 50%, #EC407A 100%)" }}>JEE Counselling</span>
            </h2>
            <p className="text-lg" style={{ color: "#4A4A4A" }}>Six powerful features. One platform. Zero confusion.</p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <Link to={f.link} className="tilt-card block h-full">
                <div
                  className={`group relative overflow-hidden bg-white cursor-pointer h-full flex flex-col transition-all duration-300 hover:-translate-y-1.5 ${f.accent}`}
                  style={{
                    borderRadius: 24,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="relative h-36 overflow-hidden">
                    <img src={f.img} alt={f.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${f.overlay}`} />
                    <div className="absolute inset-0 p-4 flex flex-col justify-end">
                      <div>{f.preview}</div>
                    </div>
                    <div className={`absolute top-3 left-3 w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center text-white shadow-md ring-1 ring-white/40`}>{f.icon}</div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-[16px] font-bold mb-1.5 tracking-tight transition-colors" style={{ color: "#1A1A1A" }}>{f.title}</h3>
                    <p className="text-[13px] leading-relaxed mb-4 flex-1" style={{ color: "#4A4A4A" }}>{f.desc}</p>
                    <div className="flex items-center gap-1 text-[13px] font-semibold opacity-80 group-hover:opacity-100 group-hover:gap-2 transition-all duration-300" style={{ color: "#FF6B35" }}>
                      Try it now <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
