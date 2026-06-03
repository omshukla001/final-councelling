import { motion } from "framer-motion";

const colleges = ["IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur", "IIT Kharagpur", "NIT Trichy", "NIT Surathkal", "NIT Warangal", "IIIT Hyderabad", "IIIT Bangalore", "NIT Calicut", "IIT Roorkee", "IIT Guwahati", "NIT Rourkela", "IIIT Allahabad", "IIT BHU"];

export const TrustStrip = () => (
  <section className="py-10 overflow-hidden" style={{ background: "#FFFFFF", borderTop: "1px solid rgba(0,0,0,0.05)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
    <p className="text-center text-[10px] font-bold uppercase mb-5" style={{ color: "#6B6B6B", letterSpacing: "0.2em" }}>
      Helping students get into India's top institutes
    </p>
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10" style={{ background: "linear-gradient(to right, #FFFFFF, transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10" style={{ background: "linear-gradient(to left, #FFFFFF, transparent)" }} />
      <div className="flex overflow-hidden">
        <div className="marquee-track flex items-center gap-10 shrink-0 pr-10">
          {[...colleges, ...colleges].map((name, i) => (
            <span
              key={i}
              className="text-sm font-bold whitespace-nowrap transition-colors cursor-default flex items-center gap-2"
              style={{ color: "#6B6B6B" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B35" }} />
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>
);
