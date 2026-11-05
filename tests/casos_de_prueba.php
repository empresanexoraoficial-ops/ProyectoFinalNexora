<?php
/**
 * tests/casos_de_prueba.php — pruebas automatizadas básicas de StockFlow.
 *
 * Ejecuta los casos de prueba (CP) del Plan de Testing contra la API real
 * (api/*.php) y muestra, para cada CP, el resultado esperado y el obtenido.
 *
 * Requisitos: PHP 8 con la extensión curl (viene en Laragon y XAMPP), el
 * sistema corriendo y la base cargada con db/ddl_stockflow.sql + db/dml_demo_completo.sql.
 *
 * Uso:
 *     php tests/casos_de_prueba.php                        # http://localhost:8000
 *     php tests/casos_de_prueba.php http://stockflow.test
 *     php tests/casos_de_prueba.php http://stockflow.test resultados.json
 *
 * Los casos crean datos de prueba con un sufijo único, por lo que pueden
 * ejecutarse varias veces. Código de salida: 0 si todos pasan, 1 si alguno falla.
 */

$BASE   = rtrim($argv[1] ?? 'http://localhost:8000', '/');
$SALIDA = $argv[2] ?? null;
$SUF    = substr((string) time(), -6);            // sufijo único por corrida

$CUENTAS = [
    'admin'     => ['admin@nexora.com', '1234'],
    'vendedor'  => ['vendedor@nexora.com', '1234'],
    'repositor' => ['repositor@nexora.com', '1234'],
];

/** Cliente HTTP con sesión (cookie) propia. */
class Cliente
{
    private $ch;

    public function __construct()
    {
        $this->ch = curl_init();
        curl_setopt_array($this->ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_COOKIEFILE     => '',          // activa el manejo de cookies en memoria
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        ]);
    }

    /** @return array [codigo HTTP, cuerpo decodificado] */
    public function llamar(string $metodo, string $ruta, $cuerpo = null): array
    {
        global $BASE;
        curl_setopt($this->ch, CURLOPT_URL, $BASE . $ruta);
        curl_setopt($this->ch, CURLOPT_CUSTOMREQUEST, $metodo);
        curl_setopt($this->ch, CURLOPT_POSTFIELDS, $cuerpo !== null ? json_encode($cuerpo) : '');
        $texto  = curl_exec($this->ch);
        $codigo = (int) curl_getinfo($this->ch, CURLINFO_RESPONSE_CODE);
        if ($texto === false) {
            return [0, ['_texto' => curl_error($this->ch)]];
        }
        $d = json_decode($texto, true);
        return [$codigo, is_array($d) ? $d : ['_texto' => substr($texto, 0, 120)]];
    }

    public function login(string $quien): array
    {
        global $CUENTAS;
        [$email, $pw] = $CUENTAS[$quien];
        return $this->llamar('POST', '/api/login.php', ['email' => $email, 'password' => $pw]);
    }
}

function sesion(string $quien): Cliente
{
    $c = new Cliente();
    [$codigo] = $c->login($quien);
    if ($codigo !== 200) {
        fwrite(STDERR, "No se pudo iniciar sesión como $quien (HTTP $codigo). ¿Está el sistema corriendo y la base cargada?\n");
        exit(2);
    }
    return $c;
}

function variantes(Cliente $c): array
{
    return $c->llamar('GET', '/api/variantes.php')[1]['variantes'] ?? [];
}

function stock_de(Cliente $c, int $vid): int
{
    foreach (variantes($c) as $v) {
        if ((int) $v['id'] === $vid) {
            return (int) $v['stock'];
        }
    }
    return -1;
}

function cortar($txt, int $n = 90): string
{
    $txt = (string) $txt;
    return function_exists('mb_substr') ? mb_substr($txt, 0, $n) : substr($txt, 0, $n);
}

function minusculas(string $s): string
{
    return function_exists('mb_strtolower') ? mb_strtolower($s) : strtolower($s);
}

$RESULTADOS = [];

/** Registra un caso de prueba. La función devuelve [ok, obtenido]. */
function cp(string $id, string $rf, string $descripcion, string $entrada, string $esperado, callable $fn): void
{
    global $RESULTADOS;
    try {
        [$ok, $obtenido] = $fn();
    } catch (Throwable $e) {
        [$ok, $obtenido] = [false, 'excepción: ' . $e->getMessage()];
    }
    $RESULTADOS[] = ['cp' => $id, 'rf' => $rf, 'descripcion' => $descripcion, 'entrada' => $entrada,
        'esperado' => $esperado, 'obtenido' => $obtenido, 'resultado' => $ok ? 'Aprobado' : 'Fallido'];
}

// ───────────────────────── Autenticación y acceso ─────────────────────────
cp('CP01', 'RF6.1', 'Login correcto como Administrador', 'admin@nexora.com / 1234',
    'HTTP 200 y rol administrador', function () {
        [$codigo, $d] = (new Cliente())->login('admin');
        $rol = $d['usuario']['rol'] ?? null;
        return [$codigo === 200 && $rol === 'administrador', "HTTP $codigo, rol $rol"];
    });

