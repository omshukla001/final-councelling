import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { CompareProvider } from "@/contexts/CompareContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import ErrorBoundary from "@/components/ErrorBoundary";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Predictor from "./pages/Predictor";
import Colleges from "./pages/Colleges";
import CollegeDetail from "./pages/CollegeDetail";
import Compare from "./pages/Compare";

import Admin from "./pages/Admin";
import AiCounsellor from "./pages/AiCounsellor";
import CounsellorSheet from "./pages/CounsellorSheet";
import NotFound from "./pages/NotFound";
import ChatWidget from "@/components/ChatWidget";
import LoginPopup from "@/components/LoginPopup";

const queryClient = new QueryClient();

const SessionManager = () => {
  const location = useLocation();
  
  useEffect(() => {
    // If navigating anywhere EXCEPT the Counsellor Sheet or Compare matrix, wipe the sheet session!
    if (location.pathname !== "/counsellor-sheet" && location.pathname !== "/compare") {
      sessionStorage.removeItem("counsellorSheetState");
    }
  }, [location.pathname]);
  
  return null;
};

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="counsellorwala-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
        <BrowserRouter>
          <SessionManager />
          <AuthProvider>
            <SubscriptionProvider>
              <UserPreferencesProvider>
            <CompareProvider>
              <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <main className="flex-1 flex flex-col">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Navigate to="/" state={{ triggerLoginPopup: true }} replace />} />
                    <Route path="/signup" element={<Navigate to="/" state={{ triggerLoginPopup: true }} replace />} />

                    {/* Protected routes — require sign-in */}
                    <Route path="/" element={<Index />} />
                    <Route path="/predictor" element={<ProtectedRoute><Predictor /></ProtectedRoute>} />
                    <Route path="/colleges" element={<ProtectedRoute><Colleges /></ProtectedRoute>} />
                    <Route path="/college/:id" element={<ProtectedRoute><CollegeDetail /></ProtectedRoute>} />
                    <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/ai-counsellor" element={<ProtectedRoute><AiCounsellor /></ProtectedRoute>} />
                    <Route path="/counsellor-sheet" element={<ProtectedRoute><CounsellorSheet /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
              <ChatWidget />
              <LoginPopup />
            </CompareProvider>
              </UserPreferencesProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
