import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      "Something went wrong";
    
    if (error.code !== "ERR_CANCELED") {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

// ─── Dashboard ───────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getCharts: () => api.get("/dashboard/charts"),
};

// ─── Customers ───────────────────────────────────────────────
export const customersAPI = {
  getAll: (params) => api.get("/customers", { params }),
  getById: (id) => api.get(`/customers/${id}`),
  getHighRisk: () => api.get("/customers/high-risk"),
  create: (data) => api.post("/customers", data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// ─── Predictions ─────────────────────────────────────────────
export const predictionsAPI = {
  predict: (data) => api.post("/predictions/predict", data),
  simulate: (data) => api.post("/predictions/simulate", data),
  getHistory: (params) => api.get("/predictions/history", { params }),
  getById: (id) => api.get(`/predictions/${id}`),
  getStats: () => api.get("/predictions/stats"),
  delete: (id) => api.delete(`/predictions/${id}`),
};

// ─── Analytics ───────────────────────────────────────────────
export const analyticsAPI = {
  get: () => api.get("/analytics"),
};

// ─── Reports ─────────────────────────────────────────────────
export const reportsAPI = {
  getSummary: () => api.get("/reports/summary"),
  exportPredictions: (params) =>
    api.get("/reports/export/predictions", {
      params,
      responseType: "blob",
    }),
  exportCustomers: (params) =>
    api.get("/reports/export/customers", {
      params,
      responseType: "blob",
    }),
};

// ─── AI Co-Pilot ──────────────────────────────────────────────
export const aiAPI = {
  generateStrategy: (data) => api.post("/ai/retention-strategy", data),
  chat: (data) => api.post("/ai/chat", data),
  getModels: () => api.get("/ai/models"),
};

export default api;
