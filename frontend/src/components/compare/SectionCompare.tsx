import { useMemo, useState } from "react";
import {
  TrendingUp, IndianRupee, Building2, GraduationCap, Star, Sparkles,
  Trophy, Users, Briefcase, Wifi, Calendar, BookOpen, BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CollegeData, ScrapedData } from "@/types/college";

type Best = "highest" | "lowest";

interface MetricDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  best: Best;
  format: (v: number) => string;
  hint?: string;
}

interface SectionDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  metrics: MetricDef[];
  extract: (c: CollegeData) => Record<string, number>;
  insight?: (vals: Record<string, number>[], names: string[]) => string | null;
}

const num = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const m = v.replace(/,/g, "").match(/-?[\d.]+/);
    if (!m) return 0;
    let n = parseFloat(m[0]);
    const lower = v.toLowerCase();
    if (lower.includes("crore") || lower.includes("cr")) n *= 100;
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const fmtINR = (v: number): string => {
  if (!v || v <= 0) return "—";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};
const fmtLPA = (v: number): string => (v > 0 ? `${v.toFixed(1)} LPA` : "—");
const fmtPct = (v: number): string => (v > 0 ? `${v.toFixed(1)}%` : "—");
const fmtInt = (v: number): string => (v > 0 ? v.toLocaleString("en-IN") : "—");
const fmtRating = (v: number): string => (v > 0 ? `${v.toFixed(1)}/5` : "—");
const fmtAcres = (v: number): string => (v > 0 ? `${v} acres` : "—");
const fmtYear = (v: number): string => (v > 0 ? `${v}` : "—");

// ── Section extractors ──────────────────────────────────────────────────────
// new_placements.*_package is stored in rupees; institutional_totals.*_lpa is already in LPA.
// Convert rupees → LPA so both paths render on the same scale.
const rupeesToLPA = (rupees: number): number => (rupees > 0 ? rupees / 100000 : 0);

const extractPlacements = (c: CollegeData): Record<string, number> => {
  const sd = c.scraped_data || {} as ScrapedData;
  const inst = (sd.placement_summary as Record<string, unknown> | undefined)?.institutional_totals as Record<string, unknown> | undefined;
  const ps = sd.placement_summary as Record<string, unknown> | undefined;
  const np = sd.new_placements as Record<string, unknown> | undefined;
  return {
    highest: num(inst?.highest_lpa) || rupeesToLPA(num(np?.highest_package)),
    average: num(inst?.average_lpa) || rupeesToLPA(num(np?.average_package)),
    median: num(inst?.median_lpa) || rupeesToLPA(num(np?.median_package)),
    placedPct:
      num(inst?.placement_rate) ||
      num(np?.placement_percentage) ||
      num(ps?.placement_percentage) ||
      num((sd as Record<string, unknown>).placement_rate),
    students: num(inst?.students_placed) || num(np?.students_placed) || num(ps?.students_placed),
    companies: num(inst?.companies_visited) || num(ps?.companies_visited) || num(ps?.total_companies),
  };
};

const extractFees = (c: CollegeData): Record<string, number> => {
  const sd = c.scraped_data || {} as ScrapedData;
  const nf = (sd.new_fees as Record<string, unknown> | undefined) || {};
  return {
    tuition: num(nf.tuition_fee_per_year),
    hostel: num(nf.hostel_fee),
    total: num(nf.total_fee),
  };
};

const extractInfrastructure = (c: CollegeData): Record<string, number> => {
  const sd = c.scraped_data || {} as ScrapedData;
  const campus = sd.details?.campus_size || (sd.details as Record<string, unknown> | undefined)?.campus_area;
  let acres = 0;
  if (typeof campus === "string") {
    const m = campus.match(/[\d.]+/);
    if (m) acres = parseFloat(m[0]);
  } else if (typeof campus === "number") {
    acres = campus;
  }
  const fac = sd.facilities as unknown;
  let facCount = 0;
  if (Array.isArray(fac)) facCount = fac.length;
  else if (fac && typeof fac === "object") {
    facCount = Object.values(fac as Record<string, unknown>).filter((v) => v === true || (typeof v === "string" && v.length > 0)).length;
  }
  return {
    campus: acres,
    facilities: facCount,
  };
};

