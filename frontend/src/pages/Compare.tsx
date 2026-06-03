import { useState, useEffect } from "react";
import { Plus, X, Trophy, MapPin, GraduationCap, Search, Loader2, GitCompare, TrendingUp, BarChart3, Building2, Star, Target, ArrowRight, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useCompare } from "@/contexts/CompareContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Lock } from "lucide-react";
import { CollegeService, College as BasicCollege } from "@/services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, LineChart, Line } from "recharts";
import { AtmosphericGlow, FadeIn } from "@/components/ui/LayoutAtoms";
import SectionCompare from "@/components/compare/SectionCompare";
import type { CollegeData, BranchCutoff, CutoffTrendEntry, ScrapedData } from "@/types/college";

interface College extends BasicCollege {}

const COLLEGE_COLORS = ["#8b5cf6", "#06b6d4", "#f97316"]; // Purple, Cyan, Orange
const COLLEGE_BG = ["bg-[#8b5cf6]", "bg-[#06b6d4]", "bg-[#f97316]"];
const COLLEGE_BORDER = ["border-[#8b5cf6]/30", "border-[#06b6d4]/30", "border-[#f97316]/30"];

const deriveType = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("indian institute of technology") && !n.includes("information")) return "IIT";
  if (n.includes("national institute of technology")) return "NIT";
  if (n.includes("indian institute of information technology")) return "IIIT";
  return "GFTI";
};

const extractStat = (obj: Record<string, unknown> | unknown, keyRegex: RegExp): string => {
  if (!obj || typeof obj !== "object") return "";
  for (const [key, value] of Object.entries(obj)) {
    if (keyRegex.test(key)) { if (typeof value === "string") return value; if (typeof value === "number") return value.toString(); }
    if (typeof value === "object") { const nested = extractStat(value, keyRegex); if (nested) return nested; }
  }
  return "";
};

const extractLPA = (str: string) => {
  if (!str) return 0;
  const match = str.match(/(?:(?:Rs\.?\s*)|(?:INR\s*))?([\d.]+)\s*(?:lakhs?|lpa|crores?|cr)/i);
  if (match) { let val = parseFloat(match[1]); if (str.toLowerCase().includes("crore") || str.toLowerCase().includes("cr")) val *= 100; return val; }
  return 0;
};

const getMetric = (college: CollegeData, type: string) => {
  const scraped = college?.scraped_data || {};
  const inst = (scraped?.placement_summary as Record<string, unknown> | undefined)?.institutional_totals as Record<string, unknown> | undefined;
  const np = scraped?.new_placements as Record<string, unknown> | undefined;
  const toNum = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const rupeesToLPA = (v: number) => (v > 0 ? v / 100000 : 0);
  switch (type) {
    case "avg_pkg":
      return toNum(inst?.average_lpa) || rupeesToLPA(toNum(np?.average_package)) || extractLPA(extractStat(scraped?.placements, /average|avg/i));
    case "highest_pkg":
      return toNum(inst?.highest_lpa) || rupeesToLPA(toNum(np?.highest_package)) || extractLPA(extractStat(scraped?.placements, /highest|max/i));
    case "campus_size": { const raw = scraped?.details?.campus_size || ""; const num = String(raw).match(/\d+/); return num ? parseInt(num[0]) : 0; }
    default: return 0;
  }
};

