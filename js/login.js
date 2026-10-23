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
  if (!inputEmail.value.trim()) { errorEmail.textContent = t('login.email_obligatorio'); inputEmail.classList.add('input-error'); ok = false; }
  if (!inputPassword.value)     { errorPassword.textContent = t('login.pass_obligatoria'); inputPassword.classList.add('input-error'); ok = false; }
  return ok;
}

formLogin.addEventListener('submit', async function (e) {
  e.preventDefault();
  limpiarErrores();
  if (!validarFormulario()) return;

  const email = inputEmail.value.trim().toLowerCase();
  const pass  = inputPassword.value;

  try {
    const resp = await fetch('/api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // manda/recibe la cookie de sesión de PHP
      body: JSON.stringify({ email, password: pass }),
    });
    const datos = await resp.json();

    if (!resp.ok) {
      // La validación real de credenciales ahora vive en el servidor —
      // este mensaje viene de AuthService::login(), no de localStorage.
      errorGeneral.textContent = resp.status === 401 ? t('login.error_credenciales') : (datos.error || t('login.error_credenciales'));
      errorGeneral.classList.add('visible');
      return;
    }

    // Guardamos una copia liviana para que el frontend pinte nombre/rol al
    // instante, pero la protección real de cada página pasa por la sesión
    // de PHP (ver nav.js -> /api/me.php), no por esto.
    sessionStorage.setItem('usuario', JSON.stringify(datos.usuario));
    window.location.href = rutasPorRol[datos.usuario.rol] || 'pages/inicio.html';

  } catch (err) {
    errorGeneral.textContent = t('login.error_conexion');
    errorGeneral.classList.add('visible');
  }
});

inputEmail.addEventListener('input',    () => { errorEmail.textContent = '';    inputEmail.classList.remove('input-error'); });
inputPassword.addEventListener('input', () => { errorPassword.textContent = ''; inputPassword.classList.remove('input-error'); });
