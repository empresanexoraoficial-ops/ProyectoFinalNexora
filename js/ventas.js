// ventas.js — StockFlow · Nexora 2026
// Migrado a la API real. El buscador ahora trabaja con VARIANTES (no
// productos planos): cada variante ya trae sus atributos (Talle, Color,
// etc.) armados en el nombre que se busca.

let variantesCache = [];
let itemsVenta = [];
let metodoPago = 'efectivo';   // 'efectivo' | 'tarjeta' | 'transferencia'
let ultimaVenta = null;        // datos para armar el comprobante

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast visible ' + tipo;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

async function api(url, opciones = {}) {
  const resp = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opciones });
  const datos = await resp.json();
  if (!resp.ok) throw new Error(datos.error || t('comun.error_inesperado'));
  return datos;
}

function etiquetaVariante(v) {
  const atrs = Object.entries(v.atributos).map(([k, val]) => `${k}: ${val}`).join(', ');
  return v.producto_nombre + (atrs ? ` (${atrs})` : '') + (v.sku ? ` — ${v.sku}` : '');
}

// Texto contra el que se filtra: nombre del producto + TODOS los valores
// de atributos (talle, color, etc.) — así buscar "azul" o "M" encuentra
// la variante correcta sin tener que escribir el nombre completo primero.
function textoBusqueda(v) {
  const valores = Object.values(v.atributos).join(' ');
  return (v.producto_nombre + ' ' + valores + ' ' + (v.sku || '')).toLowerCase();
}

