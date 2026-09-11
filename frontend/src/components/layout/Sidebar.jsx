import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, FlaskConical, ChevronRight, TrendingDown, Activity, History, Brain, Sparkles, BarChart2, FileText, Sliders
} from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/customers", icon: Users, label: "Customer Profiler" },
  { to: "/copilot", icon: Sparkles, label: "AI Retention Copilot" },
  { to: "/predict", icon: Brain, label: "Churn Prediction" },
  { to: "/simulator", icon: Sliders, label: "What-If Simulator" },
  { to: "/model-studio", icon: FlaskConical, label: "Model Studio" },
  { to: "/analytics", icon: BarChart2, label: "Analytics" },
  { to: "/history", icon: History, label: "Prediction History" },
  { to: "/reports", icon: FileText, label: "Export Reports" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-dark-800 border-r border-slate-200 dark:border-slate-700/50 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20">
          <TrendingDown className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none tracking-tight">RetainPulse AI</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-none font-medium">Enterprise Retention</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-600/15 border border-primary-100 dark:border-primary-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx("w-4.5 h-4.5 shrink-0",
                  isActive ? "text-primary-550 dark:text-primary-400" : "text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                )} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-primary-500 dark:text-primary-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary-600/10 dark:bg-primary-600/20 border border-primary-500/20 dark:border-primary-500/30 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary-500 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">Admin Dashboard</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">Telecom Operations</p>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
        </div>
      </div>
    </aside>
  );
}
