import { useState, useCallback, useRef, useEffect } from "react";
import { Zap, RotateCcw, TrendingDown, TrendingUp, CheckCircle, AlertTriangle, Minus, Users } from "lucide-react";
import { predictionsAPI, customersAPI } from "../services/api";
import { clsx } from "clsx";

/* ─── High-risk baseline customer ─────────────────────────── */
const BASE_PROFILE = {
  gender: "Male", SeniorCitizen: 0, Partner: "No", Dependents: "No",
  tenure: 6, PhoneService: "Yes", MultipleLines: "No",
  InternetService: "Fiber optic", OnlineSecurity: "No", OnlineBackup: "No",
  DeviceProtection: "No", TechSupport: "No", StreamingTV: "No",
  StreamingMovies: "No", Contract: "Month-to-month",
  PaperlessBilling: "Yes", PaymentMethod: "Electronic check",
  MonthlyCharges: 79.85, TotalCharges: 479.10, model: "random_forest",
};

/* ─── Intervention definitions ─────────────────────────────── */
const INTERVENTIONS = [
  {
    id: "contract_1yr", group: "Contract",
    label: "Upgrade to 1-Year Contract", icon: "📋",
    field: "Contract", value: "One year",
    description: "Reduces churn risk significantly — most impactful single action",
    impact: "HIGH",
  },
  {
    id: "contract_2yr", group: "Contract",
    label: "Upgrade to 2-Year Contract", icon: "📋",
    field: "Contract", value: "Two year",
    description: "Maximum contract lock-in — best long-term retention tool",
    impact: "HIGH",
  },
  {
    id: "tech_support", group: "Services",
    label: "Add Tech Support", icon: "🛠️",
    field: "TechSupport", value: "Yes",
    description: "Resolves frustration-driven churn — high satisfaction impact",
    impact: "MEDIUM",
  },
  {
    id: "online_security", group: "Services",
    label: "Add Online Security", icon: "🔒",
    field: "OnlineSecurity", value: "Yes",
    description: "Increases service stickiness through value-added features",
    impact: "MEDIUM",
  },
  {
    id: "device_protection", group: "Services",
    label: "Add Device Protection", icon: "📱",
    field: "DeviceProtection", value: "Yes",
    description: "Bundling services reduces cancellation intent",
    impact: "LOW",
  },
  {
    id: "discount_15", group: "Pricing",
    label: "Apply 15% Loyalty Discount", icon: "💰",
    field: "MonthlyCharges", value: +(BASE_PROFILE.MonthlyCharges * 0.85).toFixed(2),
    description: "Reduces price sensitivity for high-charge customers",
    impact: "HIGH",
  },
  {
    id: "autopay", group: "Billing",
    label: "Switch to Auto-Pay (Bank)", icon: "🏦",
    field: "PaymentMethod", value: "Bank transfer (automatic)",
    description: "Auto-payment reduces payment-related churn triggers",
    impact: "LOW",
  },
  {
    id: "paperless_off", group: "Billing",
    label: "Disable Paperless Billing", icon: "📄",
    field: "PaperlessBilling", value: "No",
    description: "Minor but measurable impact on churn probability",
    impact: "LOW",
  },
];

