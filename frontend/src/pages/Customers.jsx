import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Search, RefreshCw, Filter, ChevronLeft, ChevronRight, 
  Brain, AlertTriangle, CheckCircle, Shield, TrendingDown, 
  TrendingUp, Sparkles, Key, Copy, ChevronDown, ChevronUp, Users, Info, Mail, Award, AlertOctagon,
  Send, Bot, User, Trash2
} from "lucide-react";
import { customersAPI, predictionsAPI, aiAPI } from "../services/api";
import { RiskBadge } from "../components/ui/Badge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { clsx } from "clsx";

const FILTERS = {
  riskLevel: ["HIGH", "MEDIUM", "LOW"],
  contract: ["Month-to-month", "One year", "Two year"],
  internetService: ["DSL", "Fiber optic", "No"],
};

export default function Customers() {
  // Customer list state
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const searchTimeout = useRef(null);

  // Selected customer profile & simulation state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [simProfile, setSimProfile] = useState(null);
  const [baselineProb, setBaselineProb] = useState(null);
  const [currentProb, setCurrentProb] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // AI Co-Pilot state
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModel, setAiModel] = useState("meta-llama/llama-3.1-8b-instruct");
  const [showCopilot, setShowCopilot] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch customers
  const loadCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await customersAPI.getAll({
        page,
        limit: pagination.limit,
        search,
        ...filters,
      });
      setCustomers(data.customers || []);
      setPagination((p) => ({ ...p, ...data.pagination, page }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filters, pagination.limit]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadCustomers(1), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search, filters, loadCustomers]);

  // Select customer and initialize simulator
  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setAiResult(null);
    setShowCopilot(false);
    setChatMessages([]);
    setChatInput("");
    
    // Construct simulation profile
    const profile = {
      gender: customer.gender,
      SeniorCitizen: customer.seniorCitizen ?? 0,
      Partner: customer.partner || "No",
      Dependents: customer.dependents || "No",
      tenure: customer.tenure ?? 12,
      PhoneService: customer.phoneService || "Yes",
      MultipleLines: customer.multipleLines || "No",
      InternetService: customer.internetService || "DSL",
      OnlineSecurity: customer.onlineSecurity || "No",
      OnlineBackup: customer.onlineBackup || "No",
      DeviceProtection: customer.deviceProtection || "No",
      TechSupport: customer.techSupport || "No",
      StreamingTV: customer.streamingTV || "No",
      StreamingMovies: customer.streamingMovies || "No",
      Contract: customer.contract || "Month-to-month",
      PaperlessBilling: customer.paperlessBilling || "No",
      PaymentMethod: customer.paymentMethod || "Electronic check",
      MonthlyCharges: customer.monthlyCharges ?? 50.0,
      TotalCharges: (customer.totalCharges ?? (customer.monthlyCharges * customer.tenure)) || 50.0,
      model: "random_forest"
    };

    setSimProfile(profile);
    setSimLoading(true);
    try {
      const res = await predictionsAPI.predict(profile);
      setBaselineProb(res.churn_probability);
      setCurrentProb(res.churn_probability);
    } catch (err) {
      console.error("Baseline prediction failed", err);
    } finally {
      setSimLoading(false);
    }
  };

  // Run live simulation on parameter change
  const handleSimChange = async (field, value) => {
    if (!simProfile) return;
    
    const updatedProfile = { ...simProfile, [field]: value };
    
    // Auto-update TotalCharges if tenure or monthly charges change
    if (field === "tenure" || field === "MonthlyCharges") {
      updatedProfile.TotalCharges = +(updatedProfile.tenure * updatedProfile.MonthlyCharges).toFixed(2);
    }

    setSimProfile(updatedProfile);
    setSimLoading(true);
    try {
      const res = await predictionsAPI.predict(updatedProfile);
      setCurrentProb(res.churn_probability);
    } catch (err) {
      console.error("Live simulation failed", err);
    } finally {
      setSimLoading(false);
    }
  };

  // Run Generative AI Retention Strategy
  const handleRunAICopilot = async () => {
    if (!selectedCustomer) return;
    
    setAiLoading(true);
    setAiResult(null);
    setShowCopilot(true);
    setChatMessages([]);

    try {
      const payload = {
        customerProfile: {
          customerId: selectedCustomer.customerId,
          gender: selectedCustomer.gender,
          seniorCitizen: selectedCustomer.seniorCitizen,
          partner: selectedCustomer.partner,
          dependents: selectedCustomer.dependents,
          tenure: simProfile?.tenure ?? selectedCustomer.tenure,
          contract: simProfile?.Contract ?? selectedCustomer.contract,
          monthlyCharges: simProfile?.MonthlyCharges ?? selectedCustomer.monthlyCharges,
          internetService: simProfile?.InternetService ?? selectedCustomer.internetService,
          onlineSecurity: simProfile?.OnlineSecurity ?? selectedCustomer.onlineSecurity,
          techSupport: simProfile?.TechSupport ?? selectedCustomer.techSupport,
          paymentMethod: simProfile?.PaymentMethod ?? selectedCustomer.paymentMethod,
        },
        prediction: {
          churn_probability: currentProb ?? selectedCustomer.churnProbability,
          risk_level: (currentProb ?? selectedCustomer.churnProbability) >= 0.7 
            ? "HIGH" 
            : (currentProb ?? selectedCustomer.churnProbability) >= 0.4 
            ? "MEDIUM" 
            : "LOW"
        },
        model: aiModel
      };

      const res = await aiAPI.generateStrategy(payload);
      setAiResult(res);
      
      const initialMessage = {
        role: "assistant",
        content: `### 🔍 Executive Risk Analysis\n${res.riskAnalysis}\n\n### ✉️ Personalized Outreach Template\n${res.retentionEmail}\n\n### 📋 Agent Action Plan\n${res.actionPlan.map((step, idx) => `${idx + 1}. ${step}`).join("\n")}`
      };
      setChatMessages([initialMessage]);
      toast.success("AI Strategy generated & chat session initialized!");
    } catch (err) {
      console.error("AI Strategy failed", err);
      toast.error("Failed to generate strategy. Make sure OpenRouter is configured in the backend env.");
    } finally {
      setAiLoading(false);
    }
  };

  // Send message inside customer detail chat
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !selectedCustomer) return;

    const userMsg = { role: "user", content: chatInput };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    const textToSend = chatInput;
    setChatInput("");
    setChatLoading(true);

    try {
      const historyPayload = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await aiAPI.chat({
        message: textToSend,
        customerProfile: {
          customerId: selectedCustomer.customerId,
          gender: selectedCustomer.gender,
          seniorCitizen: selectedCustomer.seniorCitizen,
          partner: selectedCustomer.partner,
          dependents: selectedCustomer.dependents,
          tenure: simProfile?.tenure ?? selectedCustomer.tenure,
          contract: simProfile?.Contract ?? selectedCustomer.contract,
          monthlyCharges: simProfile?.MonthlyCharges ?? selectedCustomer.monthlyCharges,
          internetService: simProfile?.InternetService ?? selectedCustomer.internetService,
          onlineSecurity: simProfile?.OnlineSecurity ?? selectedCustomer.onlineSecurity,
          techSupport: simProfile?.TechSupport ?? selectedCustomer.techSupport,
          paymentMethod: simProfile?.PaymentMethod ?? selectedCustomer.paymentMethod,
          riskLevel: (currentProb ?? selectedCustomer.churnProbability) >= 0.7 ? "HIGH" : (currentProb ?? selectedCustomer.churnProbability) >= 0.4 ? "MEDIUM" : "LOW",
          churnProbability: currentProb ?? selectedCustomer.churnProbability,
        },
        chatHistory: historyPayload
      });

      setChatMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to get chat response. Check backend OpenRouter settings.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleOpenDirectChat = () => {
    if (!selectedCustomer) return;
    setShowCopilot(true);
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          role: "assistant",
          content: `Hi! I have loaded the live context for Customer **${selectedCustomer.customerId}** (${simProfile?.Contract || selectedCustomer.contract}, ${simProfile?.tenure || selectedCustomer.tenure} mo tenure). 

How can I help you retain this customer today? You can ask me to draft emails, propose discount structures, or analyze specific risk parameters.`
        }
      ]);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((f) => {
      const updated = { ...f };
      if (updated[key] === value) delete updated[key];
      else updated[key] = value;
      return updated;
    });
  };

  // SVG Gauge calculations
  const renderGauge = (prob) => {
    const pct = Math.round((prob ?? 0) * 100);
    const color = pct >= 70 ? "#f43f5e" : pct >= 40 ? "#f59e0b" : "#10b981";
    const label = pct >= 70 ? "HIGH RISK" : pct >= 40 ? "MEDIUM RISK" : "LOW RISK";

    const r = 55;
    const cx = 80;
    const cy = 80;
    const startAngle = -210;
    const totalDeg = 240;
    const angle = startAngle + (pct / 100) * totalDeg;
    const toRad = (deg) => (deg * Math.PI) / 180;
    
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(angle));
    const y2 = cy + r * Math.sin(toRad(angle));
    const large = angle - startAngle > 180 ? 1 : 0;
    
    const arcPath = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;

    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 160 120" className="w-40 h-32">
          {/* Background arc */}
          <path d={`M ${cx + r * Math.cos(toRad(-210))} ${cy + r * Math.sin(toRad(-210))} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(toRad(30))} ${cy + r * Math.sin(toRad(30))}`} fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
          {/* Active arc */}
          {pct > 0 && (
            <path d={arcPath} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" className="transition-all duration-500 ease-out" />
          )}
          {/* Text */}
          <text x={cx} y={cy - 2} textAnchor="middle" fill={color} fontSize="22" fontWeight="bold" fontFamily="monospace">
            {pct}%
          </text>
          <text x={cx} y={cy + 15} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">
            {label}
          </text>
        </svg>
      </div>
    );
  };

  // Get live risk drivers
  const getRiskDrivers = () => {
    if (!simProfile) return [];
    const drivers = [];
    
    // High-risk factors
    if (simProfile.Contract === "Month-to-month") {
      drivers.push({ name: "Month-to-month contract", impact: "+17%", isRisk: true, val: 80 });
    }
    if (simProfile.tenure <= 6) {
      drivers.push({ name: `Low tenure (${simProfile.tenure} mos)`, impact: "+15%", isRisk: true, val: 70 });
    }
    if (simProfile.MonthlyCharges >= 80) {
      drivers.push({ name: `High Monthly Charges ($${simProfile.MonthlyCharges})`, impact: "+12%", isRisk: true, val: 55 });
    }
    if (simProfile.InternetService === "Fiber optic") {
      drivers.push({ name: "Fiber optic connection", impact: "+10%", isRisk: true, val: 45 });
    }
    if (simProfile.OnlineSecurity === "No") {
      drivers.push({ name: "No Online Security service", impact: "+8%", isRisk: true, val: 35 });
    }
    if (simProfile.TechSupport === "No") {
      drivers.push({ name: "No Technical Support service", impact: "+7%", isRisk: true, val: 30 });
    }

    // Beneficial factors
    if (simProfile.Contract === "Two year" || simProfile.Contract === "One year") {
      drivers.push({ name: "Long-term contract lock-in", impact: "-25%", isRisk: false, val: 90 });
    }
    if (simProfile.PaymentMethod.includes("automatic")) {
      drivers.push({ name: "Automatic payment active", impact: "-10%", isRisk: false, val: 45 });
    }
    if (simProfile.tenure > 24) {
      drivers.push({ name: `High tenure loyalty (${simProfile.tenure} mos)`, impact: "-15%", isRisk: false, val: 65 });
    }

    return drivers.sort((a, b) => b.val - a.val).slice(0, 3);
  };

  const currentDrivers = getRiskDrivers();
  const deltaVal = currentProb !== null && baselineProb !== null ? Math.round((currentProb - baselineProb) * 100) : 0;

  return (
    <div className="flex h-[calc(100vh-6.5rem)] overflow-hidden gap-5 -m-2">
      {/* LEFT: Customer List Panel (Portfolio) */}
      <div className="w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col h-full shrink-0 overflow-hidden">
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-250">Customer Portfolio</h3>
            <button onClick={() => loadCustomers(pagination.page)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-250 transition-colors p-1" title="Refresh list">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search Customer ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all duration-150",
                showFilters || Object.keys(filters).length > 0
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700"
              )}
            >
              <Filter className="w-3 h-3" /> Filters
              {Object.keys(filters).length > 0 && (
                <span className="ml-0.5 bg-indigo-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-850 space-y-3 text-[11px] animate-slide-up">
              {Object.entries(FILTERS).map(([key, options]) => (
                <div key={key} className="space-y-1">
                  <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px]">{key.replace(/([A-Z])/g, " $1")}</p>
                  <div className="flex flex-wrap gap-1">
                    {options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleFilterChange(key, opt)}
                        className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-medium border transition-colors",
                          filters[key] === opt
                            ? "bg-indigo-600/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/50">
          {loading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner text="" /></div>
          ) : customers.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-550">No customers found.</p>
          ) : (
            customers.map((c) => {
              const isSelected = selectedCustomer?._id === c._id;
              return (
                <button
                  key={c._id}
                  onClick={() => handleSelectCustomer(c)}
                  className={clsx(
                    "w-full text-left p-3 flex items-center justify-between border-l-2 transition-all duration-150",
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500"
                      : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  )}
                >
                  <div className="min-w-0">
                    <p className={clsx("text-xs font-mono font-bold leading-none", isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-slate-300")}>
                      {c.customerId}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                      {c.contract} • {c.tenure}mo • ${c.monthlyCharges?.toFixed(1)}
                    </p>
                  </div>
                  <RiskBadge level={c.riskLevel} />
                </button>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950 text-[10px] text-slate-500 dark:text-slate-500">
            <span>Page {pagination.page} / {pagination.totalPages}</span>
            <div className="flex gap-1">
              <button
                onClick={() => loadCustomers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-850"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => loadCustomers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-850"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Detail & Simulation Dashboard */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col h-full overflow-y-auto p-5 no-scrollbar">
        {!selectedCustomer ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700/30">
              <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350">No Customer Selected</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Select a subscriber from the portfolio panel on the left to view active risk profile metrics, run live predictions, and build outreach strategies.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Header Information */}
            <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4 flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Customer Risk Profile</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                    ID: {selectedCustomer.customerId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {selectedCustomer.gender} • Senior: {selectedCustomer.seniorCitizen ? "Yes" : "No"} • Partner: {selectedCustomer.partner} • Dependents: {selectedCustomer.dependents}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunAICopilot}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 transition-all duration-150"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Run AI Retention Strategy
                </button>
                <button
                  onClick={handleOpenDirectChat}
                  className="bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all duration-150 border border-slate-200 dark:border-slate-700"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Retention Chat
                </button>
              </div>
            </div>

            {/* 2. Top Half: Gauge & Primary Drivers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Churn Risk Gauge Card */}
              <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-3 left-4 flex items-center gap-1 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  <Info className="w-3 h-3" /> Live Churn Risk
                </div>
                {simLoading ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {renderGauge(currentProb)}
                    
                    {/* Delta indicator */}
                    {deltaVal !== 0 && (
                      <div className={clsx(
                        "flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border mt-2",
                        deltaVal < 0
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                      )}>
                        {deltaVal < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        {deltaVal > 0 ? "+" : ""}{deltaVal}pp from baseline
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drivers Card */}
              <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Primary Risk / Benefit Drivers</h4>
                  <div className="space-y-3">
                    {currentDrivers.map((d, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-slate-700 dark:text-slate-300">{d.name}</span>
                          <span className={d.isRisk ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                            {d.impact}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={clsx("h-full rounded-full transition-all duration-500", d.isRisk ? "bg-rose-500" : "bg-emerald-500")}
                            style={{ width: `${d.val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic mt-3">
                  Drivers update dynamically as simulator features change.
                </p>
              </div>
            </div>

            {/* 3. Generative AI Retention Chat Panel */}
            {showCopilot && (
              <div className="bg-indigo-950/5 dark:bg-indigo-950/15 border border-indigo-500/20 rounded-xl p-4 space-y-4 animate-slide-up">
                <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">AI Customer Retention Chat</h3>
                  </div>
                  <button 
                    onClick={() => { setChatMessages([]); setShowCopilot(false); }} 
                    className="text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium"
                  >
                    Clear & Close
                  </button>
                </div>

                {aiLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400">Synthesizing personalized outreach plan & strategy...</p>
                  </div>
                ) : chatMessages.length > 0 ? (
                  <div className="space-y-4">
                    {/* Chat Feed */}
                    <div className="space-y-3 max-h-96 overflow-y-auto p-2 bg-slate-50/50 dark:bg-slate-950/20 rounded-lg border border-slate-200 dark:border-slate-800">
                      {chatMessages.map((m, idx) => {
                        const isBot = m.role === "assistant";
                        return (
                          <div key={idx} className={clsx("flex gap-2 max-w-[90%] items-start", isBot ? "mr-auto" : "ml-auto flex-row-reverse")}>
                            <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center border shrink-0 text-[10px]", isBot ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-150 text-indigo-600 dark:text-indigo-400" : "bg-slate-105 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350")}>
                              {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            </div>
                            <div className={clsx("p-2.5 rounded-xl text-[11px] leading-relaxed border shadow-sm whitespace-pre-wrap", isBot ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-300" : "bg-indigo-600 border-indigo-550 text-white")}>
                              <div className="markdown-chat">
                                {m.content}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {chatLoading && (
                        <div className="flex gap-2 mr-auto items-start">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center border bg-indigo-50 dark:bg-indigo-950/30 border-indigo-150 text-indigo-600 dark:text-indigo-400 text-[10px] shrink-0">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-1">
                            <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" />
                            <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input Bar */}
                    <form onSubmit={handleSendChat} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Chat about Customer ${selectedCustomer.customerId}...`}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={chatLoading}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                      <button type="submit" disabled={chatLoading || !chatInput.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 flex items-center justify-center disabled:opacity-50 transition-colors">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 text-center py-4">Click "Run AI Retention Strategy" to initialize the retention strategy chat session.</p>
                )}
              </div>
            )}

            {/* 4. What-If Retention Simulator */}
            {simProfile && (
              <div className="border-t border-slate-200 dark:border-slate-800/80 pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-750 dark:text-slate-200 uppercase tracking-widest">"What-If" Retention Simulator</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 text-[11px]">
                  {/* ML Model Selector */}
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-450 font-medium">Predictive ML Model</label>
                    <select
                      value={simProfile.model}
                      onChange={(e) => handleSimChange("model", e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="random_forest">Random Forest (Primary)</option>
                      <option value="logistic_regression">Logistic Regression</option>
                      <option value="xgboost">XGBoost</option>
                    </select>
                  </div>

                  {/* Tenure Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-500 dark:text-slate-450 font-medium">
                      <span>Tenure (Months)</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{simProfile.tenure} mo</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="72"
                      value={simProfile.tenure}
                      onChange={(e) => handleSimChange("tenure", parseInt(e.target.value))}
                      className="w-full accent-indigo-500 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Monthly Charges Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-500 dark:text-slate-450 font-medium">
                      <span>Monthly Charges</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">${simProfile.MonthlyCharges}</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="200"
                      step="0.5"
                      value={simProfile.MonthlyCharges}
                      onChange={(e) => handleSimChange("MonthlyCharges", parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Contract Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-450 font-medium">Contract Type</label>
                    <select
                      value={simProfile.Contract}
                      onChange={(e) => handleSimChange("Contract", e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Month-to-month">Month-to-month</option>
                      <option value="One year">One year</option>
                      <option value="Two year">Two year</option>
                    </select>
                  </div>

                  {/* Internet Service Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-450 font-medium">Internet Service</label>
                    <select
                      value={simProfile.InternetService}
                      onChange={(e) => handleSimChange("InternetService", e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="DSL">DSL</option>
                      <option value="Fiber optic">Fiber optic</option>
                      <option value="No">No Service</option>
                    </select>
                  </div>

                  {/* Tech Support */}
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-450 font-medium">Tech Support</label>
                    <select
                      value={simProfile.TechSupport}
                      onChange={(e) => handleSimChange("TechSupport", e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="No internet service">No Internet Service</option>
                    </select>
                  </div>

                  {/* Online Security */}
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-450 font-medium">Online Security</label>
                    <select
                      value={simProfile.OnlineSecurity}
                      onChange={(e) => handleSimChange("OnlineSecurity", e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="No internet service">No Internet Service</option>
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-slate-500 dark:text-slate-450 font-medium">Payment Method</label>
                    <select
                      value={simProfile.PaymentMethod}
                      onChange={(e) => handleSimChange("PaymentMethod", e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Electronic check">Electronic check</option>
                      <option value="Mailed check">Mailed check</option>
                      <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                      <option value="Credit card (automatic)">Credit card (automatic)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
