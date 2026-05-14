"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, MapPin, Radio, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { volunteerService } from "@/services";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";

interface ApiEnvelope<T> {
  data: T;
}

interface VolunteerTask {
  id: string;
  type: string;
  severity: string;
  status: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  user?: {
    name?: string;
    phone?: string;
  };
}

function priorityClass(severity: string) {
  const normalized = severity.toLowerCase();
  if (normalized === "critical" || normalized === "high") return "bg-error-container text-on-error-container";
  if (normalized === "medium") return "bg-tertiary-container text-on-tertiary-container";
  return "bg-surface-container-high text-on-surface-variant";
}

function statusClass(status: string) {
  if (status === "RESOLVED") return "bg-surface-container-high text-outline";
  if (status === "ASSIGNED" || status === "IN_PROGRESS") return "bg-primary text-on-primary";
  return "bg-tertiary-container text-on-tertiary-container";
}

export default function VolunteerTasksPage() {
  const { on, isConnected } = useSocket();
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [incoming, setIncoming] = useState<VolunteerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const response = await volunteerService.getTasks();
      setTasks((response.data as ApiEnvelope<VolunteerTask[]>).data || []);
    } catch {
      setError("Volunteer tasks could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const offNewSos = on<VolunteerTask>("new-sos", (payload) => {
      setIncoming((current) => [payload, ...current.filter((task) => task.id !== payload.id)].slice(0, 5));
      toast.warning("New SOS nearby", {
        description: `${payload.type} request marked ${payload.severity}`
      });
    });

    const offAssigned = on("volunteer-assigned", () => {
      loadTasks();
    });

    const offStatus = on("sos-status-update", () => {
      loadTasks();
    });

    return () => {
      offNewSos();
      offAssigned();
      offStatus();
    };
  }, [loadTasks, on]);

  const stats = useMemo(() => {
    const active = tasks.filter((task) => task.status === "ASSIGNED" || task.status === "IN_PROGRESS").length;
    const pending = incoming.length;
    const completed = tasks.filter((task) => task.status === "RESOLVED").length;
    return { total: tasks.length + incoming.length, active, pending, completed };
  }, [incoming.length, tasks]);

  const acceptTask = async (taskId: string) => {
    setBusyId(taskId);
    try {
      await volunteerService.accept(taskId);
      setIncoming((current) => current.filter((task) => task.id !== taskId));
      await loadTasks();
      toast.success("Task accepted");
    } catch {
      toast.error("Could not accept task");
    } finally {
      setBusyId(null);
    }
  };

  const completeTask = async (taskId: string) => {
    setBusyId(taskId);
    try {
      await volunteerService.complete(taskId);
      await loadTasks();
      toast.success("Task completed");
    } catch {
      toast.error("Could not complete task");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="flex-grow max-w-[1440px] mx-auto w-full px-4 md:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-display-lg text-primary">Task Assignments</h1>
          <p className="text-body-base text-on-surface-variant">Live assignments and nearby SOS requests from dispatch.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-label-caps px-3 py-2 rounded-md", isConnected ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant")}>
            {isConnected ? "SOCKET LIVE" : "SOCKET OFFLINE"}
          </span>
          <button
            onClick={loadTasks}
            className="bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-md text-label-caps hover:bg-surface-container-highest transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-md"><p className="text-label-caps text-on-surface-variant">TOTAL TASKS</p><p className="text-headline-md font-mono text-primary">{stats.total}</p></div>
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-md"><p className="text-label-caps text-on-surface-variant">ACTIVE</p><p className="text-headline-md font-mono text-primary">{stats.active}</p></div>
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-md"><p className="text-label-caps text-on-surface-variant">INCOMING</p><p className="text-headline-md font-mono text-tertiary">{stats.pending}</p></div>
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-md"><p className="text-label-caps text-on-surface-variant">COMPLETED</p><p className="text-headline-md font-mono text-outline">{stats.completed}</p></div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-error/30 bg-error-container p-3 text-body-sm text-on-error-container">
          {error}
        </div>
      )}

      {incoming.length > 0 && (
        <section className="mb-6">
          <h2 className="text-title-sm text-on-surface mb-3 flex items-center gap-2">
            <Radio className="h-5 w-5 text-error" />
            Incoming SOS
          </h2>
          <div className="space-y-3">
            {incoming.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                actionLabel="Accept"
                disabled={busyId === task.id}
                onAction={() => acceptTask(task.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-title-sm text-on-surface mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Assigned Tasks
        </h2>
        <div className="space-y-4">
          {isLoading && <div className="text-body-sm text-on-surface-variant">Loading tasks...</div>}
          {!isLoading && tasks.length === 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-6 text-body-sm text-on-surface-variant">
              No assigned tasks yet. New SOS requests will appear here when dispatch assigns them or when a live request arrives.
            </div>
          )}
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              actionLabel="Complete"
              disabled={busyId === task.id || task.status === "RESOLVED"}
              onAction={() => completeTask(task.id)}
            />
          ))}
        </div>
      </section>

      <div className="mt-6">
        <Link href="/volunteer" className="text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1 text-body-sm">
          Back to Volunteer Hub
        </Link>
      </div>
    </main>
  );
}

function TaskCard({
  task,
  actionLabel,
  disabled,
  onAction
}: {
  task: VolunteerTask;
  actionLabel: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  return (
    <div className={cn("bg-surface-container-lowest border border-outline-variant rounded-md p-6 hover:shadow-md transition-shadow", task.status === "RESOLVED" && "opacity-60")}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn("text-label-caps px-2 py-1 rounded", priorityClass(task.severity))}>{task.severity}</span>
          <span className={cn("text-label-caps px-2 py-1 rounded", statusClass(task.status))}>{task.status.replaceAll("_", " ")}</span>
          <span className="text-mono-data text-on-surface-variant">{task.id.slice(0, 8)}</span>
        </div>
        <span className="text-mono-data text-on-surface-variant">{new Date(task.createdAt).toLocaleString()}</span>
      </div>
      <h3 className="text-title-sm text-on-surface mb-1">{task.type} SOS</h3>
      <p className="text-body-sm text-on-surface-variant mb-3">{task.description || "No description provided."}</p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 text-body-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {task.latitude.toFixed(4)}, {task.longitude.toFixed(4)}
          </span>
          {task.user?.name && <span>Requester: {task.user.name}</span>}
        </div>
        <button
          onClick={onAction}
          disabled={disabled}
          className="bg-primary text-on-primary px-4 py-2 rounded-md text-label-caps hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
