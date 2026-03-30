"use server";

import { prisma } from "@/lib/prisma";

export async function getMantenimientos() {
    return prisma.maintenanceLog.findMany({
        orderBy: { startDate: "desc" },
    });
}

export async function getKpisMantenimiento() {
    const [total, pendientes, enProceso, terminados] = await Promise.all([
        prisma.maintenanceLog.count(),
        prisma.maintenanceLog.count({ where: { status: "Pendiente" } }),
        prisma.maintenanceLog.count({ where: { status: "En proceso" } }),
        prisma.maintenanceLog.count({ where: { status: "Terminado" } }),
    ]);
    return { total, pendientes, enProceso, terminados };
}

export async function crearMantenimiento(data: {
    nombre: string;
    description: string;
    prioridad: string;
    tecnicoAsignado?: string;
    diagnosticoInicial?: string;
    costoEstimado?: number;
    itemId?: string;
    cantidad?: number;
}) {
    if (data.cantidad !== undefined && data.cantidad <= 0) {
        throw new Error("La cantidad debe ser mayor a cero.");
    }
    const qty = data.cantidad || 1;

    // 1. Validar stock
    const item = await prisma.item.findUnique({ where: { id: data.itemId || "" } });
    if (data.itemId && (!item || item.quantity < qty)) {
        throw new Error(`No hay stock suficiente (${item?.quantity || 0} disponibles) para enviar a mantenimiento.`);
    }

    const logsPromises = [];
    for (let i = 0; i < qty; i++) {
        logsPromises.push(prisma.maintenanceLog.create({
            data: {
                nombre: data.nombre,
                description: data.description,
                prioridad: data.prioridad,
                tecnicoAsignado: data.tecnicoAsignado || null,
                diagnosticoInicial: data.diagnosticoInicial || null,
                costoEstimado: data.costoEstimado || null,
                itemId: data.itemId || null,
                status: "Pendiente",
            },
        }));
    }

    const mantenimientos = await Promise.all(logsPromises);
    const primerMantenimiento = mantenimientos[0];

    // 2. Restar cantidad y cambiar estado si existe
    if (data.itemId && item) {
        const nextQty = item.quantity - qty;
        await prisma.item.update({
            where: { id: data.itemId },
            data: {
                quantity: nextQty,
                status: nextQty === 0 ? "No disponible" : item.status
            },
        });
    }

    await prisma.historyLog.create({
        data: {
            action: "CREADO",
            entityId: primerMantenimiento?.id || "N/A",
            entityType: "MAINTENANCE",
            details: `Mantenimiento (${qty} unid.): ${data.nombre} — ${data.description}`,
            itemId: data.itemId || null,
        },
    });

    return primerMantenimiento;
}

export async function cambiarEstadoMantenimiento(
    id: string,
    status: string,
    data?: {
        accionesRealizadas?: string;
        piezasReemplazadas?: string;
        costoReal?: number;
    }
) {
    const isTerminado = status === "Terminado";
    const mantenimientoActual = await prisma.maintenanceLog.findUnique({
        where: { id },
    });

    const mantenimiento = await prisma.maintenanceLog.update({
        where: { id },
        data: {
            status,
            endDate: isTerminado ? new Date() : undefined,
            fechaLiberacion: isTerminado ? new Date() : undefined,
            accionesRealizadas: data?.accionesRealizadas,
            piezasReemplazadas: data?.piezasReemplazadas,
            costoReal: data?.costoReal,
        },
    });

    // Si termina, la cantidad aumenta (+1) y vuelve a estar Disponible
    if (isTerminado && mantenimiento.itemId) {
        const item = await prisma.item.findUnique({ where: { id: mantenimiento.itemId } });
        if (item) {
            await prisma.item.update({
                where: { id: mantenimiento.itemId },
                data: {
                    quantity: item.quantity + 1,
                    status: "Disponible"
                },
            });
        }
    }

    await prisma.historyLog.create({
        data: {
            action: "ESTADO_CAMBIADO",
            entityId: mantenimiento.id,
            entityType: "MAINTENANCE",
            details: `Estado cambiado a: ${status}${isTerminado ? `. Acciones: ${data?.accionesRealizadas || "Ninguna"}` : ""}`,
            itemId: mantenimiento.itemId || null,
        },
    });

    return mantenimiento;
}

export async function resolverMantenimientosLote(ticketIds: string[], status: string = "Terminado") {
    const isTerminado = status === "Terminado";
    if (!ticketIds || !ticketIds.length) return;

    await prisma.maintenanceLog.updateMany({
        where: { id: { in: ticketIds } },
        data: {
            status,
            endDate: isTerminado ? new Date() : undefined,
            fechaLiberacion: isTerminado ? new Date() : undefined,
        },
    });

    if (isTerminado) {
        const logs = await prisma.maintenanceLog.findMany({
            where: { id: { in: ticketIds }, itemId: { not: null } },
            select: { itemId: true }
        });

        const countsByItem: Record<string, number> = {};
        for (const log of logs) {
            if (log.itemId) countsByItem[log.itemId] = (countsByItem[log.itemId] || 0) + 1;
        }

        for (const [itemId, qty] of Object.entries(countsByItem)) {
            const item = await prisma.item.findUnique({ where: { id: itemId } });
            if (item) {
                await prisma.item.update({
                    where: { id: itemId },
                    data: {
                        quantity: item.quantity + qty,
                        status: "Disponible"
                    }
                });
            }
        }
    }

    await prisma.historyLog.create({
        data: {
            action: "ESTADO_CAMBIADO",
            entityId: ticketIds[0],
            entityType: "MAINTENANCE",
            details: `Se marcaron ${ticketIds.length} tickets de mantenimiento como ${status}.`,
            itemId: null,
        },
    });

    return true;
}

