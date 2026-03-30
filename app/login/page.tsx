"use client";

import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Server, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { loginUsuario } from "@/app/actions/usuarios";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [dark, setDark] = useState(false);

    useEffect(() => {
        startTransition(() => {
            setIsMounted(true);
        });
        // Cargar tema
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            startTransition(() => {
                setDark(true);
            });
        }

        // Si ya está logueado, redirigir al home
        const isAuth = localStorage.getItem("is_authenticated");
        if (isAuth === "true") {
            router.push("/");
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await loginUsuario(email, password);

            if (res.success && res.user) {
                // Guardar sesión y datos del perfil
                localStorage.setItem("is_authenticated", "true");
                localStorage.setItem("user_id", res.user.id);
                localStorage.setItem("perfil_nombre", res.user.name || "Usuario");
                localStorage.setItem("perfil_email", res.user.email || email);
                localStorage.setItem("perfil_role", res.user.role || "STAFF");

                router.push("/");
            } else {
                setError(res.error || "Correo electrónico o contraseña incorrectos");
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Error al intentar conectar con el servidor");
            setIsLoading(false);
        }
    };

    return (
        <div className={`${dark ? "dark" : ""} min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden font-sans transition-opacity duration-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>

            {/* Elementos decorativos de fondo */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-400/5 blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] rounded-full bg-indigo-500/10 dark:bg-indigo-400/5 blur-3xl"></div>
            </div>

            <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-500">

                {/* Encabezado del Formulario */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-blue-500/10 border border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto mb-5 text-blue-600 dark:text-blue-400 transition-transform hover:scale-110">
                        <Server size={40} />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">TechSystem</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Gestión de Inventario y Mantenimiento</p>
                </div>

                {/* Tarjeta de Login */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-8">Iniciar Sesión</h2>

                    <form onSubmit={handleLogin} className="space-y-6">

                        {/* Campo Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Correo Electrónico</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@techsystem.com"
                                    className="w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    disabled={isLoading}
                                />
                                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            </div>
                        </div>

                        {/* Campo Contraseña */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contraseña</label>
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    disabled={isLoading}
                                />
                                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            </div>
                        </div>

                        {/* Mensaje de Error */}
                        {error && (
                            <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1 duration-300">
                                <AlertCircle size={18} className="shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        {/* Botón de Enviar */}
                        <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-2xl font-bold text-base transition-all active:scale-95 shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 group mt-2"
                        >
                            {isLoading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <>
                                    Ingresar al sistema
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Credenciales de prueba:</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold">admin@techsystem.com / admin123</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
