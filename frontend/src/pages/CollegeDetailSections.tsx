import { Badge } from "@/components/ui/badge";
import {
  Trophy, TrendingUp, TrendingDown, LayoutGrid, Users, Briefcase, GraduationCap, Building2,
  Star, CheckCircle2, IndianRupee, BookOpen, MapPin, Calendar,
  Landmark, Globe, Shield, Award, Wifi, Navigation, ChevronDown,
  BarChart2, LineChart as LineChartIcon, ExternalLink, ChevronRight, ArrowUpRight, FileText
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, Cell, PieChart, Pie, Sector
} from "recharts";
import ScrollReveal from "@/components/ScrollReveal";
import { useState, useRef } from "react";
import type { CollegeData, ScrapedData, BranchCutoff, CutoffTrendEntry, SeatMatrixEntry } from "@/types/college";

/* ── Format currency ── */
export const formatINR = (val: number) => {
  if (!val || val <= 0) return null;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val}`;
};

/* ══════════════════════════════════════════════════════
   OVERVIEW TAB
   ══════════════════════════════════════════════════════ */
/* ── About section: splits raw text into readable bullet points ── */
const AboutPoints = ({ text }: { text: string }) => {
  const raw = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.replace(/^[·•\-\d.]+\s*/, "").trim())
    .filter(s => s.length > 30);
  const [intro, ...bullets] = raw;
  return (
    <div className="space-y-4">
      {intro && <p className="text-stone-700 text-sm leading-relaxed tracking-wide">{intro}</p>}
      {bullets.length > 0 && (
        <ul className="space-y-2">
          {bullets.slice(0, 10).map((point, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-stone-500 tracking-wide">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{background:"#f97316"}} />
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const OverviewTab = ({ college, scraped }: { college: CollegeData; scraped: ScrapedData }) => {
  const about = scraped?.details?.about;
  const reviews = scraped?.reviews || {};
  const admissions = scraped?.admissions || {};
  const newRankings = scraped?.new_rankings || {};
  const established = scraped?.details?.established_year;
  const director = scraped?.details?.director;
  const motto = scraped?.details?.motto;
  const campusSize = scraped?.details?.campus_size;
  const website = scraped?.official_website;

  const ratingItems = [
    { label: "Overall", value: reviews.overall_rating, color: "#3b82f6" },
    { label: "Placements", value: reviews.placement_rating, color: "#10b981" },
    { label: "Faculty", value: reviews.faculty_rating, color: "#f59e0b" },
    { label: "Infrastructure", value: reviews.infrastructure_rating, color: "#f97316" },
    { label: "Campus Life", value: reviews.campus_life_rating, color: "#ec4899" },
  ].filter(r => r.value && r.value > 0);

  const radarData = ratingItems.map(r => ({
    subject: r.label, A: r.value, fullMark: 5
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* About */}
      {about && (
        <ScrollReveal>
          <div className="rounded-2xl p-8 relative overflow-hidden group hover:border-orange-300 hover:shadow-md transition-all duration-500" style={{background:"rgba(255,255,255,0.8)",border:"1px solid #fed7aa",backdropFilter:"blur(20px)"}}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -z-10 pointer-events-none" style={{background:"rgba(249,115,22,0.07)"}} />
            <h3 className="font-bold text-2xl tracking-tight mb-5 flex items-center gap-3 text-stone-900">
              <div className="p-2.5 rounded-xl border" style={{background:"rgba(249,115,22,0.05)",borderColor:"rgba(249,115,22,0.25)"}}><BookOpen className="w-5 h-5" style={{color:"#f97316"}} /></div>
              About the Institute
            </h3>
            <AboutPoints text={about} />
            {website && (
              <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm hover:bg-orange-100 hover:text-stone-900 transition-all">
                <Globe className="w-3.5 h-3.5" /> Visit Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </ScrollReveal>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Facts */}
        <ScrollReveal delay={60}>
          <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-8 h-full relative overflow-hidden group hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100 rounded-full blur-[60px] -z-10" />
            <h3 className="font-bold text-xl tracking-tight mb-5 flex items-center gap-3 text-stone-900">
              <div className="p-2.5 rounded-xl bg-orange-100 border border-orange-200"><Building2 className="w-4 h-4 text-orange-500" /></div>
              Key Facts
            </h3>
            <div className="space-y-2">
              {[
                { label: "Type", value: college.type, show: true },
                { label: "Established", value: established, show: !!established },
                { label: "Campus Size", value: campusSize, show: !!campusSize },
                { label: "Director", value: director, show: !!director },
                { label: "Ownership", value: scraped?.ownership_type, show: !!scraped?.ownership_type },
                { label: "NIRF Rank", value: newRankings?.nirf_rank ? `#${newRankings.nirf_rank}` : null, show: !!newRankings?.nirf_rank },
              ].filter(f => f.show && f.value).map((fact, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-3.5 rounded-xl bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm hover:bg-white/70 transition-colors group/row">
                  <span className="text-stone-500 text-xs font-semibold">{fact.label}</span>
                  <span className="font-bold text-stone-800 text-right group-hover/row:text-stone-900 transition-colors">{fact.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Reviews Radar */}
        {radarData.length >= 3 && (
          <ScrollReveal delay={100}>
            <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-8 h-full relative overflow-hidden group hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ">
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100 rounded-full blur-[60px] -z-10" />
              <h3 className="font-bold text-xl tracking-tight mb-2 flex items-center gap-3 text-stone-900">
                <div className="p-2.5 rounded-xl bg-orange-100 border border-orange-200"><Star className="w-4 h-4 text-orange-500" /></div>
                Student Reviews
              </h3>
              {reviews.overall_rating && (
                <div className="flex items-center gap-2 mb-2 bg-white/70 w-max px-4 py-2 rounded-xl border border-stone-200">
                  <span className="text-3xl font-extrabold text-orange-500 tracking-tighter">{reviews.overall_rating}</span>
                  <span className="text-xs font-semibold text-stone-500 mt-1">/ 5.0</span>
                </div>
              )}
              <div className="h-[220px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="rgba(0,0,0,0.06)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#888", fontWeight: "bold", textTransform: "uppercase" }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>

      {/* Admissions */}
      {admissions.entrance_exam && (
        <ScrollReveal delay={140}>
          <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-8 group hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ">
            <h3 className="font-bold text-xl tracking-tight mb-5 flex items-center gap-3 text-stone-900">
              <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-200"><Shield className="w-4 h-4 text-amber-600" /></div>
              Admissions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-box bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-xl">
                <p className="text-xs text-stone-500 font-semibold mb-3">Entrance Exams</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(admissions.entrance_exam) ? admissions.entrance_exam : [admissions.entrance_exam]).map((e: string, i: number) => (
                    <span key={i} className="px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200 rounded-md">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
              {admissions.counselling_authority && (
                <div className="p-5 rounded-box bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-xl">
                  <p className="text-xs text-stone-500 font-semibold mb-3">Counselling Body</p>
                  <p className="font-bold text-stone-900 text-sm">
                    {Array.isArray(admissions.counselling_authority) ? admissions.counselling_authority.join(" / ") : admissions.counselling_authority}
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   CUTOFFS TAB
   ══════════════════════════════════════════════════════ */
export const CutoffsTab = ({ branches, availableYears }: { branches: BranchCutoff[]; availableYears: number[] }) => {
  const [selectedBranchName, setSelectedBranchName] = useState<string | null>(branches?.[0]?.name || null);
  const [filterMode, setFilterMode] = useState<"ALL" | "HIGHEST" | "LOWEST">("ALL");
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");
  const detailRef = useRef<HTMLDivElement>(null);

  if (!branches || branches.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-16 text-center animate-in fade-in duration-700 ">
        <LineChartIcon className="w-12 h-12 text-stone-500 mx-auto mb-4" />
        <p className="font-bold text-xl text-stone-500">No cutoff data available</p>
      </div>
    );
  }

  const activeBranch = branches.find(b => b.name === selectedBranchName) || branches[0];
  const activeTrendData = activeBranch?.cutoff_trend ? [...activeBranch.cutoff_trend].sort((a,b) => a.year - b.year) : [];

  let difficultySummary = "No trend data";
  let diffColor = "text-stone-500 border-stone-300 bg-stone-100";
  let DiffIcon = TrendingUp;
  
  if (activeTrendData.length >= 2) {
    const latest = activeTrendData[activeTrendData.length - 1].closing_rank;
    const previous = activeTrendData[activeTrendData.length - 2].closing_rank;
    const diff = previous - latest;
    if (diff > 0) {
      difficultySummary = `Tougher by ${diff.toLocaleString()} ranks`;
      diffColor = "text-red-400 bg-red-500/10 border-red-500/30";
      DiffIcon = TrendingUp;
    } else if (diff < 0) {
      difficultySummary = `Easier by ${Math.abs(diff).toLocaleString()} ranks`;
      diffColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      DiffIcon = TrendingDown;
    } else {
      difficultySummary = "No change in ranks";
      diffColor = "text-stone-500 bg-white/70 border-stone-200";
      DiffIcon = TrendingUp;
    }
  }

  const handleBranchSelect = (name: string) => {
    setSelectedBranchName(name);
    if (window.innerWidth < 1024 && detailRef.current) setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative items-start">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 xl:col-span-4 bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl overflow-hidden flex flex-col h-[500px] lg:h-[calc(100vh-160px)] lg:sticky lg:top-32">
          <div className="p-6 border-b border-stone-200 bg-white/70 z-10">
            <h3 className="text-xs font-semibold text-stone-500 mb-1 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Branches
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 bg-stone-50/50">
            {branches.map((branch: BranchCutoff, i: number) => {
              const isSelected = selectedBranchName === branch.name;
              const latest = branch.cutoff_trend?.[0];

              return (
                <button
                  key={i} onClick={() => handleBranchSelect(branch.name)}
                  className={`w-full text-left flex items-center justify-between p-4 rounded-xl transition-all duration-300 border
                    ${isSelected ? "bg-white/70 text-stone-900 border-white shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]" : "bg-transparent border-transparent hover:border-stone-200 hover:bg-white/70"}
                  `}
                >
                  <div className="flex-1 pr-4">
                    <h4 className={`text-xs font-semibold leading-snug line-clamp-2 ${isSelected ? "text-stone-900" : "text-stone-500"}`}>{branch.name}</h4>
                  </div>
                  {latest && (
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-bold font-mono tracking-tighter ${isSelected ? "text-stone-900" : "text-stone-900"}`}>#{latest.closing_rank.toLocaleString()}</p>
                      <p className={`text-xs font-semibold ${isSelected ? "text-stone-900/60" : "text-stone-500"}`}>{latest.year}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div ref={detailRef} className="lg:col-span-8 xl:col-span-8 lg:sticky lg:top-32">
          {activeBranch ? (
            <div className="space-y-6">
              <ScrollReveal delay={60} key={`header-${activeBranch.name}`}>
                <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-6 md:p-8  overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
                  
                  <div className="mb-8">
                    <h2 className="font-bold text-2xl md:text-3xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500 leading-tight mb-4">
                      {activeBranch.name}
                    </h2>
                    {activeTrendData.length >= 2 && (
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${diffColor}`}>
                         {difficultySummary !== "No change in ranks" && <DiffIcon className="w-3.5 h-3.5" />} {difficultySummary} (latest)
                      </div>
                    )}
                  </div>

                  {/* MASSIVE CHART */}
                  <div className="h-[350px] w-full bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-4 relative pl-12 sm:pl-16">
                    <div className="absolute left-[-15px] sm:left-[-10px] top-1/2 -translate-y-1/2 -rotate-90 text-[10px] sm:text-xs font-semibold flex items-center gap-6 whitespace-nowrap opacity-100 pointer-events-none z-10">
                        <span className="text-[#ef4444]/50">Low Cutoff</span>
                        <span className="text-[#ef4444]">High Cutoff</span>
                    </div>
                    {activeTrendData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={activeTrendData} margin={{ top: 10, right: 10, left: 50, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                            <XAxis dataKey="year" stroke="#555" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} padding={{ left: 20, right: 20 }} />
                            <YAxis reversed stroke="#555" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={v => `#${v}`} domain={['auto', 'auto']} />
                            <RechartsTooltip 
                               cursor={{ stroke: "rgba(0,0,0,0.06)", strokeWidth: 1, strokeDasharray: "3 3" }}
                               contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e7e5e4", borderRadius: "12px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", tracking: "0.1em" }}
                               labelFormatter={(label) => `Year: ${label}`}
                               formatter={(value: number, name: string) => [`#${value?.toLocaleString() || '—'}`, name]} />
                            <Line type="monotone" dataKey="opening_rank" name="OPENING RANK" stroke="#22c55e" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: '#22c55e', stroke: "#fff" }} />
                            <Line type="monotone" dataKey="closing_rank" name="CLOSING RANK" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444', stroke: "#fff" }} />
                          </LineChart>
                        </ResponsiveContainer>

                        {/* LEGEND overlay */}
                        <div className="absolute top-4 right-4 flex items-center gap-4 bg-white border border-stone-200 px-3 py-1.5 rounded-lg z-10 shadow-xl">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
                                <span className="text-xs font-semibold text-[#22c55e]">Opening</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
                                <span className="text-xs font-semibold text-[#ef4444]">Closing</span>
                            </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-500">
                        <LineChartIcon className="w-10 h-10 opacity-30 mb-2" />
                        <p className="text-xs font-semibold text-stone-500">No trend data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              {/* Data Table */}
              <ScrollReveal delay={120} key={`table-${activeBranch.name}`}>
                 <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl overflow-hidden ">
                    <div className="p-4 sm:p-5 border-b border-stone-200 bg-white/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <h3 className="text-xs font-semibold text-stone-500">Historical Data</h3>
                       <div className="flex items-center gap-2">
                          <div className="flex bg-stone-50 border border-stone-200 rounded-lg p-1">
                             <button onClick={() => setFilterMode("ALL")} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterMode === "ALL" ? "bg-white/10 text-stone-900" : "text-stone-400 hover:text-stone-600"}`}>All</button>
                             <button onClick={() => setFilterMode("HIGHEST")} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterMode === "HIGHEST" ? "bg-[#ef4444]/20 text-[#ef4444]" : "text-stone-400 hover:text-stone-600"}`}>Highest</button>
                             <button onClick={() => setFilterMode("LOWEST")} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterMode === "LOWEST" ? "bg-white/10 text-stone-900" : "text-stone-400 hover:text-stone-600"}`}>Lowest</button>
                          </div>
                          <button onClick={() => setSortOrder(prev => prev === "DESC" ? "ASC" : "DESC")} className="p-2 px-3 bg-stone-50 border border-stone-200 rounded-lg font-bold text-stone-400 hover:text-stone-900 transition-colors flex items-center justify-center" title="Toggle Sort Year">
                             {sortOrder === "DESC" ? "↓" : "↑"}
                          </button>
                       </div>
                    </div>
                    {(() => {
                        const highestCutoff = Math.min(...activeTrendData.map((d: CutoffTrendEntry) => d.closing_rank));
                        const lowestCutoff = Math.max(...activeTrendData.map((d: CutoffTrendEntry) => d.closing_rank));

                        return (
                          <div className="overflow-x-auto max-h-[300px] custom-scrollbar bg-stone-50/50">
                            <table className="w-full text-xs">
                              <thead className="bg-white/70 text-stone-500 text-xs font-semibold sticky top-0 z-10 ">
                                <tr>
                                  <th className="px-5 py-4 text-left border-b border-stone-200">Year</th>
                                  <th className="px-5 py-4 text-left border-b border-stone-200">Round</th>
                                  <th className="px-5 py-4 text-right border-b border-stone-200">Opening Rank</th>
                                  <th className="px-5 py-4 text-right border-b border-stone-200">Closing Rank</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {(() => {
                                    let displayData = [...activeTrendData];
                                    if (sortOrder === "DESC") displayData.reverse();
                                    else displayData.sort((a,b) => a.year - b.year);
                                    
                                    if (filterMode === "HIGHEST") displayData = displayData.filter(d => d.closing_rank === highestCutoff);
                                    if (filterMode === "LOWEST") displayData = displayData.filter(d => d.closing_rank === lowestCutoff);
                                    
                                    return displayData.map((dataObj: CutoffTrendEntry, idx: number) => {
                                      const isHighest = dataObj.closing_rank === highestCutoff;
                                      const isLowest = dataObj.closing_rank === lowestCutoff;
                                      
                                      return (
                                        <tr key={idx} className={`transition-colors hover:bg-white/70 ${idx % 2 === 0 ? "bg-transparent" : "bg-stone-50/50"}`}>
                                          <td className="px-5 py-4 text-stone-900 font-bold flex items-center gap-2">
                                            {dataObj.year}
                                            {isHighest && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 pointer-events-none">Toughest</span>}
                                            {isLowest && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-stone-900/40 border border-white/10 pointer-events-none">Easiest</span>}
                                          </td>
                                          <td className="px-5 py-4 text-stone-400">
                                            {dataObj.round ? <span className="px-2 py-0.5 border border-stone-200 rounded text-[10px] font-bold bg-white/70">R{dataObj.round}</span> : "-"}
                                          </td>
                                          <td className="px-5 py-4 text-right font-mono text-[#22c55e] font-bold">
                                            {dataObj.opening_rank > 0 ? `#${dataObj.opening_rank.toLocaleString()}` : "-"}
                                          </td>
                                          <td className="px-5 py-4 text-right font-mono font-bold text-[#ef4444] tracking-tighter text-sm">
                                            #{dataObj.closing_rank.toLocaleString()}
                                          </td>
                                        </tr>
                                      );
                                    });
                                })()}
                              </tbody>
                            </table>
                          </div>
                        );
                    })()}
                 </div>
              </ScrollReveal>
            </div>
          ) : (
             <div className="h-[500px] flex items-center justify-center bg-white/70 border border-dashed border-white/20 rounded-2xl ">
               <p className="text-xs font-semibold text-stone-500">Select a branch to view details</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   SEATS TAB
   ══════════════════════════════════════════════════════ */
const renderActiveShape = (props: Record<string, unknown>) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <text x={cx} y={cy} dy={-4} textAnchor="middle" fill={fill} className="font-bold text-sm">{payload.name}</text>
      <text x={cx} y={cy} dy={14} textAnchor="middle" fill="#999" className="font-semibold text-xs">{value} seats</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} fill={fill} />
    </g>
  );
};

