import { Star } from "lucide-react";
import { FadeIn } from "./Animations";

export const TrustSection = () => {
  const testimonials = [
    { text: "This tool predicted my exact college allocation! I got into NIT Surathkal CSE which was shown as a Safe choice.", name: "Rahul S.", detail: "JEE Main 2024 — Rank 8,432", avatar: "R", color: "bg-violet-100 text-violet-600", accent: "border-l-violet-500" },
    { text: "The counsellor sheet feature saved me hours of research. Totally worth ₹39 for 10 sheets — I just exported the PDF and used it during choice filling.", name: "Priya M.", detail: "JEE Advanced 2024 — Rank 3,200", avatar: "P", color: "bg-orange-100 text-orange-600", accent: "border-l-orange-500" },
    { text: "The AI counsellor helped me understand the difference between NIT branches. Much better than random YouTube advice.", name: "Arjun K.", detail: "JEE Main 2024 — Rank 15,670", avatar: "A", color: "bg-amber-100 text-amber-600", accent: "border-l-amber-500" },
  ];

  return (
    <section className="py-24 px-6 sm:px-12 md:px-24">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200 mb-5">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-amber-600">Real stories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-stone-800">
              Students{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500">Love It</span>
            </h2>
            <p className="text-stone-500 text-lg">See what JEE aspirants are saying about CounsellorWala.</p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className={`p-7 rounded-2xl bg-white border border-stone-200/80 border-l-4 ${t.accent} hover:shadow-xl transition-all duration-400 hover:-translate-y-2`}>
                <div className="flex gap-1 mb-5">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-[15px] text-stone-600 leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full ${t.color} flex items-center justify-center font-bold text-base`}>{t.avatar}</div>
                  <div><p className="text-sm font-bold text-stone-800">{t.name}</p><p className="text-xs text-stone-400">{t.detail}</p></div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
