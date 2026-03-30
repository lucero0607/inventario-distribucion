"use server";

import { prisma } from "@/lib/prisma";

export async function getItems() {
    return prisma.item.findMany({
        include: {
            maintenanceLogs: {
                where: {
                    status: { not: "Terminado" }
                }
            },
            movements: true
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getKpisInventario() {
    const [total, disponibles, noDisponibles, totalEntregados] = await Promise.all([
        prisma.item.count(),
        prisma.item.count({ where: { status: "Disponible" } }),
        prisma.item.count({ where: { status: "No disponible" } }),
        prisma.movement.count({ where: { type: "SALIDA" } }),
    ]);
    const maintenanceItems = await prisma.maintenanceLog.groupBy({
        by: ['itemId'],
        where: {
            status: { not: "Terminado" },
            itemId: { not: null }
        }
    });

    return { 
        total, 
        disponibles, 
        enMantenimiento: maintenanceItems.length, 
        asignados: noDisponibles,
        totalEntregados
    };
}

export async function crearItem(data: {
    name: string;
    description?: string;
    category: string;
    brand?: string;
    serialNumber?: string;
    quantity: number;
    location?: string;
}) {
    const item = await prisma.item.create({
        data: {
            name: data.name,
            description: data.description || null,
            category: data.category,
            brand: data.brand || null,
            serialNumber: data.serialNumber || null,
            quantity: data.quantity,
            status: data.quantity > 0 ? "Disponible" : "No disponible",
            location: data.location || null,
        },
    });

    await prisma.historyLog.create({
        data: {
            action: "CREADO",
            entityId: item.id,
            entityType: "ITEM",
            itemId: item.id,
            details: `Item creado: ${data.name} (${data.category}) × ${data.quantity}`,
        },
    });

    return item;
}

export async function actualizarItem(
    id: string,
    data: {
        name?: string;
        description?: string;
        category?: string;
        brand?: string;
        serialNumber?: string;
        quantity?: number;
        status?: string;
        location?: string;
    }
) {
    if (data.quantity !== undefined && data.quantity < 0) {
        throw new Error("La cantidad no puede ser negativa.");
    }

    if (data.quantity !== undefined && !data.status) {
        data.status = data.quantity > 0 ? "Disponible" : "No disponible";
    }

    const item = await prisma.item.update({
        where: { id },
        data,
    });

    await prisma.historyLog.create({
        data: {
            action: "ACTUALIZADO",
            entityId: item.id,
            entityType: "ITEM",
            itemId: item.id,
            details: `Item actualizado: ${item.name}`,
        },
    });

    return item;
}

export async function eliminarItem(id: string) {
    // Delete related records first
    await prisma.historyLog.deleteMany({ where: { itemId: id } });
    await prisma.request.deleteMany({ where: { itemId: id } });
    await prisma.maintenanceLog.deleteMany({ where: { itemId: id } });

    const item = await prisma.item.delete({ where: { id } });

    await prisma.historyLog.create({
        data: {
            action: "ELIMINADO",
            entityId: id,
            entityType: "ITEM",
            details: `Item eliminado: ${item.name}`,
        },
    });

    return item;
}
