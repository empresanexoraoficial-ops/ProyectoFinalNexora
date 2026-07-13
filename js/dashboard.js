// dashboard.js — StockFlow · Nexora 2026
// Agustín Giacobone

function fmt(n) { return '$' + Number(n).toFixed(2); }

function cargarDashboard() {
  const productos = Store.get('productos');
  const ventas    = Store.get('ventas');
  const gastos    = Store.get('gastos');

  const hoy = new Date().toISOString().split('T')[0];
  const mes = new Date().toISOString().slice(0, 7);

  const ventasHoy = ventas.filter(v => v.fecha.startsWith(hoy));
  document.getElementById('dash-ventas-hoy').textContent = ventasHoy.length;
  document.getElementById('dash-total-hoy').textContent  = fmt(ventasHoy.reduce((s,v) => s + v.total, 0));

  const ventasMes = ventas.filter(v => v.fecha.startsWith(mes));

  const criticos = productos.filter(p => p.stock <= p.stockMin);
  document.getElementById('dash-critico').textContent = criticos.length;

  const totalStock = productos.reduce((s, p) => s + p.stock, 0);
  document.getElementById('dash-productos-stock').textContent = totalStock;

  const gastosMes   = gastos.filter(g => g.fecha && g.fecha.startsWith(mes));
  const totalGastos = gastosMes.reduce((s,g) => s + Number(g.monto), 0);
  document.getElementById('dash-gastos-mes').textContent = fmt(totalGastos);

  const ingresos = ventasMes.reduce((s,v) => s + v.total, 0);
  const margen   = ingresos > 0 ? ((ingresos - totalGastos) / ingresos * 100).toFixed(1) : '—';
  document.getElementById('dash-margen').textContent =
    margen !== '—' ? `Margen: ${margen}%` : 'Margen: —';

  const conteo = {};
  ventas.forEach(v => v.items.forEach(i => {
    conteo[i.nombre] = conteo[i.nombre] || { unidades: 0, total: 0 };
    conteo[i.nombre].unidades += i.cantidad;
    conteo[i.nombre].total    += i.cantidad * i.precioUnitario;
  }));
  const top = Object.entries(conteo)
    .sort((a, b) => b[1].unidades - a[1].unidades).slice(0, 5);

  if (top.length) {
    document.getElementById('dash-favoritos-nombre').textContent = top[0][0];
    document.getElementById('dash-favoritos-unidades').textContent = `${top[0][1].unidades} unidades vendidas`;
  } else {
    document.getElementById('dash-favoritos-nombre').textContent = '—';
    document.getElementById('dash-favoritos-unidades').textContent = 'Sin ventas aún';
  }

  document.getElementById('dash-top-productos').innerHTML = top.length
    ? top.map(([n, d]) =>
        `<tr><td>${n}</td><td>${d.unidades}</td><td>${fmt(d.total)}</td></tr>`).join('')
    : `<tr><td colspan="3" style="text-align:center;color:var(--texto-secundario);
        padding:20px">Sin datos aún</td></tr>`;

  document.getElementById('dash-alertas').innerHTML = criticos.length
    ? criticos.map(p =>
        `<tr style="background:var(--fondo-error)">
          <td>${p.nombre}</td>
          <td><strong>${p.stock}</strong></td>
          <td>${p.stockMin}</td>
          <td><span class="badge badge-critico">Crítico</span></td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="text-align:center;color:var(--color-exito);
        padding:20px">✓ Sin alertas de stock</td></tr>`;

  // ── Mercadería rechazada por proveedor ──
  const registrosIngresos = Store.get('ingresos');
  const porProveedor = {};
  registrosIngresos.forEach(i => {
    const nombre = i.proveedor || 'Sin proveedor especificado';
    if (!porProveedor[nombre]) porProveedor[nombre] = { rechazadas: 0, totalIngresos: 0 };
    porProveedor[nombre].rechazadas += (i.cantidad - i.cantidadBuena);
    porProveedor[nombre].totalIngresos += 1;
  });
  const conRechazos = Object.entries(porProveedor)
    .filter(([, d]) => d.rechazadas > 0)
    .sort((a, b) => b[1].rechazadas - a[1].rechazadas);

  const cardRechazos = document.getElementById('card-rechazos');
  if (conRechazos.length) {
    cardRechazos.style.display = '';
    document.getElementById('dash-rechazos').innerHTML = conRechazos.map(([nombre, d]) =>
      `<tr style="background:var(--fondo-error)">
        <td><strong>${nombre}</strong></td>
        <td><span style="color:var(--color-error);font-weight:600">${d.rechazadas}</span></td>
        <td>${d.totalIngresos}</td>
      </tr>`).join('');
  } else {
    cardRechazos.style.display = 'none'; // sin rechazos, no ensuciamos el dashboard
  }
}

cargarDashboard();
