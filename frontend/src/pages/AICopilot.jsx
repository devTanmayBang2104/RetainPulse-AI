import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Bot, User, Trash2, ShieldAlert, BadgeAlert } from "lucide-react";
import { customersAPI, aiAPI } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { clsx } from "clsx";

export default function AICopilot() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your AI Retention Assistant. You can load a subscriber context from the selector above, and I can help you analyze their risk, recommend plan interventions, or write personalized emails."
    }
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Load all customers for context dropdown selector
  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await customersAPI.getAll({ limit: 100 });
        setCustomers(res.customers || []);
      } catch (err) {
        console.error("Failed to fetch customers for chatbot", err);
      } finally {
        setCustomersLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Fetch full profile details when a customer is selected
  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedProfile(null);
      return;
    }

    async function loadProfile() {
      try {
        const profile = await customersAPI.getById(selectedCustomerId);
        setSelectedProfile(profile);
        
        // Add context loaded message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Loaded profile for Customer ID: **${profile.customerId}** (${profile.contract}, ${profile.tenure} mo tenure). Churn risk probability is **${(profile.churnProbability * 100).toFixed(1)}%**. How can I help you retain this customer?`
          }
        ]);
      } catch (err) {
        console.error("Failed to load customer profile context", err);
      }
    }
    loadProfile();
  }, [selectedCustomerId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setChatLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await aiAPI.chat({
        message: input,
        customerProfile: selectedProfile,
        chatHistory: historyPayload
      });

      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to get response from AI. Check backend OpenRouter settings.");
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hello! Context has been cleared. Load a subscriber context above to begin analyzing again."
      }
    ]);
    setSelectedCustomerId("");
    setSelectedProfile(null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-6.5rem)] gap-5 -m-2 overflow-hidden">
      {/* LEFT: Chat Window */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
        {/* Header Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">AI Retention Assistant</h3>
          </div>
          <div className="flex items-center gap-3">
            {customersLoading ? (
              <span className="text-[10px] text-slate-500">Loading portfolio...</span>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 max-w-xs"
              >
                <option value="">-- Select Customer Context --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.customerId} ({c.riskLevel} - {Math.round((c.churnProbability ?? 0) * 100)}%)
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={clearChat}
              className="p-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 rounded-lg transition-colors bg-white dark:bg-slate-900"
              title="Reset Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
          {messages.map((m, idx) => {
            const isBot = m.role === "assistant";
            return (
              <div
                key={idx}
                className={clsx(
                  "flex gap-3 max-w-[85%] items-start animate-slide-up",
                  isBot ? "mr-auto" : "ml-auto flex-row-reverse"
                )}
              >
                <div
                  className={clsx(
                    "w-7 h-7 rounded-full flex items-center justify-center border shrink-0 mt-1",
                    isBot
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-500/20 text-indigo-650 dark:text-indigo-400"
                      : "bg-slate-105 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div
                  className={clsx(
                    "p-3 rounded-2xl text-xs leading-relaxed border shadow-sm",
                    isBot
                      ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300"
                      : "bg-indigo-600 border-indigo-500 text-white"
                  )}
                >
                  <p className="whitespace-pre-line">{m.content}</p>
                </div>
              </div>
            );
          })}
          {chatLoading && (
            <div className="flex gap-3 mr-auto items-start">
              <div className="w-7 h-7 rounded-full flex items-center justify-center border bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-500/20 text-indigo-650 dark:text-indigo-400 mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0 bg-white dark:bg-slate-900">
          <input
            type="text"
            placeholder={
              selectedProfile
                ? `Ask about Customer ${selectedProfile.customerId}...`
                : "Ask a general retention question or load a customer..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={chatLoading}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={chatLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 flex items-center justify-center disabled:opacity-50 transition-colors shadow-md shadow-indigo-600/15"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* RIGHT: Selected Customer Context Panel (Sticky) */}
      {selectedProfile && (
        <div className="w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-4 shrink-0 overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <ShieldAlert className="w-4.5 h-4.5 text-indigo-500" />
            <h4 className="text-xs font-bold text-slate-855 dark:text-slate-200 uppercase tracking-wide">Customer Context</h4>
          </div>

          {/* Core Info */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="text-slate-500">Customer ID</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedProfile.customerId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="text-slate-500">Gender / Senior</span>
              <span className="text-slate-700 dark:text-slate-350">{selectedProfile.gender} / {selectedProfile.seniorCitizen ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="text-slate-500">Contract</span>
              <span className="text-slate-700 dark:text-slate-350 font-semibold">{selectedProfile.contract}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="text-slate-500">Tenure</span>
              <span className="text-slate-700 dark:text-slate-350">{selectedProfile.tenure} months</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="text-slate-500">Monthly Charges</span>
              <span className="text-slate-750 dark:text-slate-300 font-mono font-bold">${selectedProfile.monthlyCharges?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="text-slate-500">Internet Service</span>
              <span className="text-slate-700 dark:text-slate-350">{selectedProfile.internetService}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="text-slate-500">Tech Support</span>
              <span className="text-slate-700 dark:text-slate-350">{selectedProfile.techSupport}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <span className="text-slate-500">Online Security</span>
              <span className="text-slate-700 dark:text-slate-350">{selectedProfile.onlineSecurity}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-slate-500">Payment Method</span>
              <span className="text-slate-700 dark:text-slate-350 text-right truncate max-w-[120px]">{selectedProfile.paymentMethod}</span>
            </div>
          </div>

          {/* Risk Callout */}
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-3 rounded-lg flex items-center gap-2 mt-auto">
            <BadgeAlert className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold tracking-wider leading-none">Churn Risk Status</p>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-1 font-mono">
                {Math.round((selectedProfile.churnProbability ?? 0) * 100)}% ({selectedProfile.riskLevel})
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
