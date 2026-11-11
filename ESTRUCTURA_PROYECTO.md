# CulturedPass — Estructura de carpetas

Proyecto con dos carpetas independientes dentro de una raíz común:

```
CulturedPass/
├── server/        ← Backend (Node.js + Express + Prisma)   [ENTREGADO]
├── cliente/       ← Frontend (Vite + React, patrón MVC)    [pendiente: se desarrolla con el maquetado]
├── .gitignore
└── README.md
```

---

## 1. `server/` — Backend

```
server/
├── package.json                 Dependencias y scripts (npm run dev)
├── .env.example                 Plantilla de variables de entorno (copiar a .env)
├── .env                         Variables reales (NO se sube a Git)
├── .gitignore
│
├── prisma/
│   └── schema.prisma            Modelos que reflejan las tablas ya creadas en Supabase
│
├── scripts/
│   └── crearAdmin.js            Crea el primer administrador ya aprobado
│
└── src/
    ├── server.js                Punto de entrada: conecta a la BD y levanta Express
    ├── app.js                   Configura helmet, cors, JSON, cookies, rutas y errores
    │
    ├── config/
    │   ├── env.js               Lee y valida las variables de entorno
    │   └── prisma.js            Cliente único de Prisma
    │
    ├── routes/                  Define las URLs y qué middlewares/controladores usan
    │   ├── index.js             Agrupa todas las rutas bajo /api
    │   ├── auth.routes.js       Registro, login, logout, sesión actual
    │   ├── publico.routes.js    Visitantes: ver eventos, inscribirse, cancelar
    │   └── gestion.routes.js    Organizadores: eventos, asistencia, cuentas (requiere sesión)
    │
    ├── controllers/             Reciben req, devuelven res (req/res)
    │   ├── auth.controller.js
    │   ├── evento.controller.js
    │   ├── boleto.controller.js
    │   └── organizador.controller.js
    │
    ├── services/                Lógica de negocio reutilizable
    │   ├── inscripcion.service.js   Transacción de inscripción (control de cupo)
    │   ├── evento.service.js        Finalización automática de eventos vencidos
    │   └── email.service.js         Correos: boleto y aviso de cambios
    │
    ├── middlewares/
    │   ├── auth.js                  Verifica el JWT y que la cuenta siga aprobada
    │   ├── validar.js               Valida body/params/query con Zod
    │   ├── limitadores.js           Rate limiting (login, registro, inscripción, global)
    │   ├── intentosCancelacion.js   3 intentos + cooldown al cancelar
    │   └── errorHandler.js          Manejo centralizado de errores
    │
    ├── validators/
    │   └── schemas.js               Esquemas de validación (Zod)
    │
    └── utils/
        ├── AppError.js
        ├── asyncHandler.js
        ├── codigo.js                Generador de códigos de boleto (8 caracteres A-Z0-9)
        ├── fechas.js                Manejo de fecha/hora y zona horaria
        ├── html.js                  Escape de HTML para correos
        └── serializar.js            Formatea fechas/horas para el cliente
```

### Flujo de una petición

```
Cliente → app.js (helmet, cors, json, cookies, rate limit)
        → routes → middlewares (validar / autenticar)
        → controller → service → Prisma → Supabase (PostgreSQL)
        → res.json(...)   (cualquier error → errorHandler)
```

---

## 2. `cliente/` — Frontend (React + Vite, MVC del lado del cliente)  [ENTREGADO]

SPA con React Router. **Modelo** = datos y comunicación con la API; **Vista** = lo que se ve (componentes React y CSS); **Controlador** = hooks y contextos que conectan ambos.

```
cliente/
├── package.json                 Dependencias y scripts (npm run dev)
├── vite.config.js               Puerto 5173, proxy /api -> http://localhost:3000, cabeceras de seguridad
├── index.html                   Meta viewport (responsivo) + íconos de Google Fonts (Material Symbols)
├── .env.example                 VITE_API_URL=/api
├── public/
│   ├── favicon.jpg
│   └── fondo-teatro.jpg         (OPCIONAL) foto de teatro para el fondo; si no está se usa un degradado
│
└── src/
    ├── main.jsx                 Punto de entrada: Router + Providers + estilos
    ├── App.jsx                  Rutas de la SPA
    ├── assets/                  logo.jpg, telon.png
    │
    ├── models/                  MODELO
    │   ├── api/
    │   │   ├── cliente.js           fetch base (cookies, errores, sesión vencida)
    │   │   ├── authApi.js
    │   │   ├── eventosApi.js
    │   │   ├── boletosApi.js
    │   │   └── organizadoresApi.js
    │   ├── formato.js               Formato de fechas, búsqueda sin tildes, copiar al portapapeles
    │   └── validaciones.js          Mismas reglas de validación que el backend
    │
    ├── controllers/             CONTROLADOR
    │   ├── AuthContext.jsx          Sesión del organizador
    │   ├── ModalContext.jsx         Ventanas modales, avisos y refresco de listas
    │   ├── useCarga.js / useAccion.js   Hooks genéricos (cargar datos / ejecutar acciones)
    │   ├── useEventos.js            Eventos disponibles y finalizados
    │   ├── useInscripcion.js
    │   ├── useCancelacion.js        3 intentos + cooldown
    │   ├── useGestionEventos.js
    │   ├── useAsistencia.js
    │   └── useCuentas.js
    │
    └── views/                   VISTA
        ├── layout/                  Layout, Navbar (menú hamburguesa en celular), RutaProtegida
        ├── pages/                   Inicio, Eventos, GestionEventos, Asistencia, GestionCuentas, NoEncontrado
        ├── components/              TarjetaEvento, Panel, Campo, ImagenPortada, Icono, LogoCirculo, Aviso...
        ├── modales/                 ModalBase, ModalHost + 12 ventanas (detalle, inscripción, código,
        │                            cancelar, login, registro, crear/editar/eliminar evento,
        │                            editar/eliminar cuenta, cuenta no aprobada)
        └── styles/                  base.css, layout.css, componentes.css, modales.css, paginas.css
```

### Flujo en el cliente

```
Vista (página/modal) → Controlador (hook) → Modelo (api/*.js) → fetch /api/... → Backend
```

---

## 3. Archivos de la raíz

```
CulturedPass/.gitignore    node_modules/, .env, dist/
CulturedPass/README.md     Pasos para levantar server y cliente
```

---

## 4. Puertos en desarrollo

| Parte    | Carpeta    | Puerto | URL                     |
|----------|------------|--------|-------------------------|
| Backend  | `server/`  | 3000   | http://localhost:3000   |
| Frontend | `cliente/` | 5173   | http://localhost:5173   |
