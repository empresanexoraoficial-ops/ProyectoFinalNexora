// store.js — StockFlow · Nexora 2026
const Store = {
  get(key)        { try { return JSON.parse(localStorage.getItem('sf_' + key)) || []; } catch { return []; } },
  getObj(key, d)  { try { const v = localStorage.getItem('sf_' + key); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(key, val)   { localStorage.setItem('sf_' + key, JSON.stringify(val)); },
  remove(key)     { localStorage.removeItem('sf_' + key); },
};

const PERMISOS = {
  administrador: ['inicio','dashboard','inventario','ingreso-stock','ventas','gastos','reportes','personal'],
  vendedor:      ['inicio','ventas'],
  repositor:     ['inicio','inventario','ingreso-stock'],
};

function protegerPagina(nombrePagina) {
  let sesion = null;
  try { sesion = JSON.parse(sessionStorage.getItem('usuario')); } catch {}
  if (!sesion) { window.location.href = '../index.html'; return; }
  const permitidas = PERMISOS[sesion.rol] || [];
  if (!permitidas.includes(nombrePagina)) window.location.href = 'inicio.html';
}

function inicializarUsuarios() {
  const usuarios = Store.get('usuarios');
  if (usuarios.length) return;
  const ahora = new Date().toISOString();
  Store.set('usuarios', [
    { id: 'u1', nombre: 'Agustín Giacobone', email: 'admin@nexora.com',     password: '1234', rol: 'administrador', telefono: '099 924 573', activo: true, fechaIngreso: ahora, fechaModificacion: ahora },
    { id: 'u2', nombre: 'Enzo Mera',         email: 'vendedor@nexora.com',  password: '1234', rol: 'vendedor',      telefono: '097 073 505', activo: true, fechaIngreso: ahora, fechaModificacion: ahora },
    { id: 'u3', nombre: 'Darío Prieto',      email: 'repositor@nexora.com', password: '1234', rol: 'repositor',     telefono: '098 541 788', activo: true, fechaIngreso: ahora, fechaModificacion: ahora },
    { id: 'u4', nombre: 'Renzo Corbo',       email: 'renzo@nexora.com',     password: '1234', rol: 'vendedor',      telefono: '095 253 938', activo: true, fechaIngreso: ahora, fechaModificacion: ahora },
  ]);
}
inicializarUsuarios();
