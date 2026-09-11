import { useState, useEffect } from "react";
import { Download, FileText, Users, Brain, TrendingDown } from "lucide-react";
import { reportsAPI } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    reportsAPI.getSummary().then(setSummary).finally(() => setLoading(false));
  }, []);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const blob = type === "predictions"
        ? await reportsAPI.exportPredictions()
        : await reportsAPI.exportCustomers();
      downloadBlob(blob, `${type}_report_${Date.now()}.csv`);
      toast.success(`${type} report downloaded!`);
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading report summary..." />;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Customers", value: summary?.totalCustomers?.toLocaleString(), icon: Users, color: "text-primary-400" },
          { label: "Total Predictions", value: summary?.totalPredictions?.toLocaleString(), icon: Brain, color: "text-purple-400" },
          { label: "High Risk Customers", value: summary?.highRiskCustomers?.toLocaleString(), icon: TrendingDown, color: "text-rose-400" },
          { label: "Annual Revenue at Risk", value: `$${(summary?.estimatedAnnualRevenueAtRisk ?? 0).toLocaleString()}`, icon: FileText, color: "text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
            <p className="text-2xl font-bold text-slate-100">{value ?? "—"}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          {
            type: "predictions",
            title: "Prediction History Report",
            description: "Export all churn predictions with risk levels, probabilities, model used, top explanations, and recommendations.",
            icon: Brain,
            color: "text-primary-400",
            fields: ["Prediction ID", "Customer ID", "Model", "Churn Probability", "Risk Level", "Confidence", "Top Reason", "Top Recommendation", "Date"],
          },
          {
            type: "customers",
            title: "Customer Database Report",
            description: "Export customer records with demographics, service details, and their latest churn risk assessment.",
            icon: Users,
            color: "text-emerald-400",
            fields: ["Customer ID", "Gender", "Senior Citizen", "Tenure", "Contract", "Internet Service", "Monthly Charges", "Churn Probability", "Risk Level", "Added On"],
          },
        ].map(({ type, title, description, icon: Icon, color, fields }) => (
          <div key={type} className="card">
            <div className="flex items-start gap-4 mb-5">
              <div className={`p-2.5 rounded-lg bg-slate-800 border border-slate-700`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">{title}</h3>
                <p className="text-sm text-slate-400 mt-1">{description}</p>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Columns Included</p>
              <div className="flex flex-wrap gap-1.5">
                {fields.map((f) => (
                  <span key={f} className="text-[11px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <button
              id={`btn-export-${type}`}
              onClick={() => handleExport(type)}
              disabled={exporting === type}
              className="btn-primary btn w-full"
            >
              {exporting === type ? (
                <><span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" /> Generating...</>
              ) : (
                <><Download className="w-4 h-4" /> Download CSV</>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Report generation info */}
      <div className="card">
        <h3 className="section-title">📋 About Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { title: "Real-Time Data", text: "Reports are generated on-demand from live MongoDB data. Always reflects current state." },
            { title: "CSV Format", text: "Industry-standard CSV format. Compatible with Excel, Google Sheets, Tableau, Power BI." },
            { title: "Up to 1,000 Records", text: "Each export includes up to 1,000 most recent records, sorted by date." },
          ].map(({ title, text }) => (
            <div key={title} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/40">
              <p className="font-semibold text-slate-300 mb-1">{title}</p>
              <p className="text-slate-500 text-xs leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-4">
          Generated: {summary?.generatedAt ? new Date(summary.generatedAt).toLocaleString() : "—"}
        </p>
      </div>
    </div>
  );
}
