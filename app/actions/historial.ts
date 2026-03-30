"use server";

import { prisma } from "@/lib/prisma";

export async function getHistorial(filtros?: {
    busqueda?: string;
    entityType?: string;
}) {
    const where: Record<string, unknown> = {};

    if (filtros?.entityType && filtros.entityType !== "todos") {
        where.entityType = filtros.entityType;
    }

    if (filtros?.busqueda) {
        where.details = { contains: filtros.busqueda };
    }

    return prisma.historyLog.findMany({
        where,
        orderBy: { date: "desc" },
    });
}

export async function getKpisHistorial() {
    const [total, creados, actualizados, eliminados] = await Promise.all([
        prisma.historyLog.count(),
        prisma.historyLog.count({ where: { action: "CREADO" } }),
        prisma.historyLog.count({
            where: { action: { in: ["ACTUALIZADO", "ESTADO_CAMBIADO"] } },
        }),
        prisma.historyLog.count({ where: { action: "ELIMINADO" } }),
    ]);
    return { total, creados, actualizados, eliminados };
}