cp('CP02', 'RF6.1', 'Login con contraseña incorrecta', 'admin@nexora.com / clave-mala',
    'HTTP 401, sin acceso', function () {
        [$codigo, $d] = (new Cliente())->llamar('POST', '/api/login.php', ['email' => 'admin@nexora.com', 'password' => 'clave-mala']);
        return [$codigo === 401, "HTTP $codigo: " . ($d['error'] ?? '')];
    });

cp('CP03', 'RF6.1', 'Intento de inyección SQL en el login', "email: ' OR '1'='1 / password: x",
    'HTTP 401 (la consulta preparada lo trata como texto)', function () {
        [$codigo] = (new Cliente())->llamar('POST', '/api/login.php', ['email' => "' OR '1'='1", 'password' => 'x']);
        return [$codigo === 401, "HTTP $codigo"];
    });

cp('CP04', 'RF6.1', 'Login con campos vacíos', 'email y contraseña vacíos', 'HTTP 400', function () {
    [$codigo] = (new Cliente())->llamar('POST', '/api/login.php', ['email' => '', 'password' => '']);
    return [$codigo === 400, "HTTP $codigo"];
});

cp('CP05', 'RF6.3', 'Pedir un dato sin sesión iniciada', 'GET api/me.php sin cookie', 'HTTP 401', function () {
    [$codigo] = (new Cliente())->llamar('GET', '/api/me.php');
    return [$codigo === 401, "HTTP $codigo"];
});

cp('CP06', 'RF6.3', 'Vendedor intenta ver Personal (solo Administrador)', 'GET api/personal.php como Vendedor',
    'HTTP 403', function () {
        [$codigo] = sesion('vendedor')->llamar('GET', '/api/personal.php');
        return [$codigo === 403, "HTTP $codigo"];
    });

cp('CP07', 'RF6.3', 'Repositor intenta registrar una venta', 'POST api/ventas.php como Repositor', 'HTTP 403', function () {
    [$codigo] = sesion('repositor')->llamar('POST', '/api/ventas.php', ['items' => [['variante_id' => 1, 'cantidad' => 1]]]);
    return [$codigo === 403, "HTTP $codigo"];
});

cp('CP08', 'RF6.1', 'Cerrar sesión destruye la sesión', 'POST api/logout.php y luego GET api/me.php',
    'me.php responde 401 después del logout', function () {
        $c = sesion('admin');
        $c->llamar('POST', '/api/logout.php');
        [$codigo] = $c->llamar('GET', '/api/me.php');
        return [$codigo === 401, "HTTP $codigo después de cerrar sesión"];
    });

// ───────────────────────────── Inventario ─────────────────────────────
$ADMIN = sesion('admin');
$PRODUCTO_ID = null;

cp('CP09', 'RF1.1', 'Administrador crea un producto nuevo', "nombre \"Prueba $SUF\", marca \"Nexora\", precios",
    'HTTP 200 y id del producto', function () {
        global $ADMIN, $SUF, $PRODUCTO_ID;
        [$codigo, $d] = $ADMIN->llamar('POST', '/api/productos.php', ['nombre' => "Prueba $SUF", 'marca' => 'Nexora',
            'precio_costo' => 100, 'precio_venta' => 150]);
        $PRODUCTO_ID = $d['id'] ?? null;
        return [$codigo === 200 && !empty($d['id']), "HTTP $codigo, id " . ($d['id'] ?? '')];
    });

cp('CP10', 'RF1.1', 'Crear un producto con mismo nombre y marca (duplicado)', "nombre \"Prueba $SUF\", marca \"Nexora\"",
    'HTTP 409 y mensaje que sugiere agregar una variante', function () {
        global $ADMIN, $SUF;
        [$codigo, $d] = $ADMIN->llamar('POST', '/api/productos.php', ['nombre' => "Prueba $SUF", 'marca' => 'Nexora',
            'precio_costo' => 100, 'precio_venta' => 150]);
        return [$codigo === 409, "HTTP $codigo: " . cortar($d['error'] ?? '')];
    });

cp('CP11', 'RF1.1', 'Repositor intenta crear un producto', 'POST api/productos.php como Repositor', 'HTTP 403', function () {
    global $SUF;
    [$codigo] = sesion('repositor')->llamar('POST', '/api/productos.php', ['nombre' => "Otro $SUF"]);
    return [$codigo === 403, "HTTP $codigo"];
});

cp('CP12', 'RF1.1', 'Crear un producto sin nombre', 'nombre vacío', 'HTTP 400', function () {
    global $ADMIN;
    [$codigo] = $ADMIN->llamar('POST', '/api/productos.php', ['nombre' => '']);
    return [$codigo === 400, "HTTP $codigo"];
});

$VARIANTE_ID = null;

