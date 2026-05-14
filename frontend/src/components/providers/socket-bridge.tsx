"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";

interface EmergencyAlert {
  title?: string;
  message?: string;
}

export function SocketBridge() {
  const { on } = useSocket();

  useEffect(() => {
    const offEmergency = on<EmergencyAlert>("emergency-alert", (payload) => {
      toast.warning(payload.title || "Emergency alert", {
        description: payload.message
      });
    });

    const offAssigned = on<{ sosId?: string }>("volunteer-assigned", (payload) => {
      toast.success("Volunteer assigned", {
        description: payload.sosId ? `SOS ${payload.sosId} has a responder.` : undefined
      });
    });

    const offStatus = on<{ sosId?: string; status?: string }>("sos-status-update", (payload) => {
      toast.info("SOS status updated", {
        description: [payload.sosId, payload.status].filter(Boolean).join(" - ") || undefined
      });
    });

    return () => {
      offEmergency();
      offAssigned();
      offStatus();
    };
  }, [on]);

  return null;
}
