"use server";
// Updated for Custom Responsible support

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function registrarMovimiento(data: {
    type: "ENTRADA" | "SALIDA";
    itemId: string;
    userId?: string;
    customResponsible?: string;
    reason?: string;
    details?: string;
}) {
    // 1. Obtener el item actual
    const item = await prisma.item.findUnique({ where: { id: data.itemId } });
    if (!item) throw new Error("Item no encontrado");

    // 2. Validar stock para salidas y límites para entradas (devoluciones)
    if (data.type === "SALIDA" && item.quantity <= 0) {
        throw new Error("No hay stock suficiente para realizar la entrega.");
    }

    if (data.type === "ENTRADA") {
        // Contar cuántos equipos de este tipo están actualmente "fuera" (SALIDAS sin returnedAt)
        // O simplemente validar que no se devuelva algo que no se entregó.
        // Como el usuario quiere que no se pueda devolver más de lo entregado:
        const outstanding = await prisma.movement.count({
            where: {
                itemId: data.itemId,
                type: "SALIDA",
                returnedAt: null
            }
        });
        
        // Si no hay entregas pendientes y la razón parece ser una devolución normal
        const isNormalReturn = !data.reason?.toLowerCase().includes("compra") && !data.reason?.toLowerCase().includes("ingreso");
        if (outstanding <= 0 && isNormalReturn) {
            throw new Error("No hay entregas pendientes de este equipo para procesar una devolución.");
        }
    }

    const movement = await prisma.movement.create({
        data: {
            type: data.type,
            itemId: data.itemId,
            responsibleUserId: data.userId,
            customResponsible: data.customResponsible,
            reason: data.reason,
            details: data.details,
        },
    });

    // 3. Calcular nueva cantidad y estado
    const nextQuantity = data.type === "SALIDA" ? item.quantity - 1 : item.quantity + 1;
    let nextStatus = item.status;

    if (data.type === "SALIDA" && nextQuantity === 0) {
        nextStatus = "No disponible";
    } else if (data.type === "ENTRADA" && nextQuantity > 0) {
        nextStatus = "Disponible";
    }

    // 4. Actualizar el item
    await prisma.item.update({
        where: { id: data.itemId },
        data: {
            quantity: nextQuantity,
            status: nextStatus
        },
    });

    await prisma.historyLog.create({
        data: {
            action: "MOVIMIENTO",
            entityId: movement.id,
            entityType: "MOVEMENT",
            details: `${data.type}: ${data.reason || "Sin motivo especificado"} (Cant: ${nextQuantity})${data.customResponsible ? ` - Resp: ${data.customResponsible}` : ""}`,
            itemId: data.itemId,
            responsibleUserId: data.userId,
        },
    });

    revalidatePath("/");
    return movement;
}

export async function getMovimientos() {
    return prisma.movement.findMany({
        include: {
            item: true,
            responsibleUser: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function devolverMovimiento(id: string) {
    const movement = await prisma.movement.findUnique({
        where: { id },
        include: { item: true }
    });

    if (!movement) throw new Error("Movimiento no encontrado");
    if (movement.returnedAt) throw new Error("Este equipo ya ha sido devuelto");
    if (movement.type !== "SALIDA") throw new Error("Solo se pueden devolver salidas (entregas/ventas)");

    await prisma.$transaction([
        prisma.movement.update({
            where: { id },
            data: { returnedAt: new Date() }
        }),
        prisma.item.update({
            where: { id: movement.itemId },
            data: {
                quantity: { increment: 1 },
                status: "Disponible"
            }
        })
    ]);

    revalidatePath("/");
    return { success: true };
}