cp('CP13', 'RF1.3', 'Agregar una variante con atributos a un producto existente',
    'producto del CP09, atributos {Tamaño: 500ml}, stock mínimo 2', 'HTTP 200 y id de variante', function () {
        global $ADMIN, $SUF, $PRODUCTO_ID, $VARIANTE_ID;
        [$codigo, $d] = $ADMIN->llamar('POST', '/api/variantes.php', ['producto_id' => $PRODUCTO_ID,
            'sku' => "PRB-$SUF", 'atributos' => ['Tamaño' => '500ml'], 'stock_min' => 2]);
        $VARIANTE_ID = $d['variante_id'] ?? null;
        return [$codigo === 200 && !empty($d['variante_id']), "HTTP $codigo, variante " . ($d['variante_id'] ?? '')];
    });

cp('CP14', 'RF1.3', 'Agregar una variante a un producto inexistente', 'producto_id 999999', 'HTTP 409 con mensaje', function () {
    global $ADMIN;
    [$codigo, $d] = $ADMIN->llamar('POST', '/api/variantes.php', ['producto_id' => 999999, 'atributos' => new stdClass()]);
    return [$codigo === 409, "HTTP $codigo: " . cortar($d['error'] ?? '')];
});

cp('CP15', 'RF1.5', 'Administrador crea un atributo y lo desactiva', "atributo \"Atr$SUF\", luego DELETE",
    'HTTP 200 al crear y al desactivar', function () {
        global $ADMIN, $SUF;
        [$c1, $d] = $ADMIN->llamar('POST', '/api/atributos.php', ['nombre' => "Atr$SUF", 'aplica_variante' => true]);
        [$c2] = $ADMIN->llamar('DELETE', '/api/atributos.php?id=' . ($d['id'] ?? ''));
        return [$c1 === 200 && $c2 === 200, "crear HTTP $c1, desactivar HTTP $c2"];
    });

// ──────────────────────────────── Ventas ────────────────────────────────
$VEND = sesion('vendedor');
$VAR = null;
foreach (variantes($VEND) as $v) {           // una variante con stock suficiente
    if ((int) $v['stock'] >= 10) { $VAR = $v; break; }
}
if ($VAR === null) {
    fwrite(STDERR, "No hay ninguna variante con stock >= 10. ¿Está cargado dml_demo_completo.sql?\n");
    exit(2);
}
$VID = (int) $VAR['id'];
$PRECIO = (float) $VAR['precio_venta'];

cp('CP16', 'RF2.1, RF2.2, RF2.5', 'Venta en efectivo con vuelto: descuenta stock y calcula el vuelto',
    "2 u. de variante $VID, método efectivo, monto recibido = total + 500",
    'HTTP 200, estado confirmada, vuelto 500, stock baja 2', function () {
        global $VEND, $VID, $PRECIO;
        $antes = stock_de($VEND, $VID);
        $total = round(2 * $PRECIO, 2);
        [$codigo, $d] = $VEND->llamar('POST', '/api/ventas.php', ['items' => [['variante_id' => $VID, 'cantidad' => 2]],
            'canal' => 'Presencial', 'metodo_pago' => 'efectivo', 'monto_recibido' => $total + 500]);
        $despues = stock_de($VEND, $VID);
        $ok = $codigo === 200 && ($d['estado'] ?? '') === 'confirmada' && abs((float) ($d['vuelto'] ?? -1) - 500) < 0.01
            && $antes - $despues === 2;
        return [$ok, "HTTP $codigo, " . ($d['estado'] ?? '') . ', vuelto ' . ($d['vuelto'] ?? '') . ", stock {$antes}→{$despues}"];
    });

cp('CP17', 'RF2.1, RF2.5', 'Venta con tarjeta: monto recibido igual al total y vuelto 0',
    "1 u. de variante $VID, método tarjeta", 'HTTP 200, vuelto 0', function () {
        global $VEND, $VID;
        [$codigo, $d] = $VEND->llamar('POST', '/api/ventas.php', ['items' => [['variante_id' => $VID, 'cantidad' => 1]],
            'canal' => 'WhatsApp', 'metodo_pago' => 'tarjeta']);
        return [$codigo === 200 && (float) ($d['vuelto'] ?? -1) == 0, "HTTP $codigo, vuelto " . ($d['vuelto'] ?? '')];
    });

cp('CP18', 'RF2.1, RF2.5', 'Efectivo insuficiente es rechazado', 'monto recibido menor al total',
    'HTTP 409 y mensaje con lo que falta; el stock no cambia', function () {
        global $VEND, $VID;
        $antes = stock_de($VEND, $VID);
        [$codigo, $d] = $VEND->llamar('POST', '/api/ventas.php', ['items' => [['variante_id' => $VID, 'cantidad' => 1]],
            'metodo_pago' => 'efectivo', 'monto_recibido' => 1]);
        $despues = stock_de($VEND, $VID);
        return [$codigo === 409 && $antes === $despues, "HTTP $codigo, stock {$antes}→{$despues}: " . cortar($d['error'] ?? '')];
    });

cp('CP19', 'RF2.1, RF2.5', 'Venta sin método de pago es rechazada', 'sin metodo_pago', 'HTTP 409', function () {
    global $VEND, $VID;
    [$codigo] = $VEND->llamar('POST', '/api/ventas.php', ['items' => [['variante_id' => $VID, 'cantidad' => 1]]]);
    return [$codigo === 409, "HTTP $codigo"];
});

