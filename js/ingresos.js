// ingresos.js — StockFlow · Nexora 2026
// Registro de mercadería nueva: solo lo "en buen estado" pasa a Inventario

let ingresos = Store.get('ingresos');

// ── Reloj en vivo (hora de registro) ──────────────────────────────
function actualizarHora() {
  const ahora = new Date();
  document.getElementById('ing-hora').value = ahora.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
actualizarHora();
setInterval(actualizarHora, 1000);

function registrarIngreso() {
  const producto      = document.getElementById('ing-producto').value.trim();
  const marca         = document.getElementById('ing-marca').value.trim();
  const talle         = document.getElementById('ing-talle').value.trim();
  const color         = document.getElementById('ing-color').value.trim();
  const peso          = document.getElementById('ing-peso').value.trim();
  const cantidad       = parseInt(document.getElementById('ing-cantidad').value);
  const cantidadBuena  = parseInt(document.getElementById('ing-cantidad-buena').value);
  const stockMin       = parseInt(document.getElementById('ing-stock-min').value) || 0;
  const vencimiento    = document.getElementById('ing-vencimiento').value;
  const proveedor      = document.getElementById('ing-proveedor').value.trim();
  const proveedorContacto = document.getElementById('ing-proveedor-contacto').value.trim();
  const lote           = document.getElementById('ing-lote').value.trim();
  const fecha          = document.getElementById('ing-fecha').value || new Date().toISOString().split('T')[0];
  const obs            = document.getElementById('ing-obs').value.trim();

  document.getElementById('err-ing-producto').textContent = '';
  document.getElementById('err-ing-cantidad').textContent = '';
  document.getElementById('err-ing-buena').textContent = '';

  let ok = true;
  if (!producto) { document.getElementById('err-ing-producto').textContent = 'El producto es obligatorio.'; ok = false; }
  if (!cantidad || cantidad <= 0) { document.getElementById('err-ing-cantidad').textContent = 'Ingresá una cantidad válida.'; ok = false; }
  if (isNaN(cantidadBuena) || cantidadBuena < 0) { document.getElementById('err-ing-buena').textContent = 'Ingresá la cantidad en buen estado (puede ser 0).'; ok = false; }
  if (cantidadBuena > cantidad) { document.getElementById('err-ing-buena').textContent = 'No puede ser mayor a la cantidad recibida.'; ok = false; }
  if (!ok) return;

  const sesion = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const fechaHoraRegistro = new Date().toISOString(); // timestamp real del momento exacto de carga

  ingresos.unshift({
    id: 'ing_' + Date.now(),
    producto, marca, talle, color, peso,
    cantidad, cantidadBuena, stockMin, vencimiento,
    proveedor, proveedorContacto, lote,
    fecha, fechaHoraRegistro,
    obs,
    operador: sesion.nombre || sesion.email || 'Desconocido',
  });
  Store.set('ingresos', ingresos);

  // Derivar automáticamente al Inventario solo lo apto para la venta
  if (cantidadBuena > 0) {
    let productos = Store.get('productos');
    const idx = productos.findIndex(p => p.nombre.toLowerCase() === producto.toLowerCase());
    if (idx >= 0) {
      productos[idx].stock += cantidadBuena;
      // Completar datos si el producto ya existía pero no los tenía cargados
      if (!productos[idx].marca && marca) productos[idx].marca = marca;
      if (!productos[idx].talle && talle) productos[idx].talle = talle;
      if (!productos[idx].color && color) productos[idx].color = color;
      if (!productos[idx].vencimiento && vencimiento) productos[idx].vencimiento = vencimiento;
      if (proveedor) productos[idx].proveedor = proveedor; // siempre se actualiza al último proveedor que lo trajo
      // Si el ingreso trae un stock mínimo sugerido y el producto no tenía uno definido, lo aplicamos
      if ((!productos[idx].stockMin || productos[idx].stockMin === 0) && stockMin > 0) {
        productos[idx].stockMin = stockMin;
      }
    } else {
      productos.push({
        id: 'p_' + Date.now(),
        codigo: '', nombre: producto, categoria: '',
        marca, talle, color, peso, vencimiento,
        precioCosto: 0, precioVenta: 0,
        proveedor,
        stock: cantidadBuena,
        stockMin: stockMin, // ← antes quedaba fijo en 0; ahora usa lo que cargó el repositor
      });
    }
    Store.set('productos', productos);
  }

  ['ing-producto','ing-marca','ing-talle','ing-color','ing-peso','ing-cantidad','ing-cantidad-buena','ing-stock-min','ing-vencimiento','ing-proveedor','ing-proveedor-contacto','ing-lote','ing-obs']
    .forEach(id => document.getElementById(id).value = '');

  renderTablaIngresos();
  renderProveedores();
  mostrarToast(`Ingreso registrado. ${cantidadBuena} unidad(es) sumadas al inventario.`, 'exito');
}

function eliminarIngreso(id) {
  if (!confirm('¿Eliminar este registro de ingreso? (no revierte el stock ya sumado)')) return;
  ingresos = ingresos.filter(i => i.id !== id);
  Store.set('ingresos', ingresos);
  renderTablaIngresos();
  renderProveedores();
}

function renderTablaIngresos(filtro = '') {
  const tbody = document.getElementById('tbody-ingresos');
  const lista = filtro
    ? ingresos.filter(i => (i.producto + (i.marca||'') + (i.proveedor||'') + (i.lote||'')).toLowerCase().includes(filtro.toLowerCase()))
    : ingresos;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--texto-secundario);padding:32px">Sin ingresos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(i => {
    const horaRegistro = i.fechaHoraRegistro ? new Date(i.fechaHoraRegistro).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '';
    const marcaTalle = [i.marca, i.talle].filter(Boolean).join(' / ') || '—';
    return `
    <tr>
      <td>${i.fecha}${horaRegistro ? ` <small style="color:var(--texto-secundario)">${horaRegistro}</small>` : ''}</td>
      <td><strong>${i.producto}</strong></td>
      <td>${marcaTalle}</td>
      <td>${i.cantidad}</td>
      <td>${i.cantidadBuena < i.cantidad ? `<span style="color:var(--color-advertencia);font-weight:600">${i.cantidadBuena}</span>` : i.cantidadBuena}</td>
      <td>${i.proveedor || '—'}</td>
      <td>${i.lote || '—'}</td>
      <td style="font-size:0.8rem;color:var(--texto-secundario)">${i.obs || '—'}</td>
      <td><button class="btn-peligro btn-sm" onclick="eliminarIngreso('${i.id}')">Eliminar</button></td>
    </tr>`;
  }).join('');
}

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast visible ' + tipo;
  setTimeout(() => t.className = 'toast', 3500);
}

