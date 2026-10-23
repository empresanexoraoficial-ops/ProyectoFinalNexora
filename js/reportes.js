// reportes.js — StockFlow · Nexora 2026
// Migrado a la API real. Se agregó el reporte de Rentabilidad completo
// (RF 1.9 del ESRE: unidades vendidas, margen y rotación por producto).

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.className = 'toast visible ' + tipo;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

async function api(url) {
  const resp = await fetch(url, { credentials: 'include' });
  const datos = await resp.json();
  if (!resp.ok) throw new Error(datos.error || t('comun.error_inesperado'));
  return datos;
}

async function generarReporte() {
  const desde = document.getElementById('rep-desde').value;
  const hasta = document.getElementById('rep-hasta').value;
  const tipo  = document.getElementById('rep-tipo').value;

  const resultado = document.getElementById('reporte-resultado');
  const titulo    = document.getElementById('reporte-titulo');
  const tabla     = document.getElementById('reporte-tabla');
  resultado.style.display = '';
  tabla.innerHTML = '<tbody><tr><td style="padding:20px;text-align:center">' + t('comun.cargando') + '</td></tr></tbody>';

  const qs = new URLSearchParams({ tipo });
  if (desde) qs.set('desde', desde);
  if (hasta) qs.set('hasta', hasta);

  try {
    const { datos } = await api('/api/reportes.php?' + qs.toString());

    if (tipo === 'ventas') {
      titulo.textContent = t('rep.titulo_ventas');
      tabla.innerHTML = `
        <thead><tr><th>${t('rep.fecha')}</th><th>${t('rep.canal')}</th><th>${t('rep.vendedor')}</th><th>${t('rep.total')}</th></tr></thead>
        <tbody>${datos.map(v => `
          <tr>
            <td>${new Date(v.fecha).toLocaleDateString(i18n.locale())}</td>
            <td>${esc(v.canal) || '—'}</td>
            <td>${esc(v.vendedor_nombre)}</td>
            <td>$${Number(v.total).toFixed(2)}</td>
          </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;padding:20px">' + t('comun.sin_datos') + '</td></tr>'}
        </tbody>`;
    }

    if (tipo === 'stock') {
      titulo.textContent = t('rep.titulo_stock');
      tabla.innerHTML = `
        <thead><tr><th>${t('rep.producto')}</th><th>${t('rep.sku')}</th><th>${t('rep.stock')}</th><th>${t('rep.minimo')}</th><th>${t('rep.estado')}</th></tr></thead>
        <tbody>${datos.map(v => `
          <tr>
            <td>${esc(v.producto_nombre)}</td>
            <td>${esc(v.sku) || '—'}</td>
            <td>${v.stock}</td>
            <td>${v.stock_min}</td>
            <td>${v.stock <= v.stock_min
              ? '<span class="badge badge-critico">' + t('comun.critico') + '</span>'
              : '<span class="badge badge-ok">OK</span>'}</td>
          </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:20px">' + t('comun.sin_datos') + '</td></tr>'}
        </tbody>`;
    }

    if (tipo === 'gastos') {
      titulo.textContent = t('rep.titulo_gastos');
      tabla.innerHTML = `
        <thead><tr><th>${t('rep.fecha')}</th><th>${t('rep.categoria')}</th><th>${t('rep.monto')}</th></tr></thead>
        <tbody>${datos.map(g => `
          <tr>
            <td>${g.fecha}</td>
            <td>${esc(g.categoria)}</td>
            <td>$${Number(g.monto).toFixed(2)}</td>
          </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;padding:20px">' + t('comun.sin_datos') + '</td></tr>'}
        </tbody>`;
    }

    if (tipo === 'rentabilidad') {
      titulo.textContent = t('rep.titulo_rentabilidad');
      tabla.innerHTML = `
        <thead><tr><th>${t('rep.producto')}</th><th>${t('rep.costo')}</th><th>${t('rep.precio_venta')}</th><th>${t('rep.margen')}</th><th>${t('rep.unidades_vendidas')}</th><th>${t('rep.rotacion')}</th></tr></thead>
        <tbody>${datos.map(p => `
          <tr>
            <td>${esc(p.nombre)}</td>
            <td>$${Number(p.precio_costo).toFixed(2)}</td>
            <td>$${Number(p.precio_venta).toFixed(2)}</td>
            <td>${p.margen_pct !== null ? p.margen_pct + '%' : '—'}</td>
            <td>${p.unidades_vendidas}</td>
            <td>${p.rotacion !== null ? p.rotacion : '—'}</td>
          </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px">' + t('comun.sin_datos') + '</td></tr>'}
        </tbody>`;
    }
  } catch (e) {
    mostrarToast(e.message, 'error');
    resultado.style.display = 'none';
  }
}
