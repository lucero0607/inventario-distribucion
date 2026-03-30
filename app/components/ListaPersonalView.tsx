"use client";

import { useState, useEffect, useTransition } from "react";
import { Users, Trash2, Edit2, Search, Loader2, Plus, X, Save, UserPlus } from "lucide-react";
import { getStaff, eliminarPersonal, crearPersonal } from "@/app/actions/personal";

interface StaffMember {
    id: string;
    name: string;
    idNumber?: string | null;
    position?: string | null;
    department?: string | null;
    email?: string | null;
    phone?: string | null;
}

export default function ListaPersonalView() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isPending, startTransition] = useTransition();

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState("");
    const [formId, setFormId] = useState("");
    const [formPosition, setFormPosition] = useState("");
    const [formDept, setFormDept] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState(false);

    const cargarPersonal = async () => {
        setLoading(true);
        const data = await getStaff();
        setStaff(data);
        setLoading(false);
    };

    useEffect(() => {
        startTransition(() => {
            cargarPersonal();
        });
    }, []);

    const resetForm = () => {
        setFormName("");
        setFormId("");
        setFormPosition("");
        setFormDept("");
        setFormEmail("");
        setFormPhone("");
        setFormError("");
        setFormSuccess(false);
        setShowForm(false);
    };

    const handleCreate = () => {
        if (!formName.trim()) {
            setFormError("El nombre es obligatorio");
            return;
        }

        startTransition(async () => {
            try {
                await crearPersonal({
                    name: formName,
                    idNumber: formId,
                    position: formPosition,
                    department: formDept,
                    email: formEmail,
                    phone: formPhone,
                });
                setFormSuccess(true);
                await cargarPersonal();
                setTimeout(() => { resetForm(); }, 2000);
            } catch (err) {
                setFormError("Error al registrar personal. Verifique si la cédula ya existe.");
            }
        });
    };

    const handleEliminar = (id: string) => {
        if (!confirm("¿Está seguro de eliminar a este miembro del personal?")) return;
        startTransition(async () => {
            await eliminarPersonal(id);
            await cargarPersonal();
        });
    };

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.idNumber && s.idNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Lista de Personal
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Directorio corporativo y administración de miembros.
                    </p>
                </div>
                <button
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold border border-transparent hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 active:translate-y-0 hover:-translate-y-0.5 transition-all shadow-md sm:w-auto w-full"
                    onClick={() => { resetForm(); setShowForm(true); }}
                >
                    <Plus size={18} /> Agregar Empleado
                </button>
            </div>

            <div className="mb-6 relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Buscar por nombre, ID o dpto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* FORMULARIO MODAL */}
            {showForm && (
                <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-100 space-y-6 mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <UserPlus className="text-indigo-600" size={24} /> Registrar Nuevo Miembro
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-slate-100 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Nombre Completo *</label>
                            <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Ej: Juan Pérez" value={formName} onChange={(e) => { setFormName(e.target.value); setFormError(""); }} required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Cédula / ID</label>
                            <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Ej: 12345678" value={formId} onChange={(e) => setFormId(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Cargo / Posición</label>
                            <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Ej: Analista de Sistemas" value={formPosition} onChange={(e) => setFormPosition(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Departamento</label>
                            <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Ej: IT, Contabilidad" value={formDept} onChange={(e) => setFormDept(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Correo Electrónico</label>
                            <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="correo@empresa.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Teléfono</label>
                            <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Ej: 555-0123" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                        </div>
                    </div>

                    {formError && <p className="text-red-500 text-sm font-medium">{formError}</p>}
                    {formSuccess && (
                        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2 animate-in fade-in">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Personal registrado con éxito. Actualizando directorio...
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2" onClick={handleCreate} disabled={isPending}>
                            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar Miembro
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                            <tr>
                                <th className="px-8 py-5">Nombre / ID</th>
                                <th className="px-8 py-5">Cargo / Departamento</th>
                                <th className="px-8 py-5">Contacto</th>
                                <th className="px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <Loader2 className="mx-auto animate-spin text-blue-500 mb-2" size={32} />
                                        <p className="text-slate-400">Cargando personal...</p>
                                    </td>
                                </tr>
                            ) : filteredStaff.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users size={48} className="text-slate-200" />
                                            <p className="text-slate-400 font-medium">No se encontró personal registrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStaff.map((person) => (
                                    <tr key={person.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    {person.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{person.name}</span>
                                                    <span className="text-xs text-slate-400">{person.idNumber || "Sin ID"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700">{person.position || "—"}</span>
                                                <span className="text-xs text-slate-400">{person.department || "Sin departamento"}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col text-xs space-y-1">
                                                {person.email && <span className="text-slate-500">📧 {person.email}</span>}
                                                {person.phone && <span className="text-slate-500">📞 {person.phone}</span>}
                                                {!person.email && !person.phone && <span className="text-slate-400 italic">Sin datos</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(person.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