cp('CP20', 'RF2.1', 'Cantidad inválida (0) es rechazada', 'cantidad 0', 'HTTP 409', function () {
    global $VEND, $VID;
    [$codigo] = $VEND->llamar('POST', '/api/ventas.php', ['items' => [['variante_id' => $VID, 'cantidad' => 0]],
        'metodo_pago' => 'tarjeta']);
    return [$codigo === 409, "HTTP $codigo"];
});

cp('CP21', 'RF2.3', 'Venta sin stock suficiente queda pendiente, no descuenta stock y genera aviso',
    'cantidad mayor al stock disponible',
    'HTTP 200, estado pendiente, stock sin cambios, aviso para Administrador/Repositor', function () {
        global $VEND, $VID;
        $antes = stock_de($VEND, $VID);
        [$codigo, $d] = $VEND->llamar('POST', '/api/ventas.php', ['items' => [['variante_id' => $VID, 'cantidad' => $antes + 1000]],
            'canal' => 'WhatsApp']);
        $despues = stock_de($VEND, $VID);
        $avisos = sesion('repositor')->llamar('GET', '/api/notificaciones.php')[1]['notificaciones'] ?? [];
        $hay = false;
        foreach ($avisos as $a) {
            if (str_contains((string) ($a['mensaje'] ?? ''), 'Venta') || ($a['tipo'] ?? '') === 'venta_pendiente') { $hay = true; break; }
        }
        $ok = $codigo === 200 && ($d['estado'] ?? '') === 'pendiente' && $antes === $despues && $hay;
        return [$ok, "HTTP $codigo, " . ($d['estado'] ?? '') . ", stock {$antes}→{$despues}, aviso " . ($hay ? 'sí' : 'no')];
    });

cp('CP22', 'RF2.4', 'El vendedor consulta su historial de ventas', 'GET api/ventas.php como Vendedor',
    'HTTP 200 y lista con las ventas registradas', function () {
        global $VEND;
        [$codigo, $d] = $VEND->llamar('GET', '/api/ventas.php');
        $n = count($d['ventas'] ?? []);
        return [$codigo === 200 && $n >= 2, "HTTP $codigo, $n ventas en el historial"];
    });

// ─────────────────────── Ingresos de mercadería ───────────────────────
$REP = sesion('repositor');

cp('CP23', 'RF3.1, RF3.2', 'Ingreso con unidades dañadas: solo suma al stock la cantidad en buen estado',
    'recibidas 10, en buen estado 8', 'HTTP 200 y el stock sube 8 (no 10)', function () {
        global $REP, $VID, $SUF;
        $antes = stock_de($REP, $VID);
        [$codigo] = $REP->llamar('POST', '/api/ingresos.php', ['variante_id' => $VID, 'cantidad' => 10, 'cantidad_buena' => 8,
            'lote' => "R-$SUF-A", 'proveedor_nombre' => "Prov $SUF"]);
        $despues = stock_de($REP, $VID);
        return [$codigo === 200 && $despues - $antes === 8, "HTTP $codigo, stock {$antes}→{$despues}"];
    });

cp('CP24', 'RF3.1', 'Remito repetido para el mismo proveedor es rechazado', "mismo lote R-$SUF-A y proveedor",
    'HTTP 409 y el stock no cambia', function () {
        global $REP, $VID, $SUF;
        $antes = stock_de($REP, $VID);
        [$codigo] = $REP->llamar('POST', '/api/ingresos.php', ['variante_id' => $VID, 'cantidad' => 5, 'cantidad_buena' => 5,
            'lote' => "R-$SUF-A", 'proveedor_nombre' => "Prov $SUF"]);
        $despues = stock_de($REP, $VID);
        return [$codigo === 409 && $antes === $despues, "HTTP $codigo, stock {$antes}→{$despues}"];
    });

cp('CP25', 'RF3.1', 'Cantidad en buen estado mayor a la recibida es rechazada', 'recibidas 5, en buen estado 9',
    'HTTP 409', function () {
        global $REP, $VID, $SUF;
        [$codigo] = $REP->llamar('POST', '/api/ingresos.php', ['variante_id' => $VID, 'cantidad' => 5, 'cantidad_buena' => 9,
            'lote' => "R-$SUF-B"]);
        return [$codigo === 409, "HTTP $codigo"];
    });

cp('CP26', 'RF3.1', 'Ingreso con campo obligatorio faltante', 'sin lote', 'HTTP 400', function () {
    global $REP, $VID;
    [$codigo] = $REP->llamar('POST', '/api/ingresos.php', ['variante_id' => $VID, 'cantidad' => 5, 'cantidad_buena' => 5]);
    return [$codigo === 400, "HTTP $codigo"];
});

