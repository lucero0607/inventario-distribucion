"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Movimiento = {
    id: string;
    type: string;
    createdAt: Date | string;
};

export default function ActividadChart({ movimientos }: { movimientos: Movimiento[] }) {
    const data = useMemo(() => {
        // Agrupar movimientos de los últimos 7 días
        const counts: Record<string, { dateStr: string; entregas: number; devoluciones: number }> = {};

        // Inicializar últimos 7 días con 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
            counts[d.toDateString()] = { dateStr, entregas: 0, devoluciones: 0 };
        }

        movimientos.forEach((m) => {
            const d = new Date(m.createdAt);
            const key = d.toDateString();
            if (counts[key]) {
                if (m.type === "SALIDA") counts[key].entregas++;
                else if (m.type === "ENTRADA") counts[key].devoluciones++;
            }
        });

        return Object.values(counts);
    }, [movimientos]);

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="dateStr" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                        cursor={{ fill: '#F1F5F9' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="entregas" name="Entregas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="devoluciones" name="Devoluciones" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
