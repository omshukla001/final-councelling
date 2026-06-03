import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Gift, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, ScaleIn } from "./Animations";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

export const PricingSection = () => {
  const { user } = useAuth();
  const { triggerPaymentFlow } = useSubscription();
  const navigate = useNavigate();

  const handlePremiumClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
    } else {
      triggerPaymentFlow();
    }
  };

  return (
  <section className="site-section bg-section-cream">
    <div className="site-container-narrow">
      <FadeIn>
        <div className="text-center site-section-header">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 bg-white"
            style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
          >
            <Gift className="w-3.5 h-3.5" style={{ color: "#10B981" }} />
            <span className="text-xs font-bold" style={{ color: "#1A1A1A" }}>Special Launch Offer</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: "#1A1A1A", lineHeight: 1.15 }}>
            Unlock Premium Access for Just{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #FF6B35, #F7B267, #EC407A)" }}>₹99</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#4A4A4A" }}>Get unlimited AI Chat, full access to college predictors, multi-college comparisons, and JoSAA-ready counsellor sheets.</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <ScaleIn delay={0.1}>
          <div
            className="p-8 transition-all hover:-translate-y-2 press-card h-full flex flex-col"
            style={{
              background: "#FFFFFF",
              borderRadius: 24,
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            }}
          >
            <div className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "#6B6B6B", letterSpacing: "0.08em" }}>Free</div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-extrabold" style={{ color: "#1A1A1A" }}>₹0</span>
              <span className="text-sm" style={{ color: "#6B6B6B" }}>/forever</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "College predictor (Top 5 only)",
                "Browse 130+ colleges",
                "AI Counsellor chat (3 free messages)",
                "10-year cutoff trends",
                "College comparison (up to 2 colleges)",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "#4A4A4A" }}>
                  <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "#10B981" }} /> {f}
                </li>
              ))}
            </ul>
            <Link to="/predictor">
              <Button
                variant="outline"
                className="w-full h-12 rounded-[14px] font-bold transition-all"
                style={{ border: "1.5px solid #FF6B35", color: "#FF6B35", background: "transparent" }}
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </ScaleIn>

        <ScaleIn delay={0.2}>
          <div
            className="relative p-8 hover:-translate-y-1 transition-all overflow-hidden h-full flex flex-col"
            style={{
              background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
              borderRadius: 24,
              boxShadow: "0 20px 60px rgba(255, 107, 53, 0.35)",
            }}
          >
            <div
              className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
              style={{
                background: "#FFFFFF",
                color: "#FF6B35",
                letterSpacing: "0.1em",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                animation: "pulse-glow 2s ease-in-out infinite",
              }}
            >
              Most Popular
            </div>
            <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full blur-[50px]" style={{ background: "rgba(255,255,255,0.12)" }} />
            <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full blur-[50px]" style={{ background: "rgba(255,255,255,0.08)" }} />

            <div className="relative">
              <div className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.85)", letterSpacing: "0.08em" }}>Premium Access</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-extrabold text-white" style={{ fontSize: "clamp(48px, 7vw, 64px)", lineHeight: 1 }}>₹99</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>/month</span>
              </div>
              <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.75)" }}>Unlimited access to the ultimate JoSAA counselling tools. Worth more than hours of research.</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Free plan",
                  "Unlimited AI Counsellor chat",
                  "Full College Predictor unlock",
                  "Compare up to 3 colleges at once",
                  "Unlimited Counsellor Sheets",
                  "Export as JoSAA-ready PDF",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.95)" }}>
                    <BadgeCheck className="w-5 h-5 shrink-0" style={{ color: "#FFFFFF" }} /> {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={handlePremiumClick}
                className="w-full h-12 rounded-[14px] font-bold border-0 group btn-glow flex items-center justify-center transition-all hover:scale-[1.02]"
                style={{
                  background: "#FFFFFF",
                  color: "#FF6B35",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.15)",
                }}
              >
                Go Premium for ₹99 <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </ScaleIn>
      </div>
    </div>
  </section>
  );
};
