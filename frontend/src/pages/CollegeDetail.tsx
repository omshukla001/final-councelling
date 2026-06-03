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
import RankingBox from "@/components/college-detail/RankingBox";
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

  // Derived KPIs for the expanded stats grid
  const placementSummary = (scraped as Record<string, unknown> | undefined)?.placement_summary as Record<string, unknown> | undefined;
  const inst = (placementSummary?.institutional_totals as Record<string, unknown> | undefined) || {};
  const newFees = (scraped as Record<string, unknown> | undefined)?.new_fees as Record<string, unknown> | undefined;
  const facilitiesRaw = (scraped as Record<string, unknown> | undefined)?.facilities;
  const facilitiesCount = Array.isArray(facilitiesRaw)
    ? facilitiesRaw.length
    : (facilitiesRaw && typeof facilitiesRaw === "object")
      ? Object.values(facilitiesRaw as Record<string, unknown>).filter(v => v === true || (typeof v === "string" && v.length > 0)).length
      : 0;
  const placementPct = Number(inst?.placement_rate ?? placementSummary?.placement_percentage ?? 0);
  const companiesVisited = Number(inst?.companies_visited ?? placementSummary?.companies_visited ?? 0);
  const medianPkg = Number(inst?.median_lpa ?? np.median_package ?? 0);
  const tuition = Number(newFees?.tuition_fee_per_year ?? 0);
  const campusSizeRaw = (scraped?.details as Record<string, unknown> | undefined)?.campus_size as string | number | undefined;
  const campusAcres = (() => {
    if (typeof campusSizeRaw === "number") return campusSizeRaw;
    if (typeof campusSizeRaw === "string") {
      const m = campusSizeRaw.match(/[\d.]+/);
      if (m) return parseFloat(m[0]);
    }
    return 0;
  })();

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

      {/* Hero Banner — compact */}
      <div className="relative site-hero mb-6 overflow-hidden">
        <img src={(college.image_url?.replace(/\/\d+px-/, '/1200px-')) || "https://images.unsplash.com/photo-1562774053-701939374585?w=1920&q=80&auto=format"} alt={college.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(28,18,10,0.70) 0%, rgba(28,18,10,0.55) 50%, rgba(28,18,10,0.40) 100%)" }} />
        <div className="site-container relative z-10">
          <FadeIn>
            <Link to="/colleges" className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/90 hover:text-white transition-colors mb-3 bg-white/20 backdrop-blur-md border border-white/25 px-3 py-1.5 rounded-lg">
              <ArrowLeft className="w-3 h-3" /> Back to colleges
            </Link>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/20 backdrop-blur-md border border-white/25 text-white">{college.type}</span>
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold">
                    <Trophy className={`w-2.5 h-2.5 ${nirfDisplay ? "text-yellow-300" : "text-white/50"}`} />
                    {nirfDisplay ? <>NIRF {nirfDisplay}</> : <>NIRF — Unranked</>}
                  </span>
                  {established && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold">
                      <Calendar className="w-2.5 h-2.5 text-orange-300" /> Est. {established}
                    </span>
                  )}
                  {reviews.overall_rating > 0 && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold">
                      <Star className="w-2.5 h-2.5 text-amber-300" /> {reviews.overall_rating}/5.0
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white mb-2 drop-shadow-xl line-clamp-2">
                  {college.name}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-white/80">
                  {college.state && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-white" />
                      <span>{college.state}</span>
                    </div>
                  )}
                  {scraped?.details?.director && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-white" />
                      <span className="truncate max-w-[280px]">Director: {scraped.details.director}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <button
                  onClick={() => addCollege({
                    college_id: college.college_id, name: college.name, type: college.type,
                    state: college.state || "", nirf_rank: college.nirf_rank,
                    branch_count: college.branch_count || 0, avg_package: formatINR(np.average_package) || "N/A"
                  })}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    inCompare ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md"
                    : "hover:scale-105 active:scale-95 text-white bg-white/20 backdrop-blur-md border border-white/25"
                  }`}
                >
                  {inCompare ? <CheckCircle2 className="w-4 h-4" /> : <GitCompare className="w-4 h-4" />}
                  {inCompare ? "Added" : "Add to Compare"}
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="site-container relative z-10">

        {/* Ranking Box */}
        <FadeIn delay={0.15}>
          <div className="mb-8">
            <RankingBox college={college} />
          </div>
        </FadeIn>

        {/* Stats Grid */}
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Avg Package", value: formatINR(np.average_package || Number(inst?.average_lpa) * 100000), icon: TrendingUp, gradient: "from-orange-500 to-amber-500", bg: "bg-orange-50", show: !!(np.average_package || inst?.average_lpa) },
              { label: "Top Package", value: formatINR(np.highest_package || Number(inst?.highest_lpa) * 100000), icon: Trophy, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", show: !!(np.highest_package || inst?.highest_lpa) },
              { label: "Median Package", value: formatINR(medianPkg * (medianPkg < 1000 ? 100000 : 1)), icon: TrendingUp, gradient: "from-cyan-500 to-blue-500", bg: "bg-cyan-50", show: medianPkg > 0 },
              { label: "Placed %", value: placementPct > 0 ? `${placementPct.toFixed(0)}%` : null, icon: Users, gradient: "from-pink-500 to-rose-500", bg: "bg-pink-50", show: placementPct > 0 },
              { label: "Recruiters", value: companiesVisited > 0 ? `${companiesVisited}+` : null, icon: Briefcase, gradient: "from-indigo-500 to-purple-500", bg: "bg-indigo-50", show: companiesVisited > 0 },
              { label: "Total Seats", value: totalSeats > 0 ? totalSeats.toString() : null, icon: GraduationCap, gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50", show: totalSeats > 0 },
              { label: "Branches", value: college.branch_count?.toString(), icon: Building2, gradient: "from-amber-500 to-yellow-500", bg: "bg-amber-50", show: !!college.branch_count },
              { label: "Campus", value: campusAcres > 0 ? `${campusAcres} acres` : null, icon: Landmark, gradient: "from-lime-500 to-green-500", bg: "bg-lime-50", show: campusAcres > 0 },
              { label: "Tuition / Yr", value: tuition > 0 ? formatINR(tuition) : null, icon: IndianRupee, gradient: "from-yellow-500 to-amber-500", bg: "bg-yellow-50", show: tuition > 0 },
              { label: "Facilities", value: facilitiesCount > 0 ? `${facilitiesCount}` : null, icon: CheckCircle2, gradient: "from-teal-500 to-emerald-500", bg: "bg-teal-50", show: facilitiesCount > 0 },
              { label: "Student Rating", value: reviews.overall_rating > 0 ? `${reviews.overall_rating}/5` : null, icon: Star, gradient: "from-fuchsia-500 to-pink-500", bg: "bg-fuchsia-50", show: reviews.overall_rating > 0 },
              { label: "Established", value: established ? `${established}` : null, icon: Calendar, gradient: "from-sky-500 to-cyan-500", bg: "bg-sky-50", show: !!established },
            ].filter(s => s.show && s.value).map((stat, i) => (
              <div key={i} className={`${stat.bg} border border-stone-200/50 rounded-2xl p-5 text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 press-card overflow-hidden relative`}>
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md text-white`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-xl font-extrabold text-stone-800 mb-1 tabular-nums">{stat.value}</p>
                <p className="text-[11px] text-stone-500 font-semibold">{stat.label}</p>
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