/* ─── SVG Gauge ─────────────────────────────────────────────── */
function RiskGauge({ probability, baseline }) {
  const pct = Math.round((probability ?? 0) * 100);
  const basePct = Math.round((baseline ?? 0) * 100);
  const delta = pct - basePct;

  const color = pct >= 70 ? "#f43f5e" : pct >= 40 ? "#f59e0b" : "#10b981";
  const label = pct >= 70 ? "HIGH RISK" : pct >= 40 ? "MEDIUM RISK" : "LOW RISK";

  // SVG arc calculations
  const r = 70;
  const cx = 100;
  const cy = 100;
  const startAngle = -210;
  const totalDeg = 240;
  const angle = startAngle + (pct / 100) * totalDeg;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcPath = (from, to, radius) => {
    const x1 = cx + radius * Math.cos(toRad(from));
    const y1 = cy + radius * Math.sin(toRad(from));
    const x2 = cx + radius * Math.cos(toRad(to));
    const y2 = cy + radius * Math.sin(toRad(to));
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 160" className="w-52 h-40">
        {/* Background arc */}
        <path d={arcPath(-210, 30, r)} fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
        {/* Colored arc */}
        <path d={arcPath(-210, angle, r)} fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round" style={{ transition: "all 0.6s ease" }} />
        {/* Center text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color}
          fontSize="28" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
          {pct}%
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
          {label}
        </text>
      </svg>
      {/* Delta badge */}
      {delta !== 0 && (
        <div className={clsx(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border",
          delta < 0
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            : "bg-rose-500/15 border-rose-500/30 text-rose-400"
        )}>
          {delta < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          {delta > 0 ? "+" : ""}{delta}% from baseline
        </div>
      )}
      {delta === 0 && baseline !== null && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-slate-500 border border-slate-700">
          <Minus className="w-3 h-3" /> Baseline (no interventions applied)
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function WhatIfSimulator() {
  const [profile, setProfile] = useState({ ...BASE_PROFILE });
  const [baseline, setBaseline] = useState(null);
  const [currentProb, setCurrentProb] = useState(null);
  const [applied, setApplied] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("default");
  const loadingRef = useRef(false);

  const runPrediction = useCallback(async (profileToRun) => {
    if (loadingRef.current) return null;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await predictionsAPI.predict(profileToRun);
      return res.churn_probability;
    } catch {
      return null;
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const handleInit = async (profileToUse = profile) => {
    const prob = await runPrediction(profileToUse);
    if (prob !== null) {
      setBaseline(prob);
      setCurrentProb(prob);
      setInitialized(true);
      setProfile({ ...profileToUse });
      setApplied([]);
    }
  };

  // Automatically start simulation on mount
  useEffect(() => {
    handleInit(BASE_PROFILE);
    customersAPI.getAll({ limit: 12, riskLevel: 'HIGH' })
      .then(res => {
        if (res && res.customers) {
          setCustomerOptions(res.customers);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectCustomer = async (e) => {
    const val = e.target.value;
    setSelectedCustomerId(val);
    if (val === 'default') {
      handleInit(BASE_PROFILE);
    } else {
      const found = customerOptions.find(c => c.customerId === val);
      if (found) {
        const newProf = {
          gender: found.gender || 'Male',
          SeniorCitizen: found.seniorCitizen || 0,
          Partner: found.partner || 'No',
          Dependents: found.dependents || 'No',
          tenure: found.tenure || 1,
          PhoneService: found.phoneService || 'Yes',
          MultipleLines: found.multipleLines || 'No',
          InternetService: found.internetService || 'Fiber optic',
          OnlineSecurity: found.onlineSecurity || 'No',
          OnlineBackup: found.onlineBackup || 'No',
          DeviceProtection: found.deviceProtection || 'No',
          TechSupport: found.techSupport || 'No',
          StreamingTV: found.streamingTV || 'No',
          StreamingMovies: found.streamingMovies || 'No',
          Contract: found.contract || 'Month-to-month',
          PaperlessBilling: found.paperlessBilling || 'Yes',
          PaymentMethod: found.paymentMethod || 'Electronic check',
          MonthlyCharges: found.monthlyCharges || 70,
          TotalCharges: found.totalCharges || 100,
          model: 'random_forest'
        };
        handleInit(newProf);
      }
    }
  };

  const handleReset = async () => {
    setProfile({ ...BASE_PROFILE });
    setApplied([]);
    setCurrentProb(baseline);
  };

  const handleIntervention = async (intervention) => {
    // Toggle off if already applied
    const alreadyApplied = applied.find((a) => a.id === intervention.id);

    let newProfile = { ...profile };
    let newApplied = [...applied];

    if (alreadyApplied) {
      // Revert this intervention
      newProfile[intervention.field] = BASE_PROFILE[intervention.field];
      newApplied = newApplied.filter((a) => a.id !== intervention.id);
    } else {
      // Apply intervention
      newProfile[intervention.field] = intervention.value;
      newApplied.push({ ...intervention, appliedAt: Date.now() });
    }

    setProfile(newProfile);
    setApplied(newApplied);

    const newProb = await runPrediction(newProfile);
    if (newProb !== null) {
      setCurrentProb(newProb);
      // Update delta for this intervention
      if (!alreadyApplied) {
        setApplied((prev) =>
          prev.map((a) =>
            a.id === intervention.id
              ? { ...a, deltaPct: Math.round((newProb - baseline) * 100) }
              : a
          )
        );
      }
    }
  };

  const impactColor = { HIGH: "text-rose-400", MEDIUM: "text-amber-400", LOW: "text-slate-400" };
  const groups = [...new Set(INTERVENTIONS.map((i) => i.group))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card border-primary-500/20 bg-primary-600/5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary-600/20 border border-primary-500/30">
            <Zap className="w-6 h-6 text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-100">What-If Simulator</h2>
            <p className="text-sm text-slate-400 mt-1">
              Pre-loaded with a <strong className="text-rose-400">HIGH RISK</strong> customer profile
              (6-month tenure, month-to-month contract, fiber optic, $79.85/month).
              Apply interventions and watch the churn probability change in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {customerOptions.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5">
                <Users className="w-4 h-4 text-primary-400" />
                <select
                  value={selectedCustomerId}
                  onChange={handleSelectCustomer}
                  className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer font-medium"
                >
                  <option value="default" className="bg-slate-900">Preset High Risk (84% Churn)</option>
                  {customerOptions.map(c => (
                    <option key={c.customerId} value={c.customerId} className="bg-slate-900">
                      {c.customerId} ({c.contract}, ${c.monthlyCharges}/mo)
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button id="btn-reset-simulator" onClick={handleReset} disabled={loading}
              className="btn-secondary btn text-xs py-2">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>
      </div>

      {false && (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 border-2 border-slate-700 border-t-primary-500 rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Calculating baseline churn probability...</p>
        </div>
      )}

      {true && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT: Gauge + Stats */}
          <div className="space-y-4">
            {/* Gauge */}
            <div className="card flex flex-col items-center py-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                Live Churn Probability
              </p>
              {loading ? (
                <div className="w-12 h-12 border-2 border-slate-700 border-t-primary-500 rounded-full animate-spin my-8" />
              ) : (
                <RiskGauge probability={currentProb} baseline={baseline} />
              )}
            </div>

            {/* Baseline vs Current */}
            <div className="card">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Comparison</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Baseline (no changes)</span>
                  <span className="font-mono text-sm font-bold text-rose-400">
                    {Math.round((baseline ?? 0) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Current (with interventions)</span>
                  <span className={clsx(
                    "font-mono text-sm font-bold",
                    currentProb < baseline ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {Math.round((currentProb ?? 0) * 100)}%
                  </span>
                </div>
                {applied.length > 0 && (
                  <>
                    <div className="divider" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Risk Reduction</span>
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        {Math.round((baseline - currentProb) * 100)}pp saved
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Applied Interventions Log */}
            {applied.length > 0 && (
              <div className="card">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Applied Interventions ({applied.length})
                </p>
                <div className="space-y-2">
                  {applied.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-slate-300 flex-1">{a.label}</span>
                      {a.deltaPct !== undefined && (
                        <span className={clsx(
                          "font-mono font-bold",
                          a.deltaPct < 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {a.deltaPct > 0 ? "+" : ""}{a.deltaPct}pp
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Intervention Controls */}
          <div className="xl:col-span-2 space-y-4">
            {groups.map((group) => (
              <div key={group} className="card">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{group}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INTERVENTIONS.filter((i) => i.group === group).map((intervention) => {
                    const isApplied = applied.some((a) => a.id === intervention.id);
                    const appliedData = applied.find((a) => a.id === intervention.id);
                    return (
                      <button
                        key={intervention.id}
                        id={`btn-intervention-${intervention.id}`}
                        onClick={() => handleIntervention(intervention)}
                        disabled={loading}
                        className={clsx(
                          "flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-200",
                          isApplied
                            ? "border-emerald-500/40 bg-emerald-500/10"
                            : "border-slate-700/60 bg-slate-800/40 hover:border-primary-500/40 hover:bg-primary-500/5"
                        )}
                      >
                        <span className="text-lg">{intervention.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={clsx("text-sm font-semibold", isApplied ? "text-emerald-300" : "text-slate-200")}>
                              {intervention.label}
                            </p>
                            <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", impactColor[intervention.impact])}>
                              {intervention.impact}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{intervention.description}</p>
                          {isApplied && appliedData?.deltaPct !== undefined && (
                            <p className={clsx(
                              "text-xs font-bold mt-1",
                              appliedData.deltaPct < 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                              {appliedData.deltaPct > 0 ? "+" : ""}{appliedData.deltaPct}pp impact
                            </p>
                          )}
                        </div>
                        {isApplied && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Interview note */}
            <div className="card border-primary-500/20 bg-primary-500/5">
              <p className="text-xs font-semibold text-primary-400 mb-2">💡 What This Demonstrates</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Each click calls the live ML model with the modified profile — this is a real inference call, not a simulation.
                The delta shows the exact business value of each retention action (e.g., "switching to annual contract saves 23 percentage points of churn risk").
                This converts model output into <em>actionable retention decisions</em>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
