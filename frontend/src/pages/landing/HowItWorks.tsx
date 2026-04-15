import { Search, Zap, CheckCircle, Play } from "lucide-react";
import { FadeIn, ScaleIn } from "./Animations";

export const HowItWorks = () => {
  const steps = [
    { num: "1", title: "Enter Your Details", desc: "Input your JEE rank, exam type, category, home state, and preferred branches.", icon: <Search className="w-7 h-7" />, color: "from-violet-500 to-orange-600", bg: "bg-violet-50", border: "border-violet-200" },
    { num: "2", title: "Get Instant Results", desc: "Our engine analyzes 1.2M+ data points to find your best matches across 130+ colleges.", icon: <Zap className="w-7 h-7" />, color: "from-amber-500 to-orange-500", bg: "bg-amber-50", border: "border-amber-200" },
    { num: "3", title: "Make Your Choice", desc: "Compare options, build your preference list, and export it as a ready-to-use PDF.", icon: <CheckCircle className="w-7 h-7" />, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  ];

  return (
    <section className="py-24 px-6 sm:px-12 md:px-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-orange-50/40 to-amber-50/30" />
      <div className="absolute top-20 right-20 w-80 h-80 rounded-full bg-violet-200/20 blur-[100px]" />
      <div className="absolute bottom-20 left-20 w-72 h-72 rounded-full bg-amber-200/20 blur-[80px]" />
      <div className="max-w-6xl mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-5 shadow-sm">
              <Play className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-xs font-bold text-stone-600">How it works</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-stone-800">
              Three Steps to Your{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500">Dream College</span>
            </h2>
            <p className="text-stone-500 text-lg max-w-md mx-auto">Simple, fast, and accurate.</p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <ScaleIn key={i} delay={i * 0.12}>
              <div className="relative group">
                {i < 2 && <div className="hidden md:block absolute top-16 left-[calc(100%)] w-full h-[2px] bg-gradient-to-r from-stone-200 to-transparent z-0" />}
                <div className={`relative ${step.bg} border ${step.border} rounded-2xl p-8 text-center transition-all duration-400 hover:-translate-y-2 hover:shadow-xl`}>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-5 text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>{step.icon}</div>
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-stone-200 flex items-center justify-center mx-auto mb-4 text-sm font-extrabold text-stone-600 shadow-sm">{step.num}</div>
                  <h3 className="text-xl font-bold text-stone-800 mb-3">{step.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </ScaleIn>
          ))}
        </div>
      </div>
    </section>
  );
};
