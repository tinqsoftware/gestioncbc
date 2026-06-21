# Sistema de Gestión de Expedientes ANP (SistemaCBC)

Un sistema web integral, dinámico y moderno diseñado para registrar, administrar, dar seguimiento exhaustivo y auditar los expedientes de evaluación, supervisión y casos de instituciones universitarias (ANP).

## ✨ Arquitectura Visual y UX/UI

*   **Identidad Corporativa**: Logotipo personalizado (`cbc_logo.jpeg`) como favicon y título "SistemaCBC" en las pestañas del navegador.
*   **Diseño Premium (CSS Puro)**: Interfaz construida desde cero con variables CSS, paleta de colores cohesiva, bordes redondeados y tipografía moderna (Inter). Sin librerías de estilos pesadas.
*   **Sistema de Modales Reutilizable**: Popups con un sistema de clases común (`.modal-section`, `.field-grid`, `.field-value`) que alternan fluidamente entre **modo lectura** (los datos se ven como "fichas" limpias) y **modo edición** (formularios), todo sin cambiar de pantalla. Overlay con desenfoque y animación de entrada.
*   **Compatibilidad con Modo Oscuro de Windows**: Se fuerza `color-scheme: light` para que todos los desplegables nativos y sus listas se rendericen siempre claros (antes algunos aparecían en negro).
*   **Desplegables Uniformes**: Todos los `<select>` comparten un mismo estilo, con una variante compacta (`.form-control.compact`) para la barra de filtros.

## 🚀 Características y Funcionalidades Principales

### 1. Panel de Control — "Resumen General" (Dashboard)
Interfaz analítica *responsive* impulsada por **ApexCharts**, que lee los datos en tiempo real desde `/api/dashboard`:

*   **5 Tarjetas KPI**: Total de Expedientes + los 3 estados oficiales (**En trámite**, **Archivo**, **Derivado a UDRA**) + una tarjeta **"Por actualizar"** que se resalta en rojo cuando hay expedientes con estado pendiente de clasificar.
*   **5 Gráficos** (con aviso automático cuando no hay datos):
    *   **Por Tipo ANP** (dona): SNP, Acción Directa, Denuncia.
    *   **Evolución por Año** (barras): distribución 2022 → 2026.
    *   **Tipo de Gestión** (dona): Pública vs Privada.
    *   **Por Canal de Origen** (barras horizontales): Web, Correo, MP, FUD…
    *   **Top 10 Universidades** (barras horizontales).

### 2. Módulo de Expedientes (CRUD Completo)
La tabla `files` es el núcleo del sistema. Cada fila ofrece **dos accesos**:

*   **Lupa 🔍 — Modal de Detalle**: ver/editar el expediente completo, organizado en secciones tipo tarjeta (*Identificación · Clasificación · Detalle del caso · Comentarios*). Incluye **eliminación** del expediente con confirmación de seguridad.
*   **📋 — Modal de Seguimiento ANP**: ver/editar el seguimiento, con datos identificadores de solo lectura arriba y dos bloques editables: *Inicio ANP* y *Seguimiento ANP*.
*   **Cascada Modelo → CBC → Indicador**: al elegir Modelo se filtran los CBC, y los CBC filtran los indicadores disponibles. Los indicadores salen del campo `NroIndicador` del catálogo y se guardan como lista (`codigo_indicador`).
*   **Auto-sugerencias Dinámicas**: *Responsable* y *Canal de Origen* leen el historial (`DISTINCT`) de la base para autocompletar.
*   **Historial de Comentarios**: cada expediente guarda comentarios con fecha (almacenados como JSON en `historial_comentarios`).

### 3. Cálculo Automático de Vencimientos (Días Hábiles) + Feriados
*   En el modal de **Seguimiento ANP**, la **Fecha de Notificación** se elige por **calendario**, los **Días Hábiles** se escriben como número, y la **Fecha de Vencimiento** se **calcula sola** descontando sábados, domingos y **feriados registrados**. Aplica tanto a *Inicio ANP* como a *Seguimiento ANP*.
*   **Menú "Feriados"** 🗓️ (nuevo): página dedicada para **registrar y eliminar feriados** (fecha + descripción). Esas fechas son las que el cálculo de días hábiles descuenta automáticamente. Rechaza fechas duplicadas.

### 4. Estados de Expediente (3 oficiales + bandera de revisión)
Los estados se consolidaron a **3 valores oficiales**:
*   🟡 **En trámite**
*   🔵 **Archivo**
*   🔴 **Derivado a UDRA**

Cualquier registro que no coincida exactamente con uno de los 3 queda marcado como **"Actualizar estado"**, una bandera visible en la lista, en el filtro y en la tarjeta "Por actualizar" del Dashboard, para que sea corregido manualmente.

### 5. Buscadores, Filtros y Orden
*   **Buscador Anti-Tildes**: ignora mayúsculas, minúsculas y tildes, buscando en varias columnas a la vez (Nro de expediente, universidad, canal).
*   **Filtros Combinados**: por *Año*, *Tipo ANP*, *Estado* y *Prioridad*, recalculando tabla y paginación al instante.
*   **Orden de Registro**: desplegable para mostrar **"Más nuevos primero"** o **"Más antiguos primero"**.
*   **Paginación** configurable (10 / 25 / 50 / 100 / Todos).

