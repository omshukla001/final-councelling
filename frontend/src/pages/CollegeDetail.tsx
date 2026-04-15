import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, MapPin, Trophy, GraduationCap, Building2, TrendingUp,
  GitCompare, Loader2, Star, Users, Briefcase, CheckCircle2,
  Calendar, Landmark, IndianRupee
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScrollReveal from "@/components/ScrollReveal";
import { CollegeService } from "@/services/api";
import { useCompare } from "@/contexts/CompareContext";
import { AtmosphericGlow, FadeIn } from "@/components/ui/LayoutAtoms";
import type { CollegeData, SeatMatrixEntry } from "@/types/college";

import { OverviewTab, CutoffsTab, SeatsTab, FeesTab, PlacementsTab, CampusTab, formatINR } from "./college-detail";

const CollegeDetail = () => {
  const { id } = useParams();
  const [college, setCollege] = useState<CollegeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addCollege, isInCompare } = useCompare();
  const [bulkPlacement, setBulkPlacement] = useState<Record<string, unknown> | null>(null);
  const [bulkPlacementLoading, setBulkPlacementLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await CollegeService.getCollege(id);
        setCollege(data);
      } catch {
        setError("Failed to load college details. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setBulkPlacementLoading(true);
        const data = await CollegeService.getPlacementData(id);
        if (data?.found) setBulkPlacement(data.data);
      } catch { /* optional */ }
      finally { setBulkPlacementLoading(false); }
    })();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-stone-900 animate-spin" />
        <p className="text-xs font-semibold text-stone-500 animate-pulse">Loading college details...</p>
      </div>
    </div>
  );

  if (error || !college) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
      <Building2 className="w-16 h-16 text-stone-500 mb-6" />
      <p className="text-xl font-bold text-red-500 mb-6">{error || "College not found."}</p>
      <Link to="/colleges" className="inline-flex items-center gap-2 px-6 py-3 border border-stone-200 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to colleges
      </Link>
    </div>
  );

  const inCompare = isInCompare(college.college_id);
  const scraped = college.scraped_data;
  const nirfRank = college.nirf_rank;
  const nirfDisplay = college.nirf_display;
  const established = scraped?.details?.established_year;
  const np = scraped?.new_placements || {};
  const reviews = scraped?.reviews || {};
  const seats = scraped?.seats || [];
  const totalSeats = seats.reduce((s: number, item: SeatMatrixEntry) => s + (item.total_seats || 0), 0);

  const typeBadgeClass =
    college.type === "IIT" ? "bg-violet-500/10 text-violet-400 border-orange-200"
    : college.type === "NIT" ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
    : college.type === "IIIT" ? "bg-purple-500/10 text-orange-500 border-purple-500/30"
    : "bg-stone-100 text-stone-500 border-stone-300";

  // Tab config
  const tabs = [
    { value: "overview", label: "Overview", icon: Building2, show: true },
    { value: "cutoffs", label: "Cutoffs", icon: TrendingUp, show: (college.branches?.length > 0) },
    { value: "seats", label: "Seat Matrix", icon: Users, show: (seats.length > 0) },
    { value: "fees", label: "Fees", icon: IndianRupee, show: !!(scraped?.fee_structure || scraped?.new_fees?.btech_course_fees?.length || scraped?.fees) },
    { value: "placements", label: "Placements", icon: Briefcase, show: !!(scraped?.placement_summary || np.highest_package || bulkPlacement) },
    { value: "campus", label: "Campus", icon: Landmark, show: true },
  ].filter(t => t.show);

  return (
    <div className="min-h-screen text-stone-900 pb-20 overflow-x-hidden">
      <AtmosphericGlow />

      {/* Hero Banner */}
      <div className="relative pt-24 pb-14 px-4 mb-8 overflow-hidden">
        <img src={(college.image_url?.replace(/\/\d+px-/, '/1200px-')) || "https://images.unsplash.com/photo-1562774053-701939374585?w=1920&q=80&auto=format"} alt={college.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(28,18,10,0.65) 0%, rgba(28,18,10,0.50) 50%, rgba(28,18,10,0.35) 100%)" }} />
        <div className="container mx-auto max-w-7xl relative z-10">
          <FadeIn>
            <Link to="/colleges" className="inline-flex items-center gap-2 text-xs font-semibold text-white/90 hover:text-white transition-colors mb-6 bg-white/20 backdrop-blur-md border border-white/25 px-4 py-2 rounded-lg">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to colleges
            </Link>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <span className="text-xs font-semibold px-3 py-1 rounded bg-white/20 backdrop-blur-md border border-white/25 text-white">{college.type}</span>
                  {nirfDisplay && (
                    <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold">
                      <Trophy className="w-3 h-3 text-yellow-300" /> NIRF {nirfDisplay}
                    </span>
                  )}
                  {established && (
                    <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold">
                      <Calendar className="w-3 h-3 text-orange-300" /> Est. {established}
                    </span>
                  )}
                  {reviews.overall_rating > 0 && (
                    <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold">
                      <Star className="w-3 h-3 text-amber-300" /> {reviews.overall_rating}/5.0
                    </span>
                  )}
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[0.9] text-white mb-6 drop-shadow-2xl">
                  {college.name}
                </h1>

                <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-white/80">
                  {college.state && (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-white/20 backdrop-blur-md border border-white/25"><MapPin className="w-3.5 h-3.5 text-white" /></div>
                      <span>{college.state}</span>
                    </div>
                  )}
                  {scraped?.details?.director && (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-white/20 backdrop-blur-md border border-white/25"><Users className="w-3.5 h-3.5 text-white" /></div>
                      <span>Director: {scraped.details.director}</span>
                    </div>
                  )}
                </div>
                {scraped?.details?.motto && (
                  <p className="text-sm text-white/70 mt-6 border-l-2 border-white/30 pl-4 leading-relaxed max-w-2xl">"{scraped.details.motto}"</p>
                )}
              </div>

              <div className="flex flex-col gap-3 shrink-0 xl:pt-4">
                <button
                  onClick={() => addCollege({
                    college_id: college.college_id, name: college.name, type: college.type,
                    state: college.state || "", nirf_rank: college.nirf_rank,
                    branch_count: college.branch_count || 0, avg_package: formatINR(np.average_package) || "N/A"
                  })}
                  className={`flex items-center justify-center gap-2 px-8 py-5 rounded-2xl text-xs font-bold transition-all duration-300 ${
                    inCompare ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]"
                    : "hover:scale-105 active:scale-95 text-white bg-white/20 backdrop-blur-md border border-white/25 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                  }`}
                >
                  {inCompare ? <CheckCircle2 className="w-5 h-5" /> : <GitCompare className="w-5 h-5" />}
                  {inCompare ? "Added to Compare" : "Add to Compare"}
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">

        {/* Stats Grid */}
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Avg Package", value: formatINR(np.average_package), icon: TrendingUp, gradient: "from-orange-500 to-amber-500", bg: "bg-orange-50", show: !!np.average_package },
              { label: "Top Package", value: formatINR(np.highest_package), icon: Trophy, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", show: !!np.highest_package },
              { label: "Total Seats", value: totalSeats > 0 ? totalSeats.toString() : null, icon: GraduationCap, gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50", show: totalSeats > 0 },
              { label: "Branches", value: college.branch_count?.toString(), icon: Building2, gradient: "from-amber-500 to-yellow-500", bg: "bg-amber-50", show: !!college.branch_count },
            ].filter(s => s.show && s.value).map((stat, i) => (
              <div key={i} className={`${stat.bg} border border-stone-200/50 rounded-2xl p-6 text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 press-card overflow-hidden relative`}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-2xl font-extrabold text-stone-800 mb-1">{stat.value}</p>
                <p className="text-xs text-stone-500 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <FadeIn delay={0.3}>
            <TabsList className="flex w-full overflow-x-auto custom-scrollbar bg-gradient-to-r from-orange-50 via-amber-50/50 to-stone-50 border border-orange-200/50 p-2 rounded-2xl mb-8 h-auto gap-2 shadow-sm">
              {tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}
                  className="flex-[0_0_auto] py-3 px-5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-300/30 text-stone-500 transition-all font-semibold text-xs flex items-center gap-2 hover:text-stone-800 hover:bg-white/60 border border-transparent data-[state=active]:border-orange-400 press-card">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </FadeIn>

          <TabsContent value="overview"><OverviewTab college={college} scraped={scraped} /></TabsContent>
          <TabsContent value="cutoffs"><CutoffsTab branches={college.branches || []} availableYears={college.available_years || []} /></TabsContent>
          <TabsContent value="seats"><SeatsTab seats={seats} /></TabsContent>
          <TabsContent value="fees"><FeesTab scraped={scraped} collegeName={college.name} /></TabsContent>
          <TabsContent value="placements"><PlacementsTab scraped={scraped} bulkPlacement={bulkPlacement} bulkPlacementLoading={bulkPlacementLoading} /></TabsContent>
          <TabsContent value="campus"><CampusTab scraped={scraped} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CollegeDetail;
