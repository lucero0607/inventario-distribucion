"use client";

import { useState, useEffect, useTransition, startTransition } from "react";
import { User, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { actualizarPerfil } from "@/app/actions/usuarios";

const inputCls = "w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition";
const labelCls = "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider";

export default function PerfilView() {
    const [nombre, setNombre] = useState("Administrador");
    const [email, setEmail] = useState("admin@techsystem.com");
    const [role, setRole] = useState("ADMIN");
    const [passActual, setPassActual] = useState("");
    const [passNew, setPassNew] = useState("");
    const [passConf, setPassConf] = useState("");
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const n = localStorage.getItem("perfil_nombre");
        const e = localStorage.getItem("perfil_email");
        const r = localStorage.getItem("perfil_role");
        startTransition(() => {
            if (n) setNombre(n);
            if (e) setEmail(e);
            if (r) setRole(r);
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (passNew && passNew !== passConf) {
            setError("Las contraseñas nuevas no coinciden");
            return;
        }

        const userId = localStorage.getItem("user_id");
        if (!userId) {
            setError("No se encontró una sesión activa");
            return;
        }

        startTransition(async () => {
            const res = await actualizarPerfil(userId, {
                name: nombre,
                email: email,
                password: passNew || undefined
            });

            if (res.success) {
                localStorage.setItem("perfil_nombre", nombre);
                localStorage.setItem("perfil_email", email);
                setSaved(true); setPassActual(""); setPassNew(""); setPassConf("");
                setTimeout(() => setSaved(false), 3000);
                window.dispatchEvent(new Event("storage"));
            } else {
                setError(res.error || "Error al actualizar el perfil");
            }
        });
    };

    return (
        <form className="space-y-5" onSubmit={handleSave}>
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <User size={26} />
                </div>
                <div>
                    <p className="font-bold text-slate-900 dark:text-white text-base">{nombre}</p>
                    <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg mt-1 inline-block capitalize">{role.toLowerCase()}</span>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Nombre</label>
                    <div className="relative"><User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} className={inputCls + " pl-10"} /></div>
                </div>
                <div><label className={labelCls}>Correo</label>
                    <div className="relative"><Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls + " pl-10"} /></div>
                </div>
            </div>

            <div className="pt-1">
                <p className={`${labelCls} mb-3`}>Cambiar contraseña <span className="text-slate-400 font-normal normal-case">(dejar en blanco para no cambiar)</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[["Actual", passActual, setPassActual], ["Nueva", passNew, setPassNew], ["Confirmar", passConf, setPassConf]].map(([ph, val, fn]) => (
                        <div key={ph as string} className="relative">
                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="password" placeholder={ph as string} value={val as string} onChange={e => (fn as (v: string) => void)(e.target.value)} className={inputCls + " pl-10"} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                {saved ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm animate-in fade-in"><CheckCircle size={16} /> Guardado</span>
                ) : <div />}
                <button type="submit" disabled={isPending} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold text-sm transition active:scale-95 flex items-center gap-2">
                    {isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Guardar Cambios
                </button>
            </div>
        </form>
    );
}
