"use client";

import { useState, useEffect, useTransition } from "react";
import { Clock, Loader2, Filter, Search, Wrench, ArrowUpDown, Package } from "lucide-react";
import { getMantenimientos, cambiarEstadoMantenimiento } from "@/app/actions/mantenimiento";
import { getMovimientos } from "@/app/actions/movimientos";

type Tab = "movimientos" | "mantenimiento";

interface Movement {
  id: string; type: string; createdAt: Date | string;
  item?: { name: string } | null; responsibleUser?: { name: string } | null;
  reason?: string | null;
}

interface MaintenanceLog {
  id: string; nombre: string; description: string;
  status: string; prioridad: string;
  tecnicoAsignado?: string | null;
  startDate: Date | string;
}

export default function HistorialView() {
  const [tab, setTab] = useState<Tab>("movimientos");

  // Data
  const [movimientos, setMovimientos] = useState<Movement[]>([]);
  const [mantenimientos, setMantenimientos] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos"); // Para movs: SALIDA/ENTRADA. Para mant: Pendiente/etc
  const [techFilter, setTechFilter] = useState("Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todos");
  const [dateFilter, setDateFilter] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [mvts, mnts] = await Promise.all([getMovimientos(), getMantenimientos()]);
    setMovimientos(mvts);
    setMantenimientos(mnts);
    setLoading(false);
  };

  useEffect(() => {
    startTransition(() => {
      loadData();
    });
  }, []);

  const updateMantStatus = (id: string, status: string) => {
    startTransition(async () => { await cambiarEstadoMantenimiento(id, status); await loadData(); });
  };

  // Filter movimientos
  const filteredMov = movimientos.filter(m => {
    const s = search.toLowerCase();
    const matchSearch = !s || (m.item?.name || "").toLowerCase().includes(s) || (m.reason || "").toLowerCase().includes(s);
    const matchStatus = statusFilter === "Todos" || m.type === statusFilter;
    let matchDate = true;
    if (dateFilter) {
      const d = new Date(m.createdAt);
      matchDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0] === dateFilter;
    }
    return matchSearch && matchStatus && matchDate;
  });

  // Filter mantenimientos
  const uniqueTechs = Array.from(new Set(mantenimientos.map(m => m.tecnicoAsignado).filter(Boolean)));

  const filteredMant = mantenimientos.filter(m => {
    const s = search.toLowerCase();
    const matchSearch = !s || (m.nombre || "").toLowerCase().includes(s) || (m.description || "").toLowerCase().includes(s) || (m.tecnicoAsignado || "").toLowerCase().includes(s);
    const matchStatus = statusFilter === "Todos" || m.status === statusFilter;
    const matchTech = techFilter === "Todos" || m.tecnicoAsignado === techFilter;
    const matchPriority = priorityFilter === "Todos" || m.prioridad === priorityFilter;
    let matchDate = true;
    if (dateFilter) {
      const d = new Date(m.startDate);
      matchDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0] === dateFilter;
    }
    return matchSearch && matchStatus && matchTech && matchPriority && matchDate;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historial</h1>
        <p className="text-slate-500 text-sm mt-0.5">Seguimiento de movimientos y tickets de mantenimiento.</p>
      </div>

      {/* TABS */}
      <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
        <button onClick={() => { setTab("movimientos"); setStatusFilter("Todos"); setTechFilter("Todos"); }} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${tab === "movimientos" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <div className="flex items-center gap-1.5"><ArrowUpDown size={14} /> Movimientos</div>
        </button>
        <button onClick={() => { setTab("mantenimiento"); setStatusFilter("Todos"); setTechFilter("Todos"); }} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${tab === "mantenimiento" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <div className="flex items-center gap-1.5"><Wrench size={14} /> Mantenimiento</div>
        </button>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {tab === "movimientos" && (
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white appearance-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="Todos">Todos los tipos</option>
              <option value="SALIDA">Entrega</option>
              <option value="ENTRADA">Devolución</option>
            </select>
          </div>
        )}

        {tab === "mantenimiento" && (
          <>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white appearance-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="Todos">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En proceso">En proceso</option>
                <option value="Terminado">Terminado</option>
              </select>
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white appearance-none" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="Todos">Todas las prioridades</option>
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </>
        )}

        <div className="relative">
          <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="date" className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "movimientos" ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3">Equipo</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Responsable</th>
                  <th className="px-5 py-3">Motivo</th>
                  <th className="px-5 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-16"><Loader2 className="animate-spin mx-auto text-blue-500" size={24} /></td></tr>
                ) : filteredMov.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-slate-400 text-sm">Sin movimientos</td></tr>
                ) : filteredMov.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 font-medium text-slate-900">{m.item?.name || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.type === "SALIDA" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>{m.type === "SALIDA" ? "Entrega" : "Devolución"}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{m.responsibleUser?.name || "—"}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate">{m.reason || "—"}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{new Date(m.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Prioridad</th>
                  <th className="px-5 py-3">Técnico</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-16"><Loader2 className="animate-spin mx-auto text-blue-500" size={24} /></td></tr>
                ) : filteredMant.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-slate-400 text-sm">Sin tickets</td></tr>
                ) : filteredMant.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{m.nombre}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">{m.description}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.status === "Terminado" ? "bg-emerald-100 text-emerald-700" : m.status === "En proceso" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{m.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${m.prioridad === "Urgente" ? "text-red-600" : m.prioridad === "Alta" ? "text-amber-600" : "text-slate-500"}`}>{m.prioridad}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{m.tecnicoAsignado || "No asignado"}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{new Date(m.startDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-5 py-3 text-right">
                      <select className="text-xs border border-slate-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={m.status} onChange={e => updateMantStatus(m.id, e.target.value)}>
                        <option value="Pendiente">Pendiente</option>
                        <option value="En proceso">En taller</option>
                        <option value="Terminado">Terminado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}