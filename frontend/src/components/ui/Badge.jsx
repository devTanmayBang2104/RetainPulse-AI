import { clsx } from "clsx";

const variants = {
  HIGH: "badge-high",
  MEDIUM: "badge-medium",
  LOW: "badge-low",
};

const dots = {
  HIGH: "bg-rose-400",
  MEDIUM: "bg-amber-400",
  LOW: "bg-emerald-400",
};

export function RiskBadge({ level }) {
  if (!level) return <span className="text-slate-500 text-xs">—</span>;
  return (
    <span className={clsx("badge", variants[level] || "badge")}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", dots[level])} />
      {level}
    </span>
  );
}

export function ProbabilityBar({ value }) {
  const pct = Math.round((value ?? 0) * 100);
  const color =
    pct >= 70 ? "bg-rose-500" : pct >= 40 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="progress-bar flex-1">
        <div
          className={clsx("progress-fill", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-400 w-9 text-right">{pct}%</span>
    </div>
  );
}
