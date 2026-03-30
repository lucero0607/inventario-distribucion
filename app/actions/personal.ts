"use server";
// Force re-evaluation of Prisma client for Staff

import { prisma } from "@/lib/prisma";

export async function getStaff() {
    return prisma.user.findMany({
        orderBy: { name: "asc" },
    });
}

export async function crearPersonal(data: {
    name: string;
    idNumber?: string;
    position?: string;
    department?: string;
    email?: string;
    phone?: string;
}) {
    // Para simplificar, creamos un usuario con rol STAFF y nombre de usuario basado en el nombre
    const username = data.name.toLowerCase().replace(/\s+/g, '.') + Math.floor(Math.random() * 100);
    const user = await prisma.user.create({
        data: {
            name: data.name,
            username: username,
            password: "defaultPassword123", // Contraseña temporal
            role: "STAFF",
            email: data.email,
        },
    });

    await prisma.historyLog.create({
        data: {
            action: "CREADO",
            entityId: user.id,
            entityType: "USER",
            details: `Personal (Usuario) registrado: ${user.name}`,
            responsibleUserId: user.id,
        },
    });

    return user;
}

export async function actualizarPersonal(id: string, data: { name: string; email?: string }) {
    const user = await prisma.user.update({
        where: { id },
        data: {
            name: data.name,
            email: data.email,
        },
    });

    await prisma.historyLog.create({
        data: {
            action: "ACTUALIZADO",
            entityId: user.id,
            entityType: "USER",
            details: `Usuario actualizado: ${user.name}`,
            responsibleUserId: user.id,
        },
    });

    return user;
}

export async function eliminarPersonal(id: string) {
    const user = await prisma.user.delete({
        where: { id },
    });

    await prisma.historyLog.create({
        data: {
            action: "ELIMINADO",
            entityId: id,
            entityType: "USER",
            details: `Usuario eliminado: ${user.name}`,
        },
    });

    return user;
}
