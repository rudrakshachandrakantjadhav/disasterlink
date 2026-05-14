"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  Activity,
  AlertTriangle,
  Home,
  Users,
  BarChart3,
  LayoutDashboard,
  Siren,
  Radio,
  FileText,
  Map,
  UserCircle,
  ClipboardList,
  Navigation,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/store/notification-store";
import { useAuthStore } from "@/store/auth-store";
import { ROLE_LABELS, ROLE_BADGE_COLORS } from "@/lib/permissions";
import type { NavItem } from "@/types";
import { useRouter } from "next/navigation";

const iconMap: Record<string, React.ElementType> = {
  Activity,
  AlertTriangle,
  Home,
  Users,
  BarChart3,
  LayoutDashboard,
  Siren,
  Radio,
  FileText,
  Map,
  UserCircle,
  Bell,
  ClipboardList,
  Navigation,
  Shield,
};

interface SidebarProps {
  navItems: NavItem[];
  title: string;
  subtitle?: string;
}

export function Sidebar({ navItems, title, subtitle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar, unreadCount } = useNotificationStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed top-0 left-0 h-screen border-r border-outline-variant bg-surface-container-low z-40 transition-all duration-300",
          sidebarOpen ? "w-[280px]" : "w-[72px]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-outline-variant bg-primary-container">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <Image src="/logo.png" alt="DisasterLink Logo" width={36} height={36} className="shrink-0 object-contain" />
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold tracking-wide text-on-primary truncate">
                  DISASTERLINK
                </span>
                <span className="text-[10px] text-on-primary/60 tracking-wider uppercase truncate">
                  {subtitle || "NEMA"}
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded text-on-primary/70 hover:bg-on-primary/10 transition-colors"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Section Title */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-outline-variant">
            <p className="text-label-caps text-on-surface-variant">{title}</p>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2" aria-label={title}>
          {navItems.map((item) => {
            const isActive =
              item.href === pathname ||
              (item.href !== "/" &&
                item.href !== "/admin" &&
                item.href !== "/dashboard" &&
                item.href !== "/volunteer" &&
                pathname.startsWith(item.href));
            const exactActive = item.href === pathname;
            const Icon = item.icon ? iconMap[item.icon] : Activity;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors mb-0.5",
                  exactActive || isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                )}
                title={!sidebarOpen ? item.title : undefined}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      exactActive || isActive
                        ? "text-primary"
                        : "text-on-surface-variant"
                    )}
                  />
                )}
                {sidebarOpen && <span className="truncate">{item.title}</span>}
                {sidebarOpen && item.badge && item.badge > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[11px] font-bold text-on-error">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-outline-variant p-2 space-y-1">

          {user && sidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2 border-t border-outline-variant mt-1 pt-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary text-xs font-bold">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-on-surface truncate">
                  {user.name}
                </p>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${ROLE_BADGE_COLORS[user.role]?.bg || ''} ${ROLE_BADGE_COLORS[user.role]?.text || ''}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] flex lg:hidden items-stretch border-t border-outline-variant bg-surface-container-lowest pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.08)] h-[72px]">
        {navItems.slice(0, 5).map((item) => {
          const isActive =
            item.href === pathname ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon ? iconMap[item.icon] : Activity;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center relative transition-all duration-200 active:scale-95"
            >
              <div className={cn(
                "flex items-center justify-center w-12 h-8 rounded-full mb-1 transition-all duration-300",
                isActive 
                  ? "bg-primary text-on-primary shadow-sm" 
                  : "text-on-surface-variant hover:bg-on-surface/5"
              )}>
                {Icon && <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />}
              </div>
              <span className={cn(
                "text-[10px] font-bold tracking-tight leading-tight text-center px-1 max-w-[80px] line-clamp-2",
                isActive ? "text-primary" : "text-on-surface-variant"
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
