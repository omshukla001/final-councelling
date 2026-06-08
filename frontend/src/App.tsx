import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { CompareProvider } from "@/contexts/CompareContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
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

const queryClient = new QueryClient();

const SessionManager = () => {
  const location = useLocation();
  useEffect(() => {
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
            <UserPreferencesProvider>
              <CompareProvider>
                <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
                  <Navbar />
                  <main className="flex-1 flex flex-col">
                    <Routes>
                      <Route path="/login" element={<Navigate to="/" replace />} />
                      <Route path="/signup" element={<Navigate to="/" replace />} />
                      <Route path="/" element={<Index />} />
                      <Route path="/predictor" element={<Predictor />} />
                      <Route path="/colleges" element={<Colleges />} />
                      <Route path="/college/:id" element={<CollegeDetail />} />
                      <Route path="/compare" element={<Compare />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/ai-counsellor" element={<AiCounsellor />} />
                      <Route path="/counsellor-sheet" element={<CounsellorSheet />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
                <ChatWidget />
              </CompareProvider>
            </UserPreferencesProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
