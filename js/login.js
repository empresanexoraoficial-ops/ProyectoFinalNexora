// login.js — StockFlow · Nexora 2026
const formLogin     = document.getElementById('form-login');
const inputEmail    = document.getElementById('email');
const inputPassword = document.getElementById('password');
const errorEmail    = document.getElementById('error-email');
const errorPassword = document.getElementById('error-password');
const errorGeneral  = document.getElementById('error-general');

const rutasPorRol = {
  administrador: 'pages/inicio.html',
  vendedor:      'pages/ventas.html',
  repositor:     'pages/inventario.html',
};

function limpiarErrores() {
  errorEmail.textContent = ''; errorPassword.textContent = ''; errorGeneral.textContent = '';
  errorGeneral.classList.remove('visible');
  inputEmail.classList.remove('input-error'); inputPassword.classList.remove('input-error');
}

function validarFormulario() {
  let ok = true;
  if (!inputEmail.value.trim()) { errorEmail.textContent = 'El email es obligatorio.'; inputEmail.classList.add('input-error'); ok = false; }
  if (!inputPassword.value)     { errorPassword.textContent = 'La contraseña es obligatoria.'; inputPassword.classList.add('input-error'); ok = false; }
  return ok;
}

formLogin.addEventListener('submit', function (e) {
  e.preventDefault();
  limpiarErrores();
  if (!validarFormulario()) return;

  let usuarios = [];
  try { usuarios = JSON.parse(localStorage.getItem('sf_usuarios')) || []; } catch {}

  const email = inputEmail.value.trim().toLowerCase();
  const pass  = inputPassword.value;
  const usuario = usuarios.find(u => u.email.toLowerCase() === email && u.password === pass && u.activo !== false);

  if (!usuario) {
    errorGeneral.textContent = 'Email o contraseña incorrectos, o cuenta inactiva.';
    errorGeneral.classList.add('visible');
    return;
  }

  sessionStorage.setItem('usuario', JSON.stringify({
    id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, telefono: usuario.telefono || '',
  }));

  window.location.href = rutasPorRol[usuario.rol] || 'pages/inicio.html';
});

inputEmail.addEventListener('input',    () => { errorEmail.textContent = '';    inputEmail.classList.remove('input-error'); });
inputPassword.addEventListener('input', () => { errorPassword.textContent = ''; inputPassword.classList.remove('input-error'); });