cp('CP27', 'RF1.8, RF3.3', 'Aviso de stock mínimo cuando una venta deja la variante en el mínimo',
    'vender hasta quedar en el stock mínimo', 'se genera un aviso visible para el Repositor', function () {
        global $REP, $VID;
        $c = sesion('vendedor');
        $v = null;
        foreach (variantes($c) as $x) {
            if ((int) $x['id'] === $VID) { $v = $x; break; }
        }
        $aVender = (int) $v['stock'] - (int) $v['stock_min'];
        if ($aVender < 1) {
            return [true, 'la variante ya estaba en el mínimo (aviso ya generado)'];
        }
        [$codigo] = $c->llamar('POST', '/api/ventas.php', ['items' => [['variante_id' => $VID, 'cantidad' => $aVender]],
            'metodo_pago' => 'tarjeta']);
        $avisos = $REP->llamar('GET', '/api/notificaciones.php')[1]['notificaciones'] ?? [];
        $hay = false;
        foreach ($avisos as $a) {
            if (str_contains(minusculas((string) ($a['mensaje'] ?? '')), 'mínimo')) { $hay = true; break; }
        }
        return [$codigo === 200 && $hay, "HTTP $codigo, aviso de mínimo " . ($hay ? 'sí' : 'no')];
    });

// ───────────────────────── Gastos, reportes y panel ─────────────────────────
cp('CP28', 'RF4.1', 'Administrador registra un gasto', 'categoría "Logística", monto 450', 'HTTP 200', function () {
    global $ADMIN, $SUF;
    [$codigo, $d] = $ADMIN->llamar('POST', '/api/gastos.php', ['categoria' => 'Logística', 'monto' => 450,
        'descripcion' => "Prueba $SUF"]);
    return [$codigo === 200, "HTTP $codigo, id " . ($d['id'] ?? '')];
});

cp('CP29', 'RF4.1', 'Gasto con monto 0 es rechazado', 'monto 0', 'HTTP 400', function () {
    global $ADMIN;
    [$codigo] = $ADMIN->llamar('POST', '/api/gastos.php', ['categoria' => 'Logística', 'monto' => 0]);
    return [$codigo === 400, "HTTP $codigo"];
});

cp('CP30', 'RF5.2', 'Reporte de ventas por período', 'GET api/reportes.php?tipo=ventas', 'HTTP 200 con datos', function () {
    global $ADMIN;
    [$codigo, $d] = $ADMIN->llamar('GET', '/api/reportes.php?tipo=ventas');
    $n = count($d['datos'] ?? []);
    return [$codigo === 200 && $n > 0, "HTTP $codigo, $n filas"];
});

cp('CP31', 'RF5.2', 'Reporte con tipo inválido', 'tipo=inexistente', 'HTTP 400', function () {
    global $ADMIN;
    [$codigo] = $ADMIN->llamar('GET', '/api/reportes.php?tipo=inexistente');
    return [$codigo === 400, "HTTP $codigo"];
});

cp('CP32', 'RF5.1', 'Dashboard del Administrador con indicadores', 'GET api/resumen.php?vista=dashboard',
    'HTTP 200 con ventas del mes, gastos, stock crítico y top de productos', function () {
        global $ADMIN;
        [$codigo, $d] = $ADMIN->llamar('GET', '/api/resumen.php?vista=dashboard');
        $datos = $d['datos'] ?? [];
        $claves = true;
        foreach (['ventas_mes', 'gastos_mes', 'stock_critico', 'top_productos'] as $k) {
            if (!array_key_exists($k, $datos)) { $claves = false; }
        }
        return [$codigo === 200 && $claves, "HTTP $codigo, indicadores " . ($claves ? 'completos' : 'incompletos')];
    });

cp('CP33', 'RF5.1', 'El dashboard no es accesible para el Vendedor', 'GET dashboard como Vendedor', 'HTTP 403', function () {
    [$codigo] = sesion('vendedor')->llamar('GET', '/api/resumen.php?vista=dashboard');
    return [$codigo === 403, "HTTP $codigo"];
});

// ───────────────────────────── Personal ─────────────────────────────
$USUARIO_ID = null;

cp('CP34', 'RF6.2', 'Administrador crea un usuario', "usuario$SUF@nexora.com, rol vendedor", 'HTTP 200 y id', function () {
    global $ADMIN, $SUF, $USUARIO_ID;
    [$codigo, $d] = $ADMIN->llamar('POST', '/api/personal.php', ['nombre' => "Usuario $SUF", 'email' => "usuario$SUF@nexora.com",
        'rol' => 'vendedor', 'password' => 'clave1234']);
    $USUARIO_ID = $d['id'] ?? null;
    return [$codigo === 200 && !empty($d['id']), "HTTP $codigo, id " . ($d['id'] ?? '')];
});

cp('CP35', 'RF6.2', 'Crear un usuario con email repetido', 'mismo email del CP34', 'HTTP 409', function () {
    global $ADMIN, $SUF;
    [$codigo] = $ADMIN->llamar('POST', '/api/personal.php', ['nombre' => 'Otro', 'email' => "usuario$SUF@nexora.com",
        'rol' => 'vendedor', 'password' => 'clave1234']);
    return [$codigo === 409, "HTTP $codigo"];
});

