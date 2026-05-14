import api from "./api";

// ============================================
// INCIDENT SERVICE
// ============================================
export const incidentService = {
  getAll: async (params?: { status?: string; severity?: string; page?: number }) =>
    api.get("/incidents", { params }),
  getById: async (id: string) => api.get(`/incidents/${id}`),
  create: async (data: Record<string, unknown>) => api.post("/incidents", data),
  update: async (id: string, data: Record<string, unknown>) => api.patch(`/incidents/${id}`, data),
  delete: async (id: string) => api.delete(`/incidents/${id}`),
  getTimeline: async (id: string) => api.get(`/incidents/${id}/timeline`),
};

// ============================================
// ALERT SERVICE
// ============================================
export const alertService = {
  getAll: async (params?: { severity?: string; status?: string }) =>
    api.get("/alerts", { params }),
  getById: async (id: string) => api.get(`/alerts/${id}`),
  broadcast: async (data: Record<string, unknown>) => api.post("/alerts/broadcast", data),
  dismiss: async (id: string) => api.patch(`/alerts/${id}/dismiss`),
};

// ============================================
// SHELTER SERVICE
// ============================================
export const shelterService = {
  getAll: async (params?: { status?: string; district?: string }) =>
    api.get("/shelters", { params }),
  getNearby: async (params: { latitude: number; longitude: number; radiusKm?: number }) =>
    api.get("/shelters/nearby", { params }),
  getById: async (id: string) => api.get(`/shelters/${id}`),
  create: async (data: Record<string, unknown>) => api.post("/shelters", data),
  update: async (id: string, data: Record<string, unknown>) => api.patch(`/shelters/${id}`, data),
  updateCapacity: async (id: string, data: { current: number }) =>
    api.patch(`/shelters/${id}/capacity`, data),
};

// ============================================
// VOLUNTEER SERVICE
// ============================================
export const volunteerService = {
  getTasks: async () => api.get("/volunteer/tasks"),
  getStats: async () => api.get("/volunteer/stats"),
  accept: async (sosId: string) => api.post(`/volunteer/accept/${sosId}`),
  complete: async (sosId: string) => api.post(`/volunteer/complete/${sosId}`),
  updateAvailability: async (isAvailable: boolean) =>
    api.patch("/volunteer/availability", { isAvailable }),
};

// ============================================
// SOS SERVICE
// ============================================
export const sosService = {
  submit: async (data: Record<string, unknown>) => api.post("/sos/create", data),
  getMyRequests: async () => api.get("/sos/my"),
  getNearby: async (params: { latitude: number; longitude: number; radiusKm?: number }) =>
    api.get("/sos/nearby", { params }),
  getById: async (id: string) => api.get(`/sos/${id}`),
  updateStatus: async (id: string, status: string) => api.patch(`/sos/${id}/status`, { status }),
};

// ============================================
// ANALYTICS SERVICE
// ============================================
export const analyticsService = {
  getDashboard: async () => api.get("/analytics/dashboard"),
  getIncidentTrends: async (params?: { period?: string }) =>
    api.get("/analytics/incidents/trends", { params }),
  getResponseMetrics: async () => api.get("/analytics/response-metrics"),
  getResourceAllocation: async () => api.get("/analytics/resources"),
  exportReport: async (params: { format: string; dateRange?: string }) =>
    api.get("/analytics/export", { params, responseType: "blob" }),
};

// ============================================
// AUTH SERVICE
// ============================================
export const authService = {
  login: async (data: { email: string; password: string }) => api.post("/auth/login", data),
  register: async (data: Record<string, unknown>) => api.post("/auth/register", data),
  verifyOtp: async (data: { email: string; code: string }) => api.post("/auth/verify", data),
  resendOtp: async (email: string) => api.post("/auth/resend-otp", { email }),
  logout: async () => api.post("/auth/logout"),
  getProfile: async () => api.get("/auth/profile"),
  updateProfile: async (data: Record<string, unknown>) => api.patch("/auth/profile", data),
};

// ============================================
// MAP SERVICE
// ============================================
export const mapService = {
  getLive: async () => api.get("/map/live"),
  getShelters: async (params?: { latitude?: number; longitude?: number; radiusKm?: number }) =>
    api.get("/map/shelters", { params }),
  getHeatmapData: async () => api.get("/map/heatmap"),
};
