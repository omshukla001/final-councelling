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
            ? "backdrop-blur-2xl max-w-5xl py-2 px-5 bg-white/95 border-stone-200 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            : "max-w-6xl py-2 px-4 bg-white/70 backdrop-blur-md border-white/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-[1.02]">
            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-lg shadow-amber-500/25 border-2 border-amber-400/40">
              <img src="/logo.png" alt="CounsellorWala" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-extrabold text-base">CW</div>'; }}/>
            </div>
            <span className="font-extrabold text-xl tracking-tight hidden sm:inline">
              <span className="text-stone-900">Counsellor</span>
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #FF6B35, #EC407A)" }}>Wala</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1 rounded-xl p-1 border bg-white/70 border-stone-200">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-3.5 py-2 text-[12px] font-semibold rounded-lg whitespace-nowrap transition-all duration-200 ${
                    isActive ? "text-stone-900" : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "rgba(255,107,53,0.12)", border: "1px solid rgba(255,107,53,0.25)" }}
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
                    className="gap-2 rounded-xl border px-3 h-9 border-stone-200 bg-white/70 hover:bg-stone-100"
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6B35, #F7931E)" }}>
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold max-w-[100px] truncate text-stone-900">
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
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-stone-600 hover:text-stone-900" onClick={() => setShowLoginPopup(true)}>
                  Log in
                </Button>
                <Button
                  size="sm"
                  className="text-white font-bold text-xs rounded-xl px-4 border-0"
                  style={{
                    background: "linear-gradient(135deg, #FF6B35, #F7931E)",
                    boxShadow: "0 6px 18px rgba(255,107,53,0.3)",
                  }}
                  onClick={() => setShowLoginPopup(true)}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle — generous 44px touch target */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="w-11 h-11 flex items-center justify-center rounded-xl transition-all text-stone-800 hover:bg-stone-100 border border-stone-200/60 bg-white/70 backdrop-blur-md"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <motion.div
                animate={{ rotate: mobileOpen ? 180 : 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden mt-3 mx-1 rounded-2xl bg-white border border-stone-200 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.45)] overflow-hidden relative z-10"
          >
            {/* User header strip (if logged in) */}
            {user && (
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-stone-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md ring-2 ring-white">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-stone-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-stone-500 truncate">{user.email || user.displayName}</p>
                </div>
              </div>
            )}

            {/* Nav links */}
            <div className="p-2 space-y-1 bg-white">
              {navItems.map((item, i) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.03, duration: 0.25 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 min-h-[44px] ${
                        isActive
                          ? "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-200"
                          : "text-stone-700 hover:text-stone-900 hover:bg-stone-50 active:bg-stone-100"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA strip */}
            <div className="p-3 border-t border-stone-100 bg-stone-50">
              {user ? (
                <Button
                  variant="outline"
                  className="w-full h-11 border-stone-300 text-stone-700 font-semibold rounded-xl bg-white"
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 border-stone-300 text-stone-700 font-semibold rounded-xl bg-white"
                    onClick={() => { setMobileOpen(false); setShowLoginPopup(true); }}
                  >
                    Log in
                  </Button>
                  <Button
                    className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold border-0 rounded-xl shadow-md shadow-orange-400/30"
                    onClick={() => { setMobileOpen(false); setShowLoginPopup(true); }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Fixed full-screen scrim behind the mobile menu — dims the page so the panel reads as opaque, and tap-outside-to-close */}
      {mobileOpen && (
        <motion.button
          aria-label="Close menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 top-16 bg-black/45 backdrop-blur-sm -z-10"
        />
      )}
    </header>
  );
};

export default Navbar;
