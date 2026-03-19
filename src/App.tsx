import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClinicProvider } from "@/lib/clinic-context";
import HomePage from "./pages/HomePage";
import KioskPage from "./pages/KioskPage";
import WaitPanelPage from "./pages/WaitPanelPage";
import ReceptionPage from "./pages/ReceptionPage";
import AssistantPage from "./pages/AssistantPage";
import DoctorPage from "./pages/DoctorPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ClinicProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/kiosk" element={<KioskPage />} />
            <Route path="/panel" element={<WaitPanelPage />} />
            <Route path="/reception" element={<ReceptionPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/doctor/:doctorId" element={<DoctorPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ClinicProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
