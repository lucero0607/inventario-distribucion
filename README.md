# Inventario & Distribución

Sistema de gestión de inventario premium diseñado para el control eficiente de entregas, ventas y mantenimiento de equipos.

## 🚀 Características Principales

- **Dashboard Inteligente**: Visualización en tiempo real de KPIs (Disponibles, No disponibles, Mantenimiento, etc.) y gráficos de actividad reciente.
- **Gestión de Inventario**: Control detallado de stock, marcas, series y estados de equipos.
- **Sistema de Entregas & Ventas**: Modal interactivo para registrar salidas, permitiendo asignar responsables (usuarios del sistema o externos).
- **Control de Devoluciones (Single-Row)**: Gestión optimizada que permite marcar devoluciones en el mismo registro de entrega, manteniendo la trazabilidad con fechas exactas de salida y entrada.
- **Mantenimiento**: Módulo para seguimiento de reparaciones con prioridades y estados.
- **Historial de Movimientos**: Registro completo y auditable de todas las transacciones realizadas.

## 🛠️ Tecnologías

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Lucide React (Icons), Recharts (Charts).
- **Backend/ORM**: Prisma (SQLite para desarrollo local rápido).
- **Lenguaje**: TypeScript.
- **Estilo**: Shadcn UI / Custom Premium Glassmorphism.

## 📦 Instalación

1. Clona el repositorio.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicializa la base de datos:
   ```bash
   npx prisma db push
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 🔒 Auditoría & Trazabilidad

- Cada movimiento registra el usuario responsable.
- Soporta responsables externos mediante el campo `customResponsible`.
- Las devoluciones actualizan automáticamente el stock y registran el timestamp `returnedAt`.