### 6. Catálogos
*   **Universidades** y **Modelos / Indicadores**: páginas de consulta de los catálogos importados (`dim_universidades`, `dim_indicadores`), con buscador.

### 7. Reportabilidad
*   **Exportación a Excel**: reportes `.xlsx` con un clic (**SheetJS**), respetando los filtros aplicados en pantalla.

## 🗃️ Estructura de la Base de Datos

Base local en un único archivo `backend/database.sqlite`.

*   **`files`** — Tabla núcleo: todos los expedientes y sus metadatos. Incluye identificación (`internal_id`, `year`, `type_anp`, `canal_origen`, `nro_expediente_sunged`), entidad (`id_universidad`, `tipo_gestion`, `codigo_local`), clasificación (`modelo`, `cbc`, `codigo_indicador`, `complejidad`, `priority`), gestión (`status`, `profesional_asignado`, `observations`, `historial_comentarios`) y dos fases de plazos ANP (`inicio_anp_*` y `seg_anp_*`: documento, fecha de notificación, días hábiles, fecha de vencimiento, etc.).
*   **`dim_universidades`** (149) · **`dim_locales`** (848) · **`dim_indicadores`** (247) — Catálogos importados desde Excel (`scripts/import_catalogs.js`).
*   **`holidays`** — Feriados que alimentan el cálculo de días hábiles.
*   **`users`** — Credenciales y roles de acceso.

> Mantenimiento de datos aplicado: se eliminaron columnas de ubicación no usadas (`region/provincia/distrito/direccion`), se normalizó la **complejidad** a `Alta/Media/Baja` y se consolidaron los **estados** a los 3 oficiales.

## 🛠 Tecnologías Utilizadas

### Frontend
*   **React 18** (con **Vite**).
*   **CSS 3** (Custom Properties, Flexbox, CSS Grid).
*   **React Router** (navegación SPA).
*   **Lucide React** (iconografía).
*   **ApexCharts** (gráficos).
*   **SheetJS (xlsx)** (exportación a Excel).

*   `React 18`, `Vite`, `React Router`
*   `Lucide React`, `ApexCharts`, `SheetJS`
*   `Node.js`, `Express`, `Better-SQLite3`

## 🗄 Backend (Estructura de la API)

*   `GET/POST/PUT/DELETE /api/files` - CRUD de expedientes.
*   `GET /api/dashboard` - Métricas (estados, tipos, universidades, por año, gestión, canal).
*   `GET /api/catalogs/{universidades|locales|indicadores|opciones}` - Catálogos y opciones dinámicas.
*   `GET/POST/DELETE /api/holidays` - Gestión de feriados.
*   `GET/POST/PUT/DELETE /api/users` - CRUD de usuarios (Solo Admin).
*   `POST /api/users/:id/reset-password` - Reseteo de credenciales.
*   `POST /api/users/change-password` - Actualización de contraseña.
*   `POST /api/auth/login` - Autenticación con validación de bandera `must_change_password`.

### 6. Sistema de Seguridad y Gestión de Usuarios
Hemos implementado un robusto control de acceso (RBAC) y políticas de contraseñas:
*   **Inicio de Sesión Estricto**: Todo el sistema está protegido tras una pantalla de Login.
*   **Gestión de Usuarios (Admin)**: Módulo exclusivo para que los Administradores puedan crear, editar, eliminar y visualizar a todos los usuarios del sistema.
*   **Mi Perfil**: Cada usuario cuenta con un panel privado para consultar sus datos y cambiar su contraseña en cualquier momento.
*   **Cambio de Contraseña Forzado**: Medida de alta seguridad. Cuando un Administrador crea un usuario nuevo (con contraseña temporal) o resetea la contraseña de uno existente (a `12345678`), el sistema intercepta a ese usuario en su próximo inicio de sesión. No podrá acceder al Dashboard ni navegar hasta que obligatoriamente configure una nueva contraseña privada de mínimo 6 caracteres.

## 📥 Instalación y Despliegue

### 1. Levantar el Backend (API & DB)
```bash
cd backend
npm install
npm run dev
```
*Se crea/usa `database.sqlite` automáticamente y corre en el puerto `3001`.*

### 2. Levantar el Frontend (Interfaz)
```bash
cd frontend
npm install
npm run dev
```
*Accede desde `http://localhost:5173`.*

## 🔐 Cuentas de Acceso por Defecto

Al iniciar el backend por primera vez se generan automáticamente las siguientes cuentas maestras:

*   **Administrador** - `admin@sistema.com` / `admin123`
*   **Visualizador** - `visor@sistema.com` / `visor123`

*(Puedes utilizar la cuenta de Administrador para gestionar el resto de usuarios en el menú "Configuración" > "Usuarios").*

---
*Desarrollado para el seguimiento eficiente de expedientes ANP.*
