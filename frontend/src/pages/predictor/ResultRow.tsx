import React from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from "recharts";
import { BarChart3, GitCompareArrows } from "lucide-react";
import { getCollegeType, CollegeResult } from "./constants";

interface ResultRowProps {
  college: CollegeResult;
  index: number;
  isExpanded: boolean;
  isInCompare: boolean;
  onToggleExpand: () => void;
  onToggleCompare: () => void;
}

const ResultRow: React.FC<ResultRowProps> = ({
  college, index, isExpanded, isInCompare, onToggleExpand, onToggleCompare,
}) => {
  const type = getCollegeType(college.name);
  const tColor = type === "IIT" ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
    : type === "NIT" ? "text-orange-400 border-orange-500/30 bg-orange-500/10"
    : type === "IIIT" ? "text-violet-400 border-violet-500/30 bg-violet-500/10"
    : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";

  const cColor = college.classification === "SAFE" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
    : college.classification === "TARGET" ? "text-orange-400 border-orange-500/30 bg-orange-500/10"
    : "text-violet-400 border-violet-500/30 bg-violet-500/10";

  const trendData = (college.historical_cutoffs || []).sort((a, b) => (a.year || 0) - (b.year || 0));

  const hasDetail = !!college.id && college.id !== "0";

  return (
    <div className="hover:bg-stone-50/50 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-[40px_1fr_1fr_80px_80px_60px_60px] gap-4 items-center px-6 py-4">
        <div className="hidden md:block text-xs text-stone-400 font-medium">{index}</div>
        <div>
          <div className="flex md:hidden items-center gap-2 mb-1.5">
            <span className="text-xs text-stone-400">{index}.</span>
            {college.imageUrl && <img src={college.imageUrl} alt="" className="w-4 h-4 rounded object-contain" />}
            <span className={`px-1.5 py-0.5 border text-[10px] font-bold rounded ${tColor}`}>{type}</span>
          </div>
          <div className="flex justify-start md:items-center gap-2">
            {college.imageUrl && (
              <img src={college.imageUrl} alt="" className="w-5 h-5 rounded object-contain shrink-0 hidden md:block mix-blend-multiply" />
            )}
            <span className={`hidden md:inline-block px-1.5 py-0.5 border text-[10px] font-bold rounded shrink-0 ${tColor}`}>{type}</span>
            {hasDetail ? (
              <Link
                to={`/college/${college.id}`}
                className="text-sm font-semibold text-stone-900 leading-snug hover:text-orange-600 hover:underline transition-colors"
              >
                {college.name}
              </Link>
            ) : (
              <h4 className="text-sm font-semibold text-stone-900 leading-snug">{college.name}</h4>
            )}
          </div>
        </div>
        <div className="text-xs text-stone-500 line-clamp-2 leading-snug">{college.branch}</div>
        <div className="md:text-right font-mono font-bold text-sm text-stone-900">{college.cutoff?.toLocaleString() || "—"}</div>
        <div className="flex md:justify-center">
          <span className={`px-2 py-0.5 text-[10px] font-bold border rounded whitespace-nowrap ${cColor}`}>{college.classification}</span>
        </div>
        <div className="flex md:justify-center">
          <button onClick={onToggleExpand} className={`p-1.5 rounded-lg border transition-all ${isExpanded ? "bg-stone-100 border-stone-300 text-stone-900" : "border-stone-200 text-stone-400 hover:text-stone-900 hover:border-stone-300"}`}>
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex md:justify-center">
          <button onClick={onToggleCompare} className={`p-1.5 rounded-lg border transition-all ${isInCompare ? "bg-orange-500 text-white border-orange-500 shadow-sm" : "border-stone-200 text-stone-400 hover:text-stone-900 hover:border-stone-300"}`}>
            <GitCompareArrows className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="px-6 pb-5 pt-0">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-stone-400 mb-3">Cutoff Trend (10 Years)</div>
            {trendData.length > 1 ? (
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="year" tick={{ fill: '#78716c', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis reversed tick={{ fill: '#78716c', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e7e5e4', fontSize: '11px', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="closing_rank" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-stone-400 text-center py-4">Insufficient historical data</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultRow;
