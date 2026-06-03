import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, GraduationCap, BarChart3, Users, Settings, MapPin, Trophy, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollegeService, College } from "@/services/api";
import { FadeIn } from "@/components/ui/LayoutAtoms";
import { useAuth } from "@/contexts/AuthContext";

// Admin email allowlist — only these emails can access the admin dashboard
const ADMIN_EMAILS = [
  "admin@counsellorwala.com",
  // Add your email here
];

const deriveType = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("indian institute of technology") && !n.includes("information")) return "IIT";
  if (n.includes("national institute of technology")) return "NIT";
  if (n.includes("indian institute of information technology")) return "IIIT";
  return "GFTI";
};

const Admin = () => {
  const { user } = useAuth();
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-stone-500">
        <ShieldAlert className="w-12 h-12 text-red-400" />
        <h2 className="text-xl font-bold text-stone-800">Access Denied</h2>
        <p className="text-sm">You do not have admin privileges.</p>
      </div>
    );
  }
  const [search, setSearch] = useState("");
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [collegeRes, filterRes] = await Promise.all([
          CollegeService.getColleges({ page_size: 500 }),
          CollegeService.getFilters(),
        ]);
        setColleges(collegeRes.colleges);
        setTotal(collegeRes.total);
        setFilters(filterRes);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = colleges.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.state || "").toLowerCase().includes(search.toLowerCase())
  );

  const typeCounts = { IIT: 0, NIT: 0, IIIT: 0, GFTI: 0 };
  colleges.forEach((c) => {
    const t = c.type || deriveType(c.name);
    if (t in typeCounts) typeCounts[t as keyof typeof typeCounts]++;
  });

  const branchCount = filters?.branches?.length || 0;
  const categoryCount = filters?.categories?.length || 0;

  return (
    <div className="min-h-screen text-stone-900 pb-12 overflow-x-hidden">
      {/* Banner */}
      <div className="relative site-hero mb-8 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&q=80&auto=format" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(28,18,10,0.65) 0%, rgba(28,18,10,0.50) 50%, rgba(28,18,10,0.35) 100%)" }} />
        </div>
        <div className="site-container relative z-10">
          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90">
                  <Settings className="w-3.5 h-3.5" /> Admin Panel
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                  Admin{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-300">Dashboard</span>
                </h1>
                <p className="text-white/60 text-sm mt-2">Real-time data from MongoDB — {total} colleges, {branchCount} branches</p>
              </div>
              <Button onClick={() => window.location.reload()} className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
            </div>
          </FadeIn>
        </div>
      </div>
      <div className="site-container relative z-10">

        {/* Live Stats from DB */}
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { icon: GraduationCap, label: "Total Colleges", value: loading ? "..." : String(total), color: "orange" },
              { icon: BarChart3, label: "Total Branches", value: loading ? "..." : String(branchCount), color: "amber" },
              { icon: Users, label: "Categories", value: loading ? "..." : String(categoryCount), color: "violet" },
              { icon: Settings, label: "College Types", value: loading ? "..." : `${Object.keys(typeCounts).length}`, color: "emerald" },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-${s.color}-100 flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 text-${s.color}-600`} />
                  </div>
                  <p className="text-xs font-semibold text-stone-500">{s.label}</p>
                </div>
                <p className="text-3xl font-extrabold text-stone-800">{s.value}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Type Breakdown */}
        <FadeIn delay={0.25}>
          <div className="flex gap-3 mb-8 flex-wrap">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl shadow-sm">
                <span className={`w-3 h-3 rounded-full ${type === "IIT" ? "bg-orange-500" : type === "NIT" ? "bg-amber-500" : type === "IIIT" ? "bg-violet-500" : "bg-emerald-500"}`} />
                <span className="text-sm font-bold text-stone-700">{type}</span>
                <span className="text-sm text-stone-400">{count}</span>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Tabs defaultValue="colleges" className="w-full">
            <TabsList className="flex w-full overflow-x-auto bg-stone-50 border border-stone-200 p-2 rounded-2xl mb-8 h-auto gap-2">
              <TabsTrigger value="colleges" className="flex-[0_0_auto] py-3 px-6 rounded-xl data-[state=active]:bg-orange-500 data-[state=active]:text-white text-stone-500 transition-all text-xs font-semibold hover:text-stone-900 border border-transparent data-[state=active]:border-orange-500">
                Colleges ({total})
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex-[0_0_auto] py-3 px-6 rounded-xl data-[state=active]:bg-orange-500 data-[state=active]:text-white text-stone-500 transition-all text-xs font-semibold hover:text-stone-900 border border-transparent data-[state=active]:border-orange-500">
                Database Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colleges">
              <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-6 overflow-hidden">
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Search by college name or state..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-12 rounded-xl bg-stone-50 border-stone-300 text-sm text-stone-800 focus-visible:ring-orange-500"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    <span className="ml-3 text-stone-500 font-medium">Loading from database...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-stone-400 mb-4">Showing {filtered.length} of {total} colleges</p>
                    <div className="overflow-x-auto pb-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-stone-200">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500">#</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500">College Name</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500">Type</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-stone-500">State</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-stone-500">NIRF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.slice(0, 50).map((c, i) => {
                            const type = c.type || deriveType(c.name);
                            const typeColor = type === "IIT" ? "orange" : type === "NIT" ? "amber" : type === "IIIT" ? "violet" : "emerald";
                            return (
                              <tr key={c.college_id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                <td className="py-3 px-4 text-xs text-stone-400">{i + 1}</td>
                                <td className="py-3 px-4 font-semibold text-stone-800">{c.name}</td>
                                <td className="py-3 px-4">
                                  <span className={`bg-${typeColor}-100 text-${typeColor}-700 border border-${typeColor}-200 px-2 py-0.5 rounded-full text-[10px] font-bold`}>{type}</span>
                                </td>
                                <td className="py-3 px-4 text-stone-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {c.state || "—"}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {c.nirf_rank ? (
                                    <span className="flex items-center justify-end gap-1 text-amber-600 font-bold">
                                      <Trophy className="w-3 h-3" /> #{c.nirf_rank}
                                    </span>
                                  ) : (
                                    <span className="text-stone-300 text-xs">Unranked</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-stone-400">No colleges matched "{search}"</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {filtered.length > 50 && (
                      <p className="text-xs text-stone-400 mt-4 text-center">Showing first 50 results. Narrow your search to see more.</p>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats">
              <div className="bg-white border border-stone-200/80 shadow-sm rounded-2xl p-8">
                <h3 className="text-lg font-bold text-stone-800 mb-6">Database Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-stone-600">College Type Distribution</h4>
                    {Object.entries(typeCounts).map(([type, count]) => {
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const color = type === "IIT" ? "bg-orange-500" : type === "NIT" ? "bg-amber-500" : type === "IIIT" ? "bg-violet-500" : "bg-emerald-500";
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-stone-600 w-12">{type}</span>
                          <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-bold text-stone-700 w-16 text-right">{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-stone-600">Data Summary</h4>
                    <div className="space-y-3">
                      {[
                        { label: "Total Colleges", value: total },
                        { label: "Total Branches", value: branchCount },
                        { label: "Categories", value: categoryCount },
                        { label: "Quotas", value: filters?.quotas?.length || 0 },
                        { label: "Gender Options", value: filters?.genders?.length || 0 },
                        { label: "Database", value: "councler_v2" },
                        { label: "Connection", value: "MongoDB Local" },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center py-2 border-b border-stone-100">
                          <span className="text-sm text-stone-500">{item.label}</span>
                          <span className="text-sm font-bold text-stone-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
    </div>
  );
};

export default Admin;
