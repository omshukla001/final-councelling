import { Search, Zap, CheckCircle, Play } from "lucide-react";
import { FadeIn, ScaleIn } from "./Animations";

export const HowItWorks = () => {
  const steps = [
    { num: "1", title: "Enter Your Details", desc: "Input your JEE rank, exam type, category, home state, and preferred branches.", icon: <Search className="w-7 h-7" />, color: "linear-gradient(135deg, #FF6B35, #F7931E)", bg: "rgba(255,107,53,0.06)", border: "rgba(255,107,53,0.18)" },
    { num: "2", title: "Get Instant Results", desc: "Our engine analyzes 1.2M+ data points to find your best matches across 130+ colleges.", icon: <Zap className="w-7 h-7" />, color: "linear-gradient(135deg, #EC407A, #FF6B35)", bg: "rgba(236,64,122,0.06)", border: "rgba(236,64,122,0.18)" },
    { num: "3", title: "Make Your Choice", desc: "Compare options, build your preference list, and export it as a ready-to-use PDF.", icon: <CheckCircle className="w-7 h-7" />, color: "linear-gradient(135deg, #10B981, #34D399)", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.18)" },
  ];

  return (
    <section className="site-section relative overflow-hidden" style={{ background: "#FFFFFF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 0%, rgba(255,107,53,0.05) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(236,64,122,0.05) 0%, transparent 55%)" }} />
      <div className="absolute top-20 right-20 w-80 h-80 rounded-full blur-[100px]" style={{ background: "rgba(255,107,53,0.08)" }} />
      <div className="absolute bottom-20 left-20 w-72 h-72 rounded-full blur-[80px]" style={{ background: "rgba(236,64,122,0.08)" }} />
      <div className="site-container relative z-10">
        <FadeIn>
          <div className="text-center site-section-header">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 bg-white"
              style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <Play className="w-3.5 h-3.5" style={{ color: "#FF6B35" }} />
              <span className="text-xs font-bold" style={{ color: "#1A1A1A" }}>How it works</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: "#1A1A1A", lineHeight: 1.15 }}>
              Three Steps to Your{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #FF6B35, #F7B267, #EC407A)" }}>Dream College</span>
            </h2>
            <p className="text-lg max-w-md mx-auto" style={{ color: "#4A4A4A" }}>Simple, fast, and accurate.</p>
          </div>
        </FadeIn>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {/* Single continuous connector behind the cards */}
          <div className="hidden md:block absolute top-9 left-[16%] right-[16%] h-[2px] pointer-events-none z-0">
            <div className="w-full h-full rounded-full opacity-70" style={{ background: "linear-gradient(90deg, rgba(255,107,53,0.3), rgba(236,64,122,0.3), rgba(16,185,129,0.3))" }} />
          </div>
          {steps.map((step, i) => (
            <ScaleIn key={i} delay={i * 0.12}>
              <div className="relative group z-10">
                <div
                  className="relative p-7 text-center transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 24,
                    border: `1px solid ${step.border}`,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{ background: step.bg }} />
                  <div className="relative">
                    <div className="absolute top-0 right-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", color: "#6B6B6B", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                      {step.num}
                    </div>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white transition-transform duration-300 group-hover:scale-105"
                      style={{ background: step.color, boxShadow: "0 10px 24px rgba(255,107,53,0.3)" }}
                    >
                      {step.icon}
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: "#1A1A1A" }}>{step.title}</h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: "#4A4A4A" }}>{step.desc}</p>
                  </div>
                </div>
              </div>
            </ScaleIn>
          ))}
        </div>
      </div>
    </section>
  );
};
