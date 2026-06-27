# StockFlow — Nexora
**Sistema de Gestión de Stock y Ventas**
Proyecto de Egreso · BT Informática 2026 · CETP-UTU

## Estructura

```
stockflow/
├── index.html              ← Login
├── css/
│   ├── reset.css
│   ├── variables.css       ← Colores, tipografía (editar acá para tema)
│   ├── main.css            ← Layout compartido (sidebar, header, cards)
│   └── login.css
├── js/
│   ├── store.js            ← localStorage + permisos por rol
│   └── login.js
└── pages/                  ← Se agrega en próximos commits
```

## Convenciones de commits

```
feat(módulo): nueva funcionalidad
fix(módulo): corrección de error
style(módulo): cambios de CSS sin lógica
refactor(módulo): reorganización sin cambiar comportamiento
docs: documentación
```

## Equipo

| Integrante | Rol en el proyecto |
|---|---|
| Agustín Giacobone | Organización, coordinación, colabora en todo |
| Renzo Corbo | Programación (frontend/backend) |
| Enzo Mera | Documentación, módulo de Ventas |
| Darío Prieto | Documentación, módulo de Inventario |

## Usuarios de prueba

| Email | Contraseña | Rol |
|---|---|---|
| admin@nexora.com | 1234 | administrador |
| vendedor@nexora.com | 1234 | vendedor |
| repositor@nexora.com | 1234 | repositor |
