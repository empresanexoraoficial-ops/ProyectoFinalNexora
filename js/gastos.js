// gastos.js — StockFlow · Nexora 2026
// Agustín Giacobone

let gastos = Store.get('gastos');

function registrarGasto() {
  const cat   = document.getElementById('gasto-cat').value.trim();
  const monto = parseFloat(document.getElementById('gasto-monto').value);
  const fecha = document.getElementById('gasto-fecha').value;
  const desc  = document.getElementById('gasto-desc').value.trim();

  document.getElementById('err-gasto-cat').textContent   = '';
  document.getElementById('err-gasto-monto').textContent = '';

  let ok = true;
  if (!cat)              { document.getElementById('err-gasto-cat').textContent   = 'La categoría es obligatoria.'; ok = false; }
  if (!monto || monto <= 0) { document.getElementById('err-gasto-monto').textContent = 'Ingresá un monto válido.';     ok = false; }
  if (!ok) return;

  const sesion = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  gastos.unshift({
    id:          'g_' + Date.now(),
    categoria:   cat,
    monto,
    fecha:       fecha || new Date().toISOString().split('T')[0],
    descripcion: desc,
    usuario:     sesion.nombre || sesion.email || 'Desconocido',
  });
  Store.set('gastos', gastos);

  document.getElementById('gasto-cat').value   = '';
  document.getElementById('gasto-monto').value = '';
  document.getElementById('gasto-desc').value  = '';

  renderTablaGastos();
  mostrarToast(`Gasto registrado: $${monto.toFixed(2)}`, 'exito');
}

function eliminarGasto(id) {
  if (!confirm('¿Eliminar este gasto?')) return;
  gastos = gastos.filter(g => g.id !== id);
  Store.set('gastos', gastos);
  renderTablaGastos();
}

function renderTablaGastos() {
  const tbody = document.getElementById('tbody-gastos');
  if (!gastos.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;
      color:var(--texto-secundario);padding:32px">Sin gastos registrados.</td></tr>`;
    document.getElementById('gastos-total').textContent = '$0.00';
    return;
  }
  tbody.innerHTML = gastos.map(g => `
    <tr>
      <td>${g.fecha}</td>
      <td>${g.categoria}</td>
      <td>${g.descripcion || '—'}</td>
      <td><strong>$${Number(g.monto).toFixed(2)}</strong></td>
      <td><button class="btn-peligro btn-sm"
          onclick="eliminarGasto('${g.id}')">Eliminar</button></td>
    </tr>`).join('');
  const total = gastos.reduce((s, g) => s + Number(g.monto), 0);
  document.getElementById('gastos-total').textContent = '$' + total.toFixed(2);
}

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast visible ' + tipo;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

document.getElementById('gasto-fecha').value = new Date().toISOString().split('T')[0];
renderTablaGastos();