const extractAcademics = (c: CollegeData): Record<string, number> => {
  const sd = c.scraped_data || {} as ScrapedData;
  const established = num(sd.details?.established_year);
  const programs = (sd as Record<string, unknown>).programs;
  const programCount = Array.isArray(programs) ? programs.length : 0;
  const seats = Array.isArray(sd.seats) ? sd.seats.reduce((acc: number, s) => acc + num((s as Record<string, unknown>).total_seats), 0) : 0;
  return {
    branches: c.branches?.length || 0,
    programs: programCount,
    totalSeats: seats,
    established,
  };
};

const extractReviews = (c: CollegeData): Record<string, number> => {
  const r = (c.scraped_data?.reviews || {}) as Record<string, unknown>;
  return {
    overall: num(r.overall_rating),
    placement: num(r.placement_rating ?? r.placements_rating),
    faculty: num(r.faculty_rating),
    infrastructure: num(r.infrastructure_rating),
  };
};

// ── Section definitions ─────────────────────────────────────────────────────
const SECTIONS: SectionDef[] = [
  {
    id: "placements",
    label: "Placements",
    icon: TrendingUp,
    accent: "#10b981",
    extract: extractPlacements,
    metrics: [
      { key: "highest", label: "Highest Package", icon: Trophy, best: "highest", format: fmtLPA },
      { key: "average", label: "Average Package", icon: TrendingUp, best: "highest", format: fmtLPA },
      { key: "median", label: "Median Package", icon: BarChart3, best: "highest", format: fmtLPA },
      { key: "placedPct", label: "% Students Placed", icon: Users, best: "highest", format: fmtPct },
      { key: "students", label: "Students Placed", icon: Users, best: "highest", format: fmtInt },
      { key: "companies", label: "Companies Visited", icon: Briefcase, best: "highest", format: fmtInt },
    ],
    insight: (vals, names) => {
      const avgs = vals.map((v) => v.average).filter((x) => x > 0);
      if (avgs.length < 2) return null;
      const maxIdx = vals.map((v) => v.average).indexOf(Math.max(...avgs));
      const minIdx = vals.map((v) => v.average).indexOf(Math.min(...avgs.filter((x) => x > 0)));
      if (maxIdx === minIdx) return null;
      const diff = ((vals[maxIdx].average - vals[minIdx].average) / vals[minIdx].average) * 100;
      return `${names[maxIdx]} reports a ${diff.toFixed(0)}% higher average package than ${names[minIdx]}.`;
    },
  },
  {
    id: "fees",
    label: "Fees",
    icon: IndianRupee,
    accent: "#f59e0b",
    extract: extractFees,
    metrics: [
      { key: "tuition", label: "Tuition / Year", icon: IndianRupee, best: "lowest", format: fmtINR },
      { key: "hostel", label: "Hostel Fee", icon: Building2, best: "lowest", format: fmtINR },
      { key: "total", label: "Total Programme Cost", icon: Trophy, best: "lowest", format: fmtINR },
    ],
    insight: (vals, names) => {
      const totals = vals.map((v) => v.total).filter((x) => x > 0);
      if (totals.length < 2) return null;
      const minIdx = vals.map((v) => v.total).indexOf(Math.min(...totals));
      const maxIdx = vals.map((v) => v.total).indexOf(Math.max(...totals));
      if (minIdx === maxIdx) return null;
      const diff = vals[maxIdx].total - vals[minIdx].total;
      return `${names[minIdx]} is ${fmtINR(diff)} cheaper across the full programme than ${names[maxIdx]}.`;
    },
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: Building2,
    accent: "#8b5cf6",
    extract: extractInfrastructure,
    metrics: [
      { key: "campus", label: "Campus Size", icon: Building2, best: "highest", format: fmtAcres },
      { key: "facilities", label: "Listed Facilities", icon: Wifi, best: "highest", format: fmtInt },
    ],
    insight: (vals, names) => {
      const cs = vals.map((v) => v.campus).filter((x) => x > 0);
      if (cs.length < 2) return null;
      const maxIdx = vals.map((v) => v.campus).indexOf(Math.max(...cs));
      const minIdx = vals.map((v) => v.campus).indexOf(Math.min(...cs));
      if (maxIdx === minIdx) return null;
      const ratio = vals[maxIdx].campus / vals[minIdx].campus;
      return `${names[maxIdx]} sits on a campus ${ratio.toFixed(1)}× the size of ${names[minIdx]}'s.`;
    },
  },
  {
    id: "academics",
    label: "Academics",
    icon: GraduationCap,
    accent: "#06b6d4",
    extract: extractAcademics,
    metrics: [
      { key: "branches", label: "B.Tech Branches", icon: GraduationCap, best: "highest", format: fmtInt },
      { key: "programs", label: "Programs Offered", icon: BookOpen, best: "highest", format: fmtInt },
      { key: "totalSeats", label: "Total Intake (Seats)", icon: Users, best: "highest", format: fmtInt },
      { key: "established", label: "Established", icon: Calendar, best: "lowest", format: fmtYear, hint: "Older = more established" },
    ],
    insight: (vals, names) => {
      const br = vals.map((v) => v.branches).filter((x) => x > 0);
      if (br.length < 2) return null;
      const maxIdx = vals.map((v) => v.branches).indexOf(Math.max(...br));
      return `${names[maxIdx]} offers the widest branch selection (${vals[maxIdx].branches} programmes).`;
    },
  },
  {
    id: "reviews",
    label: "Student Reviews",
    icon: Star,
    accent: "#ec4899",
    extract: extractReviews,
    metrics: [
      { key: "overall", label: "Overall Rating", icon: Star, best: "highest", format: fmtRating },
      { key: "placement", label: "Placement Rating", icon: TrendingUp, best: "highest", format: fmtRating },
      { key: "faculty", label: "Faculty Rating", icon: Users, best: "highest", format: fmtRating },
      { key: "infrastructure", label: "Infrastructure Rating", icon: Building2, best: "highest", format: fmtRating },
    ],
    insight: (vals, names) => {
      const ov = vals.map((v) => v.overall).filter((x) => x > 0);
      if (ov.length < 2) return null;
      const maxIdx = vals.map((v) => v.overall).indexOf(Math.max(...ov));
      return `Students rate ${names[maxIdx]} highest overall (${vals[maxIdx].overall.toFixed(1)}/5).`;
    },
  },
];

