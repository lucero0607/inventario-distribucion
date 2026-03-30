"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Edit3, Trash2, ArrowUpDown, ArrowUpRight, Wrench,
  LogOut, Loader2,
  Users, ShieldCheck, UserPlus, Star,
  UserCircle, LayoutDashboard, Menu, Save, X,
  Package, Box, CheckCircle, AlertTriangle, Activity,
  ChevronDown, Clock, Server, Filter, ChevronRight,
  Sun, Moon, Settings, Check
} from "lucide-react";

// Actions
import { getItems, crearItem, actualizarItem, eliminarItem, getKpisInventario } from "@/app/actions/inventario";
import { registrarMovimiento, getMovimientos, devolverMovimiento } from "@/app/actions/movimientos";
import { crearMantenimiento, getMantenimientos, cambiarEstadoMantenimiento, resolverMantenimientosLote } from "@/app/actions/mantenimiento";

import { getUsuarios, crearUsuario, cambiarEstadoUsuario, eliminarUsuario } from "@/app/actions/usuarios";
import { getCategorias, crearCategoria } from "@/app/actions/categorias";


// Components
import Modal from "./components/Modal";
import ActividadChart from "./components/ActividadChart";
import PerfilView from "./components/PerfilView";

// ============================================================
// TYPES
// ============================================================
interface Item {
  id: string; name: string; description: string | null; category: string;
  brand: string | null; serialNumber: string | null; quantity: number;
  status: string; location: string | null; createdAt: Date;
  maintenanceLogs?: { id: string }[];
  movements?: { id: string; type: string; createdAt: Date | string }[];
}

interface Movement {
  id: string; type: string; createdAt: Date | string;
  item?: { name: string } | null; responsibleUser?: { name: string } | null;
  customResponsible?: string | null;
  reason?: string | null;
  returnedAt?: Date | string | null;
}

interface MaintenanceLog {
  id: string; nombre: string; description: string;
  status: string; prioridad: string;
  tecnicoAsignado?: string | null;
  startDate: Date | string;
}

