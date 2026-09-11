import { useLocation } from "react-router-dom";
import { Sun, Moon, Bell } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const PAGE_TITLES = {
  "/dashboard": { title: "Dashboard", sub: "Platform overview and KPIs" },
  "/customers": { title: "Profiler & Sim", sub: "Interactive Customer Risk Portfolio & Retention Simulator" },
  "/copilot": { title: "AI Copilot", sub: "Conversational AI Assistant with full subscriber context" },
  "/predict": { title: "Churn Prediction", sub: "Run AI-powered churn risk analysis" },
  "/simulator": { title: "What-If Simulator", sub: "Toggle features and watch churn probability update live" },
  "/model-studio": { title: "Model Studio", sub: "Compare models, confusion matrix, evaluation metrics" },
  "/history": { title: "Prediction History", sub: "All past prediction records" },
  "/analytics": { title: "Analytics", sub: "Deep-dive into churn patterns" },
  "/reports": { title: "Reports", sub: "Export and download reports" },
};

export default function Header() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const page = PAGE_TITLES[location.pathname] || { title: "RetainPulse AI", sub: "Enterprise Retention Platform" };

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-700/50 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm flex items-center px-6 gap-4">
      {/* Page info */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">{page.title}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">{page.sub}</p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          id="btn-notifications"
          className="btn-ghost btn p-2 rounded-lg relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
        </button>

        {/* Theme toggle */}
        <button
          id="btn-theme-toggle"
          onClick={toggleTheme}
          className="btn-ghost btn p-2 rounded-lg"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>
      </div>
    </header>
  );
}
