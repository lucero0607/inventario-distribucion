"use client";

import { useState, useEffect, useTransition } from "react";
import { Package, Save, Loader2, AlertCircle, CheckCircle2, Trash2, Edit3, Filter, Edit } from "lucide-react";
import { getItems, crearItem, actualizarItem, eliminarItem } from "@/app/actions/inventario";

interface Item {
    id: string;
    name: string;
    description: string | null;
    category: string;
    brand: string | null;
    serialNumber: string | null;
    quantity: number;
    status: string;
    location: string | null;
    createdAt: Date;
}

export default function NuevoEquipoView() {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [brand, setBrand] = useState("");
    const [serialNumber, setSerialNumber] = useState("");
    const [description, setDescription] = useState("");
    const [quantity, setQuantity] = useState(1);

    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [items, setItems] = useState<Item[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [statusFilter, setStatusFilter] = useState("Todos");

    const cargarDatos = async () => {
        const data = await getItems();
        setItems(data as Item[]);
    };

    useEffect(() => {
        startTransition(() => {
            cargarDatos();
        });
    }, []);

    const handleDelete = (id: string) => {
        startTransition(async () => {
            await eliminarItem(id);
            await cargarDatos();
        });
    };

    const handleStatusChange = (id: string, status: string) => {
        startTransition(async () => {
            await actualizarItem(id, { status });
            await cargarDatos();
        });
    };

    const itemsFiltrados = items.filter((i) => {
        const matchBusqueda =
            busqueda === "" ||
            i.name.toLowerCase().includes(busqueda.toLowerCase()) ||
            i.category.toLowerCase().includes(busqueda.toLowerCase());

        const matchStatus = statusFilter === "Todos" || i.status === statusFilter;

        return matchBusqueda && matchStatus;
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category.trim()) {
            setError("El nombre y la categoría son obligatorios.");
            return;
        }
        if (Number(quantity) < 1) {
            setError("La cantidad mínima es 1.");
            return;
        }

        startTransition(async () => {
            try {
                await crearItem({
                    name,
                    category: category === "otro" ? customCategory : category,
                    brand,
                    serialNumber,
                    description,
                    quantity: Number(quantity),
                });

                await cargarDatos();

                // Reset form
                setName("");
                setCategory("");
                setCustomCategory("");
                setBrand("");
                setSerialNumber("");
                setDescription("");
                setQuantity(1);

                setSuccess(true);
                setError("");
                setTimeout(() => setSuccess(false), 3000);
            } catch (err) {
                setError("Error al registrar el equipo. Inténtelo de nuevo.");
            }
        });
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Agregar Nuevo Equipo
                </h1>
                <p className="text-slate-500 mt-1">
                    Registra un nuevo elemento con sus especificaciones técnicas.
                </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre del equipo */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Nombre del equipo *</label>
                            <input
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                placeholder="Ej: Laptop Dell Latitude 5420"
                                value={name}
                                onChange={(e) => { setName(e.target.value); setError(""); }}
                                required
                            />
                        </div>

                        {/* Categoria */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Categoría de equipo *</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                            >
                                <option value="">-- Seleccionar Categoría --</option>
                                <option value="computadora">Computadora</option>
                                <option value="laptop">Laptop</option>
                                <option value="monitor">Monitor</option>
                                <option value="celular">Celular</option>
                                <option value="teclado">Teclado</option>
                                <option value="Mouse">Mouse</option>
                                <option value="impresora">Impresora</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>

                        {/* Custom Category Input */}
                        {category === "otro" && (
                            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                <label className="text-sm font-bold text-slate-700">Especificar Otra Categoría *</label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-blue-50/30"
                                    placeholder="Escribe la categoría..."
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {/* Marca */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Marca</label>
                            <input
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                placeholder="Ej: Dell, HP, Cisco"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                            />
                        </div>

                        {/* Número de Serie */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Número de serie</label>
                            <input
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                placeholder="Ej: SN-123456789"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                            />
                        </div>

                        {/* Cantidad */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Cantidad</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                value={quantity}
                                onChange={(e) => {
                                    const val = Math.max(1, Number(e.target.value));
                                    setQuantity(val);
                                    setError("");
                                }}
                            />
                        </div>

                        {/* Descripción adicional */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-700">Descripción adicional</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all h-24 pt-3"
                                placeholder="Detalles adicionales, estado físico, especificaciones técnicas..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2 animate-in fade-in">
                            <CheckCircle2 size={20} />
                            Equipo registrado con éxito en el inventario.
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="group flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
                        >
                            {isPending ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <Save size={20} />
                            )}
                            {isPending ? "Registrando..." : "Guardar Equipo"}
                        </button>
                    </div>
                </form>
            </div>

            {/* SECCIÓN DE INVENTARIO */}
            <div className="mt-16 space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Inventario Actual</h2>
                    <p className="text-slate-500 mt-1">Lista de equipos y elementos ya registrados en el sistema.</p>
                </div>

                {/* BUSCADOR Y FILTROS */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o categoría..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="relative min-w-[220px]">
                        <select
                            className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-10 pr-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 font-medium h-full"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="Disponible">Disponible</option>
                            <option value="No disponible">No disponible</option>
                        </select>
                        <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* TABLA DE EQUIPOS */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Nombre</th>
                                <th className="px-6 py-4">Categoría</th>
                                <th className="px-6 py-4">Marca / Serie</th>
                                <th className="px-6 py-4">Cantidad</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-400">
                                        No hay equipos en el inventario
                                    </td>
                                </tr>
                            ) : (
                                itemsFiltrados.map((item) => (
                                    <tr key={item.id} className="border-t hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 font-medium">{item.name}</td>
                                        <td className="px-6 py-4">{item.category}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs">
                                                <span className="text-slate-900 font-medium">{item.brand || "—"}</span>
                                                <span className="text-slate-400 font-mono">{item.serialNumber || "—"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold">{item.quantity}</td>
                                        <td className="px-6 py-4">
                                            <select
                                                className="border border-slate-300 rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                            >
                                                <option value="Disponible">Disponible</option>
                                                <option value="No disponible">No disponible</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {/* Edit removed for simplicity in this view to avoid double modal forms, only showing delete */}
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-200"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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
    );
}
