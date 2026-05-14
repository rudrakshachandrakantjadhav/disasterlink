import type { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/response.js";
import { hasAnyPermission } from "../modules/permissions/rbac.js";

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const allowed = roles.map((role) => role.toLowerCase());
    if (!req.user || !req.user.roles.some((role) => allowed.includes(role.toLowerCase()))) {
      return sendError(res, "Forbidden", 403);
    }

    return next();
  };
}

export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !hasAnyPermission(req.user, permissions)) {
      return sendError(res, `Missing required permission: ${permissions.join(" or ")}`, 403);
    }

    return next();
  };
}

export function requireHierarchy(minimumLevel: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.hierarchyLevel < minimumLevel) {
      return sendError(res, `Insufficient role hierarchy. Minimum level: ${minimumLevel}`, 403);
    }

    return next();
  };
}

export function requireScope(...scopes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !scopes.includes(req.user.accessScope)) {
      return sendError(res, `Insufficient geographic access scope: ${scopes.join(" or ")}`, 403);
    }

    return next();
  };
}