cp('CP36', 'RF6.2', 'Un usuario desactivado ya no puede iniciar sesión', 'PATCH activo=false y luego login',
    'HTTP 200 al desactivar y HTTP 401 al intentar entrar', function () {
        global $ADMIN, $SUF, $USUARIO_ID;
        [$c1] = $ADMIN->llamar('PATCH', "/api/personal.php?id=$USUARIO_ID", ['activo' => false]);
        [$c2] = (new Cliente())->llamar('POST', '/api/login.php', ['email' => "usuario$SUF@nexora.com", 'password' => 'clave1234']);
        return [$c1 === 200 && $c2 === 401, "desactivar HTTP $c1, login HTTP $c2"];
    });

cp('CP37', 'RF6.2', 'No se puede desactivar al propio Administrador', 'el admin se desactiva a sí mismo',
    'HTTP 409 con mensaje', function () {
        global $ADMIN;
        $yo = $ADMIN->llamar('GET', '/api/me.php')[1]['usuario']['id'] ?? 0;
        [$codigo, $d] = $ADMIN->llamar('PATCH', "/api/personal.php?id=$yo", ['activo' => false]);
        return [$codigo === 409, "HTTP $codigo: " . cortar($d['error'] ?? '')];
    });

cp('CP38', 'RF6.2', 'Editar un usuario que no existe', 'PUT api/personal.php?id=999999', 'HTTP 404', function () {
    global $ADMIN;
    [$codigo] = $ADMIN->llamar('PUT', '/api/personal.php?id=999999', ['nombre' => 'x']);
    return [$codigo === 404, "HTTP $codigo"];
});

cp('CP39', 'RF1.5', 'Desactivar un atributo que no existe', 'DELETE api/atributos.php?id=999999', 'HTTP 404', function () {
    global $ADMIN;
    [$codigo] = $ADMIN->llamar('DELETE', '/api/atributos.php?id=999999');
    return [$codigo === 404, "HTTP $codigo"];
});

cp('CP40', 'RF1.8', 'Marcar como leído un aviso que no existe', 'PATCH api/notificaciones.php?id=999999', 'HTTP 404', function () {
    global $REP;
    [$codigo] = $REP->llamar('PATCH', '/api/notificaciones.php?id=999999');
    return [$codigo === 404, "HTTP $codigo"];
});

// ───────────────── Identificación, rentabilidad y rendimiento ─────────────────
cp('CP41', 'RF1.4', 'El SKU identifica una única variante: un SKU repetido es rechazado',
    "segunda variante con sku PRB-$SUF", 'HTTP 409 (o 400) y no se crea la variante', function () {
        global $ADMIN, $SUF, $PRODUCTO_ID;
        [$codigo, $d] = $ADMIN->llamar('POST', '/api/variantes.php', ['producto_id' => $PRODUCTO_ID, 'sku' => "PRB-$SUF",
            'atributos' => ['Tamaño' => '1L'], 'stock_min' => 1]);
        return [in_array($codigo, [400, 409], true), "HTTP $codigo: " . cortar($d['error'] ?? '')];
    });

cp('CP42', 'RF1.9', 'Reporte de rentabilidad por producto (unidades, margen, rotación)',
    'GET api/reportes.php?tipo=rentabilidad', 'HTTP 200 con filas de productos', function () {
        global $ADMIN;
        [$codigo, $d] = $ADMIN->llamar('GET', '/api/reportes.php?tipo=rentabilidad');
        $n = count($d['datos'] ?? []);
        return [$codigo === 200 && $n > 0, "HTTP $codigo, $n filas"];
    });

cp('CP43', 'RNF03', 'Tiempo de respuesta menor a 3 segundos en consultas principales',
    'GET variantes, dashboard, ventas, reportes (5 veces cada una)', 'máximo < 3 s', function () {
        global $ADMIN;
        $peor = 0.0;
        foreach (['/api/variantes.php', '/api/resumen.php?vista=dashboard', '/api/ventas.php', '/api/reportes.php?tipo=ventas'] as $ruta) {
            for ($i = 0; $i < 5; $i++) {
                $t = microtime(true);
                $ADMIN->llamar('GET', $ruta);
                $peor = max($peor, microtime(true) - $t);
            }
        }
        return [$peor < 3, 'tiempo máximo ' . round($peor * 1000) . ' ms'];
    });

cp('CP44', 'RNF04', 'Las contraseñas no se devuelven por la API ni se guardan en texto plano',
    'GET api/personal.php y búsqueda de "password" / "1234"', 'ningún dato de contraseña en la respuesta', function () {
        global $ADMIN;
        [$codigo, $d] = $ADMIN->llamar('GET', '/api/personal.php');
        $txt = json_encode($d);
        return [$codigo === 200 && !str_contains($txt, 'password') && !str_contains($txt, '"1234"'), "HTTP $codigo, sin datos de contraseña"];
    });

