import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Loader2, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Predictor", path: "/predictor" },
  { label: "Colleges", path: "/colleges" },
  { label: "Compare", path: "/compare" },
  { label: "Counsellor Sheet", path: "/counsellor-sheet" },
  { label: "AI Counsellor", path: "/ai-counsellor" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout, setShowLoginPopup } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center py-3 px-4">
      <nav
        className={`transition-all duration-500 rounded-2xl w-full border ${
          scrolled
            ? "backdrop-blur-2xl max-w-5xl py-2 px-5 bg-white/95 border-stone-200 shadow-lg shadow-stone-300/30"
            : "max-w-6xl py-2 px-4 bg-transparent border-transparent"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-[1.02]">
            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-lg shadow-amber-500/25 border-2 border-amber-400/40">
              <img src="/logo.png" alt="CounsellorWala" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-extrabold text-base">CW</div>'; }}/>
            </div>
            <span className={`font-extrabold text-xl tracking-tight hidden sm:inline transition-colors duration-300 ${scrolled ? "" : ""}`}>
              <span className={scrolled ? "text-stone-800" : "text-white"}>Counsellor</span><span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">Wala</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className={`hidden lg:flex items-center gap-1 rounded-xl p-1 border transition-colors duration-300 ${scrolled ? "bg-white/70 border-stone-200" : "bg-white/10 backdrop-blur-md border-white/15"}`}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-3.5 py-2 text-[12px] font-semibold rounded-lg whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? (scrolled ? "text-stone-900" : "text-white")
                      : (scrolled ? "text-stone-500 hover:text-stone-800" : "text-white/60 hover:text-white")
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className={`absolute inset-0 rounded-lg ${scrolled ? "bg-violet-600/20 border border-violet-500/30" : "bg-white/15 border border-white/20"}`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-2">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`gap-2 rounded-xl border px-3 h-9 transition-colors duration-300 ${scrolled ? "border-stone-200 bg-white/70 hover:bg-stone-100" : "border-white/20 bg-white/10 hover:bg-white/20"}`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className={`text-sm font-semibold max-w-[100px] truncate transition-colors duration-300 ${scrolled ? "text-stone-800" : "text-white"}`}>
                      {displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-stone-200 bg-stone-100/95 backdrop-blur-xl">
                  <div className="px-3 py-2">
                    <p className="text-sm font-bold text-stone-900">{displayName}</p>
                    <p className="text-xs text-stone-500 truncate">{user.email || user.displayName}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-stone-100" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-lg"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" className={`text-xs font-semibold transition-colors duration-300 ${scrolled ? "text-stone-500 hover:text-stone-900" : "text-white/70 hover:text-white"}`} onClick={() => setShowLoginPopup(true)}>
                  Log in
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-900 font-bold text-xs rounded-xl px-4 border-0 shadow-md" onClick={() => setShowLoginPopup(true)}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              className="text-foreground p-2 hover:bg-stone-100 rounded-xl transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden mt-3 mx-1 rounded-xl bg-white/95 backdrop-blur-xl border border-stone-200 p-3"
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-violet-600/15 text-violet-300 border border-violet-500/20"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="flex gap-2 mt-3 pt-3 border-t border-stone-200">
              {user ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-stone-300 text-stone-600"
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="flex-1 border-stone-300 text-stone-600" onClick={() => { setMobileOpen(false); setShowLoginPopup(true); }}>Log in</Button>
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold border-0" onClick={() => { setMobileOpen(false); setShowLoginPopup(true); }}>Sign Up</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
