"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Box, CheckCircle, AlertTriangle, Package, Wrench,
  Users, UserCircle, Plus, Clock, Loader2, Save, Shield,
  Search, Trash2, X
} from "lucide-react";
import { getDashboardStats } from "@/app/actions/dashboard";
import { getStaff, crearPersonal, eliminarPersonal } from "@/app/actions/personal";
import { getUsuarios, crearUsuario, cambiarEstadoUsuario, eliminarUsuario } from "@/app/actions/usuarios";
import Modal from "./Modal";

interface Stats {
  totalItems: number;
  itemsDisponibles: number;
  itemsMantenimiento: number;
  solicitudesPendientes: number;
  mantenimientosPendientes: number;
  totalHistorial: number;
  totalStaff: number;
}

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  status: string;
}

export default function DashboardView({
  setView,
}: {
  setView: (view: string) => void;
}) {
  const [stats, setStats] = useState<Stats>({
    totalItems: 0, itemsDisponibles: 0, itemsMantenimiento: 0,
    solicitudesPendientes: 0, mantenimientosPendientes: 0,
    totalHistorial: 0, totalStaff: 0,
  });

  // ===== USUARIOS MODAL =====
  const [showUsuarios, setShowUsuarios] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userForm, setUserForm] = useState({ name: "", username: "", role: "STAFF", password: "" });
  const [showUserForm, setShowUserForm] = useState(false);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getDashboardStats().then(setStats).catch(console.error);
  }, []);

  const loadUsers = async () => { setUsers(await getUsuarios()); };

  const handleCreateUser = () => {
    if (!userForm.name.trim() || !userForm.username.trim()) return;
    startTransition(async () => {
      await crearUsuario(userForm);
      setUserForm({ name: "", username: "", role: "STAFF", password: "" });
      setShowUserForm(false);
      await loadUsers();
    });
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
        <p className="text-slate-500 mt-1 text-sm">Resumen general del sistema de inventario.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={<Box size={20} />} label="Equipos" value={stats.totalItems} color="blue" />
        <KpiCard icon={<CheckCircle size={20} />} label="Disponibles" value={stats.itemsDisponibles} color="emerald" />
        <KpiCard icon={<AlertTriangle size={20} />} label="Mant. Pendiente" value={stats.mantenimientosPendientes} color="amber" />
        <KpiCard icon={<Users size={20} />} label="Total Cuentas" value={stats.totalStaff} color="indigo" />
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <QuickBtn icon={<Package size={16} />} label="Ver Inventario" onClick={() => setView("inventario")} />
          <QuickBtn icon={<Clock size={16} />} label="Ver Historial" onClick={() => setView("historial")} />
          <QuickBtn icon={<Shield size={16} />} label="Gestionar Cuentas" onClick={() => { setShowUsuarios(true); loadUsers(); }} />
        </div>
      </div>

      {/* RESUMEN VISUAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div onClick={() => setView("inventario")} className="group bg-white rounded-xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-md cursor-pointer transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors"><Package size={18} /></div>
            <span className="font-semibold text-slate-800">Inventario de Equipos</span>
          </div>
          <p className="text-sm text-slate-500">Gestiona equipos, solicitudes y mantenimiento desde un solo lugar.</p>
        </div>
        <div onClick={() => setView("historial")} className="group bg-white rounded-xl p-5 border border-slate-100 hover:border-amber-200 hover:shadow-md cursor-pointer transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors"><Clock size={18} /></div>
            <span className="font-semibold text-slate-800">Historial Completo</span>
          </div>
          <p className="text-sm text-slate-500">Movimientos, mantenimientos y seguimiento de tickets.</p>
        </div>
      </div>

      {/* ===== MODAL USUARIOS ===== */}
      <Modal open={showUsuarios} onClose={() => { setShowUsuarios(false); setShowUserForm(false); }} title="Gestión de Cuentas" size="lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Buscar..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowUserForm(!showUserForm)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition shrink-0">
            {showUserForm ? <X size={14} /> : <Plus size={14} />} {showUserForm ? "Cancelar" : "Nuevo"}
          </button>
        </div>

        {showUserForm && (
          <div className="bg-slate-50 p-4 rounded-xl mb-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder="Nombre *" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
              <input className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder="Usuario *" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} />
              <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
              <input type="password" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder="Contraseña (def: 123456)" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
            </div>
            <div className="flex justify-end">
              <button onClick={handleCreateUser} disabled={isPending} className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-1.5">
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Crear
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">Sin resultados</p>
          ) : filteredUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between py-3 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><UserCircle size={16} /></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.username} · <span className={u.role === "ADMIN" ? "text-indigo-500" : ""}>{u.role}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startTransition(async () => { await cambiarEstadoUsuario(u.id, u.status === "ACTIVO" ? "INACTIVO" : "ACTIVO"); await loadUsers(); })} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === "ACTIVO" ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-600"}`}>{u.status}</button>
                <button onClick={() => { if (confirm("¿Eliminar usuario?")) startTransition(async () => { await eliminarUsuario(u.id); await loadUsers(); }); }} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const themes: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${themes[color]}`}>{icon}</div>
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function QuickBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all">
      {icon} {label}
    </button>
  );
}