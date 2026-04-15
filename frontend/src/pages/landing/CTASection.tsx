import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./Animations";

export const CTASection = () => (
  <section className="py-12 px-6 sm:px-12 md:px-24">
    <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 30%, #f59e0b 60%, #d97706 100%)" }}>
      <div className="absolute top-8 left-8 w-64 h-64 rounded-full bg-yellow-300/15 blur-[80px]" />
      <div className="absolute bottom-8 right-8 w-80 h-80 rounded-full bg-red-400/10 blur-[80px]" />
      <div className="relative z-10 text-center py-20 px-8">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 mb-8">
            <GraduationCap className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-semibold text-white/90">Start your journey today</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 leading-tight text-white">
            Ready to Find Your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-200">Dream College?</span>
          </h2>
          <p className="text-lg text-white/65 mb-10 max-w-xl mx-auto">Join thousands of JEE aspirants who made smarter choices.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/predictor">
              <Button className="h-14 px-10 rounded-2xl bg-white text-orange-700 font-bold text-sm shadow-xl hover:bg-white/90 hover:-translate-y-0.5 transition-all border-0 group btn-glow">
                Start Predicting <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/counsellor-sheet">
              <Button className="h-14 px-10 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-sm transition-all backdrop-blur-md shadow-lg hover:-translate-y-0.5">
                Go Premium for ₹99/month
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  </section>
);
