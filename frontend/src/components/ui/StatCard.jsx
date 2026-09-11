import { clsx } from "clsx";

export default function StatCard({ title, value, subtitle, icon: Icon, color = "primary", trend }) {
  const colorMap = {
    primary: "text-primary-400 bg-primary-500/10 border-primary-500/20",
    danger: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    info: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <div className="card flex items-start gap-4 animate-slide-up">
      {Icon && (
        <div className={clsx("p-2.5 rounded-lg border", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1 leading-none">
          {value ?? <span className="skeleton w-16 h-7 inline-block" />}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1.5 truncate">{subtitle}</p>
        )}
        {trend !== undefined && (
          <p className={clsx(
            "text-xs font-medium mt-1.5",
            trend >= 0 ? "text-rose-400" : "text-emerald-400"
          )}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last week
          </p>
        )}
      </div>
    </div>
  );
}
