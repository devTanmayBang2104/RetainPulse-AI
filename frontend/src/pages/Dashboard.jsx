import { useState, useEffect, useCallback } from "react";
import {
  Users, UserCheck, AlertTriangle, TrendingDown,
  DollarSign, Activity, Brain, Calendar
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from "recharts";
import StatCard from "../components/ui/StatCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { dashboardAPI } from "../services/api";

const COLORS = {
  HIGH: "#f43f5e",
  MEDIUM: "#f59e0b",
  LOW: "#10b981",
};

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];

function fmt(num) {
  if (num === null || num === undefined) return "—";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return typeof num === "number" ? num.toLocaleString() : num;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getCharts(),
      ]);
      setStats(s);
      setCharts(c);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const statCards = [
    { title: "Total Customers", value: stats?.totalCustomers?.toLocaleString(), icon: Users, color: "primary" },
    { title: "Active Customers", value: stats?.activeCustomers?.toLocaleString(), icon: UserCheck, color: "success" },
    { title: "High Risk Customers", value: stats?.highRiskCustomers?.toLocaleString(), icon: AlertTriangle, color: "danger" },
    { title: "Revenue At Risk / Month", value: fmt(stats?.revenueAtRisk), icon: DollarSign, color: "warning" },
    { title: "Avg Churn Probability", value: stats ? `${(stats.avgChurnProbability * 100).toFixed(1)}%` : "—", icon: TrendingDown, color: "danger" },
    { title: "Total Predictions", value: stats?.totalPredictions?.toLocaleString(), icon: Brain, color: "purple" },
    { title: "Today's Predictions", value: stats?.todayPredictions?.toLocaleString(), icon: Calendar, color: "info" },
    { title: "Medium Risk", value: stats?.mediumRiskCustomers?.toLocaleString(), icon: Activity, color: "warning" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Churn Distribution Pie */}
        <div className="card">
          <h3 className="section-title">Risk Distribution</h3>
          {charts?.churnDistribution?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={charts.churnDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {charts.churnDistribution.map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.name] || CHART_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [`${v} customers`, name]}
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                />
                <Legend
                  formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No risk data yet. Run predictions to see distribution." />
          )}
        </div>

        {/* Contract Distribution Bar */}
        <div className="card">
          <h3 className="section-title">By Contract Type</h3>
          {charts?.contractDistribution?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.contractDistribution} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No customer data yet." />
          )}
        </div>

        {/* Internet Service Distribution */}
        <div className="card">
          <h3 className="section-title">By Internet Service</h3>
          {charts?.internetDistribution?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.internetDistribution} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No customer data yet." />
          )}
        </div>
      </div>

      {/* Prediction Trend */}
      <div className="card">
        <h3 className="section-title">Prediction Trend — Last 7 Days</h3>
        {charts?.predictionTrend?.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.predictionTrend}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
              <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#grad1)" name="Total" />
              <Area type="monotone" dataKey="highRisk" stroke="#f43f5e" fill="url(#grad2)" name="High Risk" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No predictions made yet. Use the Prediction page to get started." />
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="section-title">Recent Activity</h3>
        {charts?.recentActivity?.length ? (
          <div className="space-y-2">
            {charts.recentActivity.slice(0, 6).map((log, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-t border-slate-200 dark:border-slate-700/40 first:border-t-0">
                <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{formatAction(log.action)}</span>
                <span className="ml-auto text-xs text-slate-500">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No recent activity.</p>
        )}
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <p className="text-slate-500 text-sm text-center max-w-xs">{message}</p>
    </div>
  );
}

function formatAction(action) {
  const map = {
    PREDICTION_MADE: "🤖 New churn prediction completed",
    CUSTOMER_ADDED: "👤 New customer added",
    CUSTOMER_UPDATED: "✏️ Customer record updated",
    CUSTOMER_DELETED: "🗑️ Customer removed",
    REPORT_GENERATED: "📊 Report generated",
  };
  return map[action] || action;
}
