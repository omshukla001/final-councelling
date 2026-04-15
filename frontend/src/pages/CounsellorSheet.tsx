import { useCallback, useState } from "react";
import { Search, AlertCircle, ChevronDown, ChevronUp, Check, Plus, X, GraduationCap, Target, Shield, Download, SlidersHorizontal, ListOrdered, MapPin, Hash, Filter, GripVertical, GitCompareArrows, BarChart3, RotateCcw, Sparkles, Zap, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

import { AtmosphericGlow, FadeIn } from "@/components/ui/LayoutAtoms";
import { useCounsellor, BRANCH_GROUPS, QUOTA_NAMES, getCollegeType } from "@/hooks/useCounsellor";
import { exportCounsellorPdf } from "@/utils/exportPdf";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Lock } from "lucide-react";

const CounsellorSheet = () => {
  const {
    // Form state
    userRank, setUserRank, bufferRange, setBufferRange,
    branchPreferences, setBranchPreferences, removeBranch,
    examType, setExamType, category, setCategory,
    selectedQuotas, setSelectedQuotas, gender, setGender,
    // Results
    loading, results, error, orderedChoices, displayedColleges,
    // UI
    showBranchModal, setShowBranchModal, branchSearch, setBranchSearch,
    expandedCategory, setExpandedCategory, activeChanceFilter, setActiveChanceFilter,
    expandedRow, trendCache, trendLoading,
    // Data
    currentFilters, isFiltersLoading,
    addCollege, removeCollege, isInCompare,
    // Actions
    fetchSheet, onDragEnd, toggleTrend,
  } = useCounsellor();

  const { isPremium, triggerPaymentFlow } = useSubscription();

  // Virtualization / Pagination
  const [visibleCount, setVisibleCount] = useState(50);

  const handleExport = useCallback(() => {
    if (!isPremium) {
       triggerPaymentFlow();
       return;
    }
    exportCounsellorPdf({ choices: orderedChoices, userRank, category, gender, examType });
  }, [orderedChoices, userRank, category, gender, examType, isPremium, triggerPaymentFlow]);




  if (isFiltersLoading) return <div className="min-h-screen  flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen text-stone-900 pb-16 relative overflow-hidden">
      <AtmosphericGlow />

      {/* Hero Banner */}
      <div className="relative pt-24 pb-14 px-4 mb-8 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=80&auto=format" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(28,18,10,0.65) 0%, rgba(28,18,10,0.50) 50%, rgba(28,18,10,0.35) 100%)" }} />
        <div className="container mx-auto max-w-7xl relative z-10 flex flex-col items-center text-center">
          <FadeIn>
            <div className="mb-2">
              <div className="inline-flex justify-center items-center gap-2 px-3 py-1 mb-4 rounded-md bg-white/20 backdrop-blur-md border border-white/25 text-xs font-semibold text-white">
                <ListOrdered className="w-3 h-3 text-white" /> Counsellor Sheet
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.9] text-white">
                Counsellor <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300">Sheet</span>
              </h1>
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">

        {/* Main Layout: Controls on left, Results on right */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT PANEL — Configuration */}
          <FadeIn delay={0.1} className="w-full lg:w-[480px] shrink-0 space-y-5">

            {/* Row 1: Exam + Rank side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-5">
                <label className="text-xs font-semibold text-stone-700 font-semibold mb-3 block">Exam Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setExamType("JEE_MAINS")} className={`py-3 rounded-xl text-xs font-semibold transition-all border ${examType === "JEE_MAINS" ? "bg-orange-500/10 border-orange-500/50 text-orange-400" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-white/30"}`}>JEE Main</button>
                  <button onClick={() => setExamType("JEE_ADVANCED")} className={`py-3 rounded-xl text-xs font-semibold transition-all border ${examType === "JEE_ADVANCED" ? "bg-violet-500/10 border-violet-500/50 text-violet-400" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-white/30"}`}>JEE Adv</button>
                </div>
              </div>
              <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-5">
                <label className="text-xs font-semibold text-stone-700 font-semibold mb-3 block">Your Rank</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <Input type="number" value={userRank} onChange={(e) => setUserRank(e.target.value)} placeholder="Enter rank..." className="pl-10 h-12 bg-stone-50 border-stone-200 text-stone-900 font-mono rounded-xl focus-visible:ring-orange-500" />
                </div>
              </div>
            </div>

            {/* Row 2: Buffer Range */}
            <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-semibold text-stone-500">Buffer Range</label>
                <span className="text-[10px] font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">± {bufferRange}</span>
              </div>
              <input type="range" min={0} max={15000} step={500} value={bufferRange} onChange={(e) => setBufferRange(Number(e.target.value))} className="w-full h-1 bg-white/70/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white/70 [&::-webkit-slider-thumb]:rounded-full cursor-pointer" />
            </div>

            {/* Row 3: Category + Gender side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-5">
                <label className="text-xs font-semibold text-stone-700 font-semibold mb-3 block">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {currentFilters.categories.map((c: string) => (
                    <button key={c} onClick={() => setCategory(c)} className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${category === c ? "bg-white/70 text-stone-900 border-white" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-white/30"}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-5">
                <label className="text-xs font-semibold text-stone-700 font-semibold mb-3 block">Gender</label>
                <div className="flex flex-col gap-1.5">
                  {currentFilters.genders.filter((g: string) => g !== "NA").map((g: string) => (
                    <button key={g} onClick={() => setGender(g)} className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-left ${gender === g ? "bg-white/70 text-stone-900 border-white" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-white/30"}`}>
                      {g.replace("Gender-Neutral", "Neutral").replace("Female-only (including Supernumerary)", "Female Only")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: Quota */}
            <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-5">
              <label className="text-xs font-semibold text-stone-500 mb-3 block">Quota</label>
              <div className="flex flex-wrap gap-2">
                {currentFilters.quotas.map((q: string) => {
                  const isSelected = selectedQuotas.includes(q);
                  return (
                    <button 
                      key={q} 
                      onClick={() => {
                        if (examType === "JEE_ADVANCED") return;
                        setSelectedQuotas(prev => isSelected ? prev.filter(x => x !== q) : [...prev, q]);
                      }} 
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${isSelected ? "bg-white/70 text-stone-900 border-white" : "bg-stone-50 border-stone-200 text-stone-500 hover:border-white/30"} ${examType === "JEE_ADVANCED" ? "cursor-default opacity-60" : ""}`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {QUOTA_NAMES[q] || q}
                    </button>
                  );
                })}
              </div>
              {selectedQuotas.length === 0 && <span className="text-[9px] text-red-500 font-semibold mt-2 block">Select at least one quota</span>}
              <p className="text-[11px] text-stone-500 mt-3 leading-relaxed">
                <strong className="text-violet-400">Disclaimer:</strong> {examType === "JEE_ADVANCED" ? "JEE Advanced (IITs) only uses the All India (AI) quota. Quota selection is locked." : "AI = All India, HS = Home State (state where NIT is located), OS = Other State. State-specific quotas (AP, GO, JK, LA) are applicable only to domiciled students of that state."}
              </p>
            </div>

            {/* Row 5: Branch Selection */}
            <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-stone-500">Branches</label>
                {branchPreferences.length > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">{branchPreferences.length} selected</span>}
              </div>
              {branchPreferences.length > 0 && (
                <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  {branchPreferences.map((b, i) => (
                    <div key={b} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 border border-white/5 group">
                      <span className="text-[9px] font-mono text-stone-500 w-4">{i + 1}</span>
                      <span className="text-xs font-semibold text-stone-600 uppercase truncate flex-1">{b}</span>
                      <button onClick={() => removeBranch(i)} className="text-stone-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setShowBranchModal(true)} className="w-full h-11 flex items-center justify-center gap-2 border border-dashed border-white/20 rounded-xl text-xs font-semibold text-stone-500 hover:bg-white/70 hover:text-stone-900 hover:border-white/40 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Branches
              </button>
            </div>

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 text-center">{error}</div>}
            
            <button onClick={fetchSheet} disabled={loading} className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-orange-500 text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Generating...</>
              ) : (
                <><Zap className="w-4 h-4" /> Generate Sheet</>
              )}
            </button>
          </FadeIn>

          {/* RIGHT PANEL — Results */}
          <div className="flex-1 w-full min-w-0">
            {!results ? (
              <FadeIn delay={0.2}>
                <div className="bg-white shadow-sm border border-dashed border-stone-200 rounded-2xl min-h-[600px] flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
                  {/* Subtle animated rings */}
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute w-80 h-80 rounded-full border border-white/5" />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute w-56 h-56 rounded-full border border-dashed border-white/5" />
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center justify-center mx-auto mb-6">
                      <SlidersHorizontal className="w-7 h-7 text-stone-500" />
                    </div>
                    <h2 className="text-lg font-bold text-stone-400 mb-2">Configure & Run</h2>
                    <p className="text-xs text-stone-500 max-w-sm leading-relaxed mb-8">
                      Set your rank, select branches, and hit Run Simulator to generate your personalized choice list with safe, target, and dream colleges.
                    </p>
                    <div className="flex items-center justify-center gap-6 text-xs font-semibold text-stone-500">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500/50" /> Safe</div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500/50" /> Target</div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500/50" /> Dream</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ) : (
              <FadeIn delay={0.1}>
                <div className="space-y-5">
                  {/* Results header */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                      {[{ label: "ALL", k: null, bg: "bg-white/70 text-stone-900 border-white" }, { label: "SAFE", k: "Safe", bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }, { label: "TARGET", k: "Target", bg: "bg-orange-500/20 text-orange-400 border-orange-500/30" }, { label: "DREAM", k: "Dream", bg: "bg-purple-500/20 text-orange-500 border-purple-500/30" }].map(f => (
                        <button key={f.label} onClick={() => setActiveChanceFilter(f.k)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${activeChanceFilter === f.k ? f.bg : "bg-stone-50 border-stone-200 text-stone-500 hover:border-white/30"}`}>{f.label}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => results?.choices && window.location.reload()} className="px-3 py-1.5 border border-stone-200 rounded-lg bg-white/70 text-xs font-semibold hover:bg-stone-100 transition-all flex items-center gap-1.5"><RotateCcw className="w-3 h-3"/> Reset</button>
                      <button onClick={handleExport} className="px-3 py-1.5 border border-white text-stone-900 rounded-lg bg-white shadow-sm text-xs font-semibold hover:bg-stone-50 transition-all flex items-center gap-1.5">
                         {!isPremium ? <Lock className="w-3 h-3 text-orange-500" /> : <Download className="w-3 h-3"/>}
                         <span>{isPremium ? "Export PDF" : "Unlock Export"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Results count */}
                  <p className="text-xs font-semibold text-stone-500">{displayedColleges.length} results found</p>

                  {/* Results Table */}
                  <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl overflow-hidden">
                    <div className="hidden md:grid grid-cols-[40px_1fr_1fr_80px_80px_50px_50px] gap-3 px-5 py-3 bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500">
                      <span>#</span><span>Institute</span><span>Branch</span><span className="text-right">Cutoff</span><span className="text-center">Chance</span><span className="text-center">Trend</span><span className="text-center">Cmp</span>
                    </div>
                    
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="choices">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="divide-y divide-white/5">
                            {displayedColleges.slice(0, visibleCount).map((c, i) => {
                              const type = getCollegeType(c.college_name);
                              const tColor = type === "IIT" ? "text-orange-500 border-orange-500/30 bg-orange-500/10" : type === "NIT" ? "text-orange-400 border-orange-500/30 bg-orange-500/10" : type === "IIIT" ? "text-amber-500 border-amber-500/30 bg-amber-500/10" : "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
                              const cColor = c.chance === "Safe" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : c.chance === "Target" ? "text-orange-400 border-orange-500/30 bg-orange-500/10" : "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
                              const key = `${c.college_id}|${c.branch}`;
                              const isExp = expandedRow === key;
                              
                              return (
                                <Draggable key={key} draggableId={key} index={i}>
                                  {(prov, snap) => (
                                    <div ref={prov.innerRef} {...prov.draggableProps} style={prov.draggableProps.style} className={`${snap.isDragging ? "bg-stone-100 shadow-2xl z-50 rounded-xl outline outline-1 outline-white/20" : "hover:bg-white/5"} transition-colors`}>
                                      <div className="grid grid-cols-1 md:grid-cols-[40px_1fr_1fr_80px_80px_50px_50px] gap-3 items-center px-5 py-3.5">
                                        <div {...prov.dragHandleProps} className="hidden md:flex items-center text-stone-600 hover:text-stone-900 cursor-grab"><GripVertical className="w-4 h-4"/></div>
                                        
                                        <div>
                                          <div className="flex md:hidden items-center gap-2 mb-1.5">
                                            <div {...prov.dragHandleProps} className="cursor-grab text-stone-600"><GripVertical className="w-3.5 h-3.5"/></div>
                                            <span className="text-[9px] font-mono text-stone-500">{i + 1}</span>
                                            <span className={`px-1.5 py-0.5 border text-[9px] font-bold rounded ${tColor}`}>{type}</span>
                                          </div>
                                          <div className="flex md:items-center gap-2">
                                            <span className={`hidden md:inline-block px-1.5 py-0.5 border text-[8px] font-bold rounded shrink-0 ${tColor}`}>{type}</span>
                                            <h4 className="text-xs font-bold uppercase leading-snug">{c.college_name}</h4>
                                          </div>
                                        </div>

                                        <div className="text-xs text-stone-400 font-mono line-clamp-2">{c.branch}</div>
                                        <div className="md:text-right font-mono font-bold text-xs">{c.closing_rank}</div>
                                        <div className="flex md:justify-center"><span className={`px-2 py-0.5 text-[9px] font-bold uppercase border rounded ${cColor}`}>{c.chance}</span></div>
                                        
                                        <div className="flex md:justify-center">
                                          <button onClick={() => toggleTrend(c.college_id, c.branch)} className={`p-1.5 rounded-lg border transition-all ${isExp ? "bg-stone-100 border-white/30 text-stone-900" : "border-stone-200 text-stone-500 hover:text-stone-900 hover:border-white/30"}`}><BarChart3 className="w-3.5 h-3.5"/></button>
                                        </div>
                                        
                                        <div className="flex md:justify-center">
                                          <button onClick={() => isInCompare(c.college_id) ? removeCollege(c.college_id) : addCollege({college_id: c.college_id, name: c.college_name, type, state: "", nirf_rank: undefined})} className={`p-1.5 rounded-lg border transition-all ${isInCompare(c.college_id) ? "bg-white/70 text-stone-900 border-white" : "border-stone-200 text-stone-500 hover:text-stone-900 hover:border-white/30"}`}><GitCompareArrows className="w-3.5 h-3.5"/></button>
                                        </div>
                                      </div>

                                      {isExp && (
                                        <div className="px-5 pb-4 pt-1">
                                          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                                            <div className="text-xs font-semibold text-stone-500 mb-3">Cutoff Trend</div>
                                            {trendLoading === key ? <div className="h-24 flex items-center justify-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/></div> : trendCache[key]?.length ? (
                                              <div className="h-28">
                                                <ResponsiveContainer width="100%" height="100%">
                                                  <LineChart data={trendCache[key]}>
                                                    <XAxis dataKey="year" tick={{fill:'#78716c', fontSize:9, fontWeight:'bold'}} axisLine={false} tickLine={false}/>
                                                    <YAxis reversed tick={{fill:'#78716c', fontSize:9, fontWeight:'bold'}} axisLine={false} tickLine={false} width={40}/>
                                                    <Tooltip contentStyle={{background:'#ffffff', border:'1px solid #e7e5e4', fontSize:'10px', fontWeight:'bold'}}/>
                                                    <Line type="monotone" dataKey="rank" stroke="#8b5cf6" strokeWidth={2} dot={{fill:'#8b5cf6', r:3}}/>
                                                  </LineChart>
                                                </ResponsiveContainer>
                                              </div>
                                            ) : <p className="text-[9px] text-stone-500 font-semibold text-center py-4">No historical data available.</p>}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                    {displayedColleges.length > visibleCount && (
                      <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-center">
                        <button 
                          onClick={() => setVisibleCount(c => c + 50)}
                          className="px-6 py-2.5 bg-white border border-stone-200 shadow-sm rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                        >
                          Load More Options
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </div>

      {/* Branch Selection Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm  p-4" onClick={() => setShowBranchModal(false)}>
          <div className="bg-stone-100 border border-stone-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-stone-200 bg-white/70 flex items-center justify-between">
              <h2 className="text-lg font-bold">Select Branches</h2>
              <button onClick={() => setShowBranchModal(false)} className="text-stone-500 hover:text-stone-900"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 border-b border-stone-200">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input type="text" placeholder="Search branches..." value={branchSearch} onChange={(e) => { setBranchSearch(e.target.value); setExpandedCategory(null); }} className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 h-12 text-stone-900 text-sm focus:outline-none focus:border-white/30" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {Object.entries(BRANCH_GROUPS).map(([cat, branches]) => {
                const match = branchSearch ? branches.filter(b => b.toLowerCase().includes(branchSearch.toLowerCase())) : branches;
                if (!match.length) return null;
                const isExp = expandedCategory === cat || !!branchSearch;
                const allSel = match.length > 0 && match.every(b => branchPreferences.includes(b));
                return (
                  <div key={cat} className="mb-2 border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                    <div className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-white/70" onClick={() => setExpandedCategory(isExp && !branchSearch ? null : cat)}>
                      <div className="flex items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); if (allSel) setBranchPreferences(p => p.filter(b => !match.includes(b))); else setBranchPreferences(p => [...p, ...match.filter(b => !p.includes(b))]); }} className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${allSel ? "bg-white shadow-sm border-white text-stone-900" : "border-white/30"}`}>{allSel && <Check className="w-2.5 h-2.5" />}</button>
                        <span className="font-semibold text-xs">{cat} <span className="ml-1.5 bg-stone-100 px-1.5 py-0.5 rounded text-[9px] text-stone-400">{match.length}</span></span>
                      </div>
                      <span className="text-stone-500">{isExp ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}</span>
                    </div>
                    {isExp && (
                      <div className="px-3.5 pb-3 pt-1 border-t border-white/5 space-y-0.5">
                        {match.map(b => {
                          const isSel = branchPreferences.includes(b);
                          return (
                            <button key={b} onClick={() => setBranchPreferences(p => isSel ? p.filter(x => x !== b) : [...p, b])} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/70 text-left">
                              <span className={`w-3.5 h-3.5 rounded border flex shrink-0 items-center justify-center ${isSel ? "bg-white shadow-sm border-white text-stone-900" : "border-white/30"}`}>{isSel && <Check className="w-2 h-2" />}</span>
                              <span className="text-xs text-stone-600 leading-snug">{b}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-5 border-t border-stone-200">
               <button onClick={() => setShowBranchModal(false)} className="w-full h-12 bg-orange-500 text-white font-bold text-xs rounded-xl hover:bg-orange-400 transition-all">Confirm ({branchPreferences.length} selected)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounsellorSheet;
