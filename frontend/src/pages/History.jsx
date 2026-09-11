import { useState, useEffect, useCallback } from "react";
import { Trash2, Filter, ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { predictionsAPI } from "../services/api";
import { RiskBadge, ProbabilityBar } from "../components/ui/Badge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { clsx } from "clsx";

const RISK_LEVELS = ["HIGH", "MEDIUM", "LOW"];
const MODELS = ["random_forest", "logistic_regression", "xgboost"];

export default function History() {
  const [predictions, setPredictions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await predictionsAPI.getHistory({ page, limit: 10, ...filters });
      setPredictions(data.predictions || []);
      setPagination((p) => ({ ...p, ...data.pagination, page }));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(1); }, [filters, load]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this prediction?")) return;
    await predictionsAPI.delete(id);
    toast.success("Prediction deleted");
    load(pagination.page);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 items-center">
          <p className="text-sm text-slate-400">Risk:</p>
          {RISK_LEVELS.map((r) => (
            <button key={r}
              onClick={() => setFilters((f) => f.riskLevel === r ? {} : { ...f, riskLevel: r })}
              className={clsx("px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors",
                filters.riskLevel === r
                  ? r === "HIGH" ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                  : r === "MEDIUM" ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-transparent border-slate-700 text-slate-500 hover:text-slate-300"
              )}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <p className="text-sm text-slate-400">Model:</p>
          {MODELS.map((m) => (
            <button key={m}
              onClick={() => setFilters((f) => f.modelUsed === m ? {} : { ...f, modelUsed: m })}
              className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border transition-colors capitalize",
                filters.modelUsed === m
                  ? "bg-primary-500/20 border-primary-500/40 text-primary-400"
                  : "bg-transparent border-slate-700 text-slate-500 hover:text-slate-300"
              )}>
              {m.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <button onClick={() => setFilters({})} className="btn-ghost btn btn-sm ml-auto">Clear</button>
        <button onClick={() => load(pagination.page)} className="btn-ghost btn p-2">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <p className="text-sm font-medium text-slate-300">
            {pagination.total.toLocaleString()} predictions recorded
          </p>
        </div>
        {loading ? <LoadingSpinner text="Loading history..." /> : (
          <div className="table-container rounded-none border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Model</th>
                  <th>Risk Level</th>
                  <th>Churn Probability</th>
                  <th>Confidence</th>
                  <th>Top Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {predictions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      No predictions yet. Use the Prediction page to run your first analysis.
                    </td>
                  </tr>
                ) : predictions.map((p) => (
                  <>
                    <tr key={p._id} className="cursor-pointer" onClick={() => setExpanded(expanded === p._id ? null : p._id)}>
                      <td className="text-xs text-slate-400">
                        {format(new Date(p.createdAt), "MMM d, yyyy HH:mm")}
                      </td>
                      <td>
                        <span className="text-xs text-primary-400 capitalize font-medium">
                          {p.modelUsed?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td><RiskBadge level={p.riskLevel} /></td>
                      <td className="w-36"><ProbabilityBar value={p.churnProbability} /></td>
                      <td>
                        <span className="font-mono text-xs text-slate-400">
                          {(p.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="max-w-xs">
                        <p className="text-xs text-slate-400 truncate">
                          {p.explanations?.[0]?.message || "—"}
                        </p>
                      </td>
                      <td>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}
                          className="btn-danger btn btn-sm p-1.5">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                    {expanded === p._id && (
                      <tr key={`${p._id}-exp`}>
                        <td colSpan={7} className="bg-dark-900/60 px-6 py-4 animate-slide-up">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Explanations</p>
                              <div className="space-y-2">
                                {p.explanations?.map((exp, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className={clsx("px-1.5 py-0.5 rounded text-[10px] font-bold",
                                      exp.impact === "HIGH" ? "bg-rose-500/20 text-rose-400" : exp.impact === "MEDIUM" ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-400"
                                    )}>{exp.impact}</span>
                                    <span className="text-slate-300">{exp.message}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Recommendations</p>
                              <div className="space-y-2">
                                {p.recommendations?.slice(0, 3).map((rec, i) => (
                                  <div key={i} className="text-xs text-slate-300">
                                    <span className="text-primary-400 font-medium">→ </span>{rec.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-xs text-slate-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1} className="btn-secondary btn btn-sm">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="btn-secondary btn btn-sm">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
