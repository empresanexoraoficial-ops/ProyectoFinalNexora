// gastos.js — StockFlow · Nexora 2026
// Migrado a la API real (antes: localStorage).

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast visible ' + tipo;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

async function api(url, opciones = {}) {
  const resp = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opciones });
  const datos = await resp.json();
  if (!resp.ok) throw new Error(datos.error || t('comun.error_inesperado'));
  return datos;
}

async function registrarGasto() {
  const cat   = document.getElementById('gasto-cat').value.trim();
  const monto = parseFloat(document.getElementById('gasto-monto').value);
  const fecha = document.getElementById('gasto-fecha').value;
  const desc  = document.getElementById('gasto-desc').value.trim();

  document.getElementById('err-gasto-cat').textContent   = '';
  document.getElementById('err-gasto-monto').textContent = '';

  let ok = true;
  if (!cat) { document.getElementById('err-gasto-cat').textContent = t('gastos.categoria_obligatoria'); ok = false; }
  if (!monto || monto <= 0) { document.getElementById('err-gasto-monto').textContent = t('gastos.monto_invalido'); ok = false; }
  if (!ok) return;

  try {
    await api('/api/gastos.php', {
      method: 'POST',
      body: JSON.stringify({ categoria: cat, monto, fecha: fecha || null, descripcion: desc || null }),
    });

    document.getElementById('gasto-cat').value   = '';
    document.getElementById('gasto-monto').value = '';
    document.getElementById('gasto-desc').value  = '';

    renderTablaGastos();
    mostrarToast(t('gastos.registrado', { monto: '$' + monto.toFixed(2) }), 'exito');
  } catch (e) {
    document.getElementById('err-gasto-cat').textContent = e.message;
  }
}

async function renderTablaGastos() {
  const tbody = document.getElementById('tbody-gastos');
  try {
    const r = await api('/api/gastos.php');
    const gastos = r.gastos;

    if (!gastos.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;
        color:var(--texto-secundario);padding:32px">${t('gastos.sin_gastos')}</td></tr>`;
      document.getElementById('gastos-total').textContent = '$0.00';
      return;
    }
    tbody.innerHTML = gastos.map(g => `
      <tr>
        <td>${g.fecha}</td>
        <td>${esc(g.categoria)}</td>
        <td>${esc(g.descripcion) || '—'}</td>
        <td>${esc(g.usuario_nombre)}</td>
        <td><strong>$${Number(g.monto).toFixed(2)}</strong></td>
      </tr>`).join('');
    const total = gastos.reduce((s, g) => s + Number(g.monto), 0);
    document.getElementById('gastos-total').textContent = '$' + total.toFixed(2);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--color-error)">${e.message}</td></tr>`;
  }
}

document.getElementById('gasto-fecha').value = new Date().toISOString().split('T')[0];
renderTablaGastos();
