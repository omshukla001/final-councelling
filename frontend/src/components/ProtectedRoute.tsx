/**
 * ProtectedRoute — Blocks unauthenticated users from accessing protected pages.
 * Redirects to the login route if the user is not authenticated.
 */
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!user) {
        // Redirect them to the home page and violently trigger the login popup
        return <Navigate to="/" state={{ triggerLoginPopup: true }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