export const SeatsTab = ({ seats }: { seats: SeatMatrixEntry[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!seats || seats.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-16 text-center animate-in fade-in duration-700 ">
        <Users className="w-12 h-12 text-stone-500 mx-auto mb-4" />
        <p className="font-bold text-xl text-stone-500">No seat data available</p>
      </div>
    );
  }

  const totalSeats = seats.reduce((sum: number, s: SeatMatrixEntry) => sum + (Number(s.total_seats) || 0), 0);
  const demographicData = [
    { name: "OPEN", value: seats.reduce((sum: number, s: SeatMatrixEntry) => sum + (Number(s.gen_seats) || 0), 0), fill: "#3b82f6" },
    { name: "OBC", value: seats.reduce((sum: number, s: SeatMatrixEntry) => sum + (Number(s.obc_seats) || 0), 0), fill: "#f59e0b" },
    { name: "SC", value: seats.reduce((sum: number, s: SeatMatrixEntry) => sum + (Number(s.sc_seats) || 0), 0), fill: "#ef4444" },
    { name: "ST", value: seats.reduce((sum: number, s: SeatMatrixEntry) => sum + (Number(s.st_seats) || 0), 0), fill: "#f97316" },
    { name: "EWS", value: seats.reduce((sum: number, s: SeatMatrixEntry) => sum + (Number(s.ews_seats) || Number(s.ews) || 0), 0), fill: "#10b981" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-6 md:p-8  relative overflow-hidden flex flex-col items-center justify-center min-h-[250px]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-[60px] -z-10" />
            <div className="p-4 rounded-2xl bg-orange-100 border border-orange-200 mb-4"><Users className="w-8 h-8 text-orange-500" /></div>
            <p className="text-xs text-stone-500 font-semibold mb-2">Total Seats</p>
            <h3 className="font-extrabold text-5xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              {totalSeats}
            </h3>
          </div>

          <div className="lg:col-span-2 bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-6 md:p-8  relative overflow-hidden">
            <h3 className="font-bold text-sm mb-4 text-stone-500">Category-wise Distribution</h3>
            <div className="h-[400px] w-full bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-xl p-4 flex items-center justify-center">
              {demographicData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart cursor="pointer">
                    <Pie 
                      data={demographicData} 
                      cx="50%" cy="50%" 
                      innerRadius={80} 
                      outerRadius={130} 
                      paddingAngle={2} 
                      dataKey="value" 
                      stroke="none"
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      labelLine={{ stroke: "rgba(255,255,255,0.5)", strokeWidth: 1 }}
                      label={({ name, value, percent }: { name: string; value: number; percent: number }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {demographicData.map((e, idx) => <Cell key={idx} fill={e.fill} />)}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e7e5e4", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}
                      formatter={(value: number, name: string) => [`${value} seats`, name]}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs font-semibold text-stone-500">No category data available</p>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Enhanced Interactive Seat Grid */}
      <ScrollReveal delay={60}>
        <h3 className="font-bold text-xl tracking-tight mb-6 flex items-center gap-3 text-stone-900">
          <div className="p-2.5 rounded-xl bg-orange-100 border border-orange-200"><LayoutGrid className="w-5 h-5 text-orange-500" /></div>
          Branch-wise Seats
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seats.map((seat: SeatMatrixEntry, i: number) => {
            const total = seat.total_seats || 1; // avoid division by zero
            return (
              <div key={i} className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-5 hover:bg-white/70 hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group ">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold text-xs text-stone-700 leading-relaxed w-3/4 group-hover:text-orange-500 transition-colors">
                    {seat.branch_name || seat.course_name}
                  </h4>
                  <div className="bg-orange-500/10 border border-orange-200 px-3 py-1.5 rounded-xl text-center shrink-0">
                    <span className="block text-[10px] font-semibold text-orange-500 mb-0.5">Total</span>
                    <span className="block font-bold text-orange-500 text-sm leading-none">{seat.total_seats || "-"}</span>
                  </div>
                </div>
                
                {/* Visual Distribution Bar */}
                <div className="w-full h-1.5 rounded-full overflow-hidden flex mb-4 bg-white/70">
                  <div style={{ width: `${((seat.general_seats || seat.general || 0) / total) * 100}%` }} className="bg-orange-500 h-full hover:opacity-80 transition-opacity" />
                  <div style={{ width: `${((seat.obc_seats || seat.obc || 0) / total) * 100}%` }} className="bg-amber-500 h-full hover:opacity-80 transition-opacity" />
                  <div style={{ width: `${((seat.sc_seats || seat.sc || 0) / total) * 100}%` }} className="bg-red-500 h-full hover:opacity-80 transition-opacity" />
                  <div style={{ width: `${((seat.st_seats || seat.st || 0) / total) * 100}%` }} className="bg-purple-500 h-full hover:opacity-80 transition-opacity" />
                  <div style={{ width: `${((seat.ews_seats || seat.ews || 0) / total) * 100}%` }} className="bg-emerald-500 h-full hover:opacity-80 transition-opacity" />
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-5 gap-2 text-center bg-stone-50/50 p-3 rounded-xl border border-stone-200">
                  <div className="group/stat cursor-default">
                    <span className="block text-[8px] text-stone-500 font-bold tracking-wider mb-1 group-hover/stat:text-orange-400 transition-colors">OPEN</span>
                    <span className="block text-xs font-mono font-bold text-stone-700 group-hover/stat:text-orange-400 transition-colors">{seat.general_seats || seat.general || "-"}</span>
                  </div>
                  <div className="group/stat cursor-default border-l border-stone-200">
                    <span className="block text-[8px] text-stone-500 font-bold tracking-wider mb-1 group-hover/stat:text-amber-400 transition-colors">OBC</span>
                    <span className="block text-xs font-mono font-bold text-stone-700 group-hover/stat:text-amber-400 transition-colors">{seat.obc_seats || seat.obc || "-"}</span>
                  </div>
                  <div className="group/stat cursor-default border-l border-stone-200">
                    <span className="block text-[8px] text-stone-500 font-bold tracking-wider mb-1 group-hover/stat:text-red-400 transition-colors">SC</span>
                    <span className="block text-xs font-mono font-bold text-stone-700 group-hover/stat:text-red-400 transition-colors">{seat.sc_seats || seat.sc || "-"}</span>
                  </div>
                  <div className="group/stat cursor-default border-l border-stone-200">
                    <span className="block text-[8px] text-stone-500 font-bold tracking-wider mb-1 group-hover/stat:text-orange-500 transition-colors">ST</span>
                    <span className="block text-xs font-mono font-bold text-stone-700 group-hover/stat:text-orange-500 transition-colors">{seat.st_seats || seat.st || "-"}</span>
                  </div>
                  <div className="group/stat cursor-default border-l border-stone-200">
                    <span className="block text-[8px] text-stone-500 font-bold tracking-wider mb-1 group-hover/stat:text-emerald-400 transition-colors">EWS</span>
                    <span className="block text-xs font-mono font-bold text-stone-700 group-hover/stat:text-emerald-400 transition-colors">{seat.ews_seats || seat.ews || "-"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </div>
  );
};
