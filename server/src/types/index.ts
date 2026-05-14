import type { ResolvedAccess } from "../modules/permissions/rbac.js";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  roles: string[];
  permissions: string[];
  hierarchyLevel: number;
  accessScope: string;
  dashboards: string[];
  modules: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      access?: ResolvedAccess;
    }
  }
}
