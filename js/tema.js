// tema.js — StockFlow · Nexora 2026
// Preferencias del usuario (idioma y tema). Se carga en el <head>, ANTES
// del CSS, para que la página nazca ya con el tema elegido y no parpadee
// en claro antes de oscurecerse.
//
// Claves en localStorage (texto plano, sin JSON):
//   sf_tema    → 'claro' | 'oscuro'
//   sf_idioma  → 'es' | 'en'      (lo lee js/i18n.js para traducir)
const PREFS = {
  get(clave, porDefecto) {
    try { return localStorage.getItem('sf_' + clave) || porDefecto; } catch { return porDefecto; }
  },
  set(clave, valor) {
    try { localStorage.setItem('sf_' + clave, valor); } catch {}
  },
};

function aplicarPreferencias() {
  const tema   = PREFS.get('tema', 'claro') === 'oscuro' ? 'oscuro' : 'claro';
  const idioma = PREFS.get('idioma', 'es') === 'en' ? 'en' : 'es';
  document.documentElement.dataset.tema = tema;
  document.documentElement.lang = idioma;
}

aplicarPreferencias();
