import api from "./api";

// ============================================
// AUTH SERVICE
// ============================================
export const authService = {
  register: async (data: {
    name: string;
    phone: string;
    email: string;
    password: string;
    role?: string;
  }) => api.post("/auth/register", data),

  login: async (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  refresh: async (data: { refreshToken: string }) =>
    api.post("/auth/refresh", data),

  verifyOtp: async (data: { userId?: string; otp?: string }) =>
    api.post("/auth/verify-otp", data),

  logout: async (data?: { refreshToken?: string }) =>
    api.post("/auth/logout", data ?? {}),

  me: async () => api.get("/auth/me"),

  updateFcmToken: async (data: { fcmToken: string }) =>
    api.patch("/auth/fcm-token", data),
};

// ============================================
// SOS SERVICE
// ============================================
export const sosService = {
  // data must be FormData when sending an image, plain object otherwise
  create: async (data: FormData | Record<string, unknown>) =>
    api.post("/sos/create", data, {
      headers:
        data instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : { "Content-Type": "application/json" },
    }),

  nearby: async (params: { lat: number; lng: number; radius?: number }) =>
    api.get("/sos/nearby", { params }),

  myRequests: async () => api.get("/sos/my"),

  getById: async (id: string) => api.get(`/sos/${id}`),

  updateStatus: async (id: string, data: { status: string }) =>
    api.patch(`/sos/${id}/status`, data),
};

// ============================================
// SHELTER SERVICE
// ============================================
export const shelterService = {
  nearby: async (params?: { lat?: number; lng?: number; radius?: number }) =>
    api.get("/shelters/nearby", { params }),

  getById: async (id: string) => api.get(`/shelters/${id}`),

  create: async (data: Record<string, unknown>) =>
    api.post("/shelters", data),

  updateOccupancy: async (id: string, data: { occupied: number }) =>
    api.patch(`/shelters/${id}/occupancy`, data),
};

// ============================================
// ALERT SERVICE
// ============================================
export const alertService = {
  getAll: async () => api.get("/alerts"),

  create: async (data: {
    title: string;
    message: string;
    severity: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }) => api.post("/alerts", data),

  delete: async (id: string) => api.delete(`/alerts/${id}`),
};

// ============================================
// VOLUNTEER SERVICE  (requireAuth + VOLUNTEER/ADMIN)
// ============================================
export const volunteerService = {
  getTasks: async () => api.get("/volunteer/tasks"),

  acceptTask: async (id: string) => api.post(`/volunteer/accept/${id}`),

  completeTask: async (id: string) => api.post(`/volunteer/complete/${id}`),

  updateAvailability: async (data: { isAvailable: boolean }) =>
    api.patch("/volunteer/availability", data),

  getStats: async () => api.get("/volunteer/stats"),
};

// ============================================
// ADMIN SERVICE  (requireAuth + ADMIN)
// ============================================
export const adminService = {
  getAnalytics: async () => api.get("/admin/analytics"),

  getIncidents: async () => api.get("/admin/incidents"),

  getVolunteers: async () => api.get("/admin/volunteers"),

  broadcast: async (data: Record<string, unknown>) =>
    api.post("/admin/broadcast", data),

  getHeatmap: async () => api.get("/admin/heatmap"),
};
