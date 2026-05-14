import type { User } from "@/types";

export interface ManagedUser extends User {
  status: "active" | "suspended" | "pending";
  lastLogin?: string;
}

// Static credential authentication was removed. The users page now starts empty
// until it is wired to the live user-control API.
export const MANAGED_USERS: ManagedUser[] = [];
