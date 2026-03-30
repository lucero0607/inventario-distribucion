"use server";

import { prisma } from "@/lib/prisma";

export async function getUsuarios() {
    try {
        // Reparación/Creación del admin si es necesario
        let admin = await prisma.user.findUnique({ where: { username: "admin" } });

        if (!admin) {
            // Si el admin no existe, lo creamos
            admin = await prisma.user.create({
                data: {
                    username: "admin",
                    password: "admin123", // Ajustado para que coincida con lo que el usuario espera actualmente
                    name: "Administrador",
                    firstName: "Administrador",
                    lastName: "Tech",
                    email: "admin@techsystem.com",
                    role: "ADMIN",
                    status: "ACTIVO"
                }
            });
        } else if (!admin.email || !admin.firstName || admin.email === "admin@empresa.com") {
            // Si existe pero está incompleto o tiene el correo viejo, lo actualizamos
            await prisma.user.update({
                where: { id: admin.id },
                data: {
                    email: "admin@techsystem.com",
                    firstName: "Administrador",
                    lastName: "Tech",
                    name: "Administrador",
                    password: admin.password === "adminPassword123" ? "admin123" : admin.password
                }
            });
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            // Evitamos devolver contraseñas al cliente
            select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                role: true,
                status: true,
                createdAt: true,
            }
        });
        return users;
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function loginUsuario(email: string, password?: string) {
    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: email }
                ],
                status: "ACTIVO"
            }
        });

        if (user && user.password === password) {
            // Devolvemos el usuario sin la contraseña
            const { password: _, ...userWithoutPassword } = user;
            return { success: true, user: userWithoutPassword };
        }

        return { success: false, error: "Credenciales incorrectas" };
    } catch (error) {
        console.error("Error in loginUsuario:", error);
        return { success: false, error: "Error al intentar iniciar sesión" };
    }
}

export async function actualizarPerfil(id: string, data: {
    name?: string;
    email?: string;
    password?: string;
}) {
    try {
        const user = await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                password: data.password, // En una app real, aquí se hashearía la contraseña
            },
        });
        const { password: _, ...userWithoutPassword } = user;
        return { success: true, user: userWithoutPassword };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "No se pudo actualizar el perfil" };
    }
}

export async function crearUsuario(data: {
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    username: string;
    password?: string;
    role: string;
}) {
    try {
        const user = await prisma.user.create({
            data: {
                name: data.name,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                username: data.username,
                // Default password to '123456' if not provided for now
                password: data.password || "123456",
                role: data.role,
                status: "ACTIVO",
            },
        });
        return user;
    } catch (error: unknown) {
        console.error("Error creating user:", error);
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
            const meta = (error as { meta?: { target?: string | string[] } }).meta;
            const target = meta?.target || '';
            if (target.includes('username')) throw new Error("El ID de usuario ya está en uso.");
            if (target.includes('email')) throw new Error("El correo electrónico ya está registrado.");
        }
        throw new Error("Error al crear la cuenta. Por favor verifica los datos.");
    }
}

export async function cambiarEstadoUsuario(id: string, newStatus: string) {
    try {
        const user = await prisma.user.update({
            where: { id },
            data: { status: newStatus },
        });
        return user;
    } catch (error) {
        console.error("Error modifying user status:", error);
        throw new Error("Failed to change user status");
    }
}

export async function eliminarUsuario(id: string) {
    try {
        await prisma.user.delete({
            where: { id },
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new Error("Failed to delete user");
    }
}
