import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./Animations";

export const CTASection = () => (
  <section className="site-section-tight">
    <div className="site-container">
    <div className="overflow-hidden relative" style={{ background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 60%, #EC407A 100%)", borderRadius: 32, boxShadow: "0 24px 60px rgba(255,107,53,0.28)" }}>
      <div className="absolute top-8 left-8 w-64 h-64 rounded-full blur-[80px]" style={{ background: "rgba(255,255,255,0.12)" }} />
      <div className="absolute bottom-8 right-8 w-80 h-80 rounded-full blur-[80px]" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="relative z-10 text-center py-20 md:py-24 px-6 md:px-10">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.35)" }}>
            <GraduationCap className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">Start your journey today</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight text-white">
            Ready to Find Your{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #FFFFFF, #FFE8D6)" }}>Dream College?</span>
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.85)" }}>Join thousands of JEE aspirants who made smarter choices.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/predictor">
              <Button
                className="h-14 px-10 font-bold text-sm hover:-translate-y-0.5 transition-all border-0 group btn-glow"
                style={{ background: "#FFFFFF", color: "#FF6B35", borderRadius: 16, boxShadow: "0 12px 32px rgba(0,0,0,0.14)" }}
              >
                Start Predicting <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/counsellor-sheet">
              <Button
                className="h-14 px-10 text-white font-bold text-sm transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 16 }}
              >
                Go Premium for ₹99/month
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
    </div>
  </section>
);
