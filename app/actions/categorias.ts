"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategorias() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" }
        });
        
        // If no categories exist, seed the defaults
        if (categories.length === 0) {
            const defaults = ["Computadora", "Laptop", "Monitor", "Celular", "Teclado", "Mouse", "Impresora"];
            await Promise.all(
                defaults.map(name => 
                    prisma.category.upsert({
                        where: { name },
                        update: {},
                        create: { name }
                    })
                )
            );
            return prisma.category.findMany({ orderBy: { name: "asc" } });
        }
        
        return categories;
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

export async function crearCategoria(name: string) {
    if (!name || name.trim() === "") throw new Error("El nombre no puede estar vacío");
    
    try {
        const category = await prisma.category.create({
            data: { name: name.trim() }
        });
        revalidatePath("/");
        return category;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error("Esta categoría ya existe");
        }
        throw error;
    }
}
