<?php
/**
 * Validador.php — capa de lógica
 * Valida lo que llega desde los formularios ANTES de usarlo.
 * La validación del navegador (js/validacion.js) mejora la experiencia,
 * pero esta es la que cuenta: el navegador se puede saltear, el servidor no.
 *
 * Cada campo tiene un tipo y cada tipo su regla:
 *  - texto          letras (con tildes y ñ), números, espacios y los signos . , ; : ' " ( ) - _ / & # % + @ ° º ª ! ? ¿ ¡ $
 *                   (nombres de producto, descripciones, observaciones, categorías…). Máximo 500 caracteres.
 *  - nombre_propio  letras, números, espacios y . , ' -   (cliente, calle, barrio, ciudad, proveedor, nombre de persona)
 *  - telefono       solo números y espacios (hasta 20)
 *  - codigo         letras, números y . _ - /   (SKU, n.º de lote)           (hasta 40, sin espacios)
 *  - numero         letras, números y espacios (n.º de puerta, ej. "1234 bis") (hasta 10)
 *  - email          usuario@dominio.ext con caracteres comunes
 *  - password       letras, números y símbolos del teclado, sin emojis
 *  - decimal        precios y montos: número de 0 a 99.999.999,99 con hasta 2 decimales
 *  - entero         cantidades y stock: número entero de 0 a 1.000.000
 * Los emojis y los símbolos < > { } [ ] \ | ^ ~ = * ` no se aceptan en ningún texto.
 */
class Validador
{
    private const TEXTO    = '/^[\p{L}\p{M}\p{N}\p{Pd}\p{Pi}\p{Pf}\s.,;:\'"()_\/&#%+@°ºª!?¿¡$]*$/u';
    private const NOMBRE   = '/^[\p{L}\p{M}\p{N} .,\'’\-]*$/u';
    private const TELEFONO = '/^[0-9 ]*$/';
    private const CODIGO   = '/^[A-Za-z0-9._\/\-]*$/';
    private const NUMERO   = '/^[A-Za-z0-9 ]*$/';
    private const EMAIL    = '/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/';
    private const PASSWORD = '/^[\x20-\x7E\p{L}\p{M}\p{N}]*$/u';

    private const MAX_TEXTO    = 500;
    private const MAX_DECIMAL  = 99999999.99;
    private const MAX_ENTERO   = 1000000;

    /** Tipo de cada campo según su nombre (lo que no figura acá es «texto»). */
    private const TIPOS = [
        'password' => 'password',
        'cliente_nombre' => 'nombre_propio', 'calle' => 'nombre_propio', 'barrio' => 'nombre_propio', 'ciudad' => 'nombre_propio',
        'proveedor' => 'nombre_propio', 'proveedor_nombre' => 'nombre_propio',
        'telefono' => 'telefono', 'cliente_telefono' => 'telefono', 'proveedor_contacto' => 'telefono',
        'sku' => 'codigo', 'lote' => 'codigo',
        'numero' => 'numero',
        'precio_costo' => 'decimal', 'precio_venta' => 'decimal', 'monto' => 'decimal', 'monto_recibido' => 'decimal',
        'cantidad' => 'entero', 'cantidad_buena' => 'entero', 'stock_min' => 'entero',
    ];

    /**
     * Devuelve el mensaje de error del primer campo inválido, o null si todo está bien.
     * @param array $tipos  tipos que reemplazan a los de TIPOS para este endpoint (ej. ['nombre' => 'nombre_propio'])
     */
    public static function revisar(array $datos, array $tipos = [], string $prefijo = ''): ?string
    {
        foreach ($datos as $clave => $valor) {
            $nombre = $prefijo . $clave;
            if (is_string($clave) && ($m = self::revisarTexto($clave, $nombre))) return $m;   // las claves (atributos) también

            if (is_array($valor)) {
                if ($m = self::revisar($valor, $tipos, $nombre . '.')) return $m;
                continue;
            }
            if ($valor === null || $valor === '' || is_bool($valor)) continue;

            $tipo = $tipos[$clave] ?? self::TIPOS[$clave] ?? (stripos((string) $clave, 'email') !== false ? 'email' : 'texto');
            if ($m = self::revisarValor($tipo, $valor, (string) $clave, $nombre)) return $m;
        }
        return null;
    }

    private static function revisarValor(string $tipo, $valor, string $clave, string $campo): ?string
    {
        if ($tipo === 'decimal') {
            if (!(is_int($valor) || is_float($valor) || (is_string($valor) && preg_match('/^\d+(\.\d{1,2})?$/', $valor)))
                || $valor < 0 || $valor > self::MAX_DECIMAL) {
                return "El campo «{$campo}» tiene que ser un número entre 0 y 99.999.999,99, con hasta 2 decimales y sin letras ni símbolos.";
            }
            return null;
        }
        if ($tipo === 'entero') {
            if (!(is_int($valor) || (is_string($valor) && preg_match('/^\d+$/', $valor)) || (is_float($valor) && floor($valor) == $valor))
                || $valor < 0 || $valor > self::MAX_ENTERO) {
                return "El campo «{$campo}» tiene que ser un número entero entre 0 y 1.000.000, sin letras ni símbolos.";
            }
            return null;
        }
        if (!is_string($valor)) return null;

        switch ($tipo) {
            case 'password':
                return preg_match(self::PASSWORD, $valor) ? null : 'La contraseña tiene caracteres no permitidos (emojis o caracteres especiales).';
            case 'email':
                return preg_match(self::EMAIL, trim($valor)) ? null : 'El email no tiene un formato válido (ejemplo: usuario@dominio.com).';
            case 'telefono':
                return (preg_match(self::TELEFONO, $valor) && strlen($valor) <= 20) ? null : 'El teléfono solo puede tener números y espacios (hasta 20).';
            case 'codigo':
                return (preg_match(self::CODIGO, $valor) && strlen($valor) <= 40) ? null : "El campo «{$campo}» solo puede tener letras, números y los signos . _ - / (sin espacios, hasta 40).";
            case 'numero':
                return (preg_match(self::NUMERO, $valor) && strlen($valor) <= 10) ? null : 'El número solo puede tener letras, números y espacios (hasta 10).';
            case 'nombre_propio':
                return (preg_match(self::NOMBRE, $valor) && mb_strlen($valor) <= 100) ? null : "El campo «{$campo}» solo puede tener letras, números, espacios y los signos . , ' - (hasta 100).";
            default:
                return self::revisarTexto($valor, $campo);
        }
    }

    private static function revisarTexto(string $texto, string $campo): ?string
    {
        if (mb_strlen($texto) > self::MAX_TEXTO) {
            return "El campo «{$campo}» es demasiado largo (máximo " . self::MAX_TEXTO . ' caracteres).';
        }
        if (!preg_match(self::TEXTO, $texto)) {
            return "El campo «{$campo}» tiene caracteres no permitidos: no se aceptan emojis ni símbolos como < > { } [ ] \\ | ^ ~ = *.";
        }
        return null;
    }

    /** Para usar en los endpoints: si hay un campo inválido responde 400 y corta. */
    public static function exigir($datos, array $tipos = []): void
    {
        if (!is_array($datos)) return;
        $error = self::revisar($datos, $tipos);
        if ($error !== null) {
            http_response_code(400);
            echo json_encode(['error' => $error]);
            exit;
        }
    }
}