const Compare = () => {
  const { compareList, addCollege, removeCollege, clearAll } = useCompare();
  const { isPremium, triggerPaymentFlow } = useSubscription();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerResults, setPickerResults] = useState<College[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [detailedData, setDetailedData] = useState<Record<string, CollegeData>>({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

  useEffect(() => { return () => { clearAll(); }; }, []);

  useEffect(() => {
    if (compareList.length === 0) { setDetailedData({}); return; }
    const fetchDetails = async () => {
      setDetailLoading(true);
      const newData: Record<string, CollegeData> = {};
      for (const c of compareList) {
        if (detailedData[c.college_id]) { newData[c.college_id] = detailedData[c.college_id]; continue; }
        try { newData[c.college_id] = await CollegeService.getCollege(c.college_id); }
        catch { newData[c.college_id] = { ...c }; }
      }
      setDetailedData(newData); setDetailLoading(false);
    };
    fetchDetails();
  }, [compareList.map((c) => c.college_id).join(",")]);

  useEffect(() => {
    if (!showPicker) return;
    const timeout = setTimeout(async () => {
      setPickerLoading(true);
      try { const res = await CollegeService.getColleges({ search: pickerSearch || undefined, page_size: 200 }); setPickerResults(res.colleges); }
      catch { setPickerResults([]); } finally { setPickerLoading(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [showPicker, pickerSearch]);

  const handlePickerAdd = (c: College) => {
    if (addCollege({ college_id: c.college_id, name: c.name, type: c.type || deriveType(c.name), state: c.state || "", nirf_rank: c.nirf_rank })) setShowPicker(false);
  };

  const colleges = compareList.map(c => detailedData[c.college_id]).filter(Boolean);

  const commonBranches = (() => {
    if (colleges.length < 2) return [];
    const sets = colleges.map((c: CollegeData) => new Set((c.branches || []).filter((b: BranchCutoff) => b.cutoff_trend?.length > 0).map((b: BranchCutoff) => b.name)));
    return [...sets[0]].filter(name => sets.every((s: Set<string>) => s.has(name))).sort();
  })();

  const metricsBarData = () => {
    return [
      { metric: "NIRF Rank", key: "nirf" }, { metric: "Avg Package (LPA)", key: "avg_pkg" },
      { metric: "Highest Package (LPA)", key: "highest_pkg" }, { metric: "Campus (Acres)", key: "campus_size" }, { metric: "Branches", key: "branches" },
    ].map(m => {
      const row: Record<string, string | number> = { metric: m.metric };
      colleges.forEach((c: CollegeData, i: number) => { row[`college_${i}`] = m.key === "nirf" ? c.nirf_rank || 0 : m.key === "branches" ? c.branches?.length || 0 : getMetric(c, m.key); });
      return row;
    }).filter(r => colleges.some((_: CollegeData, i: number) => (r[`college_${i}`] as number) > 0));
  };

  const radarData = () => {
    const dims = [
      { dim: "NIRF", key: "nirf", invert: true }, { dim: "Avg Pkg", key: "avg_pkg", invert: false },
      { dim: "Top Pkg", key: "highest_pkg", invert: false }, { dim: "Campus", key: "campus_size", invert: false }, { dim: "Branches", key: "branches", invert: false }
    ];
    return dims.map(d => {
      const vals = colleges.map((c: CollegeData) => d.key === "nirf" ? c.nirf_rank || 0 : d.key === "branches" ? c.branches?.length || 0 : getMetric(c, d.key));
      const maxVal = Math.max(...vals.filter((v: number) => v > 0), 1);
      const row: Record<string, string | number> = { dimension: d.dim };
      vals.forEach((v: number, i: number) => { row[`college_${i}`] = v <= 0 ? 0 : d.invert ? Math.round(Math.max(0, (1 - v / (maxVal * 1.5)) * 100)) : Math.round((v / maxVal) * 100); });
      return row;
    });
  };

  const getCutoffTrend = (branchName: string) => {
    const allYears = new Set<number>();
    colleges.forEach((c: CollegeData) => c.branches?.find((b: BranchCutoff) => b.name === branchName)?.cutoff_trend?.forEach((t: CutoffTrendEntry) => allYears.add(t.year)));
    return [...allYears].sort().map(year => {
      const row: Record<string, number | null> = { year };
      colleges.forEach((c: CollegeData, i: number) => { row[`college_${i}`] = c.branches?.find((b: BranchCutoff) => b.name === branchName)?.cutoff_trend?.find((t: CutoffTrendEntry) => t.year === year)?.closing_rank || null; });
      return row;
    });
  };

  const shortName = (name: string) => name.length <= 28 ? name : name.replace("Indian Institute of Technology", "IIT").replace("National Institute of Technology", "NIT").replace("Indian Institute of Information Technology", "IIIT").replace(/\s*\(.*?\)\s*/g, " ").trim();

  return (
    <div className="min-h-screen text-stone-900 pb-20 overflow-hidden relative">
      <AtmosphericGlow />

      {/* Hero Banner */}
      <div className="relative site-hero mb-8 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&q=80&auto=format" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(28,18,10,0.65) 0%, rgba(28,18,10,0.50) 50%, rgba(28,18,10,0.35) 100%)" }} />
        <div className="site-container relative z-10">
          <FadeIn>
            <div className="flex flex-col md:flex-row justify-between items-end pb-4 gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-md bg-white/20 backdrop-blur-md border border-white/25 text-xs font-semibold text-white">
                  <GitCompare className="w-3 h-3 text-white" /> Compare Colleges
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.05] text-white">
                  College <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300">Comparison</span>
                </h1>
              </div>
              {compareList.length > 0 && (
                <button onClick={clearAll} className="h-10 px-6 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/25 text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                  Clear All
                </button>
              )}
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="site-container relative z-10">

        {/* Selected Slots */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
            {[0, 1, 2].map((slot) => {
              const college = compareList[slot];
              const detail = college ? detailedData[college.college_id] : null;

              return (
                <div key={slot} className="h-full">
                  {college ? (
                    <div className={`bg-white/70 backdrop-blur-md rounded-2xl p-8 h-full relative group border ${COLLEGE_BORDER[slot]} flex flex-col`}>
                      <div className={`absolute top-0 left-0 w-full h-1 ${COLLEGE_BG[slot]}`} />
                      <button onClick={() => removeCollege(college.college_id)} className="absolute top-4 right-4 text-stone-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                      <span className={`block w-fit px-2 py-1 border rounded text-xs font-bold uppercase mb-6 ${COLLEGE_COLORS[slot] === "#8b5cf6" ? "text-orange-500 border-purple-400/30" : COLLEGE_COLORS[slot] === "#06b6d4" ? "text-cyan-400 border-cyan-400/30" : "text-violet-400 border-violet-400/30"}`}>{college.type}</span>
                      <h3 className="font-bold text-lg mb-4 line-clamp-3 leading-snug">{college.name}</h3>
                      <div className="space-y-3 text-xs font-semibold text-stone-500 mt-auto">
                        <p className="flex items-center gap-2 text-stone-900"><MapPin className="w-3 h-3" style={{ color: COLLEGE_COLORS[slot] }} /> {college.state}</p>
                        {college.nirf_rank ? <p className="flex items-center gap-2 text-yellow-500"><Trophy className="w-3 h-3" /> NIRF {college.nirf_rank}</p> : <p>Unranked</p>}
                        {detail?.branches && <p className="flex items-center gap-2"><GraduationCap className="w-3 h-3" style={{ color: COLLEGE_COLORS[slot] }} /> {detail.branches.length} Branches</p>}
                      </div>
                    </div>
                  ) : slot === 2 && !isPremium ? (
                    <div className="w-full h-full min-h-[260px] rounded-2xl border border-dashed border-stone-300 bg-[#f0ece4] flex flex-col items-center justify-center text-center p-6">
                       <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mb-3">
                         <Lock className="w-5 h-5 text-white" />
                       </div>
                       <p className="text-sm font-bold text-stone-600 mb-2">Premium Slot</p>
                       <p className="text-[10px] text-stone-500 mb-4 max-w-[150px]">Upgrade to compare up to 3 colleges.</p>
                       <button onClick={triggerPaymentFlow} className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white font-bold text-[10px] transition-colors shadow-sm">
                         Unlock for ₹99
                       </button>
                    </div>
                  ) : (
                    <button onClick={() => { setShowPicker(true); setPickerSearch(""); }} className="w-full h-full min-h-[260px] rounded-2xl border border-dashed border-white/20 bg-white/70 flex flex-col items-center justify-center text-stone-500 hover:border-violet-500/50 hover:bg-orange-400/5 hover:text-violet-400 transition-all text-xs font-semibold">
                       <Plus className="w-6 h-6 mb-2" /> Add College {slot + 1}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </FadeIn>

        {/* Loading */}
        {detailLoading && compareList.length >= 2 && (
          <div className="flex flex-col items-center py-24"><Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" /><p className="text-xs font-semibold text-stone-500">Loading comparison data...</p></div>
        )}

        {/* Dashboard */}
        {!detailLoading && colleges.length >= 2 && (
          <div className="max-w-6xl mx-auto space-y-16">

            <FadeIn delay={0.2}>
              <h2 className="text-xl font-bold mb-6">Key Metrics</h2>
              <div className="bg-white/70 rounded-2xl border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50">
                        <th className="text-left p-6 text-stone-500 font-semibold text-xs w-48">Metric</th>
                        {colleges.map((c: CollegeData, i: number) => (
                          <th key={i} className="p-6 text-left">
                            <span className="font-bold text-xs" style={{ color: COLLEGE_COLORS[i] }}>{shortName(c.name)}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {colleges.some((c: CollegeData) => c.nirf_rank) && <StatRow label="NIRF Rank" icon={<Trophy className="w-3 h-3"/>} best="lowest" vals={colleges.map((c: CollegeData) => ({ val: c.nirf_rank || 0, d: c.nirf_rank ? `#${c.nirf_rank}` : "—" }))} />}
                      <StatRow label="Highest Package" icon={<TrendingUp className="w-3 h-3"/>} best="highest" vals={colleges.map((c: CollegeData) => { const v = getMetric(c, "highest_pkg"); return { val: v, d: v > 0 ? `₹${v}LPA` : "—" }; })} />
                      <StatRow label="Average Package" icon={<TrendingUp className="w-3 h-3"/>} best="highest" vals={colleges.map((c: CollegeData) => { const v = getMetric(c, "avg_pkg"); return { val: v, d: v > 0 ? `₹${v}LPA` : "—" }; })} />
                      <tr className="hover:bg-white/70"><td className="p-6 text-stone-500 text-xs font-semibold flex gap-2 items-center"><MapPin className="w-3 h-3"/> Location</td>{colleges.map((c: CollegeData,i:number) => <td key={i} className="p-6 font-mono text-stone-900 text-xs">{c.state}</td>)}</tr>
                      <StatRow label="Campus Size" icon={<Building2 className="w-3 h-3"/>} best="highest" vals={colleges.map((c: CollegeData) => { const v = getMetric(c, "campus_size"); return { val: v, d: v > 0 ? `${v} Acres` : "—" }; })} />
                    </tbody>
                  </table>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <h2 className="text-xl font-bold mb-6">Visual Analysis</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/70 rounded-2xl border border-stone-200 p-8">
                  <h3 className="text-xs font-semibold text-stone-500 mb-6">Metrics Radar</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData()} outerRadius="70%">
                      <PolarGrid stroke="#ffffff10" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: "#888", fontWeight: "bold" }} />
                      {colleges.map((_: CollegeData, i: number) => <Radar key={i} dataKey={`college_${i}`} stroke={COLLEGE_COLORS[i]} fill={COLLEGE_COLORS[i]} fillOpacity={0.2} strokeWidth={2} />)}
                      <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #333", borderRadius: "8px", fontSize: "10px", fontWeight: "bold" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white/70 rounded-2xl border border-stone-200 p-8">
                  <h3 className="text-xs font-semibold text-stone-500 mb-6">Metrics Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metricsBarData()} layout="vertical" margin={{ left: 0, right: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#888", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="metric" type="category" tick={{ fontSize: 10, fill: "#888", fontWeight: "bold" }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #333", borderRadius: "8px", fontSize: "10px", fontWeight: "bold" }} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                      {colleges.map((_: CollegeData, i: number) => <Bar key={i} dataKey={`college_${i}`} fill={COLLEGE_COLORS[i]} radius={[0, 4, 4, 0]} barSize={8} />)}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.35}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Section-wise Diff</h2>
                <span className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-1 rounded bg-white/60">
                  Auto-analysed across {colleges.length} colleges
                </span>
              </div>
              <SectionCompare colleges={colleges} colors={COLLEGE_COLORS} />
            </FadeIn>

            {commonBranches.length > 0 && (
              <FadeIn delay={0.4}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Cutoff Trends</h2>
                  <span className="text-xs font-semibold text-violet-400 border border-violet-400/30 px-3 py-1 rounded bg-violet-400/10">{commonBranches.length} Shared Branches</span>
                </div>
                <div className="space-y-4">
                  {commonBranches.slice(0, 10).map((branch) => {
                    const isOpen = expandedBranch === branch;
                    const trend = getCutoffTrend(branch);
                    return (
                      <div key={branch} className="bg-white border border-stone-200/80 shadow-sm rounded-2xl overflow-hidden">
                        <button onClick={() => setExpandedBranch(isOpen ? null : branch)} className="w-full flex justify-between items-center p-6 hover:bg-white/70 transition-all text-left">
                          <p className="font-mono text-sm text-stone-900 font-bold">{branch}</p>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-stone-500"/> : <ChevronDown className="w-4 h-4 text-stone-500"/>}
                        </button>
                        {isOpen && (
                          <div className="p-6 border-t border-white/5">
                            <ResponsiveContainer width="100%" height={220}>
                              <LineChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#555", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: "#555", fontWeight: "bold" }} axisLine={false} tickLine={false} width={50} reversed tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`}/>
                                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #333", borderRadius: "8px", fontSize: "10px", fontWeight: "bold" }} />
                                {colleges.map((_: CollegeData, i:number) => <Line key={i} dataKey={`college_${i}`} stroke={COLLEGE_COLORS[i]} strokeWidth={3} dot={{ fill: COLLEGE_COLORS[i], r: 3, strokeWidth: 0 }} type="monotone" connectNulls />)}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </FadeIn>
            )}
          </div>
        )}

        {/* Picker Modal */}
        {showPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm backdrop-blur-xl p-4" onClick={() => setShowPicker(false)}>
            <div className="bg-stone-100 rounded-2xl border border-stone-200 w-full max-w-xl p-8" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-6 border-b border-stone-200 pb-4">Find a College</h3>
              <Input placeholder="Search by name or state..." value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} className="h-14 mb-4 rounded-xl bg-white shadow-sm border-stone-200 text-stone-900 font-mono focus-visible:ring-orange-500" autoFocus/>
              <div className="max-h-[400px] overflow-y-auto space-y-2 custom-scrollbar">
                {pickerLoading ? <p className="text-xs font-semibold text-stone-500 text-center py-8">Searching...</p> :
                 pickerResults.filter(c => !compareList.find(s => s.college_id === c.college_id)).map(col => (
                   <button key={col.college_id} onClick={() => handlePickerAdd(col)} className="w-full text-left p-4 rounded-xl border border-white/5 hover:bg-white/70 transition-all group flex justify-between items-center">
                     <div>
                       <p className="text-sm font-bold mb-1 group-hover:text-violet-400 transition-colors">{col.name}</p>
                       <p className="text-xs text-stone-500 flex items-center gap-2"><MapPin className="w-3 h-3"/> {col.state}</p>
                     </div>
                     <span className="text-xs font-bold text-stone-500 border border-stone-300 px-2 py-1 rounded">{col.type}</span>
                   </button>
                 ))
                }
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Utils
interface StatVal { val: number; d: string; }
function StatRow({ icon, label, vals, best }: { icon: React.ReactNode; label: string; vals: StatVal[]; best: "highest" | "lowest" }) {
  const vArr = vals.map((v: StatVal)=>v.val).filter((v: number)=>v>0);
  const bestV = vArr.length>0 ? (best==="highest"?Math.max(...vArr):Math.min(...vArr)) : -1;
  return (
    <tr className="hover:bg-white/70">
      <td className="p-6 text-xs font-semibold text-stone-500 flex gap-2 items-center">{icon} {label}</td>
      {vals.map((v: StatVal,i:number) => {
        const isBest = v.val>0 && v.val === bestV && vArr.filter((x: number)=>x===bestV).length===1;
        return (
          <td key={i} className="p-6 text-left">
            <span className={`text-base font-mono font-bold ${isBest ? `text-[${COLLEGE_COLORS[i]}]` : "text-stone-900"}`}>{v.d}</span>
            {isBest && <span className="ml-2 text-xs font-bold" style={{ color: COLLEGE_COLORS[i]}}>Best</span>}
          </td>
        )
      })}
    </tr>
  )
}

export default Compare;
