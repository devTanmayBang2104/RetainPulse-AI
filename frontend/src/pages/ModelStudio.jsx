import { useState } from "react";
import { BarChart2, Target, GitCompare, DollarSign, ShieldAlert, BadgePercent, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { clsx } from "clsx";

/* ─── Static model data (from notebook results) ──────── */
const MODELS = [
  {
    key: "logistic_regression",
    name: "Logistic Regression",
    color: "#6366f1",
    roc_auc: 0.86, f1: 0.64, precision: 0.52, recall: 0.84,
    description: "Baseline linear model. Highest recall — catches the most churners. Best ROC-AUC.",
    pros: ["Highest recall (0.84)", "Most interpretable (coefficients)", "Best ROC-AUC (0.86)", "Fast inference"],
    cons: ["Lowest precision (0.52)", "Assumes linear relationships"],
    cm: { tp: 307, fn: 59, fp: 283, tn: 759 },
  },
  {
    key: "random_forest",
    name: "Random Forest",
    color: "#10b981",
    roc_auc: 0.85, f1: 0.65, precision: 0.56, recall: 0.78,
    description: "Ensemble of 100 decision trees. Best F1 and precision balance. Primary production model.",
    pros: ["Best F1 score (0.65)", "Highest precision (0.56)", "Feature importance built-in", "Handles non-linear patterns"],
    cons: ["Slightly lower recall", "14MB model size", "Slower than logistic"],
    cm: { tp: 285, fn: 81, fp: 224, tn: 818 },
  },
  {
    key: "xgboost",
    name: "XGBoost",
    color: "#f59e0b",
    roc_auc: 0.85, f1: 0.63, precision: 0.55, recall: 0.75,
    description: "Gradient boosting with scale_pos_weight for class imbalance. Lowest recall of the three.",
    pros: ["Handles class imbalance (scale_pos_weight)", "Built-in regularization", "Fast training"],
    cons: ["Lowest recall (0.75)", "Lowest F1 (0.63)", "Less interpretable"],
    cm: { tp: 275, fn: 91, fp: 225, tn: 817 },
  },
];

const METRICS = ["roc_auc", "f1", "precision", "recall"];
const METRIC_LABELS = { roc_auc: "ROC-AUC", f1: "F1 Score", precision: "Precision", recall: "Recall" };

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" },
};

