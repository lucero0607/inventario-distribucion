"use client";

import { useState, useEffect, useTransition } from "react";
import { ArrowUpDown, PlusCircle, History, Package, Loader2, User } from "lucide-react";
import { registrarMovimiento, getMovimientos } from "@/app/actions/movimientos";
import { crearMantenimiento } from "@/app/actions/mantenimiento";
import { getItems } from "@/app/actions/inventario";
import { getUsuarios } from "@/app/actions/usuarios";

interface User { id: string; name: string; }
interface Item { id: string; name: string; status: string; }
interface Movement {
    id: string; type: string; item?: { name: string } | null;
    responsibleUser?: { name: string } | null; date: Date | string;
    reason?: string | null;
}

export default function MovimientosView() {
    const [movimientos, setMovimientos] = useState<Movement[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [usersList, setUsersList] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Formulario General
    const [type, setType] = useState<"ENTRADA" | "SALIDA" | "MANTENIMIENTO">("SALIDA");
    const [selectedItemId, setSelectedItemId] = useState("");

    // Campos Movimientos
    const [selectedUserId, setSelectedUserId] = useState("");
    const [reason, setReason] = useState("");

    // Campos Mantenimiento
    const [formNombreMantenimiento, setFormNombreMantenimiento] = useState("");
    const [formPrioridadMantenimiento, setFormPrioridadMantenimiento] = useState("Media");
    const [formTecnico, setFormTecnico] = useState("");

    const cargarDatos = async () => {
        const [mvts, eqps, users] = await Promise.all([
            getMovimientos(),
            getItems(),
            getUsuarios(),
        ]);
        setMovimientos(mvts);
        setItems(eqps);
        setUsersList(users);
        setLoading(false);
    };

    useEffect(() => {
        startTransition(() => {
            cargarDatos();
        });
    }, []);

    const handleRegistrar = (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            if (type === "MANTENIMIENTO") {
                if (!formNombreMantenimiento.trim() || !reason.trim()) return;
                await crearMantenimiento({
                    nombre: formNombreMantenimiento,
                    description: reason,
                    prioridad: formPrioridadMantenimiento,
                    tecnicoAsignado: formTecnico || undefined,
                    itemId: selectedItemId || undefined,
                });
            } else {
                if (!selectedItemId) return;
                await registrarMovimiento({
                    type,
                    itemId: selectedItemId,
                    userId: selectedUserId || undefined,
                    reason,
                });
            }

            // Reset
            setSelectedItemId("");
            setSelectedUserId("");
            setReason("");
            setFormNombreMantenimiento("");
            setFormPrioridadMantenimiento("Media");
            setFormTecnico("");

            await cargarDatos();
        });
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Solicitudes de Equipos
                </h1>
                <p className="text-slate-500 mt-1">
                    Registra y consulta el flujo de solicitudes y equipos en la organización.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* FORMULARIO */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xl sticky top-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <PlusCircle className="text-blue-500" size={20} />
                            Nuevo Registro
                        </h3>

                        <form onSubmit={handleRegistrar} className="space-y-4">
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setType("SALIDA")}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === "SALIDA" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    ENTREGA
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType("ENTRADA")}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === "ENTRADA" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    DEVOLUCIÓN
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType("MANTENIMIENTO")}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === "MANTENIMIENTO" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    MANT.
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {type === "MANTENIMIENTO" ? "Equipo Vinculado (Opcional)" : "Equipo *"}
                                </label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                    value={selectedItemId}
                                    onChange={(e) => setSelectedItemId(e.target.value)}
                                    required={type !== "MANTENIMIENTO"}
                                >
                                    <option value="">{type === "MANTENIMIENTO" ? "-- No vincular u omitir --" : "-- Seleccionar Equipo --"}</option>
                                    {items.map(item => (
                                        <option key={item.id} value={item.id}>{item.name} ({item.status})</option>
                                    ))}
                                </select>
                            </div>

                            {type === "MANTENIMIENTO" && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asunto de Mantenimiento *</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        placeholder="Ej: Falla de memoria RAM"
                                        value={formNombreMantenimiento}
                                        onChange={(e) => setFormNombreMantenimiento(e.target.value)}
                                        required={true}
                                    />
                                </div>
                            )}

                            {type === "MANTENIMIENTO" ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Técnico sugerido</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        placeholder="Nombre del técnico..."
                                        value={formTecnico}
                                        onChange={(e) => setFormTecnico(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsable / Personal</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                    >
                                        <option value="">-- No especificado --</option>
                                        {usersList.map(person => (
                                            <option key={person.id} value={person.id}>{person.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {type === "MANTENIMIENTO" && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridad</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                                        value={formPrioridadMantenimiento}
                                        onChange={(e) => setFormPrioridadMantenimiento(e.target.value)}
                                    >
                                        <option value="Baja">Baja</option>
                                        <option value="Media">Media</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Urgente">Urgente</option>
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {type === "MANTENIMIENTO" ? "Descripción de la Falla *" : "Motivo / Notas adicionales"}
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all h-24 pt-3"
                                    placeholder={type === "MANTENIMIENTO" ? "Describe con detalles el problema... " : "Ej: Entrega por nueva contratación..."}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required={type === "MANTENIMIENTO"}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isPending || (type !== "MANTENIMIENTO" && !selectedItemId) || (type === "MANTENIMIENTO" && (!formNombreMantenimiento.trim() || !reason.trim()))}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${type === "SALIDA" ? "bg-red-600 shadow-red-900/10" : type === "ENTRADA" ? "bg-emerald-600 shadow-emerald-900/10" : "bg-amber-600 shadow-amber-900/10"} text-white hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0`}
                            >
                                {isPending ? <Loader2 className="animate-spin" size={20} /> : <SaveIcon size={20} />}
                                {isPending ? "Procesando..." : `Confirmar Solicitud`}
                            </button>
                        </form>
                    </div>
                </div>

                {/* LISTA DE MOVIMIENTOS */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <History size={18} className="text-slate-400" />
                            <h3 className="text-lg font-bold text-slate-800">Historial de solicitudes generales</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                                    <tr>
                                        <th className="px-8 py-4">Tipo</th>
                                        <th className="px-8 py-4">Equipo</th>
                                        <th className="px-8 py-4">Responsable</th>
                                        <th className="px-8 py-4">Fecha / Motivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></td>
                                        </tr>
                                    ) : movimientos.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-slate-400">No hay solicitudes registradas.</td>
                                        </tr>
                                    ) : (
                                        movimientos.map((m) => (
                                            <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.type === "SALIDA" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                        {m.type}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <Package size={16} className="text-slate-300" />
                                                        <span className="font-bold text-slate-900">{m.item?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <User size={16} className="text-slate-300" />
                                                        <span className="text-slate-600">{m.responsibleUser?.name || "Sin asignar"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-slate-400">{new Date(m.date).toLocaleString()}</span>
                                                        <span className="text-xs text-slate-600 mt-1">{m.reason || "Sin observación"}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SaveIcon({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
    );
}