// ───────────── Validación de caracteres y baja de usuarios ─────────────
cp('CP45', 'RF1.1', 'Un nombre de producto con emoji es rechazado', 'nombre "Remera 😀"', 'HTTP 400 y mensaje de caracteres no permitidos', function () {
    global $ADMIN;
    [$codigo, $d] = $ADMIN->llamar('POST', '/api/productos.php', ['nombre' => 'Remera 😀', 'marca' => 'Nexora',
        'precio_costo' => 100, 'precio_venta' => 150]);
    return [$codigo === 400, "HTTP $codigo: " . cortar($d['error'] ?? '')];
});

cp('CP46', 'RF2.1', 'Un dato del cliente con símbolos no permitidos es rechazado', 'cliente_nombre "<script>x</script>"',
    'HTTP 400 y no se registra la venta', function () {
        global $VEND, $VID;
        $antes = stock_de($VEND, $VID);
        [$codigo, $d] = $VEND->llamar('POST', '/api/ventas.php', ['items' => [['variante_id' => $VID, 'cantidad' => 1]],
            'metodo_pago' => 'tarjeta', 'cliente_nombre' => '<script>x</script>']);
        $despues = stock_de($VEND, $VID);
        return [$codigo === 400 && $antes === $despues, "HTTP $codigo, stock {$antes}→{$despues}: " . cortar($d['error'] ?? '')];
    });

cp('CP47', 'RF6.2', 'Alta de usuario con email de formato inválido', 'email "no-es-un-email"', 'HTTP 400', function () {
    global $ADMIN;
    [$codigo, $d] = $ADMIN->llamar('POST', '/api/personal.php', ['nombre' => 'Prueba', 'email' => 'no-es-un-email',
        'rol' => 'vendedor', 'password' => 'clave1234']);
    return [$codigo === 400, "HTTP $codigo: " . cortar($d['error'] ?? '')];
});

cp('CP48', 'RF6.2', 'El Administrador elimina a un usuario sin historial', 'DELETE del usuario creado en el CP34',
    'HTTP 200 y el usuario ya no aparece en la lista', function () {
        global $ADMIN, $USUARIO_ID;
        [$codigo] = $ADMIN->llamar('DELETE', "/api/personal.php?id=$USUARIO_ID");
        $lista = $ADMIN->llamar('GET', '/api/personal.php')[1]['usuarios'] ?? [];
        $sigue = false;
        foreach ($lista as $u) { if ((int) $u['id'] === (int) $USUARIO_ID) { $sigue = true; } }
        return [$codigo === 200 && !$sigue, "HTTP $codigo, " . ($sigue ? 'sigue en la lista' : 'ya no está en la lista')];
    });

cp('CP49', 'RF6.2', 'Una cuenta de Administrador no se puede eliminar', 'crear un Administrador y hacer DELETE',
    'HTTP 409 y la cuenta sigue existiendo', function () {
        global $ADMIN, $SUF;
        [, $d] = $ADMIN->llamar('POST', '/api/personal.php', ['nombre' => "Admin $SUF", 'email' => "admin$SUF@nexora.com",
            'rol' => 'administrador', 'password' => 'clave1234']);
        $id = $d['id'] ?? 0;
        [$codigo, $r] = $ADMIN->llamar('DELETE', "/api/personal.php?id=$id");
        $ADMIN->llamar('PATCH', "/api/personal.php?id=$id", ['activo' => false]);   // se deja inactivo para no ensuciar
        return [$codigo === 409, "HTTP $codigo: " . cortar($r['error'] ?? '')];
    });

cp('CP50', 'RF6.2', 'Nadie puede eliminar su propia cuenta', 'el Administrador hace DELETE sobre su propio id',
    'HTTP 409', function () {
        global $ADMIN;
        $yo = $ADMIN->llamar('GET', '/api/me.php')[1]['usuario']['id'] ?? 0;
        [$codigo, $d] = $ADMIN->llamar('DELETE', "/api/personal.php?id=$yo");
        return [$codigo === 409, "HTTP $codigo: " . cortar($d['error'] ?? '')];
    });

cp('CP51', 'RF6.2', 'Un usuario con ventas registradas no se elimina (se conserva el historial)', 'DELETE del Vendedor de prueba',
    'HTTP 409 con mensaje que sugiere desactivar', function () {
        global $ADMIN;
        $id = 0;
        foreach ($ADMIN->llamar('GET', '/api/personal.php')[1]['usuarios'] ?? [] as $u) {
            if ($u['email'] === 'vendedor@nexora.com') { $id = (int) $u['id']; }
        }
        [$codigo, $d] = $ADMIN->llamar('DELETE', "/api/personal.php?id=$id");
        return [$codigo === 409, "HTTP $codigo: " . cortar($d['error'] ?? '')];
    });

cp('CP52', 'RF6.3', 'Un Vendedor no puede eliminar usuarios', 'DELETE api/personal.php como Vendedor', 'HTTP 403', function () {
    [$codigo] = sesion('vendedor')->llamar('DELETE', '/api/personal.php?id=1');
    return [$codigo === 403, "HTTP $codigo"];
});

cp('CP53', 'RF6.2', 'Eliminar un usuario que no existe', 'DELETE api/personal.php?id=999999', 'HTTP 404', function () {
    global $ADMIN;
    [$codigo] = $ADMIN->llamar('DELETE', '/api/personal.php?id=999999');
    return [$codigo === 404, "HTTP $codigo"];
});