const shortName = (name: string): string =>
  name
    .replace("Indian Institute of Technology", "IIT")
    .replace("National Institute of Technology", "NIT")
    .replace("Indian Institute of Information Technology", "IIIT")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .trim();

interface Props {
  colleges: CollegeData[];
  colors: string[];
}

const SectionCompare = ({ colleges, colors }: Props) => {
  const [active, setActive] = useState<string>("placements");
  const section = SECTIONS.find((s) => s.id === active) || SECTIONS[0];

  const extracted = useMemo(
    () => colleges.map((c) => section.extract(c)),
    [colleges, section]
  );
  const names = colleges.map((c) => shortName(c.name));
  const insight = section.insight?.(extracted, names) || null;

  // Per-section coverage: how many metrics actually have data.
  // Only counts metrics that have ≥1 populated value across colleges —
  // metrics that are null for every college are hidden in the UI, so they
  // shouldn't drag the coverage score either.
  const coverage = useMemo(() => {
    let filled = 0;
    let total = 0;
    section.metrics.forEach((m) => {
      const vals = extracted.map((e) => e[m.key] || 0);
      const hasAny = vals.some((v) => v > 0);
      if (!hasAny) return;
      vals.forEach((v) => {
        total += 1;
        if (v > 0) filled += 1;
      });
    });
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }, [section, extracted]);

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-stone-200 overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-stone-200 bg-stone-50/60 px-4 sm:px-6 pt-4">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-3">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "text-white shadow-md"
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                }`}
                style={isActive ? { backgroundColor: s.accent } : undefined}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Insight banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`insight-${section.id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="px-6 py-4 border-b border-stone-200 flex items-center gap-3"
          style={{ background: `linear-gradient(90deg, ${section.accent}10, transparent)` }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${section.accent}20`, color: section.accent }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-stone-800 font-semibold leading-snug">
              {insight || `Comparing ${section.label.toLowerCase()} across ${colleges.length} colleges.`}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Data coverage: <span className="font-bold" style={{ color: section.accent }}>{coverage}%</span> of expected fields populated
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Metric rows */}
      <div className="p-4 sm:p-6 space-y-3">
        {section.metrics.map((m) => {
          const vals = extracted.map((e) => e[m.key] || 0);
          const validVals = vals.filter((v) => v > 0);
          if (validVals.length === 0) return null;
          const bestVal = m.best === "highest" ? Math.max(...validVals) : Math.min(...validVals);
          const bestCount = validVals.filter((v) => v === bestVal).length;
          const Icon = m.icon;

          return (
            <motion.div
              key={m.key}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border border-stone-200 bg-white overflow-hidden"
            >
              {/* Metric header */}
              <div className="px-4 sm:px-5 py-3 border-b border-stone-100 flex items-center gap-2.5 bg-stone-50/50">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${section.accent}15`, color: section.accent }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-bold text-stone-700 uppercase tracking-wide">{m.label}</p>
                {m.hint && <span className="text-[10px] text-stone-400 ml-auto">({m.hint})</span>}
              </div>

              {/* Cards row */}
              <div
                className="grid gap-px bg-stone-100"
                style={{ gridTemplateColumns: `repeat(${colleges.length}, minmax(0, 1fr))` }}
              >
                {colleges.map((c, i) => {
                  const v = vals[i];
                  const color = colors[i] || section.accent;
                  const isBest = v > 0 && v === bestVal && bestCount === 1;
                  let diffChip: string | null = null;
                  if (v > 0 && !isBest && bestVal > 0) {
                    if (m.best === "highest") {
                      const pct = ((bestVal - v) / bestVal) * 100;
                      diffChip = `−${pct.toFixed(0)}% vs best`;
                    } else {
                      const pct = ((v - bestVal) / bestVal) * 100;
                      diffChip = `+${pct.toFixed(0)}% vs best`;
                    }
                  }
                  return (
                    <div
                      key={i}
                      className="bg-white px-4 py-4 flex flex-col gap-1.5 relative"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[11px] font-semibold text-stone-500 truncate">
                          {names[i]}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span
                          className="text-xl font-extrabold tabular-nums"
                          style={{ color: v > 0 ? (isBest ? color : "#1c1917") : "#a8a29e" }}
                        >
                          {v > 0 ? m.format(v) : "—"}
                        </span>
                        {isBest && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${color}20`, color }}
                          >
                            BEST
                          </span>
                        )}
                      </div>
                      {diffChip && (
                        <span className="text-[10px] font-semibold text-stone-400">
                          {diffChip}
                        </span>
                      )}
                      {/* Comparative bar */}
                      {v > 0 && bestVal > 0 && (
                        <div className="mt-1.5 h-1 w-full rounded-full bg-stone-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                m.best === "highest"
                                  ? Math.min(100, (v / bestVal) * 100)
                                  : Math.min(100, (bestVal / v) * 100)
                              }%`,
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {section.metrics.every((m) => extracted.every((e) => (e[m.key] || 0) === 0)) && (
          <div className="text-center py-12 text-sm text-stone-400 font-semibold">
            No {section.label.toLowerCase()} data available for the selected colleges yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionCompare;
