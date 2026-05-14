import type { Request, Response } from "express";
import { SOSStatus } from "@prisma/client";
import { prisma } from "../config/database.js";
import { sendSuccess } from "../utils/response.js";

export async function getLive(_req: Request, res: Response) {
  const requests = await prisma.sOSRequest.findMany({
    where: {
      status: {
        in: [SOSStatus.PENDING, SOSStatus.ASSIGNED, SOSStatus.IN_PROGRESS],
      },
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      type: true,
      severity: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return sendSuccess(res, requests, "Live map SOS loaded");
}

export async function getShelters(_req: Request, res: Response) {
  const shelters = await prisma.shelter.findMany({
    orderBy: { name: "asc" },
  });

  const data = shelters.map((shelter) => ({
    ...shelter,
    availableSpace: shelter.capacity - shelter.occupied,
  }));

  return sendSuccess(res, data, "Map shelters loaded");
}

export async function getHeatmap(_req: Request, res: Response) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const requests = await prisma.sOSRequest.findMany({
    where: {
      createdAt: { gte: since },
    },
    select: {
      latitude: true,
      longitude: true,
    },
  });

  const grouped = new Map<string, { latitude: number; longitude: number; count: number }>();

  for (const request of requests) {
    const latitude = Math.round(request.latitude * 100) / 100;
    const longitude = Math.round(request.longitude * 100) / 100;
    const key = `${latitude}:${longitude}`;
    const current = grouped.get(key);

    if (current) {
      current.count += 1;
    } else {
      grouped.set(key, { latitude, longitude, count: 1 });
    }
  }

  return sendSuccess(res, Array.from(grouped.values()), "Map heatmap loaded");
}