export default function ModelStudio() {
  const [selected, setSelected] = useState("random_forest");
  
  // Dynamic threshold states
  const [threshold, setThreshold] = useState(0.5);
  const [arpu, setArpu] = useState(80);
  const [retentionCost, setRetentionCost] = useState(15);
  const [successRate, setSuccessRate] = useState(50);

  const model = MODELS.find((m) => m.key === selected);

  // Dynamically calculate confusion matrix cells based on threshold slider
  const getDynamicCM = () => {
    const { tp: baseTP, fn: baseFN, fp: baseFP, tn: baseTN } = model.cm;
    const shift = (threshold - 0.5) * 2; // -1 to +1

    let tp = baseTP;
    let fn = baseFN;
    let fp = baseFP;
    let tn = baseTN;

    if (shift < 0) {
      const tpGain = Math.round(baseFN * Math.abs(shift) * 0.9);
      tp = baseTP + tpGain;
      fn = baseFN - tpGain;

      const fpGain = Math.round(baseTN * Math.abs(shift) * 0.35);
      fp = baseFP + fpGain;
      tn = baseTN - fpGain;
    } else {
      const tpLoss = Math.round(baseTP * shift * 0.7);
      tp = baseTP - tpLoss;
      fn = baseFN + tpLoss;

      const fpLoss = Math.round(baseFP * shift * 0.85);
      fp = baseFP - fpLoss;
      tn = baseTN + fpLoss;
    }

    return { tp, fn, fp, tn };
  };

  const dynamicCM = getDynamicCM();
  const totalSamples = dynamicCM.tp + dynamicCM.fn + dynamicCM.fp + dynamicCM.tn;

  // Calculate dynamic precision and recall for visual feedback
  const dynamicRecall = dynamicCM.tp / (dynamicCM.tp + dynamicCM.fn) || 0;
  const dynamicPrecision = dynamicCM.tp / (dynamicCM.tp + dynamicCM.fp) || 0;
  const dynamicF1 = (2 * dynamicPrecision * dynamicRecall) / (dynamicPrecision + dynamicRecall) || 0;

  // Financial ROI calculations
  const totalRevenueAtRisk = (dynamicCM.tp + dynamicCM.fn) * arpu;
  const revenueSaved = dynamicCM.tp * (successRate / 100) * arpu;
  const campaignCost = (dynamicCM.tp + dynamicCM.fp) * retentionCost;
  const netSaved = revenueSaved - campaignCost;

  const barData = MODELS.map((m) => ({
    name: m.name.replace(" ", "\n"),
    "ROC-AUC": parseFloat((m.roc_auc * 100).toFixed(1)),
    "F1 Score": parseFloat((m.f1 * 100).toFixed(1)),
    "Precision": parseFloat((m.precision * 100).toFixed(1)),
    "Recall": parseFloat((m.recall * 100).toFixed(1)),
  }));

  const cells = [
    { label: "True Negative", abbr: "TN", value: dynamicCM.tn, sub: "Predicted Stay, Actual Stay", color: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" },
    { label: "False Positive", abbr: "FP", value: dynamicCM.fp, sub: "Predicted Churn, Actual Stay", color: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400" },
    { label: "False Negative", abbr: "FN", value: dynamicCM.fn, sub: "Predicted Stay, Actual Churn", color: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400" },
    { label: "True Positive", abbr: "TP", value: dynamicCM.tp, sub: "Predicted Churn, Actual Churn", color: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30">
            <BarChart2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Model Studio & Business Simulator</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Analyze model performances and simulate key business metrics. Tweak the <strong>Decision Threshold</strong> to optimize for either recall (catching churners) or precision (minimizing campaign waste).
            </p>
          </div>
        </div>
      </div>

      {/* Model Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODELS.map((m) => (
          <button key={m.key} onClick={() => setSelected(m.key)}
            className={clsx(
              "card text-left transition-all duration-200 border-2",
              selected === m.key ? "border-2" : "border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600"
            )}
            style={selected === m.key ? { borderColor: m.color } : {}}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ background: m.color }} />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{m.name}</p>
              {m.key === "random_forest" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 dark:border-emerald-500/30">
                  PRIMARY
                </span>
              )}
            </div>
            <div className="space-y-2">
              {METRICS.map((k) => (
                <div key={k} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{METRIC_LABELS[k]}</span>
                  <span className="font-mono text-slate-800 dark:text-slate-205 font-bold">{m[k].toFixed(2)}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Dynamic Simulator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dynamic Confusion Matrix & Threshold Slider */}
        <div className="lg:col-span-2 card space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Target className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
              Dynamic Confusion Matrix ({model.name})
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">Test Set: {totalSamples} samples</span>
          </div>

          {/* Threshold Tuning Slider */}
          <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-650 dark:text-slate-350">Decision Threshold</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/25 text-[11px]">
                {threshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.02"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Low Threshold (High Recall)</span>
              <span>High Threshold (High Precision)</span>
            </div>
          </div>

          {/* Confusion Matrix Grid */}
          <div className="grid grid-cols-2 gap-3">
            {cells.map((c) => (
              <div key={c.abbr} className={`p-4 rounded-xl border text-center ${c.color} transition-all duration-200`}>
                <p className="text-3xl font-bold font-mono tracking-tight">{c.value}</p>
                <p className="text-[11px] font-bold mt-1 text-slate-805 dark:text-slate-200">{c.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5 leading-snug">{c.sub}</p>
                <p className="text-[10px] font-mono mt-1.5 opacity-60 bg-white/50 dark:bg-slate-950/30 py-0.5 rounded inline-block px-2">
                  {((c.value / totalSamples) * 100).toFixed(1)}% of total
                </p>
              </div>
            ))}
          </div>

          {/* Dynamic Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-slate-55/50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-wider font-semibold">Recall (Sensitivity)</p>
              <p className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">{(dynamicRecall * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-wider font-semibold">Precision</p>
              <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">{(dynamicPrecision * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-wider font-semibold">F1-Score</p>
              <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{(dynamicF1 * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Right: Business ROI & Decision Impact Calculator */}
        <div className="card space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <DollarSign className="w-4.5 h-4.5 text-emerald-505 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Business ROI Simulator</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Input Slider: ARPU */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                <span>Avg Customer Value (ARPU)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-250">${arpu}</span>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                value={arpu}
                onChange={(e) => setArpu(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Input Slider: Campaign Offer Cost */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                <span>Retention Offer Value</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-250">${retentionCost}</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                value={retentionCost}
                onChange={(e) => setRetentionCost(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Input Slider: Success Offer Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                <span>Offer Success Rate</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-250">{successRate}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={successRate}
                onChange={(e) => setSuccessRate(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="divider my-1 border-slate-100 dark:border-slate-800" />

            {/* Simulated Outputs */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-lg border border-slate-150 dark:border-slate-850">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Total Churn Value
                </span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">${totalRevenueAtRisk.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Saved Revenue
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${Math.round(revenueSaved).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <BadgePercent className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Campaign Budget
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">${campaignCost.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 mt-2 pt-2 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Net Saved (ROI)</span>
                <span className={clsx(
                  "font-mono text-sm font-bold px-2 py-0.5 rounded",
                  netSaved >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                )}>
                  ${Math.round(netSaved).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="section-title flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-primary-500 dark:text-primary-400" /> Side-by-Side Performance
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={16}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `${v}%`} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => `${v}%`} />
              <Legend formatter={(v) => <span style={{ color: "#64748b", fontSize: 11 }}>{v}</span>} />
              <Bar dataKey="ROC-AUC" fill="#6366f1" radius={[2, 2, 0, 0]} />
              <Bar dataKey="F1 Score" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Precision" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Recall" fill="#f43f5e" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Interview Tips Card */}
        <div className="card border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest mb-2">💡 Interview Q&A Talking Points</h4>
            <div className="space-y-3 text-[11px] text-slate-600 dark:text-slate-450 leading-relaxed">
              <p>
                <strong>1. Why not optimize for Accuracy?</strong><br />
                With 26% base churn rate, a dummy classifier predicting "never churn" gets 74% accuracy. Using precision, recall, and F1 ensures we capture the minority churn class.
              </p>
              <p>
                <strong>2. How to choose the optimal threshold?</strong><br />
                Adjusting the slider demonstrates that the ML threshold is a business decision. A low threshold (e.g. 0.3) catches more churners (Recall increases) but increases false positives and campaign costs. The optimal threshold maximizes <strong>Net Saved (ROI)</strong>.
              </p>
            </div>
          </div>
          <p className="text-[10px] text-indigo-550 dark:text-indigo-400 font-semibold italic mt-4">
            Highlight this ROI Simulator in your full-stack / ML system design rounds!
          </p>
        </div>
      </div>
    </div>
  );
}
