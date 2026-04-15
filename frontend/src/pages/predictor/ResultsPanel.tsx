import React from "react";
import { Search, ArrowLeft, Filter } from "lucide-react";
import { useCompare } from "@/contexts/CompareContext";
import { CollegeResult, getCollegeType } from "./constants";
import ResultRow from "./ResultRow";
import { FadeIn } from "@/components/ui/LayoutAtoms";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Lock } from "lucide-react";

interface ResultsPanelProps {
  results: CollegeResult[];
  rank: string;
  exam: string;
  category: string;
  onNewSearch: () => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ results, rank, exam, category, onNewSearch }) => {
  const { addCollege, removeCollege, isInCompare } = useCompare();
  const { isPremium, triggerPaymentFlow } = useSubscription();
  const [resultSearch, setResultSearch] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("ALL");
  const [typeFilter, setTypeFilter] = React.useState("ALL");
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 50;

  React.useEffect(() => { setCurrentPage(1); }, [resultSearch, classFilter, typeFilter, sortOrder]);

  const safeCount = results.filter(r => r.classification === "SAFE").length;
  const targetCount = results.filter(r => r.classification === "TARGET").length;
  const dreamCount = results.filter(r => r.classification === "DREAM").length;

  const filteredResults = results
    .filter(r => classFilter === "ALL" || r.classification === classFilter)
    .filter(r => typeFilter === "ALL" || r.type?.toUpperCase().includes(typeFilter) || (typeFilter === "GFTI" && r.name?.toUpperCase().includes("GFTI")))
    .filter(r => !resultSearch || r.name?.toLowerCase().includes(resultSearch.toLowerCase()) || r.branch?.toLowerCase().includes(resultSearch.toLowerCase()));
  const sortedResults = [...filteredResults].sort((a, b) => ((a.cutoff || 999999) - (b.cutoff || 999999)) * (sortOrder === "asc" ? 1 : -1));
  const totalPages = Math.ceil(sortedResults.length / rowsPerPage);
  const paginatedResults = sortedResults.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <FadeIn>
      <div className="mb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-orange-400">Results</span>
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-white rounded-lg border border-stone-200 text-xs font-medium text-stone-600">Rank {rank}</span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-stone-200 text-xs font-medium text-stone-600">{exam}</span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-stone-200 text-xs font-medium text-stone-600">{category}</span>
            </div>
          </div>
          <button onClick={onNewSearch} className="px-5 h-10 bg-white border border-stone-200/80 shadow-sm rounded-xl text-xs font-semibold hover:bg-stone-100 transition-colors flex items-center gap-2 text-stone-600">
            <ArrowLeft className="w-4 h-4" /> New Search
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-stone-200/80 shadow-sm p-5 rounded-2xl">
            <span className="text-3xl font-extrabold">{results.length}</span>
            <span className="text-xs text-stone-400 block mt-1">Total Matches</span>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl">
            <span className="text-3xl font-extrabold text-emerald-400">{safeCount}</span>
            <span className="text-xs text-emerald-500/70 block mt-1">Safe Choices</span>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/20 p-5 rounded-2xl">
            <span className="text-3xl font-extrabold text-orange-400">{targetCount}</span>
            <span className="text-xs text-orange-500/70 block mt-1">Target Colleges</span>
          </div>
          <div className="bg-violet-500/5 border border-violet-500/20 p-5 rounded-2xl">
            <span className="text-3xl font-extrabold text-violet-400">{dreamCount}</span>
            <span className="text-xs text-violet-500/70 block mt-1">Dream Colleges</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input type="text" placeholder="Search results..." value={resultSearch} onChange={e => setResultSearch(e.target.value)} className="w-full bg-white border border-stone-200/80 shadow-sm rounded-xl pl-11 h-11 text-sm focus:outline-none focus:border-violet-500/50 text-stone-900" />
          </div>
          <div className="flex gap-1.5 bg-white border border-stone-200/80 shadow-sm p-1 rounded-xl">
            {[
              { k: "ALL", l: "All", active: "bg-stone-100 text-stone-900" },
              { k: "SAFE", l: "Safe", active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" },
              { k: "TARGET", l: "Target", active: "bg-orange-500/15 text-orange-400 border border-orange-500/30" },
              { k: "DREAM", l: "Dream", active: "bg-violet-500/15 text-violet-400 border border-violet-500/30" },
            ].map(f => (
              <button key={f.k} onClick={() => setClassFilter(f.k)} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${classFilter === f.k ? f.active : "text-stone-400 hover:text-stone-900"}`}>{f.l}</button>
            ))}
          </div>
          <div className="flex gap-1.5 bg-white border border-stone-200/80 shadow-sm p-1 rounded-xl">
            {["ALL", ...(exam === "JEE Main" ? ["NIT", "IIIT", "GFTI"] : ["IIT"])].map(f => (
              <button key={f} onClick={() => setTypeFilter(f)} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${typeFilter === f ? "bg-stone-100 text-stone-900" : "text-stone-400 hover:text-stone-900"}`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[40px_1fr_1fr_80px_80px_60px_60px] gap-4 px-6 py-3 bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-400">
            <span>#</span><span>College</span><span>Branch</span>
            <span className="text-right flex items-center justify-end gap-1 cursor-pointer hover:text-stone-900" onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}>Cutoff <Filter className="w-3 h-3" /></span>
            <span className="text-center">Chance</span><span className="text-center">Trend</span><span className="text-center">Cmp</span>
          </div>
          {paginatedResults.length === 0 ? (
            <div className="py-16 text-center">
              <Search className="w-8 h-8 text-stone-500 mx-auto mb-3" />
              <span className="text-sm text-stone-400">No results match your filters.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50 relative">
              {paginatedResults.map((college, i) => {
                const key = `${college.id}|${college.branch}`;
                const isPaywalled = !isPremium && ((currentPage - 1) * rowsPerPage + i) >= 5;
                
                if (isPaywalled) {
                   return (
                     <div key={`lock-${key}`} className="relative h-16 w-full overflow-hidden opacity-40 blur-[4px] pointer-events-none select-none border-b border-stone-200">
                        <ResultRow college={college} index={-1} isExpanded={false} isInCompare={false} onToggleExpand={() => {}} onToggleCompare={() => {}} />
                     </div>
                   );
                }

                return (
                  <ResultRow
                    key={key}
                    college={college}
                    index={(currentPage - 1) * rowsPerPage + i + 1}
                    isExpanded={expandedRow === key}
                    isInCompare={isInCompare(college.id)}
                    onToggleExpand={() => setExpandedRow(expandedRow === key ? null : key)}
                    onToggleCompare={() => isInCompare(college.id) ? removeCollege(college.id) : addCollege({ college_id: college.id, name: college.name, type: getCollegeType(college.name), state: college.location, nirf_rank: college.nirf })}
                  />
                );
              })}
              
              {!isPremium && sortedResults.length > 5 && (
                <div className="absolute inset-x-0 bottom-0 top-[380px] z-10 flex flex-col items-center pt-24 bg-gradient-to-t from-[#f0ece4] via-[#f0ece4]/90 to-transparent backdrop-blur-[1px]">
                   <div className="bg-white border border-stone-300 shadow-2xl p-6 rounded-3xl max-w-sm text-center flex flex-col items-center">
                     <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-orange-500 rounded-full flex justify-center items-center mb-4 shadow-lg shadow-orange-500/30">
                        <Lock className="w-6 h-6 text-white" />
                     </div>
                     <h3 className="text-xl font-extrabold text-stone-900 mb-2">Unlock {sortedResults.length - 5} More Matches</h3>
                     <p className="text-sm text-stone-500 mb-6">Upgrade to Premium to see your complete personalized probability list and historical cut-offs.</p>
                     <button onClick={triggerPaymentFlow} className="w-full h-12 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm transition-all shadow-md">
                       Pay ₹99 for 30 Days Access
                     </button>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="px-4 py-2 bg-white border border-stone-200/80 shadow-sm rounded-lg text-xs font-semibold disabled:opacity-30 hover:bg-stone-100">Prev</button>
            <span className="text-sm text-stone-500">Page {currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-4 py-2 bg-white border border-stone-200/80 shadow-sm rounded-lg text-xs font-semibold disabled:opacity-30 hover:bg-stone-100">Next</button>
          </div>
        )}
      </div>
    </FadeIn>
  );
};

export default ResultsPanel;