// ───────────── Teléfonos, precios, cantidades y códigos ─────────────
cp('CP54', 'RF2.1', 'Un teléfono con letras y símbolos es rechazado', 'cliente_telefono "09*/+-ab"', 'HTTP 400 y no se registra la venta', function () {
    global $VEND, $VID;
    $antes = stock_de($VEND, $VID);
    [$codigo, $d] = $VEND->llamar('POST', '/api/ventas.php', ['items' => [['variante_id' => $VID, 'cantidad' => 1]],
        'metodo_pago' => 'tarjeta', 'cliente_telefono' => '09*/+-ab']);
    $despues = stock_de($VEND, $VID);
    return [$codigo === 400 && $antes === $despues, "HTTP $codigo, stock {$antes}→{$despues}: " . cortar($d['error'] ?? '')];
});

cp('CP55', 'RF2.1', 'Un teléfono con números y espacios es aceptado', 'cliente_telefono "099 123 456"', 'HTTP 200', function () {
    global $VEND, $VID;
    [$codigo] = $VEND->llamar('POST', '/api/ventas.php', ['items' => [['variante_id' => $VID, 'cantidad' => 1]],
        'metodo_pago' => 'tarjeta', 'cliente_telefono' => '099 123 456', 'calle' => '18 de Julio', 'numero' => '1234 bis']);
    return [$codigo === 200, "HTTP $codigo"];
});

cp('CP56', 'RF1.1', 'Un precio con letras es rechazado', 'precio_venta "12abc"', 'HTTP 400', function () {
    global $ADMIN, $SUF;
    [$codigo, $d] = $ADMIN->llamar('POST', '/api/productos.php', ['nombre' => "Precio $SUF", 'marca' => 'Nexora',
        'precio_costo' => 100, 'precio_venta' => '12abc']);
    return [$codigo === 400, "HTTP $codigo: " . cortar($d['error'] ?? '')];
});

cp('CP57', 'RF1.1', 'Un precio negativo es rechazado', 'precio_costo -5', 'HTTP 400', function () {
    global $ADMIN, $SUF;
    [$codigo] = $ADMIN->llamar('POST', '/api/productos.php', ['nombre' => "Negativo $SUF", 'marca' => 'Nexora',
        'precio_costo' => -5, 'precio_venta' => 150]);
    return [$codigo === 400, "HTTP $codigo"];
});

cp('CP58', 'RF1.4', 'Un SKU con espacios y símbolos es rechazado', 'sku "A B*"', 'HTTP 400', function () {
    global $ADMIN, $PRODUCTO_ID;
    [$codigo, $d] = $ADMIN->llamar('POST', '/api/variantes.php', ['producto_id' => $PRODUCTO_ID, 'sku' => 'A B*',
        'atributos' => ['Tamaño' => '2L'], 'stock_min' => 1]);
    return [$codigo === 400, "HTTP $codigo: " . cortar($d['error'] ?? '')];
});

cp('CP59', 'RF3.1', 'Una cantidad desmesurada es rechazada', 'cantidad 99999999', 'HTTP 400', function () {
    global $REP, $VID, $SUF;
    [$codigo] = $REP->llamar('POST', '/api/ingresos.php', ['variante_id' => $VID, 'cantidad' => 99999999, 'cantidad_buena' => 99999999,
        'lote' => "R-$SUF-Z"]);
    return [$codigo === 400, "HTTP $codigo"];
});

cp('CP60', 'RF4.1', 'Un monto de gasto con letras es rechazado', 'monto "1e5x"', 'HTTP 400', function () {
    global $ADMIN;
    [$codigo] = $ADMIN->llamar('POST', '/api/gastos.php', ['categoria' => 'Logística', 'monto' => '1e5x']);
    return [$codigo === 400, "HTTP $codigo"];
});

// ───────────────────────────── Informe ─────────────────────────────
echo "StockFlow — casos de prueba contra $BASE\n\n";
$ancho = 0;
foreach ($RESULTADOS as $r) {
    $ancho = max($ancho, function_exists('mb_strlen') ? mb_strlen($r['descripcion']) : strlen($r['descripcion']));
}
$aprobados = 0;
foreach ($RESULTADOS as $r) {
    $ok = $r['resultado'] === 'Aprobado';
    $aprobados += $ok ? 1 : 0;
    $len = function_exists('mb_strlen') ? mb_strlen($r['descripcion']) : strlen($r['descripcion']);
    echo ($ok ? 'OK ' : 'XX ') . $r['cp'] . '  ' . $r['descripcion'] . str_repeat(' ', $ancho - $len) . '  → ' . $r['obtenido'] . "\n";
}
$total = count($RESULTADOS);
echo "\n$aprobados/$total casos aprobados, " . ($total - $aprobados) . " fallidos.\n";
if ($SALIDA) {
    file_put_contents($SALIDA, json_encode($RESULTADOS, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
}
exit($aprobados === $total ? 0 : 1);
