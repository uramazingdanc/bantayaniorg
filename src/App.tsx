import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import UserManagement from "./pages/UserManagement";
import GISMap from "./pages/GISMap";
import PestReports from "./pages/PestReports";
import Advisories from "./pages/Advisories";
import FarmerApp from "./pages/FarmerApp";
import FarmerProfile from "./pages/farmer/FarmerProfile";
import FarmerHistory from "./pages/farmer/FarmerHistory";
import FarmerCamera from "./pages/farmer/FarmerCamera";
import FarmerAdvisories from "./pages/farmer/FarmerAdvisories";
import FarmerMap from "./pages/farmer/FarmerMap";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/" element={<Index />} />

            {/* LGU Admin Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['lgu_admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="map" element={<GISMap />} />
              <Route path="reports" element={<PestReports />} />
              <Route path="advisories" element={<Advisories />} />
            </Route>

            {/* Farmer App Routes */}
            <Route
              path="/farmer"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <FarmerApp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/profile"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <FarmerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/history"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <FarmerHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/camera"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <FarmerCamera />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/advisories"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <FarmerAdvisories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/map"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <FarmerMap />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
