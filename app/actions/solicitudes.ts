"use server";

import { prisma } from "@/lib/prisma";

export async function getSolicitudes() {
    return prisma.request.findMany({
        orderBy: { date: "desc" },
    });
}

export async function getKpisSolicitudes() {
    const [pendientes, enProceso, completadas] = await Promise.all([
        prisma.request.count({ where: { status: "PENDIENTE" } }),
        prisma.request.count({ where: { status: { in: ["EN_PROCESO", "APROBADA"] } } }),
        prisma.request.count({ where: { status: { in: ["COMPLETADO", "ENTREGADO", "DEVUELTO"] } } }),
    ]);
    return { pendientes, enProceso, completadas };
}


export async function crearSolicitud(data: {
    tipo: string;
    descripcion: string;
    solicitante?: string;
    solicitanteNombre?: string;
    prioridad?: string;
    motivo?: string;
    fechaRequerida?: Date;
    fechaDevolucionEstimada?: Date;
    itemId?: string;
}) {
    const solicitud = await prisma.request.create({
        data: {
            tipo: data.tipo,
            descripcion: data.descripcion,
            solicitante: data.solicitante || null,
            solicitanteNombre: data.solicitanteNombre || null,
            prioridad: data.prioridad || "Media",
            motivo: data.motivo || null,
            fechaRequerida: data.fechaRequerida || null,
            fechaDevolucionEstimada: data.fechaDevolucionEstimada || null,
            itemId: data.itemId || null,
        },
    });

    // Auto-log en historial
    await prisma.historyLog.create({
        data: {
            action: "CREADO",
            entityId: solicitud.id,
            entityType: "REQUEST",
            details: `Solicitud de ${data.tipo}: ${data.descripcion} (Prioridad: ${data.prioridad || "Media"})`,
            itemId: data.itemId || null,
        },
    });

    return solicitud;
}

export async function actualizarEstadoSolicitud(id: string, status: string, aprobadoPor?: string) {
    const solicitud = await prisma.request.update({
        where: { id },
        data: {
            status,
            aprobadoPor: aprobadoPor || null,
        },
    });

    // Si la solicitud se marca como ENTREGADO y tiene un item, actualizamos el estado del item
    if (status === "ENTREGADO" && solicitud.itemId) {
        await prisma.item.update({
            where: { id: solicitud.itemId },
            data: { status: "No disponible" },
        });
    }

    // Si se marca como DEVUELTO, el item vuelve a estar DISPONIBLE
    if (status === "DEVUELTO" && solicitud.itemId) {
        await prisma.item.update({
            where: { id: solicitud.itemId },
            data: { status: "Disponible" },
        });
    }

    await prisma.historyLog.create({
        data: {
            action: "ESTADO_CAMBIADO",
            entityId: solicitud.id,
            entityType: "REQUEST",
            details: `Estado cambiado a: ${status}${aprobadoPor ? ` por ${aprobadoPor}` : ""}`,
            itemId: solicitud.itemId || null,
        },
    });

    return solicitud;
}

