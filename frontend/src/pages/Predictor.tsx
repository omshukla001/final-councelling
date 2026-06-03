import React, { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Search, Target, Loader2, Check, ChevronDown, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { CollegeService } from "@/services/api";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCollegeType, quotaLabels, examQuotas, examDefaultQuotas,
  disciplineGroups, CollegeResult,
} from "./predictor/constants";
import ResultsPanel from "./predictor/ResultsPanel";
import { FadeIn } from "@/components/ui/LayoutAtoms";

const Predictor = () => {
  const { prefs, updatePrefs } = useUserPreferences();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [rank, setRank] = useState(prefs.rank || "");
  const [exam, setExam] = useState(prefs.examType || "JEE Main");
  const [category, setCategory] = useState(prefs.category || "OPEN");
  const [selectedQuotas, setSelectedQuotas] = useState<string[]>(prefs.quotas?.length ? prefs.quotas : ["AI", "HS", "OS"]);
  const [gender, setGender] = useState(prefs.gender || "Gender-Neutral");
  const [selectedBranches, setSelectedBranches] = useState<string[]>(prefs.preferredBranches || []);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankError, setRankError] = useState<string | null>(null);
  const [results, setResults] = useState<CollegeResult[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbBranches, setDbBranches] = useState<string[]>([]);
  const [examBranchesMap, setExamBranchesMap] = useState<Record<string, string[]>>({});
  const [dbQuotas, setDbQuotas] = useState<string[]>([]);
  const [dbGenders, setDbGenders] = useState<string[]>(["Gender-Neutral", "Female-only (including Supernumerary)"]);
  const [allQuotas, setAllQuotas] = useState<string[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [branchSearch, setBranchSearch] = useState("");
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null);

  useEffect(() => {
    const allowed = examQuotas[exam] || allQuotas;
    const filtered = allQuotas.filter((q) => allowed.includes(q));
    setDbQuotas(filtered.length > 0 ? filtered : allowed);
    const defaults = examDefaultQuotas[exam] || ["AI"];
    setSelectedQuotas(defaults.filter((q) => allowed.includes(q)));
  }, [exam, allQuotas]);

  useEffect(() => {
    CollegeService.getFilters()
      .then((f) => {
        setDbCategories(f.categories);
        setDbBranches(f.branches);
        if (f.examBranches) setExamBranchesMap(f.examBranches);
        setAllQuotas(f.quotas);
        const cleanGenders = f.genders ? f.genders.filter((g: string) => g !== "NA") : ["Gender-Neutral", "Female-only (including Supernumerary)"];
        setDbGenders(cleanGenders);
        if (f.categories.length > 0 && !f.categories.includes(category)) setCategory(f.categories[0]);
      })
      .catch(() => {
        setDbCategories(["OPEN", "EWS", "OBC-NCL", "SC", "ST"]);
        setDbBranches(["Computer Science and Engineering"]);
        setDbQuotas(["AI", "HS", "OS"]);
      })
      .finally(() => setFiltersLoading(false));
  }, []);

  const toggleBranch = (b: string) => setSelectedBranches(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]);

  const getBranchesForDiscipline = (label: string): string[] => {
    const group = disciplineGroups.find((g) => g.label === label);
    if (!group) return [];
    const validBranches = examBranchesMap[exam] || dbBranches;
    return validBranches.filter((b) => group.keywords.some((kw) => b.toLowerCase().includes(kw)));
  };

  const getOtherBranches = (): string[] => {
    const validBranches = examBranchesMap[exam] || dbBranches;
    return validBranches.filter((b) => !disciplineGroups.some((g) => g.keywords.some((kw) => b.toLowerCase().includes(kw))));
  };

  const currentDisciplineBranches = activeDiscipline ? activeDiscipline === "Other" ? getOtherBranches() : getBranchesForDiscipline(activeDiscipline) : [];
  const visibleBranches = branchSearch ? currentDisciplineBranches.filter((b) => b.toLowerCase().includes(branchSearch.toLowerCase())) : currentDisciplineBranches;

  const selectAllVisible = () => {
    const allSelected = visibleBranches.length > 0 && visibleBranches.every(b => selectedBranches.includes(b));
    if (allSelected) setSelectedBranches(prev => prev.filter(b => !visibleBranches.includes(b)));
    else setSelectedBranches(prev => [...prev, ...visibleBranches.filter(b => !prev.includes(b))]);
  };

  const handleSubmit = async () => {
    try {
      const parsedRank = parseInt(rank);
      if (isNaN(parsedRank) || parsedRank <= 0 || parsedRank > 2000000) { setError("Please enter a valid rank between 1 and 2,000,000."); return; }
      updatePrefs({ rank, examType: exam, category, quotas: selectedQuotas, gender, preferredBranches: selectedBranches });
      setLoading(true); setError(null);
      const response = await CollegeService.getRecommendations({
        rank: parsedRank, exam, category, quota: selectedQuotas, gender, counselling_type: "JOSAA",
        preferred_branches: selectedBranches.length > 0 ? selectedBranches : undefined, limit: 500, firebase_uid: user?.id
      });
      let transformedResults = response.recommendations.map((rec: { college_id: string; college_name: string; branch: string; closing_rank: number; classification: string; type: string; location: string; nirf_rank?: number }) => ({
        id: rec.college?.id, name: rec.college?.name, branch: rec.branch?.name, cutoff: rec.cutoff_info?.closing_rank,
        fees: rec.college?.fees || "—", nirf: rec.college?.nirf_rank || 99, location: rec.college?.state || "India",
        type: rec.college?.type || "Institute", classification: rec.classification, historical_cutoffs: rec.historical_cutoffs || [],
      }));
      if (exam === "JEE Main") {
        transformedResults = transformedResults.filter((r: CollegeResult) => getCollegeType(r.name || "") !== "IIT");
      }
      setResults(transformedResults);
      setShowResults(true);
      setStep(4);
    } catch { setError("Failed to fetch recommendations. Please try again."); } finally { setLoading(false); }
  };

  if (filtersLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen text-stone-900 pb-16 relative overflow-hidden">
      {/* Hero banner */}
      {!showResults && (
        <div className="relative site-hero mb-8 overflow-hidden">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80&auto=format" alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(28,18,10,0.65) 0%, rgba(28,18,10,0.50) 50%, rgba(28,18,10,0.35) 100%)" }} />
          </div>
          <div className="site-container relative z-10 flex flex-col items-center text-center">
            <FadeIn>
              <div className="inline-flex justify-center items-center gap-2 px-4 py-2 mb-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90">
                <Target className="w-3.5 h-3.5" /> AI-Powered Predictions
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-white">
                College{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-300">Predictor</span>
              </h1>
              <p className="text-white/60 text-sm max-w-lg mx-auto">Enter your JEE details to discover your best college matches.</p>
            </FadeIn>
          </div>
        </div>
      )}
      {showResults && <div className="pt-24" />}
      <div className="site-container relative z-10">

        {/* Step Indicators */}
        {!showResults && (
          <FadeIn>
            <div className="flex items-center justify-center gap-3 mb-10 max-w-sm mx-auto">
              {[
                { n: 1, label: "Details" },
                { n: 2, label: "Branches" },
                { n: 3, label: "Review" },
              ].map((s, i) => (
                <div key={s.n} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${step >= s.n ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-white border border-stone-300 text-stone-400"}`}>
                      {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                    </div>
                    <span className="text-[10px] text-stone-400 font-medium">{s.label}</span>
                  </div>
                  {i < 2 && <div className={`w-12 h-0.5 rounded-full mb-5 ${step > s.n ? "bg-violet-500" : "bg-stone-100"}`} />}
                </div>
              ))}
            </div>
          </FadeIn>
        )}

        <div className="relative max-w-2xl mx-auto">
          <AnimatePresence mode="wait">

            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-6 h-full flex flex-col">
                    <label className="text-xs font-semibold text-stone-700 mb-3 block">Exam Type</label>
                    <div className="grid grid-cols-2 gap-3 flex-1 items-start">
                      <button onClick={() => setExam("JEE Main")} className={`py-3.5 rounded-xl text-xs font-bold transition-all border ${exam === "JEE Main" ? "bg-orange-600 border-orange-600 text-white shadow-sm" : "bg-stone-100 border-stone-300 text-stone-600 hover:border-orange-300 hover:bg-orange-50"}`}>JEE Main</button>
                      <button onClick={() => setExam("JEE Advanced")} className={`py-3.5 rounded-xl text-xs font-bold transition-all border ${exam === "JEE Advanced" ? "bg-amber-600 border-amber-600 text-white shadow-sm" : "bg-stone-100 border-stone-300 text-stone-600 hover:border-orange-300 hover:bg-orange-50"}`}>JEE Advanced</button>
                    </div>
                  </div>
                  <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-6 h-full flex flex-col">
                    <label className="text-xs font-semibold text-stone-700 mb-3 block">Your Rank</label>
                    <div className="relative flex-1">
                      <Hash className="absolute left-3.5 top-5 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input type="number" value={rank} onChange={(e) => { setRank(e.target.value); setRankError(null); }} placeholder="Enter your rank..." className="pl-11 h-12 bg-stone-50 border-stone-300 text-stone-900 rounded-xl focus-visible:ring-orange-500 text-sm" />
                       {rankError && <p className="text-xs text-red-400 mt-2">{rankError}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-6 h-full flex flex-col">
                    <label className="text-xs font-semibold text-stone-700 mb-3 block">Category</label>
                    <div className="flex flex-wrap gap-2 flex-1 items-start content-start">
                      {dbCategories.map((c) => (
                        <button key={c} onClick={() => setCategory(c)} className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${category === c ? "bg-orange-500 text-white border-orange-500 shadow-sm" : "bg-stone-100 border-stone-300 text-stone-600 hover:border-orange-300 hover:bg-orange-50"}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-6 h-full flex flex-col">
                    <label className="text-xs font-semibold text-stone-700 mb-3 block">Gender</label>
                    <div className="flex flex-col gap-2 flex-1 justify-start">
                      {dbGenders.map((g) => (
                        <button key={g} onClick={() => setGender(g)} className={`px-3 py-2.5 text-xs font-semibold rounded-lg border transition-all text-left ${gender === g ? "bg-orange-500 text-white border-orange-500 shadow-sm" : "bg-stone-100 border-stone-300 text-stone-600 hover:border-orange-300 hover:bg-orange-50"}`}>
                          {g.replace("Gender-Neutral", "Neutral").replace("Female-only (including Supernumerary)", "Female Only")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-6">
                  <label className="text-xs font-semibold text-stone-700 mb-3 block">Quotas</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {dbQuotas.map((q) => {
                      const isSelected = selectedQuotas.includes(q);
                      return (
                        <button key={q} onClick={() => { if (exam === "JEE Advanced") return; setSelectedQuotas(p => isSelected ? p.filter(x => x !== q) : [...p, q]); }} className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${isSelected ? "bg-orange-500 text-white border-orange-500 shadow-sm" : "bg-stone-100 border-stone-300 text-stone-600 hover:border-orange-300 hover:bg-orange-50"} ${exam === "JEE Advanced" ? "cursor-default opacity-60" : ""}`}>
                          {isSelected && <Check className="w-3 h-3" />} {quotaLabels[q] || q}
                        </button>
                      );
                    })}
                  </div>
                  {selectedQuotas.length === 0 && <span className="text-xs text-red-400">Select at least one quota</span>}
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                    {exam === "JEE Advanced" ? "JEE Advanced (IITs) only uses All India quota." : "AI = All India, HS = Home State, OS = Other State. State-specific quotas apply to domiciled students."}
                  </p>
                </div>

                <button
                  onClick={() => { const p = parseInt(rank); if (!rank || isNaN(p) || p <= 0 || p > 2000000) { setRankError("Please enter a valid rank."); return; } setRankError(null); setStep(2); }}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-orange-600 hover:from-violet-500 hover:to-orange-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 border-0"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* STEP 2: BRANCHES */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <label className="text-xs font-semibold text-stone-500">Branch Preferences (Optional)</label>
                    {selectedBranches.length > 0 && <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-lg">{selectedBranches.length} selected</span>}
                  </div>

                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
                    {[...disciplineGroups, { label: "Other", keywords: [] }].map((g) => {
                      const branches = g.label === "Other" ? getOtherBranches() : getBranchesForDiscipline(g.label);
                      if (branches.length === 0) return null;
                      const isExp = activeDiscipline === g.label;
                      const selCnt = branches.filter(b => selectedBranches.includes(b)).length;
                      return (
                        <div key={g.label} className="border border-stone-200 rounded-xl overflow-hidden bg-stone-100/30">
                          <button onClick={() => { setActiveDiscipline(isExp ? null : g.label); setBranchSearch(""); }} className="flex items-center justify-between w-full p-4 hover:bg-white/70 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-sm text-stone-800">{g.label}</span>
                              <span className="text-xs text-stone-400">{selCnt}/{branches.length}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isExp ? "rotate-180" : ""}`} />
                          </button>
                          {isExp && (
                            <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                                  <input type="text" placeholder="Search branches..." value={branchSearch} onChange={e => setBranchSearch(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 h-9 text-xs text-stone-900 focus:outline-none focus:border-violet-500/50" />
                                </div>
                                {visibleBranches.length > 0 && (
                                  <button onClick={selectAllVisible} className="text-xs font-bold text-violet-400 hover:text-violet-300 px-3 py-1.5 border border-violet-500/30 rounded-lg bg-violet-500/10">
                                    {visibleBranches.every(b => selectedBranches.includes(b)) ? "Deselect All" : "Select All"}
                                  </button>
                                )}
                              </div>
                              <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                                {visibleBranches.map(b => {
                                  const isSel = selectedBranches.includes(b);
                                  return (
                                    <button key={b} onClick={() => toggleBranch(b)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/70 text-left transition-colors">
                                      <div className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center ${isSel ? "bg-orange-500 border-orange-500 text-white" : "border-stone-300"}`}>
                                        {isSel && <Check className="w-3 h-3" />}
                                      </div>
                                      <span className={`text-xs leading-snug ${isSel ? "text-stone-900 font-medium" : "text-stone-500"}`}>{b}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl bg-white border border-stone-200/80 shadow-sm text-stone-900 font-semibold text-sm hover:bg-stone-100 transition-all flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={() => setStep(3)} className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-violet-600 to-orange-600 hover:from-violet-500 hover:to-orange-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 border-0">
                    {selectedBranches.length > 0 ? "Review Selection" : "Skip & Continue"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: REVIEW */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-6">
                  <label className="text-xs font-semibold text-stone-500 mb-5 block">Review Your Details</label>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl">
                      <span className="text-xs text-stone-400">Rank</span>
                      <div className="text-2xl font-extrabold text-stone-900 mt-1">{rank}</div>
                      <div className="text-xs text-stone-400 mt-1">{exam}</div>
                    </div>
                    <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl">
                      <span className="text-xs text-stone-400">Profile</span>
                      <div className="text-lg font-bold text-stone-900 mt-1">{category}</div>
                      <div className="text-xs text-stone-400 mt-1 truncate">{gender.replace("Gender-Neutral", "Neutral").replace("Female-only (including Supernumerary)", "Female Only")}</div>
                    </div>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl mb-4">
                    <span className="text-xs text-stone-400">Quotas</span>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {selectedQuotas.map(q => <span key={q} className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-stone-600">{quotaLabels[q] || q}</span>)}
                    </div>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-stone-400">Branches</span>
                      <span className="text-xs font-bold text-stone-900">{selectedBranches.length > 0 ? selectedBranches.length : "All"}</span>
                    </div>
                    {selectedBranches.length > 0 ? (
                      <div className="max-h-24 overflow-y-auto pr-2 space-y-1">
                        {selectedBranches.map(b => <div key={b} className="text-xs text-stone-500 truncate">- {b}</div>)}
                      </div>
                    ) : (
                      <div className="text-xs text-stone-400">All engineering disciplines will be included</div>
                    )}
                  </div>
                </div>

                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center">{error}</div>}

                <div className="flex gap-3">
                  <button disabled={loading} onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl bg-white border border-stone-200/80 shadow-sm text-stone-900 font-semibold text-sm hover:bg-stone-100 transition-all flex items-center justify-center">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button disabled={loading} onClick={handleSubmit} className="flex-[3] h-12 rounded-xl bg-gradient-to-r from-violet-600 to-orange-600 hover:from-violet-500 hover:to-orange-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-500/20 border-0">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Finding colleges...</> : <><Search className="w-4 h-4" /> Find My Colleges</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* STEP 4: RESULTS — now a separate component */}
        {showResults && step === 4 && (
          <ResultsPanel
            results={results}
            rank={rank}
            exam={exam}
            category={category}
            onNewSearch={() => { setShowResults(false); setStep(1); }}
          />
        )}
      </div>
    </div>
  );
};

export default Predictor;
