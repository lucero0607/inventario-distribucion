"use client";

import { useState, useEffect, useTransition } from "react";
import { Users, Loader2, Search, Plus, X, Save, Edit2, Trash2, Shield, UserCircle } from "lucide-react";
import { getUsuarios, crearUsuario, cambiarEstadoUsuario, eliminarUsuario } from "@/app/actions/usuarios";

interface User {
    id: string;
    name: string;
    username: string;
    role: string;
    status: string;
    createdAt: Date | string;
}

export default function UsuariosView() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isPending, startTransition] = useTransition();

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState("");
    const [formUsername, setFormUsername] = useState("");
    const [formRole, setFormRole] = useState("STAFF");
    const [formPassword, setFormPassword] = useState("");
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState(false);

    const cargarUsuarios = async () => {
        setLoading(true);
        const data = await getUsuarios();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        startTransition(() => {
            cargarUsuarios();
        });
    }, []);

    const resetForm = () => {
        setFormName("");
        setFormUsername("");
        setFormRole("STAFF");
        setFormPassword("");
        setFormError("");
        setFormSuccess(false);
        setShowForm(false);
    };

    const handleCreate = () => {
        if (!formName.trim() || !formUsername.trim()) {
            setFormError("Nombre y usuario son obligatorios");
            return;
        }

        startTransition(async () => {
            try {
                await crearUsuario({
                    name: formName,
                    username: formUsername,
                    role: formRole,
                    password: formPassword || undefined,
                });
                setFormSuccess(true);
                await cargarUsuarios();
                setTimeout(() => { resetForm(); }, 2000);
            } catch (err: unknown) {
                setFormError((err as Error).message || "Error al crear usuario.");
            }
        });
    };

    const handleToggleStatus = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        startTransition(async () => {
            await cambiarEstadoUsuario(id, newStatus);
            await cargarUsuarios();
        });
    };

    const handleEliminar = (id: string) => {
        if (!confirm("¿Eliminar usuario de forma permanente? Esta acción revocará todos sus accesos de inmediato.")) return;
        startTransition(async () => {
            await eliminarUsuario(id);
            await cargarUsuarios();
        });
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Gestión de Cuentas
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Controla el acceso al sistema, credenciales y privilegios.
                    </p>
                </div>
                <button
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold border border-transparent hover:bg-slate-800 hover:shadow-lg active:translate-y-0 hover:-translate-y-0.5 transition-all shadow-md sm:w-auto w-full"
                    onClick={() => { resetForm(); setShowForm(true); }}
                >
                    <Plus size={18} /> Nuevo Usuario
                </button>
            </div>

            <div className="mb-6 relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                    placeholder="Buscar por nombre o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* FORMULARIO MODAL */}
            {showForm && (
                <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-100 space-y-6 mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Shield className="text-slate-900" size={24} /> Crear Cuenta de Acceso
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-slate-100 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Nombre Completo *</label>
                            <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all" placeholder="Ej: Administrador General" value={formName} onChange={(e) => { setFormName(e.target.value); setFormError(""); }} required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Usuario / Correo *</label>
                            <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all focus:bg-white bg-slate-50" placeholder="usuario o admin@empresa.com" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Rol del Sistema</label>
                            <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all bg-white" value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                                <option value="STAFF">Staff (Solo lectura / Operaciones básicas)</option>
                                <option value="ADMIN">Administrador (Control total)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Contraseña (opcional)</label>
                            <input type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all" placeholder="Dejar en blanco para: 123456" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
                        </div>
                    </div>

                    {formError && <p className="text-red-500 text-sm font-medium">{formError}</p>}
                    {formSuccess && (
                        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2 animate-in fade-in">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Cuenta creada exitosamente. Accesos habilitados.
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-md shadow-slate-900/20 disabled:opacity-50 flex items-center gap-2" onClick={handleCreate} disabled={isPending}>
                            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Activar Cuenta
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                            <tr>
                                <th className="px-8 py-5">Identidad</th>
                                <th className="px-8 py-5">Permisos / Rol</th>
                                <th className="px-8 py-5">Estado</th>
                                <th className="px-8 py-5">Fecha creación</th>
                                <th className="px-8 py-5 text-right">Ajustes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Loader2 className="mx-auto animate-spin text-slate-900 mb-2" size={32} />
                                        <p className="text-slate-400">Verificando credenciales...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Shield size={48} className="text-slate-200" />
                                            <p className="text-slate-400 font-medium">No hay usuarios registrados con ese filtro.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                                    <UserCircle size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{user.name}</span>
                                                    <span className="text-xs text-slate-500 font-medium">{user.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-xs ${user.role === 'ADMIN' ? 'text-indigo-600' : 'text-slate-600'}`}>
                                                    {user.role === 'ADMIN' ? 'Administrador' : 'Staff Oculto'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(user.id, user.status)}
                                                disabled={isPending}
                                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 w-max ${user.status === "ACTIVO"
                                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                    : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                                    }`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.status === "ACTIVO" ? "bg-emerald-500" : "bg-red-500"}`} />
                                                {user.status}
                                            </button>
                                        </td>
                                        <td className="px-8 py-4 text-slate-400 text-xs">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(user.id)}
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
