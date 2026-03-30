"use client";

import { useState, useEffect, useTransition } from "react";
import { getItems, crearItem, actualizarItem, eliminarItem, getKpisInventario } from "@/app/actions/inventario";
import { registrarMovimiento } from "@/app/actions/movimientos";
import { crearMantenimiento, cambiarEstadoMantenimiento, resolverMantenimientosLote } from "@/app/actions/mantenimiento";
import { getUsuarios } from "@/app/actions/usuarios";
import { Trash2, Edit3, Plus, Filter, Search, Loader2, ArrowUpDown, Wrench, Package, Check } from "lucide-react";
import Modal from "./Modal";

interface User {
  id: string;
  name: string;
}

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
  createdAt: Date | string;
  maintenanceLogs?: { id: string }[];
  movements?: { id: string; type: string; createdAt: Date | string }[];
}

export default function InventarioView() {
  const [items, setItems] = useState<Item[]>([]);
  const [isPending, startTransition] = useTransition();
  const [kpis, setKpis] = useState({ total: 0, disponibles: 0, enMantenimiento: 0, asignados: 0 });
  const [busqueda, setBusqueda] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [showMaintenanceOnly, setShowMaintenanceOnly] = useState(false);
  const [showDeliveredOnly, setShowDeliveredOnly] = useState(false);

  // ===== EQUIPO MODAL =====
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formCustomCategory, setFormCustomCategory] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formSerialNumber, setFormSerialNumber] = useState("");
  const [formQuantity, setFormQuantity] = useState("1");
  const [formLocation, setFormLocation] = useState("");

  // ===== SOLICITUD MODAL =====
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [solicitudItem, setSolicitudItem] = useState<Item | null>(null);
  const [solicitudSubtype, setSolicitudSubtype] = useState<"ENTREGA" | "VENTA" | "DEVOLUCION">("ENTREGA");
  const [solicitudUserId, setSolicitudUserId] = useState("");
  const [solicitudReason, setSolicitudReason] = useState("");
  const [isCustomStaff, setIsCustomStaff] = useState(false);
  const [solCustomStaff, setSolCustomStaff] = useState("");
  const [usersList, setUsersList] = useState<User[]>([]);

  // ===== MANTENIMIENTO MODAL =====
  const [showMantModal, setShowMantModal] = useState(false);
  const [mantItem, setMantItem] = useState<Item | null>(null);
  const [mantNombre, setMantNombre] = useState("");
  const [mantDesc, setMantDesc] = useState("");
  const [mantPrioridad, setMantPrioridad] = useState("Media");
  const [mantTecnico, setMantTecnico] = useState("");
  const [mantQty, setMantQty] = useState("1");

  const [showResolveMantModal, setShowResolveMantModal] = useState(false);
  const [resolveMantItem, setResolveMantItem] = useState<Item | null>(null);
  const [resolveMantQty, setResolveMantQty] = useState("1");

  const cargarDatos = async () => {
    const [data, stats] = await Promise.all([getItems(), getKpisInventario()]);
    setItems(data as Item[]);
    setKpis(stats);
  };

  useEffect(() => {
    startTransition(() => {
      cargarDatos();
    });
  }, []);

  // ===== EQUIPO HANDLERS =====
  const resetEquipoForm = () => {
    setFormName(""); setFormDesc(""); setFormCategory(""); setFormCustomCategory("");
    setFormBrand(""); setFormSerialNumber(""); setFormQuantity("1"); setFormLocation("");
    setEditingId(null); setShowEquipoModal(false);
  };

  const handleSubmitEquipo = () => {
    if (!formName.trim() || !formCategory.trim() || (formCategory === "otro" && !formCustomCategory.trim())) return;
    if (parseInt(formQuantity) < 0) {
      alert("La cantidad no puede ser negativa.");
      return;
    }
    startTransition(async () => {
      const cat = formCategory === "otro" ? formCustomCategory : formCategory;
      const q = Math.max(0, parseInt(formQuantity) || 0);
      const payload = { name: formName, description: formDesc || undefined, category: cat, brand: formBrand || undefined, serialNumber: formSerialNumber || undefined, quantity: q, location: formLocation || undefined };
      if (editingId) await actualizarItem(editingId, payload);
      else await crearItem(payload);
      resetEquipoForm();
      await cargarDatos();
    });
  };

  const handleEdit = (item: Item) => {
    setEditingId(item.id); setFormName(item.name); setFormDesc(item.description || "");
    const std = ["computadora", "laptop", "monitor", "celular", "teclado", "mouse", "impresora"];
    if (std.includes(item.category.toLowerCase())) { setFormCategory(item.category.toLowerCase()); setFormCustomCategory(""); }
    else { setFormCategory("otro"); setFormCustomCategory(item.category); }
    setFormBrand(item.brand || ""); setFormSerialNumber(item.serialNumber || "");
    setFormQuantity(String(item.quantity)); setFormLocation(item.location || "");
    setShowEquipoModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este equipo?")) return;
    startTransition(async () => { await eliminarItem(id); await cargarDatos(); });
  };

  const handleStatusChange = (id: string, status: string) => {
    startTransition(async () => { await actualizarItem(id, { status }); await cargarDatos(); });
  };

  // ===== SOLICITUD HANDLERS =====
  const openSolicitud = async (item: Item) => {
    setSolicitudItem(item); setSolicitudSubtype("ENTREGA"); setSolicitudUserId(""); setSolicitudReason("");
    setUsersList(await getUsuarios());
    setShowSolicitudModal(true);
  };

  const handleSubmitSolicitud = () => {
    if (!solicitudItem) return;
    if (solicitudItem.quantity <= 0) {
      alert("No hay stock disponible para realizar esta entrega.");
      return;
    }
    startTransition(async () => {
      try {
        await registrarMovimiento({ 
          type: solicitudSubtype === "DEVOLUCION" ? "ENTRADA" : "SALIDA", 
          itemId: solicitudItem.id, 
          userId: isCustomStaff ? undefined : (solicitudUserId || undefined), 
          customResponsible: isCustomStaff ? solCustomStaff : undefined,
          reason: solicitudSubtype === "VENTA" ? `[VENTA] ${solicitudReason}` : (solicitudSubtype === "DEVOLUCION" ? `[DEVOLUCIÓN] ${solicitudReason}` : solicitudReason) 
        });
        setShowSolicitudModal(false);
        setIsCustomStaff(false);
        setSolCustomStaff("");
        await cargarDatos();
      } catch (err: unknown) {
        alert((err as Error).message || "Error al registrar movimiento.");
      }
    });
  };

  // ===== MANTENIMIENTO HANDLERS =====
  const openMant = (item: Item) => {
    setMantItem(item); setMantNombre(""); setMantDesc(""); setMantPrioridad("Media"); setMantTecnico(""); setMantQty("1");
    setShowMantModal(true);
  };

  const handleSubmitMant = () => {
    if (!mantNombre.trim() || !mantDesc.trim()) return;
    const qtyParsed = parseInt(mantQty) || 1;
    if (qtyParsed <= 0) {
      alert("La cantidad debe ser mayor a cero.");
      return;
    }
    if (mantItem && qtyParsed > mantItem.quantity) {
      alert("No puedes enviar más unidades de las disponibles.");
      return;
    }
    startTransition(async () => {
      await crearMantenimiento({ nombre: mantNombre, description: mantDesc, prioridad: mantPrioridad, tecnicoAsignado: mantTecnico || undefined, itemId: mantItem?.id || undefined, cantidad: qtyParsed });
      setShowMantModal(false);
      await cargarDatos();
    });
  };

  const openResolveMant = (item: Item) => {
    if (!item.maintenanceLogs || item.maintenanceLogs.length === 0) return;
    setResolveMantItem(item);
    setResolveMantQty(item.maintenanceLogs.length.toString());
    setShowResolveMantModal(true);
  };

  const handleSubmitResolve = () => {
    if (!resolveMantItem || !resolveMantItem.maintenanceLogs) return;
    const qty = parseInt(resolveMantQty) || 1;
    if (qty <= 0 || qty > resolveMantItem.maintenanceLogs.length) {
      alert("Cantidad inválida.");
      return;
    }
    const ticketsToResolve = resolveMantItem.maintenanceLogs.slice(0, qty).map(t => t.id);
    startTransition(async () => {
      await resolverMantenimientosLote(ticketsToResolve, "Terminado");
      setShowResolveMantModal(false);
      await cargarDatos();
    });
  };

  const itemsFiltrados = items.filter(i => {
    const match = busqueda === "" || i.name.toLowerCase().includes(busqueda.toLowerCase()) || i.category.toLowerCase().includes(busqueda.toLowerCase()) || (i.brand || "").toLowerCase().includes(busqueda.toLowerCase());

    if (!match) return false;
    if (showMaintenanceOnly) {
      if (!i.maintenanceLogs || i.maintenanceLogs.length === 0) return false;
    }
    if (showDeliveredOnly) {
      const todayStr = new Date().toISOString().split("T")[0];
      const hasSalidaToday = i.movements?.some(m => {
        const mDate = new Date(m.createdAt).toISOString().split("T")[0];
        return mDate === todayStr && m.type === "SALIDA";
      });
      if (!hasSalidaToday) return false;
    }
    if (statusFilter === "Todos") return true;
    return i.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestiona equipos, solicitudes y mantenimiento.</p>
        </div>
        <button onClick={() => { resetEquipoForm(); setShowEquipoModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition text-sm shadow-sm">
          <Plus size={16} /> Nuevo Equipo
        </button>
      </div>

      {/* KPIs COMPACTOS */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MiniKpi label="Total" value={kpis.total} color="text-slate-700" />
        <MiniKpi label="Disponibles" value={kpis.disponibles} color="text-emerald-600" />
        <MiniKpi label="No Disponibles" value={kpis.asignados} color="text-red-600" />
      </div>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Buscar equipo, categoría o marca..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div className="relative">
          <select className="pl-9 pr-6 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white appearance-none font-medium text-slate-700" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} disabled={showMaintenanceOnly || showDeliveredOnly}>
            <option value="Todos">Todos</option>
            <option value="Disponible">Disponible</option>
            <option value="No disponible">No disponible</option>
          </select>
        </div>
        <button onClick={() => { setShowMaintenanceOnly(!showMaintenanceOnly); setShowDeliveredOnly(false); setStatusFilter("Todos"); }} className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition ${showMaintenanceOnly ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"} border shadow-sm`}>
          <Wrench size={16} /> En Mantenimiento
        </button>
        <button onClick={() => { setShowDeliveredOnly(!showDeliveredOnly); setShowMaintenanceOnly(false); setStatusFilter("Todos"); }} className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition ${showDeliveredOnly ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"} border shadow-sm`}>
          <Package size={16} /> Productos Entregados
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3">Equipo</th>
                <th className="px-5 py-3">Categoría</th>
                <th className="px-5 py-3 hidden md:table-cell">Marca / Serie</th>
                <th className="px-5 py-3">Stock</th>
                {showDeliveredOnly && (
                  <th className="px-5 py-3 text-center text-blue-600 font-bold">Entregas Hoy</th>
                )}
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsFiltrados.length === 0 ? (
                <tr><td colSpan={showDeliveredOnly ? 7 : 6} className="text-center py-16 text-slate-400"><Package size={32} className="mx-auto mb-2 opacity-30" />Sin equipos</td></tr>
              ) : itemsFiltrados.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition group">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    {item.location && <p className="text-xs text-slate-400">{item.location}</p>}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{item.category}</td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <p className="text-xs text-slate-700 font-medium">{item.brand || "—"}</p>
                    <p className="text-xs text-slate-400 font-mono">{item.serialNumber || "—"}</p>
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    {showMaintenanceOnly ? item.maintenanceLogs?.length : item.quantity}
                  </td>
                  {showDeliveredOnly && (
                    <td className="px-5 py-3 text-center font-black text-blue-600 bg-blue-50/30">
                      {(() => {
                        const todayStr = new Date().toISOString().split("T")[0];
                        const todayMovements = item.movements?.filter(m => {
                          const mDate = new Date(m.createdAt).toISOString().split("T")[0];
                          return mDate === todayStr;
                        }) || [];
                        const salidas = todayMovements.filter(m => m.type === "SALIDA").length;
                        const entradas = todayMovements.filter(m => m.type === "ENTRADA").length;
                        return salidas - entradas;
                      })()}
                    </td>
                  )}
                  <td className="px-5 py-3">
                    {showMaintenanceOnly ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-amber-100 text-amber-700">Mantenimiento</span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${item.status === "Disponible" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{item.status}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                      <button onClick={() => openSolicitud(item)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition" title="Solicitud"><ArrowUpDown size={14} /></button>
                      <button onClick={() => showMaintenanceOnly ? openResolveMant(item) : openMant(item)} className={`p-1.5 rounded-md transition ${showMaintenanceOnly ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50"}`} title={showMaintenanceOnly ? "Terminar Mantenimiento" : "Crear Mantenimiento"}>
                        {showMaintenanceOnly ? <Check size={14} /> : <Wrench size={14} />}
                      </button>
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition" title="Editar"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition" title="Eliminar"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODAL: EQUIPO ===== */}
      <Modal open={showEquipoModal} onClose={resetEquipoForm} title={editingId ? "Editar Equipo" : "Nuevo Equipo"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre *" value={formName} onChange={setFormName} placeholder="Ej: Laptop Dell" />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Categoría *</label>
            <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={formCategory} onChange={e => setFormCategory(e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="computadora">Computadora</option>
              <option value="laptop">Laptop</option>
              <option value="monitor">Monitor</option>
              <option value="celular">Celular</option>
              <option value="teclado">Teclado</option>
              <option value="mouse">Mouse</option>
              <option value="impresora">Impresora</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          {formCategory === "otro" && <Field label="Otra categoría *" value={formCustomCategory} onChange={setFormCustomCategory} placeholder="Especifica..." />}
          <Field label="Marca" value={formBrand} onChange={setFormBrand} placeholder="Ej: Dell, HP" />
          <Field label="Nro. Serie" value={formSerialNumber} onChange={setFormSerialNumber} placeholder="SN-123" />
          <Field label="Cantidad" value={formQuantity} onChange={setFormQuantity} type="number" min="0" />
          <Field label="Ubicación" value={formLocation} onChange={setFormLocation} placeholder="Oficina 101" />
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Descripción</label>
            <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-20" placeholder="Detalles adicionales..." value={formDesc} onChange={e => setFormDesc(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
          <button onClick={handleSubmitEquipo} disabled={isPending} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {editingId ? "Guardar" : "Crear Equipo"}
          </button>
        </div>
      </Modal>

      {/* ===== MODAL: SOLICITUD (ENTREGA/DEVOLUCIÓN) ===== */}
      <Modal open={showSolicitudModal} onClose={() => setShowSolicitudModal(false)} title={`Solicitud — ${solicitudItem?.name || ""}`} size="md">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
            Stock actual: <span className="font-bold">{solicitudItem?.quantity}</span> ·
            Estado: <span className="font-bold">{solicitudItem?.status}</span>
          </p>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button type="button" onClick={() => setSolicitudSubtype("ENTREGA")} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${solicitudSubtype === "ENTREGA" ? "bg-white text-red-600 shadow-sm" : "text-slate-500"}`}>ENTREGA</button>
            <button type="button" onClick={() => setSolicitudSubtype("VENTA")} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${solicitudSubtype === "VENTA" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>VENTA</button>
            <button type="button" onClick={() => setSolicitudSubtype("DEVOLUCION")} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${solicitudSubtype === "DEVOLUCION" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"}`}>DEVOLUCIÓN</button>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">Responsable</label>
              <button 
                type="button" 
                onClick={() => setIsCustomStaff(!isCustomStaff)}
                className={`p-1 rounded-md transition ${isCustomStaff ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                title={isCustomStaff ? "Seleccionar de la lista" : "Agregar persona sin cuenta"}
              >
                <Plus size={14} />
              </button>
            </div>
            {isCustomStaff ? (
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                placeholder="Nombre del responsable externo..." 
                value={solCustomStaff} 
                onChange={e => setSolCustomStaff(e.target.value)}
              />
            ) : (
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={solicitudUserId} onChange={e => setSolicitudUserId(e.target.value)}>
                <option value="">Sin especificar</option>
                {usersList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Motivo</label>
            <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-20" placeholder="Motivo de la solicitud..." value={solicitudReason} onChange={e => setSolicitudReason(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
          <button onClick={handleSubmitSolicitud} disabled={isPending} className={`px-5 py-2.5 text-white rounded-lg font-medium text-sm transition disabled:opacity-50 flex items-center gap-2 ${solicitudSubtype === "ENTREGA" ? "bg-red-600 hover:bg-red-700" : (solicitudSubtype === "VENTA" ? "bg-blue-600 hover:bg-blue-700 shadow-md" : "bg-emerald-600 hover:bg-emerald-700")}`}>
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpDown size={14} />} Confirmar {solicitudSubtype === "ENTREGA" ? "Entrega" : (solicitudSubtype === "VENTA" ? "Venta" : "Devolución")}
          </button>
        </div>
      </Modal>

      {/* ===== MODAL: MANTENIMIENTO ===== */}
      <Modal open={showMantModal} onClose={() => setShowMantModal(false)} title={`Mantenimiento — ${mantItem?.name || ""}`} size="md">
        <div className="space-y-4">
          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-center flex-wrap gap-1">
            Stock actual: <span className="font-bold">{mantItem?.quantity}</span>.
            Enviar <input type="number" min="1" max={mantItem?.quantity || 1} className="w-16 px-1 border border-amber-200 rounded text-center font-bold bg-white focus:outline-none focus:border-amber-400" value={mantQty} onChange={e => setMantQty(e.target.value)} /> unid. a mantenimiento.
          </p>
          <Field label="Asunto de la falla *" value={mantNombre} onChange={setMantNombre} placeholder="Ej: Pantalla rota" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Prioridad</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white" value={mantPrioridad} onChange={e => setMantPrioridad(e.target.value)}>
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
            <Field label="Técnico" value={mantTecnico} onChange={setMantTecnico} placeholder="Nombre..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Descripción *</label>
            <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none h-20" placeholder="Detalles de la falla..." value={mantDesc} onChange={e => setMantDesc(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
          <button onClick={handleSubmitMant} disabled={isPending} className="px-5 py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />} Crear Ticket
          </button>
        </div>
      </Modal>

      {/* ===== MODAL: LIBERAR MANTENIMIENTO ===== */}
      <Modal open={showResolveMantModal} onClose={() => setShowResolveMantModal(false)} title="Liberar de Mantenimiento" size="sm">
        <div className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
            <Check size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{resolveMantItem?.name}</h3>
          <p className="text-slate-500 text-sm">Hay <span className="font-bold text-slate-900">{resolveMantItem?.maintenanceLogs?.length}</span> unid. en mantenimiento.</p>

          <div className="pt-2 flex flex-col items-center">
            <label className="text-xs font-semibold text-slate-600 block mb-2">Unidades a liberar (regresan a Disponible):</label>
            <input type="number" min="1" max={resolveMantItem?.maintenanceLogs?.length || 1} className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white block" value={resolveMantQty} onChange={e => setResolveMantQty(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowResolveMantModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-medium text-sm transition">Cancelar</button>
          <button onClick={handleSubmitResolve} disabled={isPending} className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirmar
          </button>
        </div>
      </Modal>
    </div>
  );
}


function MiniKpi({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-slate-100">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", min }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; min?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <input
        type={type}
        min={min}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={e => {
          let val = e.target.value;
          if (type === "number" && min !== undefined && val !== "") {
            if (parseInt(val) < parseInt(min)) val = min;
          }
          onChange(val);
        }}
      />
    </div>
  );
}