import { SOSStatus } from "@prisma/client";
import { prisma } from "../config/database.js";
import { findNearbyShelters } from "./shelter.service.js";

export async function getLiveMapData() {
  const [incidents, shelters, volunteers] = await Promise.all([
    prisma.sOSRequest.findMany({
      where: { status: { in: [SOSStatus.PENDING, SOSStatus.ASSIGNED, SOSStatus.IN_PROGRESS] } },
      include: { user: true, volunteer: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 200
    }),
    prisma.shelter.findMany({ orderBy: { updatedAt: "desc" }, take: 200 }),
    prisma.volunteer.findMany({
      where: { isAvailable: true, user: { latitude: { not: null }, longitude: { not: null } } },
      include: { user: true },
      take: 200
    })
  ]);

  return { incidents, shelters, volunteers };
}

export async function getMapShelters(latitude?: number, longitude?: number, radiusKm = 50) {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return findNearbyShelters(latitude, longitude, radiusKm);
  }

  return prisma.shelter.findMany({ orderBy: { updatedAt: "desc" }, take: 500 });
}

export async function getHeatmapPoints() {
  return prisma.sOSRequest.findMany({
    select: {
      id: true,
      latitude: true,
      longitude: true,
      severity: true,
      status: true,
      createdAt: true
    },
    where: { status: { not: SOSStatus.CANCELLED } },
    orderBy: { createdAt: "desc" },
    take: 1000
  });
}
