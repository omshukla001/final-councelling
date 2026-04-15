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
  <section className="py-24 px-6 sm:px-12 md:px-24">
    <div className="max-w-5xl mx-auto">
      <FadeIn>
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 mb-5">
            <Gift className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">Special Launch Offer</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-stone-800">
            Unlock Premium Access for Just{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">₹99</span>
          </h2>
          <p className="text-stone-500 text-lg max-w-xl mx-auto">Get unlimited AI Chat, full access to college predictors, multi-college comparisons, and JoSAA-ready counsellor sheets.</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <ScaleIn delay={0.1}>
          <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 press-card">
            <div className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3">Free</div>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-4xl font-extrabold text-stone-800">₹0</span>
              <span className="text-stone-400 text-sm">/forever</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "College predictor (Top 5 only)",
                "Browse 130+ colleges",
                "AI Counsellor chat (3 free messages)",
                "10-year cutoff trends",
                "College comparison (up to 2 colleges)",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-stone-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link to="/predictor">
              <Button variant="outline" className="w-full h-12 rounded-xl border-stone-300 text-stone-700 font-bold hover:bg-orange-50 hover:border-orange-300 transition-all">
                Get Started Free
              </Button>
            </Link>
          </div>
        </ScaleIn>

        <ScaleIn delay={0.2}>
          <div className="relative bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl p-8 shadow-xl shadow-orange-500/20 hover:-translate-y-1 transition-all overflow-hidden">
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-400 text-stone-900 text-[10px] font-extrabold uppercase tracking-wider">Most Popular</div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-[40px]" />
            <div className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">Premium Access</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-extrabold text-white">₹99</span>
              <span className="text-white/50 text-sm">/month</span>
            </div>
            <p className="text-white/60 text-xs mb-5">Unlimited access to the ultimate JoSAA counselling tools. Worth more than hours of research.</p>
            <ul className="space-y-3 mb-8">
              {[
                "Everything in Free plan",
                "Unlimited AI Counsellor chat",
                "Full College Predictor unlock",
                "Compare up to 3 colleges at once",
                "Unlimited Counsellor Sheets",
                "Export as JoSAA-ready PDF",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white/90">
                  <BadgeCheck className="w-4 h-4 text-amber-300 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button onClick={handlePremiumClick} className="w-full h-12 rounded-xl bg-white text-orange-700 font-bold hover:bg-white/90 transition-all border-0 shadow-lg group btn-glow flex items-center justify-center">
              Go Premium for ₹99 <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </ScaleIn>
      </div>
    </div>
  </section>
  );
};
