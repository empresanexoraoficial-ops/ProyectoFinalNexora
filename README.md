# StockFlow — Nexora
**Sistema de gestión de stock y ventas para pequeños comercios**
Proyecto de Egreso · Bachillerato Tecnológico en Informática 2026 · CETP-UTU

StockFlow centraliza el inventario, las ventas con cobro, los ingresos de mercadería, los gastos y los reportes de un comercio, con tres roles y permisos diferenciados.

## Tecnologías
- **Frontend:** HTML5, CSS3 (sin framework, con diseño responsivo mobile first: 576 px, 768 px y 1024 px) y JavaScript con `fetch`.
- **Backend:** PHP 8 con programación orientada a objetos, en tres capas (API → Servicios → DAOs).
- **Base de datos:** MySQL / MariaDB, normalizada a 3FN (14 tablas), acceso con PDO y consultas preparadas.

## Estructura
```
├── index.html          Login
├── api/                14 endpoints REST (JSON)
├── clases/
│   ├── logica/         5 servicios: Auth, Catalogo, Ingreso, Personal, Venta
│   └── modelo/         13 DAOs (acceso a datos con PDO)
├── config/             Database.php (conexión, patrón Singleton)
├── css/                variables, estilos compartidos y login
├── js/                 un archivo por pantalla + nav, tema, idioma y validación
├── pages/              10 pantallas
├── db/                 ddl_stockflow.sql y datos de prueba (DML)
└── tests/              60 pruebas automatizadas de la API
```

## Instalación (Laragon o XAMPP)
1. Copiá el proyecto dentro de `C:\laragon\www\stockflow` (la carpeta debe contener directamente `index.html`, `api/`, etc.).
2. Creá la base: importá `db/ddl_stockflow.sql` y después `db/dml_demo_completo.sql`. **El primer script borra y recrea la base `stockflow`.**
3. Copiá `.env.example` como `.env` y completá los datos de conexión:
   ```
   DB_HOST=localhost
   DB_NAME=stockflow
   DB_USER=root
   DB_PASS=
   DB_CHARSET=utf8mb4
   ```
   El archivo `.env` no se sube a Git.
4. Abrí `http://stockflow.test` (Laragon) o la URL de tu servidor.

## Usuarios de prueba
| Email | Contraseña | Rol |
|---|---|---|
| admin@nexora.com | 1234 | administrador |
| vendedor@nexora.com | 1234 | vendedor |
| repositor@nexora.com | 1234 | repositor |

## Seguridad
- Consultas preparadas con PDO en todos los DAOs (sin concatenar SQL).
- Contraseñas con `password_hash()`; sesiones de PHP con cierre a los 30 minutos.
- Permisos por rol validados en el servidor (`AuthService::requerirRol`).
- Validación de campos en el navegador (`js/validacion.js`) y en el servidor (`clases/logica/Validador.php`): textos sin emojis ni símbolos como `< > { } [ ] \ | ^ ~ = *`, teléfonos solo con números y espacios, códigos (SKU y lote) con letras, números y `. _ - /`, y precios y cantidades solo numéricos, sin negativos y con tope.
- Al eliminar usuarios no se pueden borrar cuentas de Administrador, la propia ni usuarios con historial (se desactivan).

## Permisos por rol
- **Administrador:** todo (dashboard, inventario, gastos, reportes, personal con alta, edición, desactivación y eliminación, contenido).
- **Vendedor:** registra ventas con cobro y consulta su historial.
- **Repositor:** registra ingresos de mercadería, consulta el stock y agrega variantes.

## Pruebas automatizadas
Con el sistema corriendo y la base cargada:
```
php tests/casos_de_prueba.php http://stockflow.test
```
Ejecuta 60 casos contra la API (login, permisos, ventas, ingresos, gastos, reportes, personal, validación de campos y respuestas 404) y muestra el resultado de cada uno. Resultado esperado: `60/60 casos aprobados`. Requiere PHP con la extensión curl (incluida en Laragon y XAMPP).

## Versiones
| Tag | Entrega |
|---|---|
| `v1.0.0` | Primera Entrega (maqueta con `localStorage`) |
| `v0.2.0` | Segunda Entrega (backend PHP + base de datos) |
| `v2.0.0` | Tercera Entrega (versión final) |

## Convención de commits
```
feat(módulo): nueva funcionalidad
fix(módulo): corrección de error
style(módulo): cambios de CSS sin lógica
refactor(módulo): reorganización sin cambiar comportamiento
docs: documentación
test: pruebas
```
Las ramas son `feature/…`, `feat/…` y `fix/…` y se integran a `main` mediante Pull Request.

## Equipo
| Integrante | Rol |
|---|---|
| Agustín Giacobone | Coordinador |
| Renzo Corbo | Subcoordinador |
| Darío Prieto | Integrante |
| Enzo Mera | Integrante |
