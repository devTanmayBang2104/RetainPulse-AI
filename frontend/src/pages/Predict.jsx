import { useState } from "react";
import { useForm } from "react-hook-form";
import { Brain, AlertTriangle, CheckCircle, Shield, ChevronRight, Lightbulb, TrendingUp, Sparkles, Key, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { predictionsAPI, aiAPI } from "../services/api";
import { RiskBadge } from "../components/ui/Badge";
import toast from "react-hot-toast";
import { clsx } from "clsx";

const FIELD_GROUPS = [
  {
    title: "Demographics",
    fields: [
      { name: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
      { name: "SeniorCitizen", label: "Senior Citizen", type: "select", options: [{ label: "No (0)", value: 0 }, { label: "Yes (1)", value: 1 }] },
      { name: "Partner", label: "Partner", type: "select", options: ["Yes", "No"] },
      { name: "Dependents", label: "Dependents", type: "select", options: ["Yes", "No"] },
    ],
  },
  {
    title: "Account Details",
    fields: [
      { name: "tenure", label: "Tenure (months)", type: "number", min: 0, max: 72 },
      { name: "Contract", label: "Contract Type", type: "select", options: ["Month-to-month", "One year", "Two year"] },
      { name: "PaperlessBilling", label: "Paperless Billing", type: "select", options: ["Yes", "No"] },
      {
        name: "PaymentMethod", label: "Payment Method", type: "select",
        options: ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"],
      },
      { name: "MonthlyCharges", label: "Monthly Charges ($)", type: "number", step: "0.01", min: 0, max: 200 },
      { name: "TotalCharges", label: "Total Charges ($)", type: "number", step: "0.01", min: 0, max: 10000 },
    ],
  },
  {
    title: "Phone Services",
    fields: [
      { name: "PhoneService", label: "Phone Service", type: "select", options: ["Yes", "No"] },
      { name: "MultipleLines", label: "Multiple Lines", type: "select", options: ["Yes", "No", "No phone service"] },
    ],
  },
  {
    title: "Internet Services",
    fields: [
      { name: "InternetService", label: "Internet Service", type: "select", options: ["DSL", "Fiber optic", "No"] },
      { name: "OnlineSecurity", label: "Online Security", type: "select", options: ["Yes", "No", "No internet service"] },
      { name: "OnlineBackup", label: "Online Backup", type: "select", options: ["Yes", "No", "No internet service"] },
      { name: "DeviceProtection", label: "Device Protection", type: "select", options: ["Yes", "No", "No internet service"] },
      { name: "TechSupport", label: "Tech Support", type: "select", options: ["Yes", "No", "No internet service"] },
      { name: "StreamingTV", label: "Streaming TV", type: "select", options: ["Yes", "No", "No internet service"] },
      { name: "StreamingMovies", label: "Streaming Movies", type: "select", options: ["Yes", "No", "No internet service"] },
    ],
  },
];

const MODEL_OPTIONS = [
  { value: "random_forest", label: "Random Forest", note: "Best F1 Score" },
  { value: "logistic_regression", label: "Logistic Regression", note: "Highest Recall" },
  { value: "xgboost", label: "XGBoost", note: "Gradient Boosting" },
];

const priorityColors = {
  URGENT: "border-rose-500/50 bg-rose-500/5",
  HIGH: "border-amber-500/50 bg-amber-500/5",
  MEDIUM: "border-blue-500/50 bg-blue-500/5",
  LOW: "border-slate-600 bg-slate-800/40",
};

export default function Predict() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFormData, setLastFormData] = useState(null);
  // AI Co-Pilot state
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      gender: "Male", SeniorCitizen: 0, Partner: "No", Dependents: "No",
      tenure: 12, Contract: "Month-to-month", PaperlessBilling: "Yes",
      PaymentMethod: "Electronic check", MonthlyCharges: 79.85, TotalCharges: 958.2,
      PhoneService: "Yes", MultipleLines: "No",
      InternetService: "Fiber optic", OnlineSecurity: "No", OnlineBackup: "No",
      DeviceProtection: "No", TechSupport: "No", StreamingTV: "No", StreamingMovies: "No",
      model: "random_forest",
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setResult(null);
    setAiResult(null);
    try {
      const payload = {
        ...data,
        SeniorCitizen: parseInt(data.SeniorCitizen),
        tenure: parseInt(data.tenure),
        MonthlyCharges: parseFloat(data.MonthlyCharges),
        TotalCharges: parseFloat(data.TotalCharges),
      };
      const res = await predictionsAPI.predict(payload);
      setResult(res);
      setLastFormData(payload);
    } catch (e) {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!result || !lastFormData) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await aiAPI.generateStrategy({
        customerProfile: lastFormData,
        prediction: result
      });
      setAiResult(res);
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const riskConfig = {
    HIGH: { color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", icon: AlertTriangle },
    MEDIUM: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: AlertTriangle },
    LOW: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle },
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* LEFT: Form */}
      <div className="space-y-5">
        {/* Model selector */}
        <div className="card">
          <h3 className="section-title flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary-400" /> Select Model
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {MODEL_OPTIONS.map((m) => (
              <label key={m.value}
                className={clsx(
                  "flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-all",
                  "border-slate-700 hover:border-primary-500/50 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-500/10"
                )}
              >
                <input type="radio" value={m.value} {...register("model")} className="sr-only" />
                <span className="text-sm font-medium text-slate-200">{m.label}</span>
                <span className="text-xs text-slate-500">{m.note}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Feature groups */}
        <form id="prediction-form" onSubmit={handleSubmit(onSubmit)}>
          {FIELD_GROUPS.map((group) => (
            <div key={group.title} className="card mb-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 pb-2 border-b border-slate-700/50">
                {group.title}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {group.fields.map(({ name, label, type, options, ...rest }) => (
                  <div key={name} className="form-group">
                    <label className="label">{label}</label>
                    {type === "select" ? (
                      <select className="select" {...register(name)}>
                        {options.map((o) =>
                          typeof o === "object"
                            ? <option key={o.value} value={o.value}>{o.label}</option>
                            : <option key={o} value={o}>{o}</option>
                        )}
                      </select>
                    ) : (
                      <input type="number" className="input" {...rest} {...register(name, { valueAsNumber: true })} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn w-full py-3 text-base font-semibold"
          >
            {loading ? (
              <><span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" /> Analyzing...</>
            ) : (
              <><Brain className="w-5 h-5" /> Run Churn Prediction</>
            )}
          </button>
        </form>
      </div>

      {/* RIGHT: Results */}
      <div className="space-y-5">
        {!result && !loading && (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <Brain className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-slate-400 font-medium">Prediction result will appear here</p>
            <p className="text-slate-600 text-sm mt-1">Fill the form and run prediction</p>
          </div>
        )}

        {loading && (
          <div className="card flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-slate-700 border-t-primary-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400">Running ML model...</p>
            <p className="text-slate-600 text-xs mt-1">Calling FastAPI prediction service</p>
          </div>
        )}

        {result && (
          <>
            {/* Risk Result Card */}
            <div className={clsx("card border", riskConfig[result.risk_level]?.bg)}>
              {(() => {
                const Icon = riskConfig[result.risk_level]?.icon || Shield;
                return (
                  <div className="flex items-start gap-4">
                    <div className={clsx("p-3 rounded-xl", result.risk_level === "HIGH" ? "bg-rose-500/20" : result.risk_level === "MEDIUM" ? "bg-amber-500/20" : "bg-emerald-500/20")}>
                      <Icon className={clsx("w-6 h-6", riskConfig[result.risk_level]?.color)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={clsx("text-xl font-bold", riskConfig[result.risk_level]?.color)}>
                          {result.risk_level} RISK
                        </h3>
                        <RiskBadge level={result.risk_level} />
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Churn Probability</p>
                          <p className="text-2xl font-bold text-slate-100 font-mono">
                            {(result.churn_probability * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Confidence</p>
                          <p className="text-2xl font-bold text-slate-100 font-mono">
                            {(result.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Model</p>
                          <p className="text-sm font-medium text-primary-400 capitalize">
                            {result.model_used?.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                      {/* Probability bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Churn Probability</span>
                          <span>{(result.churn_probability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className={clsx("progress-fill", result.risk_level === "HIGH" ? "bg-rose-500" : result.risk_level === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500")}
                            style={{ width: `${result.churn_probability * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Why This Customer Will Churn */}
            <div className="card">
              <h3 className="section-title flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-400" /> Why This Customer May Churn
              </h3>
              <div className="space-y-2">
                {result.explanations?.map((exp, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
                    <div className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                      exp.impact === "HIGH" ? "bg-rose-500/20 text-rose-400" : exp.impact === "MEDIUM" ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-400"
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-200">{exp.feature}</p>
                        <span className={clsx("text-[10px] px-1.5 py-0.5 rounded font-semibold",
                          exp.impact === "HIGH" ? "bg-rose-500/15 text-rose-400" : exp.impact === "MEDIUM" ? "bg-amber-500/15 text-amber-400" : "bg-slate-700 text-slate-400"
                        )}>{exp.impact}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{exp.message}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-slate-500">
                        {exp.shap_value > 0 ? "+" : ""}{exp.shap_value?.toFixed(3)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="card">
              <h3 className="section-title flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" /> Retention Recommendations
              </h3>
              <div className="space-y-2">
                {result.recommendations?.map((rec, i) => (
                  <div key={i} className={clsx("p-3 rounded-lg border", priorityColors[rec.priority] || "border-slate-700 bg-slate-800/40")}>
                    <div className="flex items-start gap-3">
                      <ChevronRight className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-200">{rec.title}</p>
                          <span className={clsx("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                            rec.priority === "URGENT" ? "bg-rose-500/20 text-rose-400" :
                            rec.priority === "HIGH" ? "bg-amber-500/20 text-amber-400" :
                            "bg-primary-500/15 text-primary-400"
                          )}>{rec.priority}</span>
                          <span className="text-[10px] text-slate-500 border border-slate-600 px-1.5 py-0.5 rounded">{rec.category}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{rec.description}</p>
                        <p className="text-xs text-emerald-400 mt-1 font-medium">📈 {rec.estimated_impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* AI Co-Pilot */}
            <div className="card border-primary-500/20 bg-gradient-to-br from-primary-600/5 to-violet-600/5">
              <h3 className="section-title flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-400" /> AI Co-Pilot
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30 ml-1">OpenRouter</span>
              </h3>



              <button id="btn-ai-generate" onClick={handleGenerateAI} disabled={aiLoading || !result}
                className="btn-primary btn w-full mb-4">
                {aiLoading
                  ? <><span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" /> Generating strategy...</>
                  : <><Sparkles className="w-4 h-4" /> Generate AI Retention Strategy</>}
              </button>

              {aiLoading && (
                <div className="space-y-2">
                  {["Analyzing customer profile...", "Retrieving retention playbooks...", "Drafting personalized email..."].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />{t}
                    </div>
                  ))}
                </div>
              )}

              {aiResult && (
                <div className="space-y-4">
                  {/* Risk Analysis */}
                  <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">🔍 Risk Analysis</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{aiResult.riskAnalysis}</p>
                  </div>

                  {/* Retention Email */}
                  {aiResult.retentionEmail && (
                    <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">✉️ Retention Email</p>
                        <button onClick={() => copyToClipboard(aiResult.retentionEmail)} className="btn-ghost btn btn-sm p-1">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{aiResult.retentionEmail}</pre>
                    </div>
                  )}

                  {/* Action Plan */}
                  {aiResult.actionPlan && (
                    <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">📋 Agent Action Plan</p>
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{aiResult.actionPlan}</pre>
                    </div>
                  )}

                  {aiResult.modelUsed && (
                    <p className="text-[10px] text-slate-600 text-right">
                      Generated by {aiResult.modelUsed} · {aiResult.tokensUsed} tokens
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
