"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Home } from "lucide-react";
import api from "@/services/api";

interface SosPin {
  id: string;
  type: string;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
}

interface ShelterPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  occupied: number;
  capacity: number;
}

function markerPosition(latitude: number, longitude: number) {
  return {
    left: `${Math.min(96, Math.max(4, ((longitude + 180) / 360) * 100))}%`,
    top: `${Math.min(94, Math.max(6, ((90 - latitude) / 180) * 100))}%`
  };
}

export default function LiveMap() {
  const [sosPins, setSosPins] = useState<SosPin[]>([]);
  const [shelters, setShelters] = useState<ShelterPin[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [liveRes, shelterRes] = await Promise.all([
        api.get("/map/live"),
        api.get("/map/shelters")
      ]);
      const liveData = liveRes.data?.data;
      setSosPins(Array.isArray(liveData) ? liveData : liveData?.incidents || []);
      setShelters(shelterRes.data?.data || liveData?.shelters || []);
    }

    fetchData();
    const interval = window.setInterval(fetchData, 30000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-md border border-outline-variant bg-surface-dim">
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(#6750a4 0.5px, transparent 0.5px)", backgroundSize: "32px 32px" }} />
      {shelters.map((shelter) => (
        <div key={shelter.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={markerPosition(shelter.latitude, shelter.longitude)}>
          <div className="grid h-6 w-6 place-items-center rounded-full bg-primary text-on-primary shadow">
            <Home className="h-3.5 w-3.5" />
          </div>
        </div>
      ))}
      {sosPins.map((sos) => (
        <div key={sos.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={markerPosition(sos.latitude, sos.longitude)}>
          <div className="grid h-7 w-7 place-items-center rounded-full bg-error text-on-error shadow">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
