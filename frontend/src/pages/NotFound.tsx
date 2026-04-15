import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute w-[400px] h-[400px] top-1/3 left-1/3 rounded-full opacity-25" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
      </div>
      <div className="text-center max-w-md relative z-10">
        <div className="text-8xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-orange-400 mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-3">Page Not Found</h1>
        <p className="text-stone-500 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button className="h-11 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-orange-600 hover:from-violet-500 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-violet-500/20 border-0">
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Button>
          </Link>
          <Button variant="outline" className="h-11 px-6 rounded-xl border-stone-300 text-stone-600 hover:bg-stone-100" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