async function cargarVariantes() {
  try {
    const r = await api('/api/variantes.php');
    variantesCache = r.variantes;
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

function renderResultadosBusqueda(texto) {
  const cont = document.getElementById('venta-resultados');
  if (!texto.trim()) { cont.style.display = 'none'; cont.innerHTML = ''; return; }

  const q = texto.toLowerCase();
  const coincidencias = variantesCache.filter(v => textoBusqueda(v).includes(q)).slice(0, 12);

  if (!coincidencias.length) {
    cont.innerHTML = '<div class="resultado-item" style="cursor:default;color:var(--texto-secundario)">' + t('ventas.sin_resultados') + '</div>';
    cont.style.display = '';
    return;
  }

  cont.innerHTML = coincidencias.map(v => {
    const atrs = Object.entries(v.atributos).map(([k, val]) => `${esc(k)}: ${esc(val)}`).join(' · ');
    const sinStock = v.stock <= 0;
    return `
      <div class="resultado-item ${sinStock ? 'sin-stock' : ''}" onclick="${sinStock ? '' : `seleccionarVariante(${v.id})`}">
        <div>
          <div class="resultado-nombre">${esc(v.producto_nombre)}</div>
          ${atrs ? `<div class="resultado-atributos">${atrs}</div>` : ''}
        </div>
        <span class="resultado-stock" style="color:${sinStock ? 'var(--color-error)' : 'var(--texto-secundario)'}">
          ${sinStock ? t('ventas.sin_stock') : t('ventas.en_stock', { n: v.stock })}
        </span>
      </div>`;
  }).join('');
  cont.style.display = '';
}

function seleccionarVariante(varianteId) {
  const variante = variantesCache.find(v => v.id === varianteId);
  if (!variante) return;

  const existente = itemsVenta.find(i => i.varianteId === variante.id);
  if (existente) existente.cantidad++;
  else itemsVenta.push({
    varianteId: variante.id,
    nombre: etiquetaVariante(variante),
    cantidad: 1,
    precioUnitario: Number(variante.precio_venta),
  });

  document.getElementById('venta-buscar').value = '';
  document.getElementById('venta-resultados').style.display = 'none';
  renderItemsVenta();
}

function renderItemsVenta() {
  const cont  = document.getElementById('lista-items-venta');
  const vacio = document.getElementById('venta-vacia');
  if (!itemsVenta.length) {
    cont.innerHTML = '';
    vacio.style.display = '';
    document.getElementById('venta-total').textContent = '$0.00';
    actualizarCobro();
    return;
  }
  vacio.style.display = 'none';
  cont.innerHTML = itemsVenta.map((item, idx) => `
    <div style="display:flex;align-items:center;gap:8px;background:var(--fondo-app);
                padding:8px 12px;border-radius:var(--radio)">
      <span style="flex:1;font-size:var(--texto-sm);font-weight:600">${esc(item.nombre)}</span>
      <input type="number" min="1" value="${item.cantidad}"
        style="width:60px;padding:4px 8px;border:1.5px solid var(--borde);border-radius:var(--radio)"
        onchange="cambiarCantidad(${idx}, this.value)" />
      <span style="width:70px;text-align:right">
        $${(item.cantidad * item.precioUnitario).toFixed(2)}</span>
      <button class="btn-peligro btn-sm" onclick="quitarItem(${idx})">✕</button>
    </div>`).join('');
  const total = itemsVenta.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
  document.getElementById('venta-total').textContent = '$' + total.toFixed(2);
  actualizarCobro();
}

function cambiarCantidad(idx, val) {
  const n = parseInt(val);
  if (n > 0) itemsVenta[idx].cantidad = n;
  renderItemsVenta();
}
function quitarItem(idx) { itemsVenta.splice(idx, 1); renderItemsVenta(); }

// ── Cobro ─────────────────────────────────────────────────────────
// Todo se calcula en CENTAVOS (enteros) para evitar errores de decimales
// (0.1 + 0.2 en JavaScript no da 0.3). El servidor vuelve a calcular y
// validar todo: lo que se ve acá es solo una ayuda para el cajero.
function totalCentavos() {
  return Math.round(itemsVenta.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0) * 100);
}
function recibidoCentavos() {
  const v = parseFloat(document.getElementById('venta-recibido').value);
  return isNaN(v) ? null : Math.round(v * 100);
}
function dinero(centavos) { return '$' + (centavos / 100).toFixed(2); }

// Misma regla que el servidor: si algún ítem pide más que el stock, TODA la
// venta queda pendiente (no se cobra ni se descuenta stock).
function quedaraPendiente() {
  return itemsVenta.some(i => {
    const v = variantesCache.find(x => x.id === i.varianteId);
    return v && v.stock < i.cantidad;
  });
}

function actualizarCobro() {
  const pendiente = quedaraPendiente();
  const total = totalCentavos();
  const btn = document.getElementById('venta-btn-confirmar');

  document.getElementById('cobro-pendiente').style.display = pendiente ? '' : 'none';
  document.getElementById('cobro-normal').style.display    = pendiente ? 'none' : '';

  const esEfectivo = metodoPago === 'efectivo';
  document.getElementById('cobro-efectivo').style.display  = esEfectivo ? '' : 'none';
  document.getElementById('cobro-sin-monto').style.display = esEfectivo ? 'none' : '';
  document.getElementById('fila-recibido').style.display   = esEfectivo ? '' : 'none';
  document.querySelectorAll('#venta-metodos .metodo').forEach(b =>
    b.classList.toggle('activo', b.dataset.metodo === metodoPago));

  document.getElementById('cobro-total').textContent = dinero(total);

  let puedeConfirmar = itemsVenta.length > 0;
  const box = document.getElementById('cobro-vuelto-box');
  if (esEfectivo) {
    const rec = recibidoCentavos();
    document.getElementById('cobro-recibido').textContent = dinero(rec || 0);
    if (total === 0) {
      // sin productos todavía: nada que cobrar, no mostramos "Faltan"
      box.classList.remove('falta');
      document.getElementById('cobro-vuelto-label').textContent = t('ventas.vuelto');
      document.getElementById('cobro-vuelto').textContent = dinero(0);
      puedeConfirmar = false;
    } else if (rec === null || rec < total) {
      box.classList.add('falta');
      document.getElementById('cobro-vuelto-label').textContent = t('ventas.faltan');
      document.getElementById('cobro-vuelto').textContent = dinero(total - (rec || 0));
      puedeConfirmar = false;
    } else {
      box.classList.remove('falta');
      document.getElementById('cobro-vuelto-label').textContent = t('ventas.vuelto');
      document.getElementById('cobro-vuelto').textContent = dinero(rec - total);
    }
  } else {
    box.classList.remove('falta');
    document.getElementById('cobro-vuelto-label').textContent = t('ventas.vuelto');
    document.getElementById('cobro-vuelto').textContent = dinero(0);
  }

  if (pendiente) {
    btn.textContent = t('ventas.registrar_pendiente');
    btn.disabled = !itemsVenta.length;
  } else {
    btn.textContent = itemsVenta.length ? t('ventas.confirmar_cobrar_monto', { monto: dinero(total) }) : t('ventas.confirmar_cobrar');
    btn.disabled = !puedeConfirmar;
  }
}

document.querySelectorAll('#venta-metodos .metodo').forEach(function (b) {
  b.addEventListener('click', function () { metodoPago = b.dataset.metodo; actualizarCobro(); });
});
document.getElementById('venta-recibido').addEventListener('input', actualizarCobro);
document.getElementById('venta-btn-exacto').addEventListener('click', function () {
  document.getElementById('venta-recibido').value = (totalCentavos() / 100).toFixed(2);
  actualizarCobro();
});

// ── Comprobante (NO fiscal) ───────────────────────────────────────
function armarTicket(v) {
  const filas = v.items.map(i => `
    <div class="t-item">
      <div>${esc(i.nombre)}</div>
      <div class="t-fila"><span>${i.cantidad} x ${dinero(Math.round(i.precioUnitario * 100))}</span>
        <span>${dinero(Math.round(i.cantidad * i.precioUnitario * 100))}</span></div>
    </div>`).join('');

  const nombresPago = nombresMetodoPago();
  let pago = '';
  if (v.estado === 'pendiente') {
    pago = '<div class="t-pendiente">' + t('ventas.ticket_pendiente') + '</div>';
  } else {
    pago = `<div class="t-fila"><span>${t('ventas.ticket_pago')}</span><span>${esc(nombresPago[v.metodo_pago] || v.metodo_pago)}</span></div>`;
    if (v.metodo_pago === 'efectivo') {
      pago += `<div class="t-fila"><span>${t('ventas.ticket_recibido')}</span><span>${dinero(Math.round(v.monto_recibido * 100))}</span></div>
               <div class="t-fila"><strong>${t('ventas.vuelto')}</strong><strong>${dinero(Math.round(v.vuelto * 100))}</strong></div>`;
    }
  }

  const fecha = new Date(String(v.fecha).replace(' ', 'T')).toLocaleString(i18n.locale());
  const vendedor = (sesion && sesion.nombre) || '';
  return `
    <div class="t-centro t-marca">NEXORA</div>
    <div class="t-centro">StockFlow</div>
    <div class="t-linea"></div>
    <div class="t-fila"><span>${t('ventas.ticket_venta_n')}</span><span>${String(v.id).padStart(6, '0')}</span></div>
    <div class="t-fila"><span>${t('ventas.ticket_fecha')}</span><span>${esc(fecha)}</span></div>
    <div class="t-fila"><span>${t('ventas.ticket_vendedor')}</span><span>${esc(vendedor)}</span></div>
    ${v.cliente ? `<div class="t-fila"><span>${t('ventas.ticket_cliente')}</span><span>${esc(v.cliente)}</span></div>` : ''}
    <div class="t-linea"></div>
    ${filas}
    <div class="t-linea"></div>
    <div class="t-fila t-total"><span>${t('ventas.ticket_total')}</span><span>${dinero(Math.round(v.total * 100))}</span></div>
    <div class="t-linea"></div>
    ${pago}
    <div class="t-linea"></div>
    <div class="t-pie">${t('ventas.ticket_pie')}</div>`;
}

function mostrarComprobante(venta) {
  ultimaVenta = venta;
  document.getElementById('ticket').innerHTML = armarTicket(venta);
  document.getElementById('modal-comprobante').classList.add('visible');
}
function cerrarComprobante() {
  document.getElementById('modal-comprobante').classList.remove('visible');
}

async function confirmarVenta() {
  if (!itemsVenta.length) { mostrarToast(t('ventas.err_sin_items'), 'error'); return; }

  const pendiente = quedaraPendiente();
  const datosVenta = {
    canal:    document.getElementById('venta-canal').value,
    cliente_nombre:   document.getElementById('venta-cliente').value.trim(),
    cliente_email:    document.getElementById('venta-email').value.trim(),
    cliente_telefono: document.getElementById('venta-telefono').value.trim(),
    calle:  document.getElementById('venta-calle').value.trim(),
    numero: document.getElementById('venta-numero').value.trim(),
    barrio: document.getElementById('venta-barrio').value.trim(),
    ciudad: document.getElementById('venta-ciudad').value.trim(),
    items: itemsVenta.map(i => ({ variante_id: i.varianteId, cantidad: i.cantidad, precio_unitario: i.precioUnitario })),
  };
  if (!pendiente) {
    datosVenta.metodo_pago = metodoPago;
    if (metodoPago === 'efectivo') datosVenta.monto_recibido = recibidoCentavos() / 100;
  }

  const btn = document.getElementById('venta-btn-confirmar');
  btn.disabled = true;               // evita el doble clic = venta duplicada
  const itemsSnapshot = itemsVenta.map(i => ({ ...i }));

  try {
    const r = await api('/api/ventas.php', { method: 'POST', body: JSON.stringify(datosVenta) });

    mostrarComprobante({
      id: r.id, fecha: r.fecha, estado: r.estado, total: r.total,
      metodo_pago: r.metodo_pago, monto_recibido: r.monto_recibido, vuelto: r.vuelto,
      cliente: datosVenta.cliente_nombre, items: itemsSnapshot,
    });

    itemsVenta = [];
    metodoPago = 'efectivo';
    document.getElementById('venta-recibido').value = '';
    ['venta-cliente','venta-email','venta-telefono','venta-calle','venta-numero','venta-barrio','venta-ciudad']
      .forEach(id => document.getElementById(id).value = '');
    renderItemsVenta();

    if (r.estado === 'pendiente') {
      mostrarToast(t('ventas.toast_pendiente', { total: '$' + Number(r.total).toFixed(2) }), 'error');
    } else {
      mostrarToast(t('ventas.toast_cobrada', { total: '$' + Number(r.total).toFixed(2) }), 'exito');
    }
    cargarVariantes();  // refresca stock
    renderTablaVentas();
  } catch (e) {
    mostrarToast(e.message, 'error');
    actualizarCobro();
  }
}

function nombresMetodoPago() {
  return { efectivo: t('ventas.pago_efectivo'), tarjeta: t('ventas.pago_tarjeta'), transferencia: t('ventas.pago_transferencia') };
}

function etiquetaPago(v) {
  const nombres = nombresMetodoPago();
  if (!v.metodo_pago) return '—';
  return nombres[v.metodo_pago] || esc(v.metodo_pago);
}

async function renderTablaVentas() {
  const tbody = document.getElementById('tbody-ventas');
  try {
    const r = await api('/api/ventas.php');
    if (!r.ventas.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;
        color:var(--texto-secundario);padding:32px">${t('ventas.sin_ventas')}</td></tr>`;
      return;
    }
    tbody.innerHTML = r.ventas.map(v => `<tr>
      <td>${new Date(v.fecha).toLocaleString(i18n.locale())}</td>
      <td>${t('ventas.venta_n', { id: v.id })}</td>
      <td>${esc(v.canal) || '—'}</td>
      <td>${esc(v.cliente_nombre) || '—'}</td>
      <td>${v.estado === 'pendiente' ? '<span style="color:var(--color-error);font-weight:600">' + t('comun.pendiente') + '</span>' : t('ventas.confirmada')}</td>
      <td>${etiquetaPago(v)}</td>
      <td><strong>$${Number(v.total).toFixed(2)}</strong></td>
      </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--color-error)">${esc(e.message)}</td></tr>`;
  }
}

document.getElementById('venta-buscar').addEventListener('input', function () {
  renderResultadosBusqueda(this.value);
});
document.addEventListener('click', function (e) {
  if (!e.target.closest('#venta-buscar') && !e.target.closest('#venta-resultados')) {
    document.getElementById('venta-resultados').style.display = 'none';
  }
});

cargarVariantes();
renderTablaVentas();
actualizarCobro();
