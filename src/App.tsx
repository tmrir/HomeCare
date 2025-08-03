import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import ServiceRequest from "./pages/ServiceRequest";
import Confirmation from "./pages/Confirmation";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/auth/Login";
import TechnicianDashboard from "./pages/technician/TechnicianDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import WhatsAppButton from "./components/WhatsAppButton";
import "./styles/whatsapp-button.css";

const queryClient = new QueryClient();

// Debug component to log route changes
const RouteDebugger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('Route changed to:', location.pathname);
  }, [location.pathname]);
  
  return null;
};

const App = () => {
  console.log('App component rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <RouteDebugger />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/request" element={<ServiceRequest />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected admin routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
            </Route>
            
            {/* Protected technician routes */}
            <Route element={<ProtectedRoute allowedRoles={['technician']} />}>
              <Route path="/technician-dashboard" element={<TechnicianDashboard />} />
            </Route>
            
            {/* Redirects */}
            <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
          <WhatsAppButton />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
