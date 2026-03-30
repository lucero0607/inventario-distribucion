"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    size?: "sm" | "md" | "lg" | "xl";
    children: React.ReactNode;
}

const sizeMap = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl", xl: "max-w-3xl" };

export default function Modal({ open, onClose, title, size = "md", children }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />
            {/* Panel */}
            <div className={`relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl w-full ${sizeMap[size]} max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300`}>
                {title && (
                    <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}
