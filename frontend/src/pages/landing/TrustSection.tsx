import { Star } from "lucide-react";
import { FadeIn } from "./Animations";

export const TrustSection = () => {
  const testimonials = [
    { text: "This tool predicted my exact college allocation! I got into NIT Surathkal CSE which was shown as a Safe choice.", name: "Rahul S.", detail: "JEE Main 2024 — Rank 8,432", avatar: "R", avatarBg: "linear-gradient(135deg, #FFD4B5, #FF6B35)", accent: "#FF6B35" },
    { text: "The counsellor sheet feature saved me hours of research. Totally worth ₹39 for 10 sheets — I just exported the PDF and used it during choice filling.", name: "Priya M.", detail: "JEE Advanced 2024 — Rank 3,200", avatar: "P", avatarBg: "linear-gradient(135deg, #F9A8D4, #EC407A)", accent: "#EC407A" },
    { text: "The AI counsellor helped me understand the difference between NIT branches. Much better than random YouTube advice.", name: "Arjun K.", detail: "JEE Main 2024 — Rank 15,670", avatar: "A", avatarBg: "linear-gradient(135deg, #C4B5FD, #7C3AED)", accent: "#7C3AED" },
  ];

  return (
    <section className="site-section" style={{ background: "#FFFFFF" }}>
      <div className="site-container">
        <FadeIn>
          <div className="text-center site-section-header">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 bg-white"
              style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <Star className="w-3.5 h-3.5" style={{ color: "#F59E0B", fill: "#F59E0B" }} />
              <span className="text-xs font-bold" style={{ color: "#1A1A1A" }}>Real stories</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: "#1A1A1A", lineHeight: 1.15 }}>
              Students{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #FF6B35, #F7B267, #EC407A)" }}>Love It</span>
            </h2>
            <p className="text-lg" style={{ color: "#4A4A4A" }}>See what JEE aspirants are saying about CounsellorWala.</p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div
                className="h-full p-7 transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 24,
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderLeft: `4px solid ${t.accent}`,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4" style={{ color: "#F59E0B", fill: "#F59E0B" }} />)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B6B6B", letterSpacing: "0.08em" }}>Verified</span>
                </div>
                <p className="text-[14px] leading-relaxed mb-5 flex-1" style={{ color: "#1A1A1A" }}>"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 text-white"
                    style={{ background: t.avatarBg }}
                  >
                    {t.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: "#1A1A1A" }}>{t.name}</p>
                    <p className="text-[11px] truncate" style={{ color: "#6B6B6B" }}>{t.detail}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
