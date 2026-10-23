// dashboard.js — StockFlow · Nexora 2026
// Agustín Giacobone
// Los números vienen de /api/resumen.php?vista=dashboard (se calculan en la
// base, con los datos reales). Antes se calculaban acá sobre localStorage.

function fmt(n) { return '$' + Number(n).toFixed(2); }

async function api(url, opciones = {}) {
  const resp = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opciones });
  const datos = await resp.json();
  if (!resp.ok) throw new Error(datos.error || t('comun.error_inesperado'));
  return datos;
}

function texto(id, valor) { document.getElementById(id).textContent = valor; }

function pintarDashboard(d) {
  texto('dash-ventas-hoy', d.ventas_hoy.cantidad);
  texto('dash-total-hoy', fmt(d.ventas_hoy.total));

  const criticos = d.stock_critico;
  texto('dash-critico', criticos.length);
  texto('dash-productos-stock', d.stock_total);
  texto('dash-gastos-mes', fmt(d.gastos_mes));

  const margen = d.ventas_mes > 0
    ? ((d.ventas_mes - d.gastos_mes) / d.ventas_mes * 100).toFixed(1) : null;
  texto('dash-margen', t('dash.margen', { valor: margen !== null ? margen + '%' : '—' }));

  const top = d.top_productos;
  if (top.length) {
    texto('dash-favoritos-nombre', top[0].nombre);
    texto('dash-favoritos-unidades', t('dash.unidades_vendidas', { n: top[0].unidades }));
  } else {
    texto('dash-favoritos-nombre', '—');
    texto('dash-favoritos-unidades', t('dash.sin_ventas'));
  }

  document.getElementById('dash-top-productos').innerHTML = top.length
    ? top.map(p =>
        `<tr><td>${esc(p.nombre)}</td><td>${p.unidades}</td><td>${fmt(p.total)}</td></tr>`).join('')
    : `<tr><td colspan="3" style="text-align:center;color:var(--texto-secundario);
        padding:20px">${t('dash.sin_datos')}</td></tr>`;

  document.getElementById('dash-alertas').innerHTML = criticos.length
    ? criticos.map(v =>
        `<tr style="background:var(--fondo-error)">
          <td>${esc(v.producto_nombre)}${v.sku ? ' <small>(' + esc(v.sku) + ')</small>' : ''}</td>
          <td><strong>${v.stock}</strong></td>
          <td>${v.stock_min}</td>
          <td><span class="badge badge-critico">${t('comun.critico')}</span></td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="text-align:center;color:var(--color-exito);
        padding:20px">✓ ${t('dash.sin_alertas')}</td></tr>`;

  // ── Mercadería rechazada por proveedor ──
  const cardRechazos = document.getElementById('card-rechazos');
  if (d.rechazos.length) {
    cardRechazos.style.display = '';
    document.getElementById('dash-rechazos').innerHTML = d.rechazos.map(r =>
      `<tr style="background:var(--fondo-error)">
        <td><strong>${esc(r.proveedor)}</strong></td>
        <td><span style="color:var(--color-error);font-weight:600">${r.rechazadas}</span></td>
        <td>${r.ingresos}</td>
      </tr>`).join('');
  } else {
    cardRechazos.style.display = 'none'; // sin rechazos, no ensuciamos el dashboard
  }
}

async function cargarDashboard() {
  try {
    const r = await api('/api/resumen.php?vista=dashboard');
    pintarDashboard(r.datos);
  } catch (e) {
    document.getElementById('dash-alertas').innerHTML =
      `<tr><td colspan="4" style="text-align:center;color:var(--color-error);padding:20px">${esc(e.message)}</td></tr>`;
  }
}

cargarDashboard();
