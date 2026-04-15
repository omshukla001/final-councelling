import { Clock, ShieldCheck, TrendingUp, FileText, Award } from "lucide-react";
import { FadeIn, ScaleIn } from "./Animations";

export const WhyChooseUs = () => {
  const reasons = [
    { icon: <Clock className="w-5 h-5" />, title: "Save 40+ Hours", desc: "Stop manually searching cutoffs across websites. Get everything analyzed in seconds.", stat: "40+", unit: "hrs saved", color: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
    { icon: <ShieldCheck className="w-5 h-5" />, title: "97% Accuracy", desc: "Our predictions are based on mathematical models, not opinions or guesswork.", stat: "97%", unit: "accurate", color: "from-orange-500 to-amber-600", bg: "bg-orange-50" },
    { icon: <TrendingUp className="w-5 h-5" />, title: "Spot Hidden Gems", desc: "Find underrated colleges where cutoffs are dropping — colleges others miss.", stat: "50+", unit: "hidden gems", color: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
    { icon: <FileText className="w-5 h-5" />, title: "JoSAA-Ready PDF", desc: "Export your preference list and directly use it during JoSAA choice filling.", stat: "1-Click", unit: "export", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
  ];

  return (
    <section className="py-24 px-6 sm:px-12 md:px-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-violet-50/30" />
      <div className="max-w-6xl mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-200 mb-5">
              <Award className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-xs font-bold text-orange-700">Why us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-stone-800">
              Why <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-orange-500">10,000+ Students</span> Trust Us
            </h2>
            <p className="text-stone-500 text-lg max-w-lg mx-auto">Built by JEE aspirants who went through the same confusion. We fixed it.</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reasons.map((r, i) => (
            <ScaleIn key={i} delay={i * 0.1}>
              <div className={`relative ${r.bg} border border-stone-200/60 rounded-2xl p-6 text-center transition-all duration-400 hover:-translate-y-2 hover:shadow-xl group press-card cursor-default overflow-hidden`}>
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }} />
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center mx-auto mb-4 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>{r.icon}</div>
                <div className="text-2xl font-extrabold text-stone-800 mb-0.5">{r.stat}</div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3">{r.unit}</div>
                <h3 className="text-sm font-bold text-stone-800 mb-1.5">{r.title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{r.desc}</p>
              </div>
            </ScaleIn>
          ))}
        </div>
      </div>
    </section>
  );
};
