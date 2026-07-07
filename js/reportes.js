// reportes.js — StockFlow · Nexora 2026
// Renzo Corbo

function generarReporte() {
  const desde = document.getElementById('rep-desde').value;
  const hasta = document.getElementById('rep-hasta').value;
  const tipo  = document.getElementById('rep-tipo').value;

  const resultado = document.getElementById('reporte-resultado');
  const titulo    = document.getElementById('reporte-titulo');
  const tabla     = document.getElementById('reporte-tabla');
  resultado.style.display = '';

  const enRango = (fecha) => {
    if (!fecha) return true;
    const f = fecha.split('T')[0];
    if (desde && f < desde) return false;
    if (hasta && f > hasta) return false;
    return true;
  };

  if (tipo === 'ventas') {
    titulo.textContent = 'Reporte de Ventas';
    const ventas = Store.get('ventas').filter(v => enRango(v.fecha));
    tabla.innerHTML = `
      <thead><tr><th>Fecha</th><th>Canal</th><th>Vendedor</th><th>Total</th></tr></thead>
      <tbody>${ventas.map(v => `
        <tr>
          <td>${new Date(v.fecha).toLocaleDateString('es-UY')}</td>
          <td>${v.canal}</td>
          <td>${v.vendedor}</td>
          <td>$${v.total.toFixed(2)}</td>
        </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;padding:20px">Sin datos</td></tr>'}
      </tbody>`;
  }

  if (tipo === 'stock') {
    titulo.textContent = 'Reporte de Stock';
    const prods = Store.get('productos');
    tabla.innerHTML = `
      <thead><tr><th>Producto</th><th>Stock</th><th>Mínimo</th><th>Estado</th></tr></thead>
      <tbody>${prods.map(p => `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.stock}</td>
          <td>${p.stockMin}</td>
          <td>${p.stock <= p.stockMin
            ? '<span class="badge badge-critico">Crítico</span>'
            : '<span class="badge badge-ok">OK</span>'}</td>
        </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;padding:20px">Sin datos</td></tr>'}
      </tbody>`;
  }

  if (tipo === 'gastos') {
    titulo.textContent = 'Reporte de Gastos';
    const gastos = Store.get('gastos').filter(g => enRango(g.fecha));
    tabla.innerHTML = `
      <thead><tr><th>Fecha</th><th>Categoría</th><th>Monto</th></tr></thead>
      <tbody>${gastos.map(g => `
        <tr>
          <td>${g.fecha}</td>
          <td>${g.categoria}</td>
          <td>$${Number(g.monto).toFixed(2)}</td>
        </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;padding:20px">Sin datos</td></tr>'}
      </tbody>`;
  }

  if (tipo === 'rentabilidad') {
    titulo.textContent = 'Rentabilidad Estimada por Producto';
    const prods = Store.get('productos');
    tabla.innerHTML = `
      <thead><tr><th>Producto</th><th>Costo</th><th>Venta</th><th>Margen</th></tr></thead>
      <tbody>${prods.map(p => {
        const margen = p.precioVenta > 0
          ? (((p.precioVenta - p.precioCosto) / p.precioVenta) * 100).toFixed(1)
          : '—';
        return `<tr>
          <td>${p.nombre}</td>
          <td>$${Number(p.precioCosto).toFixed(2)}</td>
          <td>$${Number(p.precioVenta).toFixed(2)}</td>
          <td>${margen !== '—' ? margen + '%' : '—'}</td>
        </tr>`;
      }).join('') || '<tr><td colspan="4" style="text-align:center;padding:20px">Sin datos</td></tr>'}
      </tbody>`;
  }
}
