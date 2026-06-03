import { Clock, ShieldCheck, TrendingUp, FileText, Award } from "lucide-react";
import { FadeIn, ScaleIn } from "./Animations";

export const WhyChooseUs = () => {
  const reasons = [
    { icon: <Clock className="w-5 h-5" />, title: "Save 40+ Hours", desc: "Stop manually searching cutoffs across websites. Get everything analyzed in seconds.", stat: "40+", unit: "hrs saved", color: "linear-gradient(135deg, #7C3AED, #6D28D9)", iconBg: "rgba(124,58,237,0.08)" },
    { icon: <ShieldCheck className="w-5 h-5" />, title: "97% Accuracy", desc: "Our predictions are based on mathematical models, not opinions or guesswork.", stat: "97%", unit: "accurate", color: "linear-gradient(135deg, #FF6B35, #F7931E)", iconBg: "rgba(255,107,53,0.08)" },
    { icon: <TrendingUp className="w-5 h-5" />, title: "Spot Hidden Gems", desc: "Find underrated colleges where cutoffs are dropping — colleges others miss.", stat: "50+", unit: "hidden gems", color: "linear-gradient(135deg, #EC407A, #FF6B35)", iconBg: "rgba(236,64,122,0.08)" },
    { icon: <FileText className="w-5 h-5" />, title: "JoSAA-Ready PDF", desc: "Export your preference list and directly use it during JoSAA choice filling.", stat: "1-Click", unit: "export", color: "linear-gradient(135deg, #10B981, #34D399)", iconBg: "rgba(16,185,129,0.08)" },
  ];

  return (
    <section className="site-section relative overflow-hidden bg-section-cream">
      <div className="absolute top-10 right-10 w-80 h-80 rounded-full blur-[110px] pointer-events-none" style={{ background: "rgba(255,107,53,0.08)" }} />
      <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(236,64,122,0.07)" }} />
      <div className="site-container relative z-10">
        <FadeIn>
          <div className="text-center site-section-header">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 bg-white"
              style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <Award className="w-3.5 h-3.5" style={{ color: "#FF6B35" }} />
              <span className="text-xs font-bold" style={{ color: "#1A1A1A" }}>Why us</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: "#1A1A1A", lineHeight: 1.15 }}>
              Why <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #FF6B35, #F7B267, #EC407A)" }}>10,000+ Students</span> Trust Us
            </h2>
            <p className="text-lg max-w-lg mx-auto" style={{ color: "#4A4A4A" }}>Built by JEE aspirants who went through the same confusion. We fixed it.</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reasons.map((r, i) => (
            <ScaleIn key={i} delay={i * 0.08}>
              <div
                className="relative h-full p-6 transition-all duration-300 hover:-translate-y-1.5 group overflow-hidden flex flex-col"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 24,
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3"
                    style={{ background: r.color, boxShadow: "0 10px 24px rgba(255,107,53,0.22)" }}
                  >
                    {r.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold leading-none tabular-nums" style={{ color: "#1A1A1A" }}>{r.stat}</div>
                    <div className="text-[9px] font-bold uppercase mt-1" style={{ color: "#6B6B6B", letterSpacing: "0.1em" }}>{r.unit}</div>
                  </div>
                </div>
                <h3 className="text-[16px] font-bold mb-2 leading-snug" style={{ color: "#1A1A1A" }}>{r.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "#4A4A4A" }}>{r.desc}</p>
              </div>
            </ScaleIn>
          ))}
        </div>
      </div>
    </section>
  );
};
