import { motion } from "framer-motion";

const colleges = ["IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur", "IIT Kharagpur", "NIT Trichy", "NIT Surathkal", "NIT Warangal", "IIIT Hyderabad", "IIIT Bangalore", "NIT Calicut", "IIT Roorkee", "IIT Guwahati", "NIT Rourkela", "IIIT Allahabad", "IIT BHU"];

export const TrustStrip = () => (
  <section className="py-8 overflow-hidden border-y border-stone-200/60 bg-stone-50/50">
    <p className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-5">Helping students get into India's top institutes</p>
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#f0ece4] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#f0ece4] to-transparent z-10" />
      <div className="flex overflow-hidden">
        <div className="marquee-track flex items-center gap-8 shrink-0 pr-8">
          {[...colleges, ...colleges].map((name, i) => (
            <span key={i} className="text-sm font-bold text-stone-400 whitespace-nowrap hover:text-violet-500 transition-colors cursor-default flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-300" />
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>
);
