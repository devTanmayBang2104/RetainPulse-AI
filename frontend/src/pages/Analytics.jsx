import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, CartesianGrid
} from "recharts";
import { analyticsAPI } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.get().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading analytics..." />;
  if (!data) return <p className="text-slate-400 text-center py-20">No analytics data available. Seed the database first.</p>;

  const formatLegend = (v) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>;

  return (
    <div className="space-y-5">
      {/* Row 1: Gender + Senior Citizen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ChartCard title="Churn Risk by Gender">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.churnByGender} barSize={24}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend formatter={formatLegend} />
              <Bar dataKey="HIGH" fill="#f43f5e" name="High Risk" radius={[3, 3, 0, 0]} />
              <Bar dataKey="MEDIUM" fill="#f59e0b" name="Medium Risk" radius={[3, 3, 0, 0]} />
              <Bar dataKey="LOW" fill="#10b981" name="Low Risk" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Churn Risk by Senior Citizen">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.churnBySeniorCitizen?.map(d => ({ ...d, name: d.name === "0" ? "Non-Senior" : "Senior" }))} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend formatter={formatLegend} />
              <Bar dataKey="HIGH" fill="#f43f5e" name="High Risk" radius={[3, 3, 0, 0]} />
              <Bar dataKey="MEDIUM" fill="#f59e0b" name="Medium Risk" radius={[3, 3, 0, 0]} />
              <Bar dataKey="LOW" fill="#10b981" name="Low Risk" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Contract + Internet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ChartCard title="Churn Risk by Contract Type">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.churnByContract} barSize={20}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend formatter={formatLegend} />
              <Bar dataKey="HIGH" fill="#f43f5e" name="High Risk" stackId="a" />
              <Bar dataKey="MEDIUM" fill="#f59e0b" name="Medium Risk" stackId="a" />
              <Bar dataKey="LOW" fill="#10b981" name="Low Risk" stackId="a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Churn Risk by Internet Service">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.churnByInternetService} barSize={24}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend formatter={formatLegend} />
              <Bar dataKey="HIGH" fill="#f43f5e" name="High Risk" radius={[3, 3, 0, 0]} />
              <Bar dataKey="MEDIUM" fill="#f59e0b" name="Medium Risk" radius={[3, 3, 0, 0]} />
              <Bar dataKey="LOW" fill="#10b981" name="Low Risk" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Payment Method + Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ChartCard title="Churn Risk by Payment Method">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.churnByPaymentMethod} barSize={16} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "#94a3b8" }} width={130} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend formatter={formatLegend} />
              <Bar dataKey="HIGH" fill="#f43f5e" name="High Risk" />
              <Bar dataKey="MEDIUM" fill="#f59e0b" name="Medium Risk" />
              <Bar dataKey="LOW" fill="#10b981" name="Low Risk" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Revenue by Risk Segment">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.revenueByRisk?.map(r => ({ name: r._id, revenue: Math.round(r.totalRevenue), count: r.count }))} barSize={36}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`$${v.toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" name="Monthly Revenue" radius={[4, 4, 0, 0]}>
                {data.revenueByRisk?.map((entry, i) => (
                  <rect key={i} fill={entry._id === "HIGH" ? "#f43f5e" : entry._id === "MEDIUM" ? "#f59e0b" : "#10b981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Prediction Trend */}
      {data.predictionTrend?.length > 0 && (
        <ChartCard title="Prediction Activity — Last 30 Days">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.predictionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="_id" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend formatter={formatLegend} />
              <Line type="monotone" dataKey="total" stroke="#6366f1" dot={false} strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="high" stroke="#f43f5e" dot={false} strokeWidth={2} name="High Risk" />
              <Line type="monotone" dataKey="medium" stroke="#f59e0b" dot={false} strokeWidth={2} name="Medium Risk" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Insights */}
      <div className="card">
        <h3 className="section-title">📊 Business Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          {[
            { icon: "📋", title: "Contract Effect", text: "Month-to-month customers show 2-3x higher churn risk. Encouraging annual contracts can reduce churn by ~25%." },
            { icon: "💰", title: "High Charges", text: "Customers paying >$70/month are more price-sensitive. Targeted loyalty discounts can retain high-value segments." },
            { icon: "👴", title: "Senior Segment", text: "Senior citizens have higher churn rates. Dedicated support programs improve their satisfaction significantly." },
            { icon: "🌐", title: "Fiber Optic", text: "Fiber customers churn more despite faster speeds — likely due to higher costs. Value reinforcement campaigns help." },
          ].map(({ icon, title, text }) => (
            <div key={title} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/40">
              <p className="font-semibold text-slate-200 mb-1">{icon} {title}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="card">
      <h3 className="section-title">{title}</h3>
      {children}
    </div>
  );
}
