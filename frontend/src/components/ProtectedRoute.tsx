/**
 * ProtectedRoute — Renders an inline locked panel for unauthenticated users
 * instead of redirecting and force-opening the login popup. The popup only
 * opens when the user clicks "Sign in to continue" or after the 10s timer
 * in LoginPopup.
 */
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading, setShowLoginPopup } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 pt-24">
                <div className="max-w-md w-full text-center bg-white/80 backdrop-blur-xl border border-stone-200 rounded-3xl shadow-xl p-8">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-5 shadow-lg shadow-orange-400/30">
                        <Lock className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-stone-900 mb-2">Sign in required</h2>
                    <p className="text-sm text-stone-500 mb-6">
                        This feature needs an account. Sign in to access your personalised counselling tools.
                    </p>
                    <Button
                        onClick={() => setShowLoginPopup(true)}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold border-0 shadow-md"
                    >
                        Sign in to continue
                    </Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