interface User {
  id: string; name: string; firstName: string | null;
  lastName: string | null; email: string | null;
  username: string; role: string; status: string;
  createdAt: Date | string;
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [dark, setDark] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("Administrador");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminRole, setAdminRole] = useState("ADMIN");

  // Data
  const [items, setItems] = useState<Item[]>([]);
  const [kpis, setKpis] = useState({ total: 0, disponibles: 0, enMantenimiento: 0, asignados: 0 });
  const [movimientos, setMovimientos] = useState<Movement[]>([]);
  const [mantenimientos, setMantenimientos] = useState<MaintenanceLog[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // UI
  const [busqueda, setBusqueda] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [showMaintenanceOnly, setShowMaintenanceOnly] = useState(false);
  const [historialTab, setHistorialTab] = useState<"mov" | "mant">("mov");
  const [histSearch, setHistSearch] = useState("");
  const [histStatusFilter, setHistStatusFilter] = useState("Todos");
  const [histPriorityFilter, setHistPriorityFilter] = useState("Todos");
  const [histDateFilter, setHistDateFilter] = useState("");

  // Modals
  const [showPerfil, setShowPerfil] = useState(false);
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [showMantModal, setShowMantModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Equipo Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formSerial, setFormSerial] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [formLocation, setFormLocation] = useState("");
  const [showDeliveredOnly, setShowDeliveredOnly] = useState(false);

  // Solicitud Form
  const [solItem, setSolItem] = useState<Item | null>(null);
  const [solSubtype, setSolSubtype] = useState<"ENTREGA" | "VENTA" | "DEVOLUCION">("ENTREGA");
  const [solStaffId, setSolStaffId] = useState("");
  const [solReason, setSolReason] = useState("");
  const [isCustomStaff, setIsCustomStaff] = useState(false);
  const [solCustomStaff, setSolCustomStaff] = useState("");

  // Mantenimiento Form
  const [mantItem, setMantItem] = useState<Item | null>(null);
  const [mantNombre, setMantNombre] = useState("");
  const [mantDesc, setMantDesc] = useState("");
  const [mantPrioridad, setMantPrioridad] = useState("Media");
  const [mantTecnico, setMantTecnico] = useState("");
  const [mantQty, setMantQty] = useState("1");

  const [showResolveMantModal, setShowResolveMantModal] = useState(false);
  const [resolveMantItem, setResolveMantItem] = useState<Item | null>(null);
  const [resolveMantQty, setResolveMantQty] = useState("1");

  // Delete
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);

  // Users Form
  const [userForm, setUserForm] = useState({ firstName: "", lastName: "", username: "", role: "STAFF", password: "", email: "" });
  const [showUserForm, setShowUserForm] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const perfil = {
    nombre: adminName,
    email: adminEmail,
    role: adminRole,
  };

  const [newCatName, setNewCatName] = useState("");
  const [showCatInput, setShowCatInput] = useState(false);

  // -------- LOAD --------
  const loadAll = async () => {
    console.log("Starting loadAll...");
    try {
      const [eqps, stats, mvts, mnts, users, cats] = await Promise.all([
        getItems(), getKpisInventario(), getMovimientos(), getMantenimientos(), getUsuarios(), getCategorias()
      ]);
      setItems(eqps as Item[]);
      setKpis(stats);
      setMovimientos(mvts);
      setMantenimientos(mnts);
      setUsersList(users);
      setCategories(cats);

      // Actualizar email del admin si se encuentra
      const me = users.find((u) => u.username === "admin" || (u as User).name === adminName);
      if (me?.email) setAdminEmail(me.email);
      console.log("loadAll COMPLETED successfully");
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  useEffect(() => {
    startTransition(() => {
      setIsMounted(true);
    });
    const isAuth = localStorage.getItem("is_authenticated");
    if (isAuth !== "true") { router.push("/login"); return; }
    // Apply saved theme
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    const n = localStorage.getItem("perfil_nombre");
    const r = localStorage.getItem("perfil_role");
    startTransition(() => {
      setDark(isDark);
      if (n) setAdminName(n);
      if (r) setAdminRole(r);
    });
    document.documentElement.classList.toggle("dark", isDark);
    const onChange = () => {
      const u = localStorage.getItem("perfil_nombre");
      const r = localStorage.getItem("perfil_role");
      if (u) setAdminName(u);
      if (r) setAdminRole(r);
    };
    window.addEventListener("storage", onChange);
    startTransition(() => {
      loadAll();
    });
    return () => window.removeEventListener("storage", onChange);
  }, []);

  // Auto-generación de email y usuario
  useEffect(() => {
    if (userForm.firstName || userForm.lastName) {
      const f = userForm.firstName.toLowerCase().trim();
      const l = userForm.lastName.toLowerCase().trim();
      if (f || l) {
        const generatedUser = f && l ? `${f.charAt(0)}${l}` : f || l;
        const generatedEmail = f && l ? `${f}.${l}@empresa.com` : `${f || l}@empresa.com`;
        startTransition(() => {
          setUserForm(prev => ({ ...prev, username: prev.username || generatedUser, email: generatedEmail }));
        });
      }
    }
  }, [userForm.firstName, userForm.lastName]);

  // Redirigir si no es ADMIN y está en la vista de personal
  useEffect(() => {
    if (adminRole !== "ADMIN" && activeView === "personal") {
      setActiveView("dashboard");
    }
  }, [adminRole, activeView]);

  const handleLogout = () => { localStorage.removeItem("is_authenticated"); router.push("/login"); };

  // -------- EQUIPO --------
  const resetEquipoForm = () => {
    setFormName(""); setFormDesc(""); setFormCategory(""); 
    setFormBrand(""); setFormSerial(""); setFormQty("1"); setFormLocation("");
    setEditingId(null); setShowEquipoModal(false);
  };

  const submitEquipo = () => {
    if (!formName.trim() || !formCategory.trim()) return;
    if (parseInt(formQty) < 0) {
      alert("La cantidad no puede ser negativa.");
      return;
    }
    startTransition(async () => {
      const cat = formCategory;
      const q = Math.max(0, parseInt(formQty) || 0);
      const p = { name: formName, description: formDesc || undefined, category: cat, brand: formBrand || undefined, serialNumber: formSerial || undefined, quantity: q, location: formLocation || undefined };
      if (editingId) await actualizarItem(editingId, p); else await crearItem(p);
      resetEquipoForm(); await loadAll();
    });
  };

  const openEdit = (item: Item) => {
    setEditingId(item.id); setFormName(item.name); setFormDesc(item.description || "");
    setFormCategory(item.category);
    setFormBrand(item.brand || ""); setFormSerial(item.serialNumber || "");
    setFormQty(String(item.quantity)); setFormLocation(item.location || "");
    setShowEquipoModal(true);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    startTransition(async () => {
      try {
        const newCat = await crearCategoria(newCatName);
        setCategories([...categories, newCat]);
        setFormCategory(newCat.name);
        setNewCatName("");
        setShowCatInput(false);
      } catch (err: any) {
        alert(err.message || "Error al crear categoría");
      }
    });
  };

  // -------- DELETE --------
  const confirmDelete = () => {
    if (!deleteItem) return;
    startTransition(async () => { await eliminarItem(deleteItem.id); setShowDeleteModal(false); setDeleteItem(null); await loadAll(); });
  };

  // -------- SOLICITUD --------
  const openSolicitud = async (item: Item) => {
    setSolItem(item); setSolSubtype("ENTREGA"); setSolStaffId(""); setSolReason("");
    setShowSolicitudModal(true);
  };

  const submitSolicitud = () => {
    if (!solItem) return;
    if (isCustomStaff && !solCustomStaff.trim()) {
      alert("Por favor ingresa el nombre del responsable.");
      return;
    }
    startTransition(async () => {
      await registrarMovimiento({ 
        type: solSubtype === "DEVOLUCION" ? "ENTRADA" : "SALIDA", 
        itemId: solItem.id, 
        userId: isCustomStaff ? undefined : (solStaffId || undefined), 
        customResponsible: isCustomStaff ? solCustomStaff : undefined,
        reason: solSubtype === "VENTA" ? `[VENTA] ${solReason}` : (solSubtype === "DEVOLUCION" ? `[DEVOLUCIÓN] ${solReason}` : solReason) 
      });
      setShowSolicitudModal(false); 
      setIsCustomStaff(false);
      setSolCustomStaff("");
      await loadAll();
    });
  };

  const handleDevolverDesdeHistorial = async (m: any) => {
    if (!confirm(`¿Deseas registrar la devolución de "${m.item?.name}"?`)) return;
    startTransition(async () => {
      try {
        await devolverMovimiento(m.id);
        await loadAll();
      } catch (error: any) {
        alert(error.message || "Error al registrar la devolución.");
      }
    });
  };

  // -------- MANTENIMIENTO --------
  const openMant = (item: Item) => {
    setMantItem(item); setMantNombre(""); setMantDesc(""); setMantPrioridad("Media"); setMantTecnico(""); setMantQty("1");
    setShowMantModal(true);
  };

  const submitMant = () => {
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
      setShowMantModal(false); await loadAll();
    });
  };

  const updateMantStatus = (id: string, status: string) => {
    startTransition(async () => { await cambiarEstadoMantenimiento(id, status); await loadAll(); });
  };

  const openResolveMant = (item: Item) => {
    if (!item.maintenanceLogs || item.maintenanceLogs.length === 0) return;
    setResolveMantItem(item);
    setResolveMantQty(item.maintenanceLogs.length.toString());
    setShowResolveMantModal(true);
  };

  const submitResolveMant = () => {
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
      await loadAll();
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    startTransition(async () => { await actualizarItem(id, { status }); await loadAll(); });
  };

  // -------- USUARIOS --------
  const loadUsers = async () => { setUsersList(await getUsuarios()); };
  const submitUser = () => {
    if (!userForm.firstName.trim() || !userForm.lastName.trim() || !userForm.username.trim()) return;
    startTransition(async () => {
      await crearUsuario({
        name: `${userForm.firstName} ${userForm.lastName}`,
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        username: userForm.username,
        role: userForm.role,
        password: userForm.password
      });
      setUserForm({ firstName: "", lastName: "", username: "", role: "STAFF", password: "", email: "" });
      setShowUserForm(false); await loadUsers();
    });
  };

  // -------- FILTERS --------
  const itemsFiltrados = items.filter(i => {
    const m = !busqueda || i.name.toLowerCase().includes(busqueda.toLowerCase()) || i.category.toLowerCase().includes(busqueda.toLowerCase()) || (i.brand || "").toLowerCase().includes(busqueda.toLowerCase());
    if (!m) return false;
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

  const filteredMov = movimientos.filter(m => {
    const s = histSearch.toLowerCase();
    const ms = !s || (m.item?.name || "").toLowerCase().includes(s) || (m.reason || "").toLowerCase().includes(s);
    const mst = histStatusFilter === "Todos" || m.type === histStatusFilter;
    let md = true;
    if (histDateFilter) { const d = new Date(m.createdAt); md = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0] === histDateFilter; }
    return ms && mst && md;
  });

  const filteredMant = mantenimientos.filter(m => {
    const s = histSearch.toLowerCase();
    const ms = !s || (m.nombre || "").toLowerCase().includes(s) || (m.tecnicoAsignado || "").toLowerCase().includes(s);
    const mst = histStatusFilter === "Todos" || m.status === histStatusFilter;
    const mp = histPriorityFilter === "Todos" || m.prioridad === histPriorityFilter;
    let md = true;
    if (histDateFilter) { const d = new Date(m.startDate); md = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0] === histDateFilter; }
    return ms && mst && mp && md;
  });

  if (!isMounted) return null;

  // ============================================================
  // LAYOUT COMPONENTS
  // ============================================================
  const navItems = [
    { id: "dashboard", label: "Panel", icon: <LayoutDashboard size={20} /> },
    { id: "inventario", label: "Inventario", icon: <Package size={20} /> },
    { id: "historial", label: "Historial", icon: <Clock size={20} /> },
    ...(adminRole === "ADMIN" ? [{ id: "personal", label: "Cuentas", icon: <Users size={20} /> }] : []),
  ];

  return (
    <div className={`${dark ? "dark" : ""} min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 font-sans flex`}>

      {/* ===== SIDEBAR ===== */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Server size={22} />
            </div>
            <span className="text-xl font-bold tracking-tight">TechSystem</span>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveView(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95 ${activeView === item.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setShowPerfil(true)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <UserCircle size={24} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{perfil.nombre}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{perfil.role}</p>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300" />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold tracking-tight capitalize hidden sm:block">
              {navItems.find(i => i.id === activeView)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Toggle de Modo Oscuro Prominente */}
            <button
              onClick={toggleDark}
              className="group flex items-center gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 hover:shadow-md"
              title="Cambiar tema"
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${dark ? "bg-slate-700 text-amber-400" : "bg-white text-blue-600 shadow-sm"}`}>
                {dark ? <Moon size={18} fill="currentColor" /> : <Sun size={18} />}
              </div>
              <div className="text-left hidden xs:block">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Sistema</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{dark ? "Oscuro" : "Claro"}</p>
              </div>
            </button>

            <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Cerrar Sesión"><LogOut size={20} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">

          {activeView === "dashboard" && (
            <div className="space-y-8">
              <section className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                <Kpi icon={<Package size={24} />} label="Total Equipos" value={kpis.total} color="blue" />
                <Kpi icon={<ArrowUpDown size={24} />} label="No Disponibles" value={kpis.asignados} color="indigo" />
                <Kpi icon={<CheckCircle size={24} />} label="Disponibles" value={kpis.disponibles} color="emerald" />
                <Kpi icon={<Wrench size={24} />} label="Mantenimiento" value={kpis.enMantenimiento} color="amber" />
                <Kpi icon={<ArrowUpRight size={24} />} label="Total Entregados" value={(kpis as any).totalEntregados || 0} color="rose" />
              </section>

              {/* Gráficos de actividad */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">Actividad Reciente</h3>
                  <div className="h-64">
                    <ActividadChart movimientos={movimientos} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "inventario" && (
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Package size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario de Equipos</h2>
                </div>
                <button onClick={() => { resetEquipoForm(); setShowEquipoModal(true); }} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-95">
                  <Plus size={20} /> Nuevo Equipo
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[280px]">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm" placeholder="Buscar equipo, marca o serie..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                </div>
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm overflow-x-auto">
                  {["Todos", "Disponible", "No disponible"].map(st => (
                    <button key={st} onClick={() => setStatusFilter(st)} disabled={showMaintenanceOnly || showDeliveredOnly} className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition ${statusFilter === st ? "bg-slate-900 dark:bg-slate-700 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"} disabled:opacity-50`}>{st}</button>
                  ))}
                </div>
                <button onClick={() => { setShowMaintenanceOnly(!showMaintenanceOnly); setShowDeliveredOnly(false); setStatusFilter("Todos"); }} className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${showMaintenanceOnly ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"} border shadow-sm`}>
                  <Wrench size={14} /> En Mantenimiento
                </button>
                <button onClick={() => { setShowDeliveredOnly(!showDeliveredOnly); setShowMaintenanceOnly(false); setStatusFilter("Todos"); }} className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${showDeliveredOnly ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"} border shadow-sm`}>
                  <Package size={14} /> Productos Entregados
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="px-5 py-4">Equipo</th>
                        <th className="px-5 py-4 hidden md:table-cell">Categoría</th>
                        <th className="px-5 py-4 hidden lg:table-cell">Marca / Serie</th>
                        <th className="px-5 py-4">Stock</th>
                        {showDeliveredOnly && (
                          <th className="px-5 py-4 text-center text-blue-600 dark:text-blue-400">Entregas Hoy</th>
                        )}
                        <th className="px-5 py-4">Estado</th>
                        <th className="px-5 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {itemsFiltrados.length === 0 ? (
                        <tr><td colSpan={showDeliveredOnly ? 6 : 5} className="text-center py-20 text-slate-400 dark:text-slate-600 text-sm"><Package size={40} className="mx-auto mb-3 opacity-20" />Sin resultados en el inventario</td></tr>
                      ) : itemsFiltrados.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="px-5 py-5">
                            <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">{item.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">{item.location || "Sin ubicación"}</p>
                          </td>
                          <td className="px-5 py-5 hidden md:table-cell">
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold uppercase">{item.category}</span>
                          </td>
                          <td className="px-5 py-5 hidden lg:table-cell">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.brand || "—"}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{item.serialNumber || "—"}</p>
                          </td>
                          <td className="px-5 py-5 font-bold text-slate-900 dark:text-white text-center">
                            {showMaintenanceOnly ? item.maintenanceLogs?.length : item.quantity}
                          </td>
                          {showDeliveredOnly && (
                            <td className="px-5 py-5 text-center font-black text-blue-600 dark:text-blue-400 bg-blue-50/10 dark:bg-blue-900/10">
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
                          <td className="px-5 py-5">
                            {showMaintenanceOnly ? (
                              <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">Mantenimiento</span>
                            ) : (
                              <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${item.status === "Disponible" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"}`}>{item.status}</span>
                            )}
                          </td>
                          <td className="px-5 py-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => openSolicitud(item)} className="w-11 h-11 flex items-center justify-center text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition active:scale-90" title="Entrega / Devolución"><ArrowUpDown size={18} /></button>
                              <button onClick={() => showMaintenanceOnly ? openResolveMant(item) : openMant(item)} className={`w-11 h-11 flex items-center justify-center rounded-xl transition active:scale-90 ${showMaintenanceOnly ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40"}`} title={showMaintenanceOnly ? "Finalizar Mantenimiento" : "Crear Mantenimiento"}>
                                {showMaintenanceOnly ? <Check size={18} /> : <Wrench size={18} />}
                              </button>
                              <button onClick={() => openEdit(item)} className="w-11 h-11 flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition active:scale-90" title="Editar"><Edit3 size={18} /></button>
                              <button onClick={() => { setDeleteItem(item); setShowDeleteModal(true); }} className="w-11 h-11 flex items-center justify-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition active:scale-90" title="Eliminar"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {activeView === "historial" && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-white">
                  <Clock size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Historial de Actividad</h2>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
                    <button onClick={() => { setHistorialTab("mov"); setHistStatusFilter("Todos"); }} className={`px-6 py-3 text-xs font-bold rounded-xl transition-all ${historialTab === "mov" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-none" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}>Movimientos</button>
                    <button onClick={() => { setHistorialTab("mant"); setHistStatusFilter("Todos"); setHistPriorityFilter("Todos"); }} className={`px-6 py-3 text-xs font-bold rounded-xl transition-all ${historialTab === "mant" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-none" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}>Mantenimiento</button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Buscar..." value={histSearch} onChange={e => setHistSearch(e.target.value)} />
                    </div>

                    {historialTab === "mov" && (
                      <select className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-blue-500 appearance-none" value={histStatusFilter} onChange={e => setHistStatusFilter(e.target.value)}>
                        <option value="Todos">Todos los tipos</option>
                        <option value="SALIDA">Entrega</option>
                        <option value="ENTRADA">Devolución</option>
                      </select>
                    )}

                    {historialTab === "mant" && (
                      <>
                        <select className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-blue-500 appearance-none" value={histStatusFilter} onChange={e => setHistStatusFilter(e.target.value)}>
                          <option value="Todos">Todos los estados</option>
                          <option value="Pendiente">Pendiente</option>
                          <option value="En proceso">En proceso</option>
                          <option value="Terminado">Terminado</option>
                        </select>
                        <select className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-amber-500 appearance-none" value={histPriorityFilter} onChange={e => setHistPriorityFilter(e.target.value)}>
                          <option value="Todos">Todas las prioridades</option>
                          <option value="Baja">Baja</option>
                          <option value="Media">Media</option>
                          <option value="Alta">Alta</option>
                          <option value="Urgente">Urgente</option>
                        </select>
                      </>
                    )}

                    <input type="date" className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 focus:ring-1 focus:ring-blue-500" value={histDateFilter} onChange={e => setHistDateFilter(e.target.value)} />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {historialTab === "mov" ? (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Equipo</th>
                          <th className="px-6 py-4">Tipo</th>
                          <th className="px-6 py-4 hidden sm:table-cell">Responsable</th>
                          <th className="px-6 py-4">Entrega</th>
                          <th className="px-6 py-4">Devolución</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredMov.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-20 text-slate-400 dark:text-slate-600 text-sm">No hay registros de movimientos</td></tr>
                        ) : filteredMov.map(m => {
                          const isVenta = m.reason?.toLowerCase().includes("[venta]");
                          const isDevolucion = !!m.returnedAt;
                          const label = isDevolucion ? "Devolución" : (isVenta ? "Venta" : "Entrega");
                          const colorClass = isDevolucion ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : (isVenta ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400");
                          
                          return (
                            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                              <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{m.item?.name || "—"}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${colorClass}`}>{label}</span>
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 hidden sm:table-cell">{m.responsibleUser?.name || m.customResponsible || "—"}</td>
                              <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500 font-mono italic">
                                {new Date(m.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                              <td className="px-6 py-4 text-xs text-emerald-600 dark:text-emerald-400 font-mono italic font-bold">
                                {m.returnedAt ? new Date(m.returnedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "—"}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {m.type === "SALIDA" && !isDevolucion && (
                                  <button onClick={() => handleDevolverDesdeHistorial(m)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition" title="Gestionar Devolución">
                                    <ArrowUpRight size={18} className="rotate-180" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Ticket de Mantenimiento</th>
                          <th className="px-6 py-4">Estado</th>
                          <th className="px-6 py-4 hidden sm:table-cell">Prioridad</th>
                          <th className="px-6 py-4 hidden md:table-cell">Asignado</th>
                          <th className="px-6 py-4">Fecha</th>
                          <th className="px-6 py-4 text-right">Gestión</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredMant.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-20 text-slate-400 dark:text-slate-600 text-sm">No hay tickets de mantenimiento</td></tr>
                        ) : filteredMant.map(m => (
                          <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800 dark:text-slate-200">{m.nombre}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1 line-clamp-1">{m.description}</p>
                            </td>
                            <td className="px-6 py-4"><span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${m.status === "Terminado" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : m.status === "En proceso" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"}`}>{m.status}</span></td>
                            <td className="px-6 py-4 text-xs hidden sm:table-cell font-bold"><span className={m.prioridad === "Urgente" ? "text-red-600 dark:text-red-400" : m.prioridad === "Alta" ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}>{m.prioridad}</span></td>
                            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">{m.tecnicoAsignado || "—"}</td>
                            <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500 italic">{new Date(m.startDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                            <td className="px-6 py-4 text-right">
                              <select className="text-[11px] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm" value={m.status} onChange={e => updateMantStatus(m.id, e.target.value)}>
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
            </section>
          )}

          {activeView === "personal" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-12">
              {/* Encabezado Profesional */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                      <ShieldCheck size={26} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Centro de Control de Cuentas</h2>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xl font-medium">Administración centralizada de identidades, permisos y seguridad del sistema.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-3 rounded-2xl shadow-sm flex flex-col items-center min-w-[100px]">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{usersList.length}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-3 rounded-2xl shadow-sm flex flex-col items-center min-w-[100px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Admins</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{usersList.filter(u => u.role === "ADMIN").length}</span>
                  </div>
                  <div className="bg-indigo-600 px-5 py-3 rounded-2xl shadow-lg shadow-indigo-600/20 flex flex-col items-center min-w-[100px]">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Activos</span>
                    <span className="text-xl font-black text-white">{usersList.filter(u => u.status === "ACTIVO").length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-10 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                  <div className="relative flex-1 w-full">
                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full pl-13 pr-6 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-base bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner" placeholder="Filtrar por nombre, usuario o rol..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                  </div>
                  <button onClick={() => setShowUserForm(!showUserForm)} className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-black transition-all active:scale-95 ${showUserForm ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/30"}`}>
                    {showUserForm ? <X size={20} /> : <UserPlus size={20} />}
                    {showUserForm ? "Cancelar Registro" : "Crear Nueva Cuenta"}
                  </button>
                </div>

                {showUserForm && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-8 rounded-[32px] mb-10 border border-indigo-100 dark:border-indigo-900/30 space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <Field label="Nombre" v={userForm.firstName} set={n => setUserForm({ ...userForm, firstName: n })} ph="Ej: Juan" />
                      <Field label="Apellido" v={userForm.lastName} set={a => setUserForm({ ...userForm, lastName: a })} ph="Ej: Pérez" />
                      <Field label="Email Corporativo" v={userForm.email} set={e => setUserForm({ ...userForm, email: e })} ph="generación automática..." />
                      <Field label="ID de Usuario (@)" v={userForm.username} set={u => setUserForm({ ...userForm, username: u })} ph="Identificador único" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pl-1 pr-2">
                          <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rol</label>
                          <button
                            type="button"
                            className="bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-400 p-1 rounded-md transition"
                            title="Agregar Nuevo Rol"
                            onClick={() => {
                              const newRole = prompt("Nombre del nuevo rol:");
                              if (newRole && newRole.trim()) {
                                setUserForm({ ...userForm, role: newRole.trim().toUpperCase() });
                              }
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <select className="w-full px-5 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none font-bold" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                          {Array.from(new Set(["STAFF", "ADMIN", ...usersList.map((u) => u.role), userForm.role])).map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <Field label="Clave de Acceso" v={userForm.password} set={p => setUserForm({ ...userForm, password: p })} ph="Contraseña segura" type="password" />
                    </div>
                    <div className="flex justify-end">
                      <button onClick={submitUser} disabled={isPending} className="px-12 py-4 bg-indigo-600 text-white text-base font-black rounded-2xl hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-600/20">Registrar y Activar Cuenta</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {usersList.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.role.toLowerCase().includes(userSearch.toLowerCase())).length === 0 ? (
                    <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px]">
                      <UserCircle size={48} className="text-slate-200 dark:text-slate-800" />
                      <p className="text-slate-400 font-medium text-lg">No se encontraron registros coincidentes</p>
                    </div>
                  ) : usersList.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.role.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                    <div key={u.id} className={`group relative rounded-[32px] border p-6 transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] ${u.name === adminName ? "bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-500/20" : "bg-white dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:shadow-indigo-600/5"}`}>
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 ${u.role === "ADMIN" ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20" : "bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-500/20"}`}>
                          {u.role === "ADMIN" ? <ShieldCheck size={28} /> : <UserCircle size={28} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-slate-900 dark:text-white truncate text-lg pr-4">{u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">@{u.username}</span>
                            <span className={`w-2 h-2 rounded-full animate-pulse ${u.status === "ACTIVO" ? "bg-emerald-500" : "bg-red-500"}`}></span>
                            {u.name === adminName && <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase ml-1">Tú</span>}
                          </div>
                        </div>
                      </div>

                      {u.email && (
                        <div className="mb-4 px-1 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Save size={12} className="opacity-50" />
                          <p className="text-[11px] font-medium truncate">{u.email}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rol Asignado</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{u.role}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                          <p className={`text-xs font-bold ${u.status === "ACTIVO" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>{u.status}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-6 px-1">
                        <Clock size={12} className="text-slate-400" />
                        <p className="text-[10px] text-slate-400 font-medium italic">Última actividad: Hoy, 10:45 AM</p>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                        <button onClick={() => startTransition(async () => { await cambiarEstadoUsuario(u.id, u.status === "ACTIVO" ? "INACTIVO" : "ACTIVO"); await loadUsers(); })} className="flex-1 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-95 shadow-sm">
                          {u.status === "ACTIVO" ? "Suspender Acceso" : "Restaurar Cuentas"}
                        </button>
                        <button onClick={() => { if (confirm("¿Eliminar cuenta permanentemente?")) startTransition(async () => { await eliminarUsuario(u.id); await loadUsers(); }); }} className="p-3 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition active:scale-95">
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {u.role === "ADMIN" && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-amber-900 shadow-lg border-4 border-white dark:border-slate-900 rotate-12">
                          <Star size={14} fill="currentColor" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =============== MODALS =============== */}

      {/* PERFIL */}
      <Modal open={showPerfil} onClose={() => setShowPerfil(false)} title="Mi Perfil" size="lg">
        <PerfilView />
      </Modal>

      {/* EQUIPO */}
      <Modal open={showEquipoModal} onClose={resetEquipoForm} title={editingId ? "Editar Equipo" : "Nuevo Equipo"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre *" v={formName} set={setFormName} ph="Ej: Laptop Dell" />
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoría *</label>
              <button 
                type="button" 
                onClick={() => setShowCatInput(!showCatInput)}
                className={`p-1 rounded-md transition ${showCatInput ? "bg-red-500 text-white" : "bg-blue-600 text-white shadow-sm shadow-blue-500/20"}`}
                title={showCatInput ? "Cancelar" : "Agregar categoría personalizada"}
              >
                {showCatInput ? <X size={12} /> : <Plus size={12} />}
              </button>
            </div>
            {showCatInput ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-4 py-2.5 border border-blue-200 dark:border-blue-900/50 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  placeholder="Nueva categoría..." 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                />
                <button 
                  onClick={handleCreateCategory}
                  className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  title="Guardar Categoría"
                >
                  <Save size={16} />
                </button>
              </div>
            ) : (
              <select className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer" value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                <option value="">Seleccionar</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>
          <Field label="Marca" v={formBrand} set={setFormBrand} ph="Dell, HP..." />
          <Field label="Nro. Serie" v={formSerial} set={setFormSerial} ph="SN-123" />
          <Field label="Cantidad" v={formQty} set={setFormQty} type="number" min="0" />
          <Field label="Ubicación" v={formLocation} set={setFormLocation} ph="Oficina 101" />
          <div className="sm:col-span-2 space-y-1"><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descripción</label><textarea className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 resize-none" placeholder="Detalles adicionales..." value={formDesc} onChange={e => setFormDesc(e.target.value)} /></div>
        </div>
        <div className="flex justify-end mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={submitEquipo} disabled={isPending} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 flex items-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {editingId ? "Guardar" : "Crear"}
          </button>
        </div>
      </Modal>

      {/* ELIMINAR CONFIRMACIÓN */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteItem(null); }} title="Confirmar eliminación" size="sm">
        <div className="text-center space-y-5 px-2">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto transition-transform hover:scale-110"><Trash2 size={24} className="text-red-600 dark:text-red-400" /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">¿Estás seguro de que quieres eliminar?</p>
            <p className="font-bold text-slate-900 dark:text-white text-xl mt-1 tracking-tight">{deleteItem?.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 leading-relaxed">Esta acción eliminará el equipo y todos sus registros asociados. No se puede deshacer.</p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={() => { setShowDeleteModal(false); setDeleteItem(null); }} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95">Cancelar</button>
            <button onClick={confirmDelete} disabled={isPending} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* SOLICITUD */}
      <Modal open={showSolicitudModal} onClose={() => setShowSolicitudModal(false)} title={`Solicitud — ${solItem?.name || ""}`} size="md">
        <div className="space-y-5">
          {solItem && <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">Estado actual: <span className="font-bold text-slate-700 dark:text-slate-200">{solItem.status}</span> · Cantidad: <span className="font-bold">{solItem.quantity}</span></p>}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
            <button type="button" onClick={() => setSolSubtype("ENTREGA")} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${solSubtype === "ENTREGA" ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm" : "text-slate-500 dark:text-slate-500 hover:text-slate-700"}`}>ENTREGA</button>
            <button type="button" onClick={() => setSolSubtype("VENTA")} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${solSubtype === "VENTA" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-500 hover:text-slate-700"}`}>VENTA</button>
            <button type="button" onClick={() => setSolSubtype("DEVOLUCION")} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${solSubtype === "DEVOLUCION" ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500 dark:text-slate-500 hover:text-slate-700"}`}>DEVOLUCIÓN</button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Responsable</label>
              <button 
                type="button" 
                onClick={() => setIsCustomStaff(!isCustomStaff)}
                className={`p-1 rounded-md transition ${isCustomStaff ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`}
                title={isCustomStaff ? "Seleccionar de la lista" : "Agregar persona sin cuenta"}
              >
                <Plus size={14} />
              </button>
            </div>
            {isCustomStaff ? (
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                placeholder="Nombre del responsable externo..." 
                value={solCustomStaff} 
                onChange={e => setSolCustomStaff(e.target.value)}
              />
            ) : (
              <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none" value={solStaffId} onChange={e => setSolStaffId(e.target.value)}>
                <option value="">Sin especificar</option>{usersList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}
          </div>
          <div className="space-y-1"><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Motivo</label>
            <textarea className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none h-24 resize-none" placeholder="Motivo de la solicitud..." value={solReason} onChange={e => setSolReason(e.target.value)} />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">Al confirmar, se descontará o aumentará 1 unidad del inventario automáticamente.</p>
        </div>
        <div className="flex justify-end mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={submitSolicitud} disabled={isPending} className={`flex-1 sm:flex-none px-6 py-3 text-white rounded-xl text-sm font-bold transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${solSubtype === "ENTREGA" ? "bg-red-600 hover:bg-red-700" : (solSubtype === "VENTA" ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" : "bg-emerald-600 hover:bg-emerald-700")}`}>
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpDown size={16} />} Confirmar {solSubtype === "ENTREGA" ? "Entrega" : (solSubtype === "VENTA" ? "Venta" : "Devolución")}
          </button>
        </div>
      </Modal>

      {/* MANTENIMIENTO */}
      <Modal open={showMantModal} onClose={() => setShowMantModal(false)} title={`Mantenimiento — ${mantItem?.name || ""}`} size="md">
        <div className="space-y-4">
          {mantItem && <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-center flex-wrap gap-2"><span>Estado actual: <span className="font-bold">{mantItem.status}</span>. Enviar</span><input type="number" min="1" max={mantItem.quantity || 1} className="w-16 px-2 py-1 border border-amber-200 dark:border-amber-700/50 rounded-lg text-center font-bold bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500" value={mantQty} onChange={e => setMantQty(e.target.value)} /><span>unid. a mantenimiento.</span></p>}
          <Field label="Asunto *" v={mantNombre} set={setMantNombre} ph="Ej: Falla de pantalla" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prioridad</label>
              <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none appearance-none" value={mantPrioridad} onChange={e => setMantPrioridad(e.target.value)}>
                <option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option><option value="Urgente">Urgente</option>
              </select>
            </div>
            <Field label="Técnico" v={mantTecnico} set={setMantTecnico} ph="Nombre del técnico..." />
          </div>
          <div className="space-y-1"><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descripción *</label>
            <textarea className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none h-24 resize-none" placeholder="Detalla la falla del equipo..." value={mantDesc} onChange={e => setMantDesc(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={submitMant} disabled={isPending} className="w-full py-3 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />} Crear Ticket de Mantenimiento
          </button>
        </div>
      </Modal>

      {/* LIBERAR MANTENIMIENTO */}
      <Modal open={showResolveMantModal} onClose={() => setShowResolveMantModal(false)} title="Liberar de Mantenimiento" size="sm">
        <div className="space-y-5 text-center px-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-2 shadow-inner">
            <Check size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{resolveMantItem?.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Hay <span className="font-bold text-slate-900 dark:text-white">{resolveMantItem?.maintenanceLogs?.length}</span> unid. en mantenimiento.</p>
          </div>

          <div className="pt-4 pb-2 flex flex-col items-center">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Unidades a liberar</label>
            <input type="number" min="1" max={resolveMantItem?.maintenanceLogs?.length || 1} className="w-28 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-2xl font-black focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" value={resolveMantQty} onChange={e => setResolveMantQty(e.target.value)} />
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Volverán al stock Disponible</p>
          </div>
        </div>
        <div className="flex gap-3 justify-center mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => setShowResolveMantModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95">Cancelar</button>
          <button onClick={submitResolveMant} disabled={isPending} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Confirmar
          </button>
        </div>
      </Modal>

    </div>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================
function Kpi({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const t: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    indigo: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 flex items-center gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-600 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${t[color]}`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1 leading-none">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, v, set, ph, type = "text", min }: { label: string; v: string; set: (s: string) => void; ph?: string; type?: string; min?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
      <input type={type} min={min} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder={ph} value={v} onChange={e => set(e.target.value)} />
    </div>
  );
}