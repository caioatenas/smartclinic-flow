import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClinicProvider } from "@/lib/clinic-context";
import { AuthProvider } from '@/lib/auth-context';
import { StaffLayout } from '@/components/AccessGate';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from "./pages/HomePage";
import KioskPage from "./pages/KioskPage";
import WaitPanelPage from "./pages/WaitPanelPage";
import ReceptionPage from "./pages/ReceptionPage";
import AssistantPage from "./pages/AssistantPage";
import DoctorPage from "./pages/DoctorPage";
import AdminPage from "./pages/AdminPage";
import RoomsPage from './pages/RoomsPage';
import BedsPage from './pages/BedsPage';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
      <ClinicProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/kiosk" element={<KioskPage />} />
            <Route path="/panel" element={<WaitPanelPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<StaffLayout />}>
            <Route path="/reception" element={<ReceptionPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/doctor" element={<DoctorPage />} />
            <Route path="/doctor/:doctorId" element={<DoctorPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/beds" element={<BedsPage />} />
            <Route path="/rooms/:officeId" element={<RoomsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ClinicProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
