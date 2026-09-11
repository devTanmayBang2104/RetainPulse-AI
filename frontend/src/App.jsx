import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Predict from "./pages/Predict";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import WhatIfSimulator from "./pages/WhatIfSimulator";
import ModelStudio from "./pages/ModelStudio";
import AICopilot from "./pages/AICopilot";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#e2e8f0",
              border: "1px solid #334155",
              borderRadius: "10px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#10b981", secondary: "#1e293b" } },
            error: { iconTheme: { primary: "#f43f5e", secondary: "#1e293b" } },
          }}
        />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="copilot" element={<AICopilot />} />
            <Route path="predict" element={<Predict />} />
            <Route path="simulator" element={<WhatIfSimulator />} />
            <Route path="model-studio" element={<ModelStudio />} />
            <Route path="history" element={<History />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
