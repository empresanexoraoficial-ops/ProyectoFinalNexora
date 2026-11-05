// validacion.js — StockFlow · Nexora 2026
// Validación de caracteres en los campos de TODAS las pantallas.
// Mientras la persona escribe o pega, se quitan los caracteres que el campo no
// admite (emojis, símbolos como < > { } [ ] \ | ^ ~ = * `, letras en un teléfono, etc.)
// y se avisa con un mensaje breve.
// Es una ayuda de usabilidad: la validación que cuenta es la del servidor
// (clases/logica/Validador.php), que aplica las mismas reglas.
//
// Cada campo de texto tiene un tipo (atributo data-tipo; si no tiene, es «texto»):
//   texto          texto común (nombres de producto, descripciones, búsquedas…)
//   nombre_propio  cliente, calle, barrio, ciudad, proveedor, nombre de persona
//   telefono       solo números y espacios
//   codigo         SKU y n.º de lote: letras, números y . _ - /
//   numero         n.º de puerta: letras, números y espacios
// Los campos type="number" (precios, montos, cantidades) se controlan aparte.
(function () {
  'use strict';

  var TIPOS = {
    texto:         { quitar: /[^\p{L}\p{M}\p{N}\p{Pd}\p{Pi}\p{Pf}\s.,;:'"()_\/&#%+@°ºª!?¿¡$]/gu, max: 500 },
    nombre_propio: { quitar: /[^\p{L}\p{M}\p{N} .,'’\-]/gu, max: 100 },
    telefono:      { quitar: /[^0-9 ]/g, max: 20, modo: 'tel', aviso: 'validacion.solo_numeros' },
    codigo:        { quitar: /[^A-Za-z0-9._\/\-]/g, max: 40, aviso: 'validacion.codigo' },
    numero:        { quitar: /[^A-Za-z0-9 ]/g, max: 10 },
    email:         { quitar: /[^A-Za-z0-9._%+\-@]/g, max: 150 },
    password:      { quitar: /[^\x20-\x7E\p{L}\p{M}\p{N}]/gu, max: 100 }
  };

  var componiendo = false;           // teclados con acentos/IME: no tocar mientras se compone
  document.addEventListener('compositionstart', function () { componiendo = true; });
  document.addEventListener('compositionend', function (e) { componiendo = false; limpiar(e.target); });

  function tipoDe(el) {
    if (!el || !el.tagName) return null;
    if (el.disabled || el.readOnly) return null;
    if (el.type === 'password') return 'password';
    if (el.type === 'email') return 'email';
    if (el.tagName === 'TEXTAREA' || el.type === 'text' || el.type === 'search' || el.type === 'tel') {
      return el.getAttribute('data-tipo') || 'texto';
    }
    return null;                     // number, date, checkbox, select…
  }

  function tr(clave, porDefecto) {
    return (typeof window.t === 'function' && window.t(clave) !== clave) ? window.t(clave) : porDefecto;
  }

  function avisar(el, texto) {
    var aviso = el.parentNode.querySelector('.aviso-caracteres');
    if (!aviso) {
      aviso = document.createElement('span');
      aviso.className = 'aviso-caracteres';
      aviso.setAttribute('role', 'alert');
      el.insertAdjacentElement('afterend', aviso);
    }
    aviso.textContent = texto;
    clearTimeout(aviso._t);
    aviso._t = setTimeout(function () { if (aviso.parentNode) aviso.parentNode.removeChild(aviso); }, 3500);
  }

  // Prepara el campo (longitud máxima y teclado numérico en el celular)
  function preparar(el) {
    var tipo = tipoDe(el); if (!tipo) return;
    var cfg = TIPOS[tipo]; if (!cfg) return;
    if (!el.maxLength || el.maxLength < 0) el.maxLength = cfg.max;
    if (cfg.modo && !el.getAttribute('inputmode')) el.setAttribute('inputmode', cfg.modo);
  }
  document.addEventListener('focusin', function (e) { preparar(e.target); });

  function limpiar(el) {
    var tipo = tipoDe(el); if (!tipo) return;
    var cfg = TIPOS[tipo]; if (!cfg) return;
    var limpio = el.value.replace(cfg.quitar, '');
    if (limpio !== el.value) {
      el.value = limpio;
      avisar(el, tr(cfg.aviso || 'validacion.caracteres', 'Se quitaron caracteres no permitidos.'));
    }
  }
  // Delegación: funciona también con los campos que arman los JS (modales, tablas).
  document.addEventListener('input', function (e) { if (!componiendo) limpiar(e.target); }, true);

  // ───────── Campos numéricos (precios, montos, cantidades, stock) ─────────
  function esNumero(el) { return el && el.tagName === 'INPUT' && el.type === 'number'; }
  function aceptaDecimales(el) {
    var paso = el.getAttribute('step');
    return paso !== null && paso !== 'any' && Number(paso) > 0 && Number(paso) < 1;
  }

  // No se pueden tipear letras, "e", "+" ni (con mínimo 0 o más) "-"; sin decimales si es entero.
  document.addEventListener('keydown', function (e) {
    var el = e.target; if (!esNumero(el)) return;
    if (e.ctrlKey || e.metaKey || e.key.length > 1) return;           // atajos y teclas de control
    var permitido = /[0-9]/.test(e.key) || ((e.key === '.' || e.key === ',') && aceptaDecimales(el)) ||
                    (e.key === '-' && (el.min === '' || parseFloat(el.min) < 0));
    if (!permitido) {
      e.preventDefault();
      avisar(el, tr('validacion.solo_numeros_campo', 'Este campo solo acepta números.'));
    }
  });

  // Al pegar: solo dígitos (y un separador decimal si corresponde).
  document.addEventListener('paste', function (e) {
    var el = e.target; if (!esNumero(el)) return;
    e.preventDefault();
    var txt = (e.clipboardData || window.clipboardData).getData('text') || '';
    var limpio = txt.replace(',', '.').replace(aceptaDecimales(el) ? /[^0-9.]/g : /[^0-9]/g, '');
    if (limpio.split('.').length > 2) limpio = limpio.split('.').slice(0, 2).join('.');
    el.value = limpio;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    if (limpio !== txt.trim()) avisar(el, tr('validacion.solo_numeros_campo', 'Este campo solo acepta números.'));
  });

  // Máximo 2 decimales en los importes.
  document.addEventListener('input', function (e) {
    var el = e.target; if (!esNumero(el)) return;
    if (aceptaDecimales(el) && /\.\d{3,}/.test(el.value)) el.value = el.value.replace(/(\.\d{2}).*$/, '$1');
    if (!aceptaDecimales(el) && /[.,]/.test(el.value)) el.value = el.value.replace(/[.,].*$/, '');
  });

  // Al salir del campo: respetar el mínimo y el máximo.
  document.addEventListener('change', function (e) {
    var el = e.target; if (!esNumero(el) || el.value === '') return;
    var v = parseFloat(el.value);
    if (el.max !== '' && v > parseFloat(el.max)) { el.value = el.max; avisar(el, tr('validacion.maximo', 'El valor máximo es') + ' ' + el.max); }
    else if (el.min !== '' && v < parseFloat(el.min)) { el.value = el.min; avisar(el, tr('validacion.minimo', 'El valor mínimo es') + ' ' + el.min); }
  }, true);

  // Aplicar a los campos que ya están en la página.
  function iniciar() { document.querySelectorAll('input, textarea').forEach(preparar); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
