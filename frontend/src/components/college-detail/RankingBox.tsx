import { Trophy, Award, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { CollegeData, ScrapedData } from "@/types/college";

interface RankRow {
  source: string;
  rank: number;
  year?: number;
  category?: string;
}

const RANKING_SOURCES: { match: RegExp; label: string; accent: string }[] = [
  { match: /nirf/i,          label: "NIRF",         accent: "#f97316" },
  { match: /india.?today/i,  label: "India Today",  accent: "#0ea5e9" },
  { match: /outlook/i,       label: "Outlook",      accent: "#8b5cf6" },
  { match: /times/i,         label: "Times",        accent: "#ef4444" },
  { match: /the_world|qs/i,  label: "QS / Global",  accent: "#10b981" },
  { match: /careers360/i,    label: "Careers360",   accent: "#ec4899" },
];

const detectSource = (key: string) => {
  const found = RANKING_SOURCES.find((s) => s.match.test(key));
  return found || { label: key.replace(/_/g, " ").replace(/rank|ranking/gi, "").trim() || "Other", accent: "#64748b" };
};

const num = (v: unknown): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const m = v.match(/\d+/);
    return m ? parseInt(m[0]) : 0;
  }
  return 0;
};

const collectRankings = (college: CollegeData): RankRow[] => {
  const rows: RankRow[] = [];
  const sd = (college.scraped_data || {}) as ScrapedData;
  const newR = (sd as Record<string, unknown>).new_rankings as Record<string, unknown> | undefined;

  // Top-level NIRF (always show first if present). Year comes from scraped_data
  // when available — fall back to the latest published year.
  if (college.nirf_rank) {
    const nirfYear = num((sd as Record<string, unknown>).nirf_year) || 2024;
    rows.push({ source: "NIRF", rank: college.nirf_rank, year: nirfYear, category: "Engineering" });
  }

  if (newR && typeof newR === "object") {
    Object.entries(newR).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      // Skip the duplicate NIRF if already pushed
      if (/nirf/i.test(key) && college.nirf_rank && num(value) === college.nirf_rank) return;

      // Year-keyed entries: { nirf_rank_2024: 12, nirf_rank_2023: 14, ... }
      const yearMatch = key.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
      const baseKey = key.replace(/_\d{4}/, "");
      const n = num(value);
      if (n > 0) {
        const detected = detectSource(baseKey);
        rows.push({ source: detected.label, rank: n, year, category: undefined });
      }
    });
  }

  // legacy rankings array: rankings: [["NIRF", "2024", "12"], ...]
  const legacy = (sd as Record<string, unknown>).rankings;
  if (Array.isArray(legacy)) {
    legacy.forEach((row) => {
      if (Array.isArray(row) && row.length >= 2) {
        const source = String(row[0] || "").trim();
        const yearStr = row[1];
        const rankStr = row[2] || row[1];
        const year = num(yearStr) >= 2000 ? num(yearStr) : undefined;
        const rank = num(rankStr);
        if (source && rank > 0) {
          rows.push({ source: detectSource(source).label, rank, year });
        }
      }
    });
  }

  return rows;
};

const trendIcon = (current: number, previous?: number) => {
  if (!previous) return <Minus className="w-3 h-3" />;
  if (current < previous) return <TrendingUp className="w-3 h-3" />;
  if (current > previous) return <TrendingDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
};

interface Props {
  college: CollegeData;
}

const RankingBox = ({ college }: Props) => {
  const rows = collectRankings(college);

  // Always render the NIRF section. When no ranking data exists,
  // show an explicit "Unranked" state instead of silently hiding.
  if (rows.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 via-white to-stone-50 shadow-sm"
      >
        <div className="relative p-6 sm:p-8 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-stone-200/60 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-stone-400" />
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-200/60 text-[10px] font-bold text-stone-600 uppercase tracking-wide mb-2">
              <Sparkles className="w-3 h-3" /> NIRF & Rankings
            </div>
            <h3 className="text-lg font-extrabold text-stone-900 tracking-tight mb-1">Not ranked by NIRF</h3>
            <p className="text-xs text-stone-500 leading-snug">
              {college.name} does not currently appear in the NIRF engineering or overall rankings. NIRF publishes only the top institutes each year; absence here does not indicate institute quality.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Group by source for trend lines
  const grouped: Record<string, RankRow[]> = {};
  rows.forEach((r) => {
    if (!grouped[r.source]) grouped[r.source] = [];
    grouped[r.source].push(r);
  });
  Object.keys(grouped).forEach((k) => {
    grouped[k].sort((a, b) => (b.year || 0) - (a.year || 0));
  });

  // Best (lowest) rank across all sources for the headline
  const best = rows.reduce((acc, r) => (r.rank < acc.rank ? r : acc), rows[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50/60 to-white shadow-sm"
    >
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-orange-200/20 blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-100 border border-amber-200 text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-2">
              <Sparkles className="w-3 h-3" /> Rankings & Recognition
            </div>
            <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">National & International Standing</h3>
            <p className="text-xs text-stone-500 mt-1">{rows.length} ranking record{rows.length === 1 ? "" : "s"} across {Object.keys(grouped).length} authority{Object.keys(grouped).length === 1 ? "" : "ies"}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
              <Trophy className="w-4 h-4" />
              <div>
                <p className="text-[10px] font-semibold uppercase opacity-90 leading-none">Best Rank</p>
                <p className="text-base font-extrabold leading-tight">#{best.rank}</p>
              </div>
            </div>
            <p className="text-[10px] text-stone-500 font-semibold mt-1">{best.source}{best.year ? ` ${best.year}` : ""}</p>
          </div>
        </div>

        {/* Source cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(grouped).map(([source, list]) => {
            const detected = detectSource(source);
            const latest = list[0];
            const previous = list[1];
            const accent = detected.accent;
            const delta = previous ? previous.rank - latest.rank : 0;
            return (
              <div
                key={source}
                className="rounded-xl border border-stone-200 bg-white p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${accent}20`, color: accent }}
                    >
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-stone-700">{source}</span>
                  </div>
                  {previous && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        color: delta > 0 ? "#10b981" : delta < 0 ? "#ef4444" : "#78716c",
                        backgroundColor: delta > 0 ? "#10b98115" : delta < 0 ? "#ef444415" : "#f5f5f4",
                      }}
                    >
                      {trendIcon(latest.rank, previous.rank)}
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tabular-nums" style={{ color: accent }}>
                    #{latest.rank}
                  </span>
                  {latest.year && (
                    <span className="text-[11px] font-semibold text-stone-400">{latest.year}</span>
                  )}
                </div>
                {list.length > 1 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {list.slice(1, 4).map((r, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500"
                      >
                        {r.year ? `${r.year}: ` : ""}#{r.rank}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default RankingBox;
