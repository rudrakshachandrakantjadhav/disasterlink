"use client";

import { useEffect, useMemo, useState } from "react";
import { connectSocket, disconnectSocket, getSocket, type ServerToClientEvent } from "@/lib/socket";
import { useAuthStore } from "@/store/auth-store";

export function useSocket() {
  const { user, role, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsConnected(false);
      return;
    }

    const socket = connectSocket({ id: user.id, role });
    if (!socket) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [isAuthenticated, role, user]);

  const api = useMemo(() => {
    const socket = getSocket();
    return {
      socket,
      on: <T>(event: ServerToClientEvent, handler: (payload: T) => void) => {
        socket.on(event, handler);
        return () => {
          socket.off(event, handler);
        };
      },
      emit: (event: string, payload?: unknown) => socket.emit(event, payload)
    };
  }, []);

  return { ...api, isConnected };
}
