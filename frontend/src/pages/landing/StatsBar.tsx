import { GraduationCap, Layers, Users, Award } from "lucide-react";
import { motion } from "framer-motion";

export const StatsBar = () => (
  <section className="site-section-tight">
    <div className="site-container">
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 24,
          background: "linear-gradient(135deg, #FFFFFF 0%, #FFF9F3 100%)",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 8px 32px rgba(255, 107, 53, 0.08)",
        }}
      >
        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full blur-[60px] pointer-events-none" style={{ background: "rgba(255, 107, 53, 0.14)" }} />
        <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full blur-[70px] pointer-events-none" style={{ background: "rgba(236, 64, 122, 0.1)" }} />
        <div className="relative grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
          {[
            { icon: <GraduationCap className="w-5 h-5" />, value: "130+", label: "Colleges Covered", color: "#FF6B35", bg: "rgba(255, 107, 53, 0.12)" },
            { icon: <Layers className="w-5 h-5" />, value: "1.2M+", label: "Data Points", color: "#7C3AED", bg: "rgba(124, 58, 237, 0.12)" },
            { icon: <Users className="w-5 h-5" />, value: "10K+", label: "Students Helped", color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" },
            { icon: <Award className="w-5 h-5" />, value: "10 Yrs", label: "Cutoff Data", color: "#EC407A", bg: "rgba(236, 64, 122, 0.12)" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="flex items-center justify-center gap-3 py-6 md:py-7 px-4 group cursor-default transition-colors"
              style={{ borderColor: "rgba(0,0,0,0.05)" }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                style={{ background: s.bg, color: s.color }}
              >
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xl md:text-2xl font-extrabold leading-none tabular-nums" style={{ color: "#1A1A1A" }}>{s.value}</div>
                <div className="text-[10px] font-semibold mt-1 tracking-wide uppercase" style={{ color: "#6B6B6B", letterSpacing: "0.05em" }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
