import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, IndianRupee, Building2, CheckCircle2, MapPin,
  Navigation, TrendingUp, Trophy, BarChart2, Users, GraduationCap,
  Loader2, ChevronDown, Wallet, Calculator
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend, Sector
} from "recharts";
import ScrollReveal from "@/components/ScrollReveal";
import { formatINR } from "./CollegeDetailSections";
import type { ScrapedData } from "@/types/college";

const renderActiveFeeShape = (props: Record<string, unknown>) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <text x={cx} y={cy} dy={-8} textAnchor="middle" fill={fill} className="font-bold text-xs">{payload.name.length > 22 ? payload.name.substring(0,20)+"…" : payload.name}</text>
      <text x={cx} y={cy} dy={10} textAnchor="middle" fill="#44403c" className="font-bold text-sm">₹{Number(value).toLocaleString('en-IN')}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 10} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 13} outerRadius={outerRadius + 17} fill={fill} />
    </g>
  );
};

/* ══════════════════════════════════════════════════════
   FEES TAB
   ══════════════════════════════════════════════════════ */
export const FeesTab = ({ scraped, collegeName }: { scraped: ScrapedData, collegeName?: string }) => {
  const feeStructure = scraped?.fee_structure;
  const newFees = scraped?.new_fees || {};
  const btechFees = (newFees.btech_course_fees || []).filter((f: Record<string, unknown>) => f.tuition_fee_per_year && (f.tuition_fee_per_year as number) > 0);
  const oldFees = scraped?.fees;
  const [activeFeeIdx, setActiveFeeIdx] = useState(-1);
  
  const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#f97316", "#ec4899", "#06b6d4", "#ef4444", "#84cc16", "#fb923c"];

  // If we have the modern fee_structure (JSON data)
  if (feeStructure && Object.keys(feeStructure).length > 0) {
    const rawSemesterSum = Object.entries(feeStructure)
      .filter(([k, v]) => v && v !== "Not Available" && typeof v === "number" && !k.includes("total"))
      .reduce((sum, [k, v]) => sum + (v as number), 0);

    // If parsed semester sum implies it's an Annual fee, halve it.
    // IIT genuine per-semester max is ~2–2.5L. NITs max is ~1–1.35L.
    const isNIT = collegeName ? (collegeName.includes("NIT") || collegeName.toLowerCase().includes("national institute of technology")) : false;
    const isIIT = collegeName ? (collegeName.includes("IIT") || collegeName.toLowerCase().includes("indian institute of technology")) : false;
    let threshold = 250000; // default
    if (isNIT) threshold = 135000;
    else if (isIIT) threshold = 250000; // IIT max per-semester is 2-2.5L
    const divisor = rawSemesterSum >= threshold ? 2 : 1;

    const normalizedFeeStructure = Object.fromEntries(
        Object.entries(feeStructure).map(([k, v]) => [
            k, 
            (v && v !== "Not Available" && typeof v === "number") ? v / divisor : v
        ])
    );

    const pieData = Object.entries(normalizedFeeStructure)
      .filter(([k, v]) => v && v !== "Not Available" && typeof v === "number" && !k.includes("total"))
      .map(([k, v]) => ({
        name: k.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
        value: v as number,
        key: k
      }));

    const totalGen = normalizedFeeStructure.grand_total_gen_obc !== "Not Available" ? normalizedFeeStructure.grand_total_gen_obc : null;
    const totalSCST = normalizedFeeStructure.grand_total_sc_st_pwd !== "Not Available" ? normalizedFeeStructure.grand_total_sc_st_pwd : null;
    const tuition = normalizedFeeStructure.tuition_fee_per_semester !== "Not Available" ? normalizedFeeStructure.tuition_fee_per_semester : null;

    // Compute estimated 4-year B.Tech total
    const semesterFees = pieData.reduce((sum, d) => sum + (d.value || 0), 0);
    const estAnnual = semesterFees * 2;
    const est4Year = semesterFees * 8;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Total Course Fee Summary Cards */}
        <ScrollReveal>
          <h3 className="font-bold text-xl tracking-tight mb-6 flex items-center gap-3 text-stone-900">
            <div className="p-2.5 rounded-xl bg-orange-100 border border-orange-200"><Calculator className="w-5 h-5 text-orange-500" /></div>
            Fee Estimate
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {tuition && (
              <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-5 text-center group hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500  relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100 rounded-full blur-[40px] -z-10" />
                <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center mx-auto mb-3">
                  <IndianRupee className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-xl font-bold text-stone-900 mb-1 tracking-tighter">{formatINR(tuition)}</p>
                <p className="text-[10px] text-stone-500 font-semibold">Per Semester Tuition</p>
              </div>
            )}
            {tuition && (
              <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-5 text-center group hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500  relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-[40px] -z-10" />
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-3">
                  <IndianRupee className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-xl font-bold text-stone-900 mb-1 tracking-tighter">{formatINR(tuition * 2)}</p>
                <p className="text-[10px] text-stone-500 font-semibold">Per Year Fee</p>
              </div>
            )}
            {totalGen && (
              <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-5 text-center group hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500  relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-[40px] -z-10" />
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-xl font-bold text-stone-900 mb-1 tracking-tighter">{formatINR(totalGen)}</p>
                <p className="text-[10px] text-stone-500 font-semibold">Total (Gen/OBC)</p>
              </div>
            )}
            {totalSCST && (
              <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-5 text-center group hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500  relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px] -z-10" />
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xl font-bold text-stone-900 mb-1 tracking-tighter">{formatINR(totalSCST)}</p>
                <p className="text-[10px] text-stone-500 font-semibold">Total (SC/ST/PWD)</p>
              </div>
            )}
            {est4Year > 0 && (
              <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-5 text-center group hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500  relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100 rounded-full blur-[40px] -z-10" />
                <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-1 tracking-tighter">{formatINR(est4Year)}</p>
                <p className="text-[10px] text-stone-500 font-semibold">Est. 4-Year B.Tech Total</p>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Interactive Pie Chart */}
        {pieData.length > 0 && (
          <ScrollReveal delay={60}>
            <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-6 lg:p-8 ">
              <h3 className="font-bold text-xl tracking-tight mb-6 flex items-center gap-3 text-stone-900">
                <div className="p-2.5 rounded-xl bg-orange-100 border border-orange-200"><BarChart2 className="w-5 h-5 text-orange-500" /></div>
                Fee Breakdown
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[650px] w-full bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-xl p-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart cursor="pointer">
                      <Pie
                        data={pieData}
                        cx="50%" cy="45%"
                        innerRadius={90}
                        outerRadius={160}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        activeIndex={activeFeeIdx >= 0 ? activeFeeIdx : undefined}
                        activeShape={renderActiveFeeShape}
                        onMouseEnter={(_, index) => setActiveFeeIdx(index)}
                        onMouseLeave={() => setActiveFeeIdx(-1)}
                        label={({ cx, cy, midAngle, outerRadius, name, percent, index }: { cx: number; cy: number; midAngle: number; outerRadius: number; name: string; percent: number; index: number }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 30 + (index % 2) * 40;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          const anchor = x > cx ? "start" : "end";
                          const shortName = name.length > 16 ? name.substring(0, 14) + "…" : name;
                          return (
                            <text x={x} y={y} textAnchor={anchor} fill="rgba(148,163,184,0.8)" fontSize={11} fontWeight="bold">
                              {shortName} {(percent * 100).toFixed(0)}%
                            </text>
                          );
                        }}
                        labelLine={{ stroke: "rgba(100,116,139,0.25)", strokeWidth: 1 }}
                      >
                        {pieData.map((e, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(value: number, name: string) => [`₹${Number(value).toLocaleString('en-IN')}`, name]} />
                      <Legend verticalAlign="bottom" height={80} iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", paddingTop: "20px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Fee Breakdown Stat Cards */}
                <div className="flex flex-col gap-3 justify-center">
                  {pieData.map((item, idx) => (
                    <div
                      key={idx}
                      className={`bg-white/70 border rounded-xl p-3 flex items-center gap-3 cursor-default transition-all duration-300 ${activeFeeIdx === idx ? 'border-stone-300 bg-white/70' : 'border-stone-200 hover:border-stone-300'}`}
                      onMouseEnter={() => setActiveFeeIdx(idx)}
                    >
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-500 font-semibold truncate">{item.name}</p>
                        <p className="text-sm font-bold text-stone-900 tracking-tight">₹{Number(item.value).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Detailed Financial Structure Table */}
        <ScrollReveal delay={80}>
          <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl overflow-hidden ">
            <div className="p-5 border-b border-stone-200 bg-white/70">
              <h3 className="text-xs font-semibold text-stone-500 flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5 text-orange-500" /> Detailed Fee Structure</h3>
            </div>
            <div className="overflow-x-auto bg-stone-50/50">
              <table className="w-full text-xs">
                <thead className="bg-white/70 text-stone-500 text-xs font-semibold border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-4 text-left">Fee Component</th>
                    <th className="px-6 py-4 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Object.entries(normalizedFeeStructure)
                    .filter(([k, v]) => v && v !== "Not Available" && v !== "NA" && v !== "na" && v !== "N/A" && v !== 0)
                    .map(([k, v]: [string, unknown], i: number) => (
                    <tr key={i} className={`hover:bg-white/70 transition-colors ${k.includes('total') ? 'bg-amber-500/5' : i % 2 === 0 ? "bg-transparent" : "bg-stone-50/50"}`}>
                      <td className={`px-6 py-4 font-bold uppercase tracking-wide leading-snug ${k.includes('total') ? 'text-amber-600' : 'text-stone-700'}`}>{k.replace(/_/g, " ")}</td>
                      <td className={`px-6 py-4 text-right font-bold font-mono text-sm tracking-tight ${k.includes('total') ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {typeof v === "number" ? `₹${Number(v).toLocaleString('en-IN')}` : String(v)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  // Check if we have ANY fee data
  const hasNewFees = newFees && (newFees.tuition_fee_per_year > 0 || newFees.total_fee > 0);
  const hasOldFees = oldFees && Object.keys(oldFees).length > 0;

  if (!hasNewFees && !hasOldFees && btechFees.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-16 text-center animate-in fade-in duration-700">
        <IndianRupee className="w-12 h-12 text-stone-400 mx-auto mb-4" />
        <p className="font-bold text-xl text-stone-500">No fee data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Fee Summary Cards */}
      {hasNewFees && (
        <ScrollReveal>
          <h3 className="font-bold text-xl tracking-tight mb-5 flex items-center gap-3 text-stone-900">
            <div className="p-2.5 rounded-xl bg-orange-100 border border-orange-200"><IndianRupee className="w-5 h-5 text-orange-500" /></div>
            Fee Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Tuition Fee / Year", value: newFees.tuition_fee_per_year, color: "orange" },
              { label: "Hostel Fee", value: newFees.hostel_fee > 10 ? newFees.hostel_fee : null, color: "amber" },
              { label: "Total Fee", value: newFees.total_fee, color: "emerald" },
            ].filter(f => f.value && f.value > 0).map((f, i) => (
              <div key={i} className={`bg-gradient-to-br from-${f.color}-50 to-white border border-${f.color}-100 rounded-2xl p-5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all`}>
                <p className="text-2xl font-extrabold text-stone-800">{formatINR(f.value)}</p>
                <p className="text-xs text-stone-500 font-semibold mt-1">{f.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}

      {/* Detailed Fee Tables from oldFees */}
      {hasOldFees && Object.entries(oldFees).map(([section, rows]: [string, unknown], si: number) => {
        if (!Array.isArray(rows) || rows.length < 2) return null;
        const headers = rows[0];
        const dataRows = (rows as string[][]).slice(1).filter((r: string[]) => {
          if (!Array.isArray(r)) return false;
          return !r.every((cell: string) => !cell || cell === "NA" || cell === "N/A" || cell === "-" || cell === "—");
        });
        if (dataRows.length === 0) return null;
        return (
          <ScrollReveal key={si} delay={si * 40}>
            <div className="bg-gradient-to-br from-white to-orange-50/20 border border-orange-100/60 shadow-sm rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200 bg-orange-50/50">
                <h4 className="font-bold text-sm text-stone-800">{section}</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/50">
                      {headers.map((h: string, hi: number) => (
                        <th key={hi} className={`px-6 py-3 text-xs font-semibold text-stone-500 ${hi === 0 ? "text-left" : "text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row: string[], ri: number) => (
                      <tr key={ri} className="border-b border-stone-100 hover:bg-orange-50/30 transition-colors">
                        {row.map((cell: string, ci: number) => (
                          <td key={ci} className={`px-6 py-3 ${ci === 0 ? "text-left font-semibold text-stone-700" : "text-right text-stone-600"}`}>{cell || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        );
      })}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   PLACEMENTS TAB
   ══════════════════════════════════════════════════════ */
export const PlacementsTab = ({ scraped, bulkPlacement, bulkPlacementLoading }: { scraped: ScrapedData; bulkPlacement: Record<string, unknown> | null; bulkPlacementLoading: boolean }) => {
  const placementSummary = scraped?.placement_summary;
  const legacyPlacements = scraped?.new_placements || {};
  const hasLegacyData = legacyPlacements.highest_package || legacyPlacements.average_package;

  const formatLPA = (val: number | string | null | undefined): string | null => {
    if (val === undefined || val === null || val === "Not Available" || val === "NA") return null;
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return val;
    if (num >= 100) return `${(num / 100).toFixed(2)} CR`;
    return `${num} LPA`;
  };

  const formatAxisLPA = (v: number) => {
    if (v >= 100) return `${(v / 100).toFixed(2)}CR`;
    return `${v}L`;
  };

  const branchSnapshots = useMemo(() => {
    const programs = scraped?.programs || [];
    const snapshots: { originalName: string; name: string; average_lpa: number | null; highest_lpa: number | null; median_lpa: number | null; success_rate: number | null }[] = [];
    
    programs.forEach((prog: Record<string, unknown>) => {
      const pData = prog.placement || {};
      const keys = Object.keys(pData);
      
      if (keys.length > 0) {
        keys.forEach(degKey => {
           const snap = pData[degKey];
           let sRate: number | null = null;
           if (snap && snap.success_rate) {
              sRate = parseFloat(String(snap.success_rate).replace("%", ""));
           }
           if (snap && (snap.average_lpa || snap.highest_lpa)) {
              snapshots.push({
                 originalName: prog.program_name || snap.branch,
                 name: (snap.branch || prog.program_name || "").replace(/B\.Tech\s*-?\s*/i, "").replace(/Engineering/i, "Engg").substring(0, 30),
                 average_lpa: snap.average_lpa || null,
                 highest_lpa: snap.highest_lpa || null,
                 median_lpa: snap.median_lpa || null,
                 success_rate: isNaN(sRate as number) ? null : sRate
              });
           }
        });
      }

      // If no valid placement was pushed or pData was empty, push a blank wrapper
      if (!snapshots.find(s => s.originalName === prog.program_name)) {
        snapshots.push({
           originalName: prog.program_name,
           name: (prog.program_name || "").replace(/B\.Tech\s*-?\s*/i, "").replace(/Engineering/i, "Engg").substring(0, 30),
           average_lpa: null,
           highest_lpa: null,
           median_lpa: null,
           success_rate: null
        });
      }
    });
    
    return snapshots.sort((a, b) => (b.average_lpa || 0) - (a.average_lpa || 0));
  }, [scraped?.programs]);

  const [selectedDeepDiveBranch, setSelectedDeepDiveBranch] = useState<string>("");
  useEffect(() => {
    if (branchSnapshots.length > 0 && !selectedDeepDiveBranch) {
      setSelectedDeepDiveBranch(branchSnapshots[0].originalName);
    }
  }, [branchSnapshots]);

  const activeDeepDive = branchSnapshots.find(b => b.originalName === selectedDeepDiveBranch) || branchSnapshots[0];

  const trendData = useMemo(() => {
    const fyt = placementSummary?.five_year_trend?.data || {};
    return Object.entries(fyt)
      .map(([year, d]: [string, Record<string, string | number>]) => ({ 
        year, 
        average_lpa: d.average_lpa ? parseFloat(d.average_lpa) : null,
        highest_lpa: d.highest_lpa ? parseFloat(d.highest_lpa) : null,
        median_lpa: d.median_lpa ? parseFloat(d.median_lpa) : null,
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [placementSummary]);

  if (bulkPlacementLoading) {
    return (
      <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-16 text-center animate-in fade-in duration-700 ">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
        <p className="font-semibold text-sm text-stone-500">Loading placement data...</p>
      </div>
    );
  }

  // Modern `placement_summary` rendering logic...
  if (placementSummary) {
    const inst = placementSummary.institutional_totals || {};
    
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {inst.highest_lpa && (
              <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-6 text-center group hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500  relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-stone-900 mb-2 tracking-tighter">{formatLPA(inst.highest_lpa)}</p>
                <p className="text-xs text-stone-500 font-semibold">Highest Package</p>
              </div>
            )}
            {inst.average_lpa && (
              <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-6 text-center group hover:border-orange-300 hover:shadow-md transition-all duration-500  relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-stone-900 mb-2 tracking-tighter">{formatLPA(inst.average_lpa)}</p>
                <p className="text-xs text-stone-500 font-semibold">Average Package</p>
              </div>
            )}
            {inst.median_lpa && (
              <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-6 text-center group hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500  relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <BarChart2 className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-stone-900 mb-2 tracking-tighter">{formatLPA(inst.median_lpa)}</p>
                <p className="text-xs text-stone-500 font-semibold">Median Package</p>
              </div>
            )}
            {inst.placement_rate && (
              <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-6 text-center group hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500  relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-stone-900 mb-2 tracking-tighter">{inst.placement_rate}%</p>
                <p className="text-xs text-stone-500 font-semibold">Placement Rate</p>
              </div>
            )}
          </div>
        </ScrollReveal>

        {trendData.length > 0 && (
          <ScrollReveal delay={50}>
            <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-6 lg:p-8  mb-6">
              <h3 className="font-bold text-xl tracking-tight mb-6 flex items-center gap-3 text-stone-900">
                <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30"><TrendingUp className="w-5 h-5 text-orange-500" /></div>
                5-Year Placement Trend
              </h3>
              <div className="h-[350px] w-full bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={true} />
                    <XAxis dataKey="year" stroke="#555" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} padding={{ left: 20, right: 20 }} />
                    <YAxis stroke="#555" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={formatAxisLPA} />
                    <RechartsTooltip 
                      cursor={{ stroke: "rgba(0,0,0,0.06)", strokeWidth: 1, strokeDasharray: "3 3" }}
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e7e5e4", borderRadius: "12px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                    <Line type="monotone" connectNulls name="AVERAGE LPA" dataKey="average_lpa" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff' }} />
                    <Line type="monotone" connectNulls name="HIGHEST LPA" dataKey="highest_lpa" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff' }} />
                    <Line type="monotone" connectNulls name="MEDIAN LPA" dataKey="median_lpa" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ScrollReveal>
        )}

        {branchSnapshots.filter(b => b.average_lpa || b.highest_lpa || b.median_lpa).length > 0 && (
          <ScrollReveal delay={60}>
            <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-6 lg:p-8  mb-6">
              <h3 className="font-bold text-xl tracking-tight mb-6 flex items-center gap-3 text-stone-900">
                <div className="p-2.5 rounded-xl bg-orange-100 border border-orange-200"><BarChart2 className="w-5 h-5 text-orange-500" /></div>
                Branch-wise Comparison
              </h3>
              
              <div className="h-[400px] w-full bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchSnapshots.filter(b => b.average_lpa && b.average_lpa > 0).slice(0, 15)} margin={{ top: 20, right: 20, left: 0, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={true} />
                    <XAxis dataKey="name" stroke="#555" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#555" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={formatAxisLPA} />
                    <RechartsTooltip 
                      cursor={{ fill: "rgba(249,115,22,0.04)" }}
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e7e5e4", borderRadius: "12px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                    <Bar name="AVERAGE LPA" dataKey="average_lpa" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar name="HIGHEST LPA" dataKey="highest_lpa" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-6 lg:p-8  mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-xl tracking-tight flex items-center gap-3 text-stone-900">
                  <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-200"><BarChart2 className="w-5 h-5 text-amber-600" /></div>
                  Branch Details
                </h3>
                <div className="relative">
                  <select 
                    value={selectedDeepDiveBranch}
                    onChange={(e) => setSelectedDeepDiveBranch(e.target.value)}
                    className="appearance-none bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm text-stone-900 font-semibold text-xs px-4 py-2.5 pr-10 rounded-xl outline-none focus:border-amber-500 transition-colors w-full md:w-auto min-w-[200px]"
                  >
                    {branchSnapshots.map((b, i) => (
                      <option key={i} value={b.originalName}>{b.originalName}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {activeDeepDive && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in duration-500">
                  <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center justify-between group hover:border-amber-300 transition-colors">
                    <div>
                      <p className="text-xs text-stone-500 font-semibold mb-1">Selected Branch</p>
                      <p className="font-bold text-lg text-stone-900 tracking-tight leading-tight">{activeDeepDive.name}</p>
                    </div>
                    <GraduationCap className="w-8 h-8 text-amber-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 text-center group hover:border-orange-300 hover:shadow-md transition-colors">
                    <p className="font-bold text-2xl text-orange-500 tracking-tighter mb-1">{formatLPA(activeDeepDive.average_lpa)}</p>
                    <p className="text-xs text-stone-500 font-semibold">Average Package</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center group hover:border-emerald-300 hover:shadow-md transition-colors">
                    <p className="font-bold text-2xl text-emerald-400 tracking-tighter mb-1">{formatLPA(activeDeepDive.highest_lpa)}</p>
                    <p className="text-xs text-stone-500 font-semibold">Highest Offer</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl overflow-hidden ">
              <div className="p-5 border-b border-stone-200 bg-white/70">
                <h3 className="text-xs font-semibold text-stone-500 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> All Branches
                </h3>
              </div>
              <div className="overflow-x-auto bg-stone-50/50">
                <table className="w-full text-xs">
                  <thead className="bg-white/70 text-stone-500 text-xs font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-6 py-4 text-left">Branch</th>
                      <th className="px-6 py-4 text-right">Average LPA</th>
                      <th className="px-6 py-4 text-right">Highest LPA</th>
                      <th className="px-6 py-4 text-right">Median LPA</th>
                      <th className="px-6 py-4 text-right">Placement Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {branchSnapshots.map((b, i) => (
                      <tr key={i} className={`hover:bg-white/70 transition-colors ${i % 2 === 0 ? "bg-transparent" : "bg-stone-50/50"}`}>
                        <td className="px-6 py-4 font-bold text-stone-700 tracking-wide">{b.originalName}</td>
                        <td className="px-6 py-4 text-right font-bold text-orange-500 font-mono tracking-tight text-sm">{b.average_lpa ? formatLPA(b.average_lpa).replace(" LPA", "") : "-"}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-400 font-mono tracking-tight text-sm">{b.highest_lpa ? formatLPA(b.highest_lpa).replace(" LPA", "") : "-"}</td>
                        <td className="px-6 py-4 text-right font-bold text-orange-500 font-mono tracking-tight text-sm">{b.median_lpa ? formatLPA(b.median_lpa).replace(" LPA", "") : "-"}</td>
                        <td className="px-6 py-4 text-right font-bold text-amber-400 font-mono tracking-tight text-sm">{b.success_rate ? `${b.success_rate}%` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        )}

        {placementSummary.top_recruiters && placementSummary.top_recruiters.length > 0 && (
          <ScrollReveal delay={80}>
            <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-6 lg:p-8  mt-6">
              <h3 className="font-bold text-xl tracking-tight mb-6 flex items-center gap-3 text-stone-900">
                <div className="p-2.5 rounded-xl bg-orange-100 border border-orange-200"><Briefcase className="w-5 h-5 text-orange-500" /></div>
                Top Recruiters
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {placementSummary.top_recruiters.slice(0, 30).map((r: string, i: number) => (
                  <span key={i} className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm text-stone-700 hover:bg-orange-100 hover:text-stone-900 hover:border-white transition-colors text-xs font-semibold px-4 py-2 rounded-lg cursor-default">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    );
  }

  // Fallbacks if no data found
  return (
    <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-16 text-center  animate-in fade-in duration-700">
      <Briefcase className="w-12 h-12 text-stone-500 mx-auto mb-4" />
      <p className="font-bold text-xl text-stone-500">No placement data available</p>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   CAMPUS & FACILITIES TAB
   ══════════════════════════════════════════════════════ */
export const CampusTab = ({ scraped }: { scraped: ScrapedData }) => {
  const facilities = scraped?.facilities || {};
  const address = scraped?.details?.address;

  const facilityItems = typeof facilities === "object" && !Array.isArray(facilities)
    ? Object.entries(facilities).filter(([, v]) => v === true).map(([k]) => k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()))
    : Array.isArray(facilities) ? facilities : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {facilityItems.length > 0 ? (
        <ScrollReveal>
          <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-8 group hover:border-emerald-300 hover:shadow-md transition-all duration-500 ">
            <h3 className="font-bold text-xl tracking-tight mb-6 flex items-center gap-3 text-stone-900">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30"><Building2 className="w-5 h-5 text-emerald-400" /></div>
              Campus Facilities
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {facilityItems.map((fac: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm hover:border-emerald-300 hover:shadow-md hover:bg-white/70 transition-all">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-stone-700">{fac}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      ) : (
        <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-16 text-center ">
          <Building2 className="w-12 h-12 text-stone-500 mx-auto mb-4" />
          <p className="font-bold text-xl text-stone-500">No facility data available</p>
        </div>
      )}

      {/* Location */}
      {address && (
        <ScrollReveal delay={60}>
          <div className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm rounded-2xl p-8 group hover:border-purple-300 hover:shadow-md transition-all duration-500 ">
            <h3 className="font-bold text-xl tracking-tight mb-6 flex items-center gap-3 text-stone-900">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30"><MapPin className="w-5 h-5 text-orange-500" /></div>
              Location
            </h3>
            <div className="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/60 shadow-sm mb-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl shrink-0 h-max"><MapPin className="w-5 h-5 text-orange-500" /></div>
              <div>
                <h4 className="text-xs font-semibold text-stone-500 mb-2">Address</h4>
                <p className="text-stone-700 text-sm leading-relaxed">{address}</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-stone-200 relative" style={{ height: "350px" }}>
              <iframe
                title="College Location Map"
                width="100%"
                height="100%"
                style={{ border: 0, filter: "none" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
              />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-orange-500 text-xs font-semibold hover:bg-purple-500/30 hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              Open in Google Maps
            </a>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
};