function renderProveedores() {
  const tbody = document.getElementById('tbody-proveedores');
  if (!ingresos.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--texto-secundario);padding:32px">Sin proveedores registrados aún.</td></tr>`;
    return;
  }

  // Agrupar ingresos por proveedor
  const grupos = {};
  ingresos.forEach(i => {
    const nombre = i.proveedor || 'Sin proveedor especificado';
    if (!grupos[nombre]) {
      grupos[nombre] = { contacto: i.proveedorContacto || '', productos: new Set(), totalIngresos: 0, rechazadas: 0 };
    }
    grupos[nombre].productos.add(i.producto);
    grupos[nombre].totalIngresos += 1;
    grupos[nombre].rechazadas += (i.cantidad - i.cantidadBuena);
    if (!grupos[nombre].contacto && i.proveedorContacto) grupos[nombre].contacto = i.proveedorContacto;
  });

  const filas = Object.entries(grupos).sort((a, b) => b[1].rechazadas - a[1].rechazadas);

  tbody.innerHTML = filas.map(([nombre, datos]) => {
    const alerta = datos.rechazadas > 0;
    return `<tr style="${alerta ? 'background:var(--fondo-error)' : ''}">
      <td><strong>${nombre}</strong></td>
      <td>${datos.contacto || '—'}</td>
      <td style="font-size:0.85rem">${[...datos.productos].join(', ')}</td>
      <td>${datos.totalIngresos}</td>
      <td>${alerta ? `<span style="color:var(--color-error);font-weight:600">${datos.rechazadas}</span>` : '0'}</td>
    </tr>`;
  }).join('');
}

document.getElementById('ing-fecha').value = new Date().toISOString().split('T')[0];
document.getElementById('buscar-ingreso').addEventListener('input', function () { renderTablaIngresos(this.value); });
renderTablaIngresos();
renderProveedores();
