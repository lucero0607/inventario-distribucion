"use server";
// Force re-evaluation of Prisma client

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
    const [
        totalItems,
        itemsDisponibles,
        itemsMantenimiento,
        solicitudesPendientes,
        mantenimientosPendientes,
        totalHistorial,
        totalStaff,
    ] = await Promise.all([
        prisma.item.count(),
        prisma.item.count({ where: { status: "Disponible" } }),
        prisma.item.count({ where: { status: "No disponible" } }),
        prisma.request.count({ where: { status: "PENDIENTE" } }),
        prisma.maintenanceLog.count({ where: { status: "Pendiente" } }),
        prisma.historyLog.count(),
        prisma.user.count(),
    ]);

    return {
        totalItems,
        itemsDisponibles,
        itemsMantenimiento,
        solicitudesPendientes,
        mantenimientosPendientes,
        totalHistorial,
        totalStaff: totalStaff,
    };
}
