import { GraduationCap, Layers, Users, Award } from "lucide-react";
import { motion } from "framer-motion";

export const StatsBar = () => (
  <section className="py-6 px-6 sm:px-12 md:px-24">
    <div className="max-w-6xl mx-auto">
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #9a3412 0%, #c2410c 30%, #ea580c 60%, #d97706 100%)" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {[
            { icon: <GraduationCap className="w-6 h-6" />, value: "130+", label: "Colleges Covered" },
            { icon: <Layers className="w-6 h-6" />, value: "1.2M+", label: "Data Points" },
            { icon: <Users className="w-6 h-6" />, value: "10K+", label: "Students Helped" },
            { icon: <Award className="w-6 h-6" />, value: "10 Yrs", label: "Cutoff Data" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex items-center justify-center gap-3 py-7 px-4 group cursor-default">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80 group-hover:bg-white/20 group-hover:scale-110 transition-all">{s.icon}</div>
              <div>
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-[10px] text-white/50 font-semibold">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
