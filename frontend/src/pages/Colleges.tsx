import { useState, useEffect, useMemo, useRef } from "react";
import { Search, MapPin, Trophy, GraduationCap, X, GitCompare, ArrowRight, Sparkles, ChevronLeft, ChevronRight, Crown, Building2, Filter, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { CollegeService, College } from "@/services/api";
import { useCompare } from "@/contexts/CompareContext";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/ui/LayoutAtoms";

const ABBREVIATION_MAP: Record<string, string[]> = {
  iit: ["Indian Institute of Technology"], nit: ["National Institute of Technology"], iiit: ["Indian Institute of Information Technology"],
  gfti: ["Government Funded Technical Institute"], bits: ["Birla Institute of Technology"], dtu: ["Delhi Technological University"],
  nsut: ["Netaji Subhas University of Technology"], jadavpur: ["Jadavpur University"],
};

const nirfTiers = [
  { label: "All", value: "all" }, { label: "Top 10", value: "10" }, { label: "Top 25", value: "25" },
  { label: "Top 50", value: "50" }, { label: "Top 100", value: "100" }, { label: "100+", value: "100+" }, { label: "Unranked", value: "unranked" },
];

const TYPE_STYLES: Record<string, { text: string; bg: string; border: string; glow: string; gradient: string; topBar: string; iconBg: string }> = {
  IIT: { text: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200", glow: "group-hover:shadow-xl group-hover:shadow-orange-200/50 group-hover:-translate-y-2", gradient: "from-orange-50 via-amber-50/40 to-white", topBar: "from-orange-500 to-amber-400", iconBg: "bg-gradient-to-br from-orange-500 to-amber-500" },
  NIT: { text: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200", glow: "group-hover:shadow-xl group-hover:shadow-amber-200/50 group-hover:-translate-y-2", gradient: "from-amber-50 via-yellow-50/40 to-white", topBar: "from-amber-500 to-yellow-400", iconBg: "bg-gradient-to-br from-amber-500 to-yellow-500" },
  IIIT: { text: "text-violet-700", bg: "bg-violet-100", border: "border-violet-200", glow: "group-hover:shadow-xl group-hover:shadow-violet-200/50 group-hover:-translate-y-2", gradient: "from-violet-50 via-purple-50/40 to-white", topBar: "from-violet-500 to-purple-400", iconBg: "bg-gradient-to-br from-violet-500 to-purple-500" },
  GFTI: { text: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200", glow: "group-hover:shadow-xl group-hover:shadow-emerald-200/50 group-hover:-translate-y-2", gradient: "from-emerald-50 via-teal-50/40 to-white", topBar: "from-emerald-500 to-teal-400", iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500" },
};

const deriveType = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("indian institute of technology") && !n.includes("information")) return "IIT";
  if (n.includes("national institute of technology")) return "NIT";
  if (n.includes("indian institute of information technology")) return "IIIT";
  return "GFTI";
};

const Colleges = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [nirfTier, setNirfTier] = useState("all");
  const [stateFilter, setStateFilter] = useState("All");
  const [sortBy, setSortBy] = useState("nirf-asc");
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { addCollege, isInCompare } = useCompare();
  const initialFetched = useRef(false);

  useEffect(() => {
    if (initialFetched.current) return;
    initialFetched.current = true;
    (async () => {
      try {
        setLoading(true);
        const res = await CollegeService.getColleges({ page_size: 500 });
        setAllColleges(res.colleges); setTotal(res.total);
      } finally { setLoading(false); }
    })();
  }, []);

  const availableStates = useMemo(() => ["All", ...[...new Set(allColleges.map((c) => c.state).filter(Boolean))].sort()], [allColleges]);

  const filteredSorted = useMemo(() => {
    let list = [...allColleges];
    if (activeType !== "All") list = list.filter((c) => (c.type || deriveType(c.name)) === activeType);
    if (searchQuery.trim()) {
      const words = searchQuery.trim().toLowerCase().split(/\s+/);
      const variants = words.map(w => ABBREVIATION_MAP[w] ? [w, ...ABBREVIATION_MAP[w].map(x => x.toLowerCase())] : [w]);
      list = list.filter(c => { const s = (c.name + " " + (c.state || "")).toLowerCase(); return variants.every(v => v.some(x => s.includes(x))); });
    }
    if (stateFilter !== "All") list = list.filter(c => c.state === stateFilter);
    if (nirfTier !== "all") {
      if (nirfTier === "unranked") list = list.filter(c => !c.nirf_rank);
      else if (nirfTier === "100+") list = list.filter(c => c.nirf_rank && c.nirf_rank > 100);
      else { const m = parseInt(nirfTier); list = list.filter(c => c.nirf_rank && c.nirf_rank <= m); }
    }
    if (sortBy === "nirf-asc") list.sort((a, b) => { if (a.nirf_rank && b.nirf_rank) return a.nirf_rank - b.nirf_rank; if (a.nirf_rank) return -1; if (b.nirf_rank) return 1; return a.name.localeCompare(b.name); });
    else if (sortBy === "nirf-desc") list.sort((a, b) => { if (a.nirf_rank && b.nirf_rank) return b.nirf_rank - a.nirf_rank; if (a.nirf_rank) return -1; if (b.nirf_rank) return 1; return a.name.localeCompare(b.name); });
    else if (sortBy === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));
    return list;
  }, [allColleges, activeType, searchQuery, stateFilter, nirfTier, sortBy]);

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 24;
  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeType, sortBy, nirfTier, stateFilter]);
  const totalPages = Math.ceil(filteredSorted.length / perPage);

  const showSpotlight = currentPage === 1 && !searchQuery.trim() && activeType === "All" && nirfTier === "all" && stateFilter === "All" && sortBy === "nirf-asc";
  const spotlightColleges = showSpotlight ? filteredSorted.filter((c) => c.nirf_rank).slice(0, 3) : [];
  const gridStart = showSpotlight ? 3 : (currentPage - 1) * perPage;
  const gridColleges = showSpotlight ? filteredSorted.slice(3, 3 + perPage - 3) : filteredSorted.slice(gridStart, gridStart + perPage);

  const activeFilterCount = [nirfTier !== "all", stateFilter !== "All"].filter(Boolean).length;
  const typeCounts = useMemo(() => {
    const m: Record<string, number> = { All: allColleges.length, IIT: 0, NIT: 0, IIIT: 0, GFTI: 0 };
    allColleges.forEach(c => { const t = c.type || deriveType(c.name); if (m[t] !== undefined) m[t]++; });
    return m;
  }, [allColleges]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen text-stone-900 pb-20 relative overflow-x-hidden bg-gradient-to-b from-transparent via-orange-50/20 to-transparent">
      {/* Hero banner with photo */}
      <div className="relative pt-24 pb-14 px-4 mb-8 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1562774053-701939374585?w=1920&q=80&auto=format" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(28,18,10,0.65) 0%, rgba(28,18,10,0.50) 50%, rgba(28,18,10,0.35) 100%)" }} />
        </div>
        <div className="container mx-auto max-w-7xl relative z-10 flex flex-col items-center text-center">
          <FadeIn>
            <div className="inline-flex justify-center items-center gap-2 px-4 py-2 mb-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90">
              <Building2 className="w-3.5 h-3.5" /> {total} colleges in database
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
              Explore{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-300">Colleges</span>
            </h1>
            <p className="text-white/60 max-w-lg mx-auto">Browse IITs, NITs, IIITs and GFTIs with detailed cutoffs, placements, and campus info.</p>
          </FadeIn>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">

        {/* Search & Filters — warm card */}
        <FadeIn delay={0.05}>
          <div className="max-w-5xl mb-10 space-y-4">
            <div className="bg-gradient-to-r from-orange-50 via-amber-50/50 to-stone-50 border border-orange-200/50 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
                  <Input
                    placeholder="Search colleges... (e.g. 'IIT Delhi', 'NIT Karnataka')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-10 h-12 rounded-xl border-orange-200 bg-white text-sm focus-visible:ring-orange-500 shadow-sm"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy(sortBy === "nirf-asc" ? "nirf-desc" : "nirf-asc")}
                    className={`h-12 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${sortBy.startsWith("nirf") ? "text-orange-700 bg-orange-100 border-orange-300" : "bg-white border-orange-200 text-stone-500 hover:text-orange-600 hover:border-orange-300"}`}
                  >
                    <Trophy className="w-4 h-4" /> NIRF {sortBy === "nirf-asc" ? "↑" : sortBy === "nirf-desc" ? "↓" : ""}
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-12 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${showFilters || activeFilterCount > 0 ? "text-orange-700 bg-orange-100 border-orange-300" : "bg-white border-orange-200 text-stone-500 hover:text-orange-600 hover:border-orange-300"}`}
                  >
                    <SlidersHorizontal className="w-4 h-4" /> Filters {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
                  </button>
                </div>
              </div>

              {/* Type tabs */}
              <div className="flex flex-wrap gap-2">
                {(["All", "IIT", "NIT", "IIIT", "GFTI"] as const).map(t => {
                  const colors: Record<string, string> = { All: "orange", IIT: "orange", NIT: "amber", IIIT: "violet", GFTI: "emerald" };
                  const c = colors[t] || "orange";
                  return (
                    <button key={t} onClick={() => setActiveType(t)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border press-card ${activeType === t ? `bg-${c}-500 text-white border-${c}-500 shadow-md` : `bg-white text-stone-600 border-stone-200 hover:border-${c}-300 hover:bg-${c}-50`}`}>
                      {t} <span className={activeType === t ? "text-white/70" : "text-stone-400"}>{typeCounts[t]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-gradient-to-r from-amber-50 to-orange-50/50 border border-orange-200/50 rounded-2xl p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-3 block">NIRF Ranking Tier</label>
                    <div className="flex flex-wrap gap-2">
                      {nirfTiers.map(tier => (
                        <button key={tier.value} onClick={() => setNirfTier(tier.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${nirfTier === tier.value ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-stone-200 text-stone-500 hover:border-orange-300"}`}>
                          {tier.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-3 block">State</label>
                    <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}
                      className="w-full h-10 rounded-lg bg-white border border-stone-200 text-sm text-stone-800 px-3 focus:ring-orange-500 outline-none">
                      {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </FadeIn>

        {filteredSorted.length === 0 ? (
          <div className="text-center py-24 border border-orange-200/50 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/50">
            <Search className="w-10 h-10 text-orange-300 mx-auto mb-4" />
            <p className="text-stone-600 font-semibold">No colleges found matching your criteria.</p>
            <p className="text-sm text-stone-400 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-500 mb-6">
              Showing <span className="text-stone-800 font-bold">{filteredSorted.length}</span> results
            </p>

            {/* Spotlight top colleges */}
            {spotlightColleges.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-stone-800">Top Ranked Colleges</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                  {spotlightColleges.map((college, i) => (
                    <CollegeCard key={college.college_id} college={college} index={i} inCompare={isInCompare(college.college_id)} addCompare={addCollege} />
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {gridColleges.map((college, i) => (
                <CollegeCard key={college.college_id} college={college} index={i} inCompare={isInCompare(college.college_id)} addCompare={addCollege} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-14 pb-8">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 rounded-xl border border-orange-200 flex justify-center items-center text-stone-700 disabled:opacity-30 hover:bg-orange-50 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-stone-500 font-medium px-4">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 rounded-xl border border-orange-200 flex justify-center items-center text-stone-700 disabled:opacity-30 hover:bg-orange-50 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface CollegeCardProps {
  college: College;
  index: number;
  inCompare: boolean;
  addCompare: (data: { college_id: string; name: string; type: string; state: string; nirf_rank?: number }) => boolean;
}

const CollegeCard = ({ college, index, inCompare, addCompare }: CollegeCardProps) => {
  const type = college.type || deriveType(college.name);
  const style = TYPE_STYLES[type] || TYPE_STYLES.GFTI;

  return (
    <FadeIn delay={index * 0.03}>
      <div className={`relative rounded-2xl h-full flex flex-col group transition-all duration-300 overflow-hidden press-card bg-white border border-stone-200/70 ${style.glow}`}>
        {/* Colored header section */}
        <div className={`relative px-5 pt-5 pb-4 bg-gradient-to-br ${style.gradient}`}>
          {/* Top bar accent */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${style.topBar}`} />
          {/* Decorative glow */}
          <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full ${style.bg} blur-[25px] opacity-60 group-hover:opacity-100 transition-opacity`} />

          <div className="flex items-start justify-between relative z-10">
            {/* Type icon + badge */}
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center shadow-md text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${style.bg} ${style.text} border ${style.border}`}>
                {type}
              </span>
            </div>
            {/* NIRF badge */}
            {college.nirf_rank ? (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200 shadow-sm">
                <Trophy className="w-3 h-3 text-amber-500" /> #{college.nirf_rank}
              </span>
            ) : (
              <span className="text-[10px] text-stone-400 bg-white/60 px-2 py-1 rounded-full border border-stone-200">Unranked</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="relative px-5 pb-5 pt-3 flex-1 flex flex-col">
          {/* Name & Location */}
          <Link to={`/college/${college.college_id}`} className="flex-1 group/link">
            <h3 className="text-[15px] font-bold text-stone-800 group-hover/link:text-orange-600 transition-colors line-clamp-2 leading-snug mb-2">
              {college.name}
            </h3>
            <p className="text-xs text-stone-500 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-orange-400" /> {college.state || "India"}
            </p>
          </Link>

          <div className="my-3 h-px bg-gradient-to-r from-orange-200/40 via-stone-200 to-orange-200/40" />

          {/* Actions */}
          <div className="flex gap-2">
            <Link
              to={`/college/${college.college_id}`}
              className={`flex-1 h-10 rounded-xl ${style.iconBg} text-white hover:opacity-90 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md group/btn`}
            >
              View Details <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
            <button
              onClick={(e) => { e.preventDefault(); addCompare({ college_id: college.college_id, name: college.name, type, state: college.state || "", nirf_rank: college.nirf_rank }); }}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${inCompare ? "bg-orange-500 text-white border-orange-500 shadow-md" : "bg-stone-50 border-stone-200 text-stone-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50"}`}
            >
              <GitCompare className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};

export default Colleges;
