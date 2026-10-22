// configuracion.js — StockFlow · Nexora 2026
// Preferencias personales (idioma y tema) para TODOS los roles.
// Se guardan en el navegador con PREFS (js/tema.js). El idioma lo aplica
// js/i18n.js leyendo la misma clave (sf_idioma).

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast visible ' + tipo;
  setTimeout(() => t.className = 'toast', 2500);
}

const selIdioma = document.getElementById('pref-idioma');
const selTema   = document.getElementById('pref-tema');

selIdioma.value = PREFS.get('idioma', 'es');
selTema.value   = PREFS.get('tema', 'claro');

selTema.addEventListener('change', function () {
  PREFS.set('tema', selTema.value);
  aplicarPreferencias();            // se ve al instante, sin recargar
  mostrarToast('Tema guardado.', 'exito');
});

selIdioma.addEventListener('change', function () {
  PREFS.set('idioma', selIdioma.value);
  aplicarPreferencias();
  mostrarToast('Idioma guardado.', 'exito');
  // Las pantallas traducidas cambian al recargar; así i18n.js no necesita
  // re-pintar la página en vivo.
  setTimeout(() => window.location.reload(), 600);
});
