/**
 * js/English.js — Base del idioma de StockFlow (ES/EN)
 *
 * Uso:
 *   1) Incluir en cada página ANTES del resto de los scripts:
 *        <script src="js/English.js"></script>
 *   2) En el HTML, marcar textos estáticos:
 *        <h1 data-i18n="dashboard.titulo"></h1>
 *        <input data-i18n-placeholder="login.usuario">
 *        <button data-i18n-title="menu.salir">...</button>
 *        <button data-i18n-aria="comun.cerrar">✕</button>      (aria-label)
 *        <p data-i18n-html="ing.nota"></p>                       (texto con <strong>)
 *   3) En JS (mensajes, modales, alertas):
 *        alert(t('login.error_credenciales'));
 *        t('gastos.eliminar_confirm', { nombre: 'Luz' })  // usa {nombre}
 *
 * Convención de claves: "<pantalla>.<texto>" (ej: login.titulo, menu.inicio).
 * Cada pantalla agrega sus claves en DICCIONARIO.es y DICCIONARIO.en.
 */
(function () {
  'use strict';

  var CLAVE_IDIOMA = 'sf_idioma';   // la misma que guarda la página Configuración
  var IDIOMA_DEFECTO = 'es';
  var IDIOMAS = ['es', 'en'];

  var DICCIONARIO = {
    es: {
      // ===== Común =====
      'comun.guardar': 'Guardar',
      'comun.cancelar': 'Cancelar',
      'comun.aceptar': 'Aceptar',
      'comun.eliminar': 'Eliminar',
      'comun.editar': 'Editar',
      'comun.buscar': 'Buscar',
      'comun.cerrar': 'Cerrar',
      'comun.error_generico': 'Ocurrió un error. Intentá de nuevo.',
      'comun.error_inesperado': 'Error inesperado.',
      'comun.sin_datos': 'Sin datos',
      'comun.cargando': 'Cargando...',
      'comun.critico': 'Crítico',
      'comun.pendiente': 'Pendiente',
      'comun.obligatorio': 'Obligatorio.',
      'comun.si': 'Sí',
      'comun.no': 'No',
      'comun.desactivar': 'Desactivar',
      'comun.cambiar_idioma': 'Cambiar a inglés',

      // ===== Roles =====
      'rol.administrador': 'Administrador',
      'rol.vendedor': 'Vendedor',
      'rol.repositor': 'Repositor',

      // ===== Encabezado y menú =====
      'menu.inicio': 'Inicio',
      'menu.dashboard': 'Dashboard',
      'menu.inventario': 'Inventario',
      'menu.ingresos': 'Ingresos',
      'menu.ventas': 'Nueva Venta',
      'menu.gastos': 'Gastos',
      'menu.reportes': 'Reportes',
      'menu.personal': 'Personal',
      'menu.contenido': 'Contenido',
      'menu.configuracion': 'Configuración',
      'menu.salir': 'Cerrar sesión',
      'nav.email': 'Email',
      'nav.telefono': 'Teléfono',
      'nav.rol': 'Rol',

      // ===== Login =====
      'login.titulo': 'Iniciar sesión',
      'login.email': 'Email',
      'login.contrasena': 'Contraseña',
      'login.entrar': 'Ingresar',
      'login.email_obligatorio': 'El email es obligatorio.',
      'login.pass_obligatoria': 'La contraseña es obligatoria.',
      'login.error_credenciales': 'Email o contraseña incorrectos.',
      'login.error_conexion': 'No se pudo conectar con el servidor. Intentá de nuevo.',

      // ===== Inicio =====
      'inicio.hola': 'Hola, {nombre}',
      'inicio.desc.dashboard': 'Métricas del negocio',
      'inicio.desc.inventario': 'Gestión de productos',
      'inicio.desc.ingresos': 'Registrar mercadería',
      'inicio.desc.ventas': 'Registrar una venta',
      'inicio.desc.gastos': 'Cargar gastos operativos',
      'inicio.desc.reportes': 'Ver informes del negocio',
      'inicio.desc.personal': 'Gestionar empleados',
      'inicio.desc.contenido': 'Atributos y tipos de producto',
      'inicio.desc.configuracion': 'Idioma y tema',
      'inicio.ventas_hoy': 'Ventas hoy',
      'inicio.stock_critico': 'Stock crítico',
      'inicio.variantes_reponer': 'variantes por reponer',
      'inicio.productos_activos': 'Productos activos',
      'inicio.en_catalogo': 'en el catálogo',
      'inicio.tus_ventas_hoy': 'Tus ventas de hoy',
      'inicio.por_vencer': 'Por vencer (≤15 días)',
      'inicio.revisar_pronto': 'revisar pronto',
      'inicio.ultimas_ventas': 'Tus últimas ventas',
      'inicio.ultimos_ingresos': 'Últimos ingresos registrados',
      'inicio.avisos': 'Avisos',
      'inicio.marcar_todos': 'Marcar todos como leídos',
      'inicio.leido': 'Leído',

      // ===== Dashboard =====
      'dash.margen': 'Margen: {valor}',
      'dash.sin_ventas': 'Sin ventas aún',
      'dash.unidades_vendidas': '{n} unidades vendidas',
      'dash.sin_datos': 'Sin datos aún',
      'dash.sin_alertas': 'Sin alertas de stock',

      // ===== Gastos =====
      'gastos.categoria_obligatoria': 'La categoría es obligatoria.',
      'gastos.monto_invalido': 'Ingresá un monto válido.',
      'gastos.registrado': 'Gasto registrado: {monto}',
      'gastos.sin_gastos': 'Sin gastos registrados.',

      // ===== Reportes =====
      'rep.resultado': 'Resultado',
      'rep.titulo_ventas': 'Reporte de Ventas',
      'rep.titulo_stock': 'Reporte de Stock',
      'rep.titulo_gastos': 'Reporte de Gastos',
      'rep.titulo_rentabilidad': 'Rentabilidad Estimada por Producto',
      'rep.fecha': 'Fecha',
      'rep.canal': 'Canal',
      'rep.vendedor': 'Vendedor',
      'rep.total': 'Total',
      'rep.producto': 'Producto',
      'rep.sku': 'SKU',
      'rep.stock': 'Stock',
      'rep.minimo': 'Mínimo',
      'rep.estado': 'Estado',
      'rep.categoria': 'Categoría',
      'rep.monto': 'Monto',
      'rep.costo': 'Costo',
      'rep.precio_venta': 'Venta',
      'rep.margen': 'Margen',
      'rep.unidades_vendidas': 'Unidades vendidas',
      'rep.rotacion': 'Rotación',

      // ===== Personal =====
      'personal.vos': '(vos)',
      'personal.activo': 'Activo',
      'personal.inactivo': 'Inactivo',
      'personal.activar': 'Activar',
      'personal.desactivar': 'Desactivar',
      'personal.sin_usuarios': 'Sin usuarios.',
      'personal.nuevo': 'Nuevo usuario',
      'personal.editar_titulo': 'Editar usuario',
      'personal.pass_requerida': 'Contraseña *',
      'personal.pass_nueva': 'Nueva contraseña (vacío = no cambiar)',
      'personal.elegir_rol': 'Seleccioná un rol.',
      'personal.actualizado': 'Usuario actualizado.',
      'personal.creado': 'Usuario creado.',
      'personal.confirmar_activar': '¿Activar a {nombre}?',
      'personal.confirmar_desactivar': '¿Desactivar a {nombre}?',
      'personal.activado': 'Usuario activado.',
      'personal.desactivado': 'Usuario desactivado.',

      // ===== Contenido =====
      'contenido.genera_variante': 'Genera variante',
      'contenido.dato_fijo': 'Dato fijo',
      'contenido.sin_atributos': 'Sin atributos todavía.',
      'contenido.sin_tipos': 'Sin tipos todavía.',
      'contenido.cargar_primero': 'Cargá atributos primero.',
      'contenido.confirmar_tipo': '¿Desactivar este tipo? Los productos que ya lo usan no se ven afectados, pero no va a poder elegirse para productos nuevos.',
      'contenido.confirmar_atributo': '¿Desactivar este atributo? No se borra, solo deja de estar disponible para elegir.',
      'contenido.tipo_desactivado': 'Tipo desactivado.',
      'contenido.atributo_desactivado': 'Atributo desactivado.',
      'contenido.atributo_creado': 'Atributo creado.',
      'contenido.tipo_creado': 'Tipo creado.',
      'contenido.poner_nombre': 'Poné un nombre.',

      // ===== Configuración =====
      'config.titulo': 'Configuración',
      'config.idioma': 'Idioma',
      'config.idioma_es': 'Español',
      'config.idioma_en': 'Inglés',
      'config.tema_guardado': 'Tema guardado.',
      'config.descripcion': 'Preferencias personales. Se guardan en este navegador y se aplican en todas las pantallas.',
      'config.idioma_interfaz': 'Idioma de la interfaz',
      'config.apariencia': 'Apariencia',
      'config.tema': 'Tema',
      'config.tema_claro': 'Claro',
      'config.tema_oscuro': 'Oscuro',
      'config.idioma_guardado': 'Idioma guardado.',

      // ===== Común (extra) =====
      'comun.nombre': 'Nombre',
      'comun.nombre_req': 'Nombre *',
      'comun.email_req': 'Email *',
      'comun.tipo': 'Tipo',
      'comun.acciones': 'Acciones',
      'comun.descripcion': 'Descripción',
      'comun.cliente': 'Cliente',
      'comun.proveedor': 'Proveedor',
      'comun.marca': 'Marca',
      'comun.atributos': 'Atributos',
      'comun.categoria_req': 'Categoría *',
      'comun.monto_req': 'Monto *',
      'comun.rol_req': 'Rol *',
      'comun.unidades': 'Unidades',
      'comun.recibido': 'Recibido',
      'comun.pago': 'Pago',
      'comun.productos': 'Productos',
      'comun.variante': 'Variante',
      'comun.buscar_puntos': 'Buscar...',
      'comun.cambiar': 'Cambiar',
      'comun.abrir_menu': 'Abrir menú',
      'comun.detalles_cuenta': 'Detalles de cuenta',
      'comun.contraer_menu': 'Contraer o expandir menú',
      'comun.nombre_nuevo': 'Nombre nuevo',
      'comun.nav_principal': 'Navegación principal',
      'inicio.accesos_rapidos': 'Accesos rápidos',
      'dash.margen_vacio': 'Margen: —',

      // ===== Títulos de página =====
      'pag.login': 'StockFlow — Iniciar sesión',
      'pag.inicio': 'StockFlow — Inicio',
      'pag.dashboard': 'StockFlow — Dashboard',
      'pag.inventario': 'StockFlow — Inventario',
      'pag.ingresos': 'StockFlow — Ingresos',
      'pag.ventas': 'StockFlow — Nueva Venta',
      'pag.gastos': 'StockFlow — Gastos',
      'pag.reportes': 'StockFlow — Reportes',
      'pag.personal': 'StockFlow — Personal',
      'pag.contenido': 'StockFlow — Administración de contenido',
      'config.titulo_pagina': 'StockFlow — Configuración',

      // ===== Login (HTML) =====
      'login.subtitulo': 'Sistema de gestión de stock y ventas · Nexora',

      // ===== Dashboard (HTML) =====
      'dash.ver_ventas': 'Ver ventas',
      'dash.ver_gastos': 'Ver gastos',
      'dash.ver_inventario': 'Ver inventario',
      'dash.gastos_mes': 'Gastos del mes',
      'dash.productos_click': 'productos — click para ver',
      'dash.productos_en_stock': 'Productos en stock',
      'dash.click_inventario': 'click para ver inventario',
      'dash.favoritos': 'Favoritos',
      'dash.mas_vendido': 'Producto más vendido',
      'dash.mas_vendidos': 'Productos más vendidos',
      'dash.alertas_stock': 'Alertas de stock',
      'dash.rechazada': '⚠ Mercadería rechazada por proveedor',
      'dash.th_rechazadas': 'Unidades rechazadas',
      'dash.th_ingresos_empresa': 'Ingresos con esta empresa',

      // ===== Gastos (HTML) =====
      'gastos.titulo': 'Gastos Operativos',
      'gastos.cargar': 'Cargar gasto',
      'gastos.ph_categoria': 'Logística, publicidad...',
      'gastos.registrar': 'Registrar gasto',
      'gastos.historial': 'Historial',
      'gastos.registrado_por': 'Registrado por',

      // ===== Reportes (HTML) =====
      'rep.desde': 'Desde',
      'rep.hasta': 'Hasta',
      'rep.tipo_reporte': 'Tipo de reporte',
      'rep.opt_ventas': 'Ventas',
      'rep.opt_rentabilidad': 'Rentabilidad estimada',
      'rep.generar': 'Generar reporte',

      // ===== Personal (HTML) =====
      'personal.titulo': 'Gestión de Personal',
      'personal.btn_nuevo': '+ Nuevo usuario',
      'personal.seleccionar': 'Seleccioná',

      // ===== Contenido (HTML) =====
      'contenido.titulo': 'Administración de contenido',
      'contenido.descripcion': 'Acá se definen los Atributos (Color, Talle, Marca, etc.) y los Tipos de producto (Ropa, Bebida, etc.) que después se usan al crear productos y variantes en Inventario.',
      'contenido.atributos': 'Atributos',
      'contenido.ph_atributo': 'Ej: Color, Sabor, Marca',
      'contenido.genera_variantes_q': '¿Genera variantes distintas?',
      'contenido.opt_si_variante': 'Sí — cada valor es un producto separado (Talle, Color)',
      'contenido.opt_no_variante': 'No — dato fijo del producto (Marca, Material)',
      'contenido.btn_atributo': '+ Agregar atributo',
      'contenido.tipos_producto': 'Tipos de producto',
      'contenido.ph_tipo': 'Ej: Ropa, Bebida, Decoración',
      'contenido.requiere_venc': 'Este tipo necesita fecha de vencimiento',
      'contenido.atributos_del_tipo': 'Atributos que usa este tipo',
      'contenido.btn_tipo': '+ Agregar tipo',
      'contenido.th_vencimiento': 'Vencimiento',

      // ===== Inventario =====
      'inv.ph_buscar': 'Buscar por nombre, marca o tipo...',
      'inv.btn_nuevo_producto': '+ Nuevo producto',
      'inv.th_precio_venta': 'Precio venta',
      'inv.th_stock_total': 'Stock total',
      'inv.variantes': 'Variantes',
      'inv.nuevo_producto': 'Nuevo producto',
      'inv.ph_nombre': 'Nombre del producto',
      'inv.tipo_req': 'Tipo *',
      'inv.elegir_tipo': 'Elegir tipo...',
      'inv.ph_categoria': 'Ej: Ropa de verano',
      'inv.precio_costo': 'Precio costo ($)',
      'inv.precio_venta': 'Precio venta ($)',
      'inv.ph_opcional': 'Opcional',
      'inv.crear_producto': 'Crear producto',
      'inv.agregar_variante': 'Agregar variante',
      'inv.nota_stock_inicial': 'El stock inicial se carga desde <strong>Ingresos</strong>, no acá — esta variante arranca en 0.',
      'inv.sku_opcional': 'SKU (opcional)',
      'inv.ph_sku': 'Ej: REM-AZ-M',
      'inv.stock_minimo': 'Stock mínimo',
      'inv.fecha_venc': 'Fecha de vencimiento',
      'inv.th_vence': 'Vence',
      'inv.sin_resultados_para': 'Sin resultados para "{filtro}".',
      'inv.sin_productos': 'Sin productos todavía.',
      'inv.ver': 'Ver',
      'inv.btn_variante': '+ Variante',
      'inv.err_nombre': 'El nombre es obligatorio.',
      'inv.err_tipo': 'Elegí un tipo.',
      'inv.err_precio': 'El precio de venta no puede ser menor al costo.',
      'inv.producto_creado': 'Producto creado.',
      'inv.sin_attr_variante': 'Este tipo no tiene atributos de variante — se crea una variante única.',
      'inv.err_attrs': 'Completá todos los atributos.',
      'inv.variante_agregada': 'Variante agregada. Cargá el stock real desde Ingresos.',
      'inv.sin_variantes': 'Sin variantes todavía.',

      // ===== Ingresos =====
      'ing.titulo': 'Ingresos de Mercadería',
      'ing.registrar': 'Registrar ingreso',
      'ing.producto_variante': 'Producto / variante *',
      'ing.ph_buscar_variante': 'Buscá por nombre, talle, color, marca...',
      'ing.cant_recibida': 'Cantidad recibida *',
      'ing.cant_buena': 'Cantidad en buen estado *',
      'ing.ph_proveedor': 'Nombre del proveedor',
      'ing.contacto_proveedor': 'Teléfono / contacto del proveedor',
      'ing.ph_contacto': 'Ej: 099 123 456',
      'ing.lote_req': 'N.º de lote / remito *',
      'ing.ph_lote': 'Para trazabilidad, evita cargar el mismo remito 2 veces',
      'ing.fecha_ingreso': 'Fecha de ingreso',
      'ing.hora_registro': 'Hora de registro',
      'ing.observaciones': 'Observaciones (estado / calidad)',
      'ing.ph_obs': 'Ej: 2 unidades con detalle de costura, no aptas para la venta',
      'ing.nota': 'Solo la <strong>cantidad en buen estado</strong> se suma automáticamente al Inventario. El resto queda registrado como merma / no apto para la venta. ¿El producto todavía no existe? Un Administrador tiene que crearlo primero en Inventario.',
      'ing.ph_buscar_ingreso': 'Buscar por producto, proveedor o lote...',
      'ing.th_fecha_hora': 'Fecha / hora',
      'ing.th_apto': 'Apto p/ venta',
      'ing.th_lote': 'Lote',
      'ing.th_operador': 'Operador',
      'ing.proveedores': 'Proveedores',
      'ing.ficha_proveedores': 'Ficha armada automáticamente a partir de los ingresos registrados.',
      'ing.th_contacto': 'Contacto',
      'ing.th_productos_provee': 'Productos que provee',
      'ing.th_ingresos': 'Ingresos',
      'ing.th_rechazadas': 'Unid. rechazadas',
      'ing.sin_resultados': 'Sin resultados. Si el producto no existe, un Administrador lo crea en Inventario.',
      'ing.stock_actual': 'Stock actual: {n}',
      'ing.cargando_para': 'Cargando ingreso para:',
      'ing.stock_actual_par': '(stock actual: {n})',
      'ing.err_variante': 'Buscá y elegí un producto/variante.',
      'ing.err_cantidad': 'Ingresá una cantidad válida.',
      'ing.err_buena': 'Ingresá la cantidad en buen estado (puede ser 0).',
      'ing.err_buena_mayor': 'No puede ser mayor a la cantidad recibida.',
      'ing.err_lote': 'El número de remito es obligatorio (evita cargar el mismo 2 veces).',
      'ing.registrado': 'Ingreso registrado. {n} unidad(es) sumadas al inventario.',
      'ing.sin_ingresos': 'Sin ingresos registrados.',
      'ing.sin_proveedores': 'Sin proveedores registrados aún.',
      'ing.sin_proveedor_esp': 'Sin proveedor especificado',

      // ===== Ventas =====
      'ventas.titulo': 'Registrar Venta',
      'ventas.buscar_producto': 'Buscar producto',
      'ventas.vacia': 'Sin productos agregados aún.',
      'ventas.total_dos_puntos': 'Total:',
      'ventas.datos_cliente': 'Datos del cliente',
      'ventas.canal_venta': 'Canal de venta',
      'ventas.canal_presencial': 'Presencial',
      'ventas.canal_otro': 'Otro',
      'ventas.direccion_entrega': 'Dirección de entrega',
      'ventas.ph_calle': 'Calle',
      'ventas.ph_numero': 'Número',
      'ventas.ph_barrio': 'Barrio',
      'ventas.ph_ciudad': 'Ciudad',
      'ventas.cobro': 'Cobro',
      'ventas.aviso_pendiente': '<strong>Hay productos sin stock suficiente.</strong> La venta quedará <strong>PENDIENTE</strong>: no se cobra ahora ni se descuenta stock. Se resuelve cuando llegue la mercadería.',
      'ventas.metodo_pago': 'Método de pago',
      'ventas.pago_efectivo': 'Efectivo',
      'ventas.pago_tarjeta': 'Tarjeta',
      'ventas.pago_transferencia': 'Transferencia',
      'ventas.paga_con': 'Paga con',
      'ventas.exacto': 'Exacto',
      'ventas.sin_monto': 'Se cobra el total justo. No hace falta ingresar un monto.',
      'ventas.historial': 'Historial de ventas',
      'ventas.comprobante': 'Comprobante de venta',
      'ventas.nueva_venta': 'Nueva venta',
      'ventas.imprimir': 'Imprimir',
      'ventas.sin_resultados': 'Sin resultados.',
      'ventas.sin_stock': 'Sin stock',
      'ventas.en_stock': '{n} en stock',
      'ventas.vuelto': 'Vuelto',
      'ventas.faltan': 'Faltan',
      'ventas.registrar_pendiente': 'Registrar venta pendiente',
      'ventas.confirmar_cobrar': 'Confirmar y cobrar',
      'ventas.confirmar_cobrar_monto': 'Confirmar y cobrar {monto}',
      'ventas.ticket_pendiente': 'PENDIENTE<br>sin stock · no se cobró',
      'ventas.ticket_venta_n': 'Venta N.º',
      'ventas.ticket_fecha': 'Fecha',
      'ventas.ticket_vendedor': 'Vendedor',
      'ventas.ticket_cliente': 'Cliente',
      'ventas.ticket_total': 'TOTAL',
      'ventas.ticket_pago': 'Pago',
      'ventas.ticket_recibido': 'Recibido',
      'ventas.ticket_pie': 'Comprobante no fiscal<br>Gracias por su compra',
      'ventas.err_sin_items': 'Agregá al menos un producto.',
      'ventas.toast_pendiente': 'Venta registrada como PENDIENTE (sin stock suficiente). Total: {total}',
      'ventas.toast_cobrada': 'Venta cobrada. Total: {total}',
      'ventas.venta_n': 'Venta #{id}',
      'ventas.confirmada': 'Confirmada',
      'ventas.sin_ventas': 'Sin ventas registradas.'
    },

    en: {
      // ===== Common =====
      'comun.guardar': 'Save',
      'comun.cancelar': 'Cancel',
      'comun.aceptar': 'OK',
      'comun.eliminar': 'Delete',
      'comun.editar': 'Edit',
      'comun.buscar': 'Search',
      'comun.cerrar': 'Close',
      'comun.error_generico': 'Something went wrong. Please try again.',
      'comun.error_inesperado': 'Unexpected error.',
      'comun.sin_datos': 'No data',
      'comun.cargando': 'Loading...',
      'comun.critico': 'Critical',
      'comun.pendiente': 'Pending',
      'comun.obligatorio': 'Required.',
      'comun.si': 'Yes',
      'comun.no': 'No',
      'comun.desactivar': 'Deactivate',
      'comun.cambiar_idioma': 'Switch to Spanish',

      // ===== Roles =====
      'rol.administrador': 'Administrator',
      'rol.vendedor': 'Salesperson',
      'rol.repositor': 'Stock Clerk',

      // ===== Header and menu =====
      'menu.inicio': 'Home',
      'menu.dashboard': 'Dashboard',
      'menu.inventario': 'Inventory',
      'menu.ingresos': 'Stock Intake',
      'menu.ventas': 'New Sale',
      'menu.gastos': 'Expenses',
      'menu.reportes': 'Reports',
      'menu.personal': 'Staff',
      'menu.contenido': 'Content',
      'menu.configuracion': 'Settings',
      'menu.salir': 'Log out',
      'nav.email': 'Email',
      'nav.telefono': 'Phone',
      'nav.rol': 'Role',

      // ===== Login =====
      'login.titulo': 'Log in',
      'login.email': 'Email',
      'login.contrasena': 'Password',
      'login.entrar': 'Log in',
      'login.email_obligatorio': 'Email is required.',
      'login.pass_obligatoria': 'Password is required.',
      'login.error_credenciales': 'Incorrect email or password.',
      'login.error_conexion': 'Could not connect to the server. Please try again.',

      // ===== Home =====
      'inicio.hola': 'Hello, {nombre}',
      'inicio.desc.dashboard': 'Business metrics',
      'inicio.desc.inventario': 'Product management',
      'inicio.desc.ingresos': 'Record incoming goods',
      'inicio.desc.ventas': 'Record a sale',
      'inicio.desc.gastos': 'Log operating expenses',
      'inicio.desc.reportes': 'View business reports',
      'inicio.desc.personal': 'Manage employees',
      'inicio.desc.contenido': 'Attributes and product types',
      'inicio.desc.configuracion': 'Language and theme',
      'inicio.ventas_hoy': 'Sales today',
      'inicio.stock_critico': 'Critical stock',
      'inicio.variantes_reponer': 'variants to restock',
      'inicio.productos_activos': 'Active products',
      'inicio.en_catalogo': 'in the catalog',
      'inicio.tus_ventas_hoy': 'Your sales today',
      'inicio.por_vencer': 'Expiring soon (≤15 days)',
      'inicio.revisar_pronto': 'check soon',
      'inicio.ultimas_ventas': 'Your latest sales',
      'inicio.ultimos_ingresos': 'Latest stock intakes',
      'inicio.avisos': 'Alerts',
      'inicio.marcar_todos': 'Mark all as read',
      'inicio.leido': 'Read',

      // ===== Dashboard =====
      'dash.margen': 'Margin: {valor}',
      'dash.sin_ventas': 'No sales yet',
      'dash.unidades_vendidas': '{n} units sold',
      'dash.sin_datos': 'No data yet',
      'dash.sin_alertas': 'No stock alerts',

      // ===== Expenses =====
      'gastos.categoria_obligatoria': 'Category is required.',
      'gastos.monto_invalido': 'Enter a valid amount.',
      'gastos.registrado': 'Expense recorded: {monto}',
      'gastos.sin_gastos': 'No expenses recorded.',

      // ===== Reports =====
      'rep.resultado': 'Result',
      'rep.titulo_ventas': 'Sales Report',
      'rep.titulo_stock': 'Stock Report',
      'rep.titulo_gastos': 'Expenses Report',
      'rep.titulo_rentabilidad': 'Estimated Profitability by Product',
      'rep.fecha': 'Date',
      'rep.canal': 'Channel',
      'rep.vendedor': 'Salesperson',
      'rep.total': 'Total',
      'rep.producto': 'Product',
      'rep.sku': 'SKU',
      'rep.stock': 'Stock',
      'rep.minimo': 'Minimum',
      'rep.estado': 'Status',
      'rep.categoria': 'Category',
      'rep.monto': 'Amount',
      'rep.costo': 'Cost',
      'rep.precio_venta': 'Sale price',
      'rep.margen': 'Margin',
      'rep.unidades_vendidas': 'Units sold',
      'rep.rotacion': 'Turnover',

      // ===== Staff =====
      'personal.vos': '(you)',
      'personal.activo': 'Active',
      'personal.inactivo': 'Inactive',
      'personal.activar': 'Activate',
      'personal.desactivar': 'Deactivate',
      'personal.sin_usuarios': 'No users.',
      'personal.nuevo': 'New user',
      'personal.editar_titulo': 'Edit user',
      'personal.pass_requerida': 'Password *',
      'personal.pass_nueva': 'New password (leave blank to keep current)',
      'personal.elegir_rol': 'Select a role.',
      'personal.actualizado': 'User updated.',
      'personal.creado': 'User created.',
      'personal.confirmar_activar': 'Activate {nombre}?',
      'personal.confirmar_desactivar': 'Deactivate {nombre}?',
      'personal.activado': 'User activated.',
      'personal.desactivado': 'User deactivated.',

      // ===== Content =====
      'contenido.genera_variante': 'Creates variants',
      'contenido.dato_fijo': 'Fixed data',
      'contenido.sin_atributos': 'No attributes yet.',
      'contenido.sin_tipos': 'No types yet.',
      'contenido.cargar_primero': 'Create attributes first.',
      'contenido.confirmar_tipo': 'Deactivate this type? Products already using it are not affected, but it can no longer be chosen for new products.',
      'contenido.confirmar_atributo': 'Deactivate this attribute? It is not deleted, it just stops being available to choose.',
      'contenido.tipo_desactivado': 'Type deactivated.',
      'contenido.atributo_desactivado': 'Attribute deactivated.',
      'contenido.atributo_creado': 'Attribute created.',
      'contenido.tipo_creado': 'Type created.',
      'contenido.poner_nombre': 'Enter a name.',

      // ===== Settings =====
      'config.titulo': 'Settings',
      'config.idioma': 'Language',
      'config.idioma_es': 'Spanish',
      'config.idioma_en': 'English',
      'config.tema_guardado': 'Theme saved.',
      'config.descripcion': 'Personal preferences. They are saved in this browser and apply to all screens.',
      'config.idioma_interfaz': 'Interface language',
      'config.apariencia': 'Appearance',
      'config.tema': 'Theme',
      'config.tema_claro': 'Light',
      'config.tema_oscuro': 'Dark',
      'config.idioma_guardado': 'Language saved.',

      // ===== Common (extra) =====
      'comun.nombre': 'Name',
      'comun.nombre_req': 'Name *',
      'comun.email_req': 'Email *',
      'comun.tipo': 'Type',
      'comun.acciones': 'Actions',
      'comun.descripcion': 'Description',
      'comun.cliente': 'Customer',
      'comun.proveedor': 'Supplier',
      'comun.marca': 'Brand',
      'comun.atributos': 'Attributes',
      'comun.categoria_req': 'Category *',
      'comun.monto_req': 'Amount *',
      'comun.rol_req': 'Role *',
      'comun.unidades': 'Units',
      'comun.recibido': 'Received',
      'comun.pago': 'Payment',
      'comun.productos': 'Products',
      'comun.variante': 'Variant',
      'comun.buscar_puntos': 'Search...',
      'comun.cambiar': 'Change',
      'comun.abrir_menu': 'Open menu',
      'comun.detalles_cuenta': 'Account details',
      'comun.contraer_menu': 'Collapse or expand menu',
      'comun.nombre_nuevo': 'New name',
      'comun.nav_principal': 'Main navigation',
      'inicio.accesos_rapidos': 'Quick access',
      'dash.margen_vacio': 'Margin: —',

      // ===== Page titles =====
      'pag.login': 'StockFlow — Log in',
      'pag.inicio': 'StockFlow — Home',
      'pag.dashboard': 'StockFlow — Dashboard',
      'pag.inventario': 'StockFlow — Inventory',
      'pag.ingresos': 'StockFlow — Stock Intake',
      'pag.ventas': 'StockFlow — New Sale',
      'pag.gastos': 'StockFlow — Expenses',
      'pag.reportes': 'StockFlow — Reports',
      'pag.personal': 'StockFlow — Staff',
      'pag.contenido': 'StockFlow — Content Management',
      'config.titulo_pagina': 'StockFlow — Settings',

      // ===== Login (HTML) =====
      'login.subtitulo': 'Stock and sales management system · Nexora',

      // ===== Dashboard (HTML) =====
      'dash.ver_ventas': 'View sales',
      'dash.ver_gastos': 'View expenses',
      'dash.ver_inventario': 'View inventory',
      'dash.gastos_mes': 'Expenses this month',
      'dash.productos_click': 'products — click to view',
      'dash.productos_en_stock': 'Products in stock',
      'dash.click_inventario': 'click to view inventory',
      'dash.favoritos': 'Favorites',
      'dash.mas_vendido': 'Best-selling product',
      'dash.mas_vendidos': 'Best-selling products',
      'dash.alertas_stock': 'Stock alerts',
      'dash.rechazada': '⚠ Goods rejected by supplier',
      'dash.th_rechazadas': 'Rejected units',
      'dash.th_ingresos_empresa': 'Intakes from this supplier',

      // ===== Expenses (HTML) =====
      'gastos.titulo': 'Operating Expenses',
      'gastos.cargar': 'Add expense',
      'gastos.ph_categoria': 'Logistics, advertising...',
      'gastos.registrar': 'Record expense',
      'gastos.historial': 'History',
      'gastos.registrado_por': 'Recorded by',

      // ===== Reports (HTML) =====
      'rep.desde': 'From',
      'rep.hasta': 'To',
      'rep.tipo_reporte': 'Report type',
      'rep.opt_ventas': 'Sales',
      'rep.opt_rentabilidad': 'Estimated profitability',
      'rep.generar': 'Generate report',

      // ===== Staff (HTML) =====
      'personal.titulo': 'Staff Management',
      'personal.btn_nuevo': '+ New user',
      'personal.seleccionar': 'Select',

      // ===== Content (HTML) =====
      'contenido.titulo': 'Content Management',
      'contenido.descripcion': 'Here you define Attributes (Color, Size, Brand, etc.) and Product Types (Clothing, Beverage, etc.) that are later used when creating products and variants in Inventory.',
      'contenido.atributos': 'Attributes',
      'contenido.ph_atributo': 'E.g. Color, Flavor, Brand',
      'contenido.genera_variantes_q': 'Creates distinct variants?',
      'contenido.opt_si_variante': 'Yes — each value is a separate product (Size, Color)',
      'contenido.opt_no_variante': 'No — fixed product data (Brand, Material)',
      'contenido.btn_atributo': '+ Add attribute',
      'contenido.tipos_producto': 'Product types',
      'contenido.ph_tipo': 'E.g. Clothing, Beverage, Decor',
      'contenido.requiere_venc': 'This type needs an expiration date',
      'contenido.atributos_del_tipo': 'Attributes this type uses',
      'contenido.btn_tipo': '+ Add type',
      'contenido.th_vencimiento': 'Expiration',

      // ===== Inventory =====
      'inv.ph_buscar': 'Search by name, brand or type...',
      'inv.btn_nuevo_producto': '+ New product',
      'inv.th_precio_venta': 'Sale price',
      'inv.th_stock_total': 'Total stock',
      'inv.variantes': 'Variants',
      'inv.nuevo_producto': 'New product',
      'inv.ph_nombre': 'Product name',
      'inv.tipo_req': 'Type *',
      'inv.elegir_tipo': 'Choose type...',
      'inv.ph_categoria': 'E.g. Summer clothing',
      'inv.precio_costo': 'Cost price ($)',
      'inv.precio_venta': 'Sale price ($)',
      'inv.ph_opcional': 'Optional',
      'inv.crear_producto': 'Create product',
      'inv.agregar_variante': 'Add variant',
      'inv.nota_stock_inicial': 'Initial stock is loaded from <strong>Stock Intake</strong>, not here — this variant starts at 0.',
      'inv.sku_opcional': 'SKU (optional)',
      'inv.ph_sku': 'E.g. TSH-BL-M',
      'inv.stock_minimo': 'Minimum stock',
      'inv.fecha_venc': 'Expiration date',
      'inv.th_vence': 'Expires',
      'inv.sin_resultados_para': 'No results for "{filtro}".',
      'inv.sin_productos': 'No products yet.',
      'inv.ver': 'View',
      'inv.btn_variante': '+ Variant',
      'inv.err_nombre': 'Name is required.',
      'inv.err_tipo': 'Choose a type.',
      'inv.err_precio': 'The sale price cannot be lower than the cost.',
      'inv.producto_creado': 'Product created.',
      'inv.sin_attr_variante': 'This type has no variant attributes — a single variant is created.',
      'inv.err_attrs': 'Fill in all attributes.',
      'inv.variante_agregada': 'Variant added. Load the actual stock from Stock Intake.',
      'inv.sin_variantes': 'No variants yet.',

      // ===== Stock Intake =====
      'ing.titulo': 'Incoming Goods',
      'ing.registrar': 'Record intake',
      'ing.producto_variante': 'Product / variant *',
      'ing.ph_buscar_variante': 'Search by name, size, color, brand...',
      'ing.cant_recibida': 'Quantity received *',
      'ing.cant_buena': 'Quantity in good condition *',
      'ing.ph_proveedor': 'Supplier name',
      'ing.contacto_proveedor': 'Supplier phone / contact',
      'ing.ph_contacto': 'E.g. 099 123 456',
      'ing.lote_req': 'Batch / delivery note no. *',
      'ing.ph_lote': 'For traceability; avoids entering the same delivery note twice',
      'ing.fecha_ingreso': 'Intake date',
      'ing.hora_registro': 'Time recorded',
      'ing.observaciones': 'Notes (condition / quality)',
      'ing.ph_obs': 'E.g. 2 units with stitching defects, not fit for sale',
      'ing.nota': 'Only the <strong>quantity in good condition</strong> is automatically added to Inventory. The rest is recorded as shrinkage / not fit for sale. Does the product not exist yet? An Administrator has to create it first in Inventory.',
      'ing.ph_buscar_ingreso': 'Search by product, supplier or batch...',
      'ing.th_fecha_hora': 'Date / time',
      'ing.th_apto': 'Fit for sale',
      'ing.th_lote': 'Batch',
      'ing.th_operador': 'Operator',
      'ing.proveedores': 'Suppliers',
      'ing.ficha_proveedores': 'Profile built automatically from the recorded intakes.',
      'ing.th_contacto': 'Contact',
      'ing.th_productos_provee': 'Products supplied',
      'ing.th_ingresos': 'Intakes',
      'ing.th_rechazadas': 'Rejected units',
      'ing.sin_resultados': 'No results. If the product does not exist, an Administrator creates it in Inventory.',
      'ing.stock_actual': 'Current stock: {n}',
      'ing.cargando_para': 'Recording intake for:',
      'ing.stock_actual_par': '(current stock: {n})',
      'ing.err_variante': 'Search and select a product/variant.',
      'ing.err_cantidad': 'Enter a valid quantity.',
      'ing.err_buena': 'Enter the quantity in good condition (can be 0).',
      'ing.err_buena_mayor': 'It cannot be greater than the quantity received.',
      'ing.err_lote': 'The delivery note number is required (avoids entering the same one twice).',
      'ing.registrado': 'Intake recorded. {n} unit(s) added to inventory.',
      'ing.sin_ingresos': 'No intakes recorded.',
      'ing.sin_proveedores': 'No suppliers recorded yet.',
      'ing.sin_proveedor_esp': 'No supplier specified',

      // ===== Sales =====
      'ventas.titulo': 'Record Sale',
      'ventas.buscar_producto': 'Search product',
      'ventas.vacia': 'No products added yet.',
      'ventas.total_dos_puntos': 'Total:',
      'ventas.datos_cliente': 'Customer details',
      'ventas.canal_venta': 'Sales channel',
      'ventas.canal_presencial': 'In person',
      'ventas.canal_otro': 'Other',
      'ventas.direccion_entrega': 'Delivery address',
      'ventas.ph_calle': 'Street',
      'ventas.ph_numero': 'Number',
      'ventas.ph_barrio': 'Neighborhood',
      'ventas.ph_ciudad': 'City',
      'ventas.cobro': 'Payment',
      'ventas.aviso_pendiente': '<strong>Some products do not have enough stock.</strong> The sale will be left <strong>PENDING</strong>: payment is not collected now and stock is not deducted. It is resolved when the goods arrive.',
      'ventas.metodo_pago': 'Payment method',
      'ventas.pago_efectivo': 'Cash',
      'ventas.pago_tarjeta': 'Card',
      'ventas.pago_transferencia': 'Bank transfer',
      'ventas.paga_con': 'Customer pays',
      'ventas.exacto': 'Exact',
      'ventas.sin_monto': 'The exact total is charged. No amount needs to be entered.',
      'ventas.historial': 'Sales history',
      'ventas.comprobante': 'Sales receipt',
      'ventas.nueva_venta': 'New sale',
      'ventas.imprimir': 'Print',
      'ventas.sin_resultados': 'No results.',
      'ventas.sin_stock': 'Out of stock',
      'ventas.en_stock': '{n} in stock',
      'ventas.vuelto': 'Change',
      'ventas.faltan': 'Remaining',
      'ventas.registrar_pendiente': 'Record pending sale',
      'ventas.confirmar_cobrar': 'Confirm and charge',
      'ventas.confirmar_cobrar_monto': 'Confirm and charge {monto}',
      'ventas.ticket_pendiente': 'PENDING<br>out of stock · not charged',
      'ventas.ticket_venta_n': 'Sale no.',
      'ventas.ticket_fecha': 'Date',
      'ventas.ticket_vendedor': 'Salesperson',
      'ventas.ticket_cliente': 'Customer',
      'ventas.ticket_total': 'TOTAL',
      'ventas.ticket_pago': 'Payment',
      'ventas.ticket_recibido': 'Received',
      'ventas.ticket_pie': 'Non-fiscal receipt<br>Thank you for your purchase',
      'ventas.err_sin_items': 'Add at least one product.',
      'ventas.toast_pendiente': 'Sale recorded as PENDING (not enough stock). Total: {total}',
      'ventas.toast_cobrada': 'Sale charged. Total: {total}',
      'ventas.venta_n': 'Sale #{id}',
      'ventas.confirmada': 'Confirmed',
      'ventas.sin_ventas': 'No sales recorded.'
    }
  };

  // ---- Leer idioma guardado (sf_idioma) ----
  function leerIdioma() {
    try {
      var guardado = localStorage.getItem(CLAVE_IDIOMA);
      if (guardado && IDIOMAS.indexOf(guardado) !== -1) return guardado;
    } catch (e) { /* localStorage no disponible */ }
    return IDIOMA_DEFECTO;
  }

  var idiomaActual = leerIdioma();

  // ---- Traducir: t('clave', {param: valor}) ----
  function t(clave, params) {
    var texto =
      (DICCIONARIO[idiomaActual] && DICCIONARIO[idiomaActual][clave]) ||
      (DICCIONARIO[IDIOMA_DEFECTO] && DICCIONARIO[IDIOMA_DEFECTO][clave]) ||
      clave; // si falta la clave, se ve la clave (facilita detectar faltantes)

    if (params) {
      Object.keys(params).forEach(function (k) {
        texto = texto.split('{' + k + '}').join(params[k]);
      });
    }
    return texto;
  }

  // ---- Aplicar traducciones a los elementos marcados ----
  function aplicarTraducciones(raiz) {
    raiz = raiz || document;
    raiz.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    raiz.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    raiz.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    raiz.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    // Para textos con <strong>/<br>: el valor sale SOLO del diccionario (texto fijo del
    // código), nunca de datos del usuario, por eso es seguro usar innerHTML.
    raiz.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.documentElement.setAttribute('lang', idiomaActual);
  }

  // ---- Cambiar idioma (lo puede llamar Configuración) ----
  function setIdioma(nuevo) {
    if (IDIOMAS.indexOf(nuevo) === -1) return;
    idiomaActual = nuevo;
    try { localStorage.setItem(CLAVE_IDIOMA, nuevo); } catch (e) {}
    aplicarTraducciones();
  }

  // ---- Agregar claves desde otro archivo/pantalla ----
  function agregarTextos(es, en) {
    Object.assign(DICCIONARIO.es, es || {});
    Object.assign(DICCIONARIO.en, en || {});
    aplicarTraducciones();
  }


  // ---- Botón flotante para cambiar de idioma (ES <-> EN) ----
  // Solo cambia sf_idioma y recarga: no toca el tema ni ninguna otra preferencia.
  // Se recarga para que también se re-pinte lo que arman los JS (tablas, modales, etc.).
  function alternarIdioma() {
    setIdioma(idiomaActual === 'es' ? 'en' : 'es');
    window.location.reload();
  }

  function crearBotonIdioma() {
    if (document.getElementById('sf-btn-idioma')) return;
    var b = document.createElement('button');
    b.id = 'sf-btn-idioma';
    b.type = 'button';
    b.textContent = idiomaActual === 'es' ? 'EN' : 'ES';   // muestra a qué idioma cambia
    b.title = t('comun.cambiar_idioma');
    b.setAttribute('aria-label', t('comun.cambiar_idioma'));
    b.style.cssText =
      'position:fixed;right:16px;bottom:16px;z-index:9999;min-width:44px;height:44px;' +
      'padding:0 12px;border-radius:22px;border:1px solid rgba(128,128,128,.5);' +
      'background:#1f2937;color:#fff;font:600 14px/1 system-ui,sans-serif;cursor:pointer;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.3);';
    b.addEventListener('click', alternarIdioma);
    document.body.appendChild(b);
  }


  // ---- Cambiar a un idioma concreto y recargar (para cualquier botón) ----
  function cambiarA(idioma) {
    if (IDIOMAS.indexOf(idioma) === -1 || idioma === idiomaActual) return;
    setIdioma(idioma);
    window.location.reload();
  }

  // Cualquier botón con data-idioma-btn funciona solo:
  //   <button data-idioma-btn="en">English</button>   -> pasa a inglés
  //   <button data-idioma-btn="es">Español</button>   -> pasa a español
  //   <button data-idioma-btn>Idioma</button>         -> alterna ES/EN
  function enlazarBotonesIdioma() {
    var botones = document.querySelectorAll('[data-idioma-btn]');
    botones.forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var destino = b.getAttribute('data-idioma-btn');
        if (destino) cambiarA(destino); else alternarIdioma();
      });
    });
    return botones.length;
  }

  // ---- API pública ----
  window.t = t;
  window.i18n = {
    t: t,
    getIdioma: function () { return idiomaActual; },
    locale: function () { return idiomaActual === 'en' ? 'en-US' : 'es-UY'; },
    setIdioma: setIdioma,
    cambiarA: cambiarA,
    alternar: alternarIdioma,
    aplicar: aplicarTraducciones,
    agregarTextos: agregarTextos
  };

  function iniciar() { aplicarTraducciones(); if (!enlazarBotonesIdioma()) crearBotonIdioma(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
