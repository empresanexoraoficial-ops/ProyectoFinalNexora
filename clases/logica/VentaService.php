<?php
/**
 * VentaService.php — capa de lógica
 * RF 2.1/2.2: registra la venta y descuenta stock.
 * RF 2.3: si no hay stock suficiente, la venta queda "pendiente" (no se
 * descuenta nada) y se notifica al Repositor — en vez de simplemente
 * rechazar la venta como hacía el sistema viejo.
 * Cobro: método de pago, monto recibido y vuelto. SIEMPRE se calculan y
 * validan acá, en el servidor: el navegador solo los muestra.
 */

require_once __DIR__ . '/../modelo/VentaDAO.php';
require_once __DIR__ . '/../modelo/VarianteDAO.php';
require_once __DIR__ . '/../modelo/NotificacionDAO.php';

class VentaService
{
    private const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];
    private const MONTO_MAXIMO = 99999999.99; // límite de DECIMAL(10,2)

    private VentaDAO $ventaDAO;
    private VarianteDAO $varianteDAO;
    private NotificacionDAO $notificacionDAO;
    private PDO $conexion;

    public function __construct()
    {
        $this->ventaDAO        = new VentaDAO();
        $this->varianteDAO     = new VarianteDAO();
        $this->notificacionDAO = new NotificacionDAO();
        $this->conexion        = Database::obtenerConexion();
    }

    /**
     * $items: [{variante_id, cantidad, precio_unitario}, ...]
     * @throws InvalidArgumentException si algún ítem no tiene variante válida
     */
    public function registrarVenta(array $datosVenta, array $items, int $vendedorId): array
    {
        if (empty($items)) {
            throw new InvalidArgumentException('La venta tiene que tener al menos un producto.');
        }

        // RF 2.3: si CUALQUIER ítem no tiene stock suficiente, toda la
        // venta queda pendiente (no se descuenta stock de ningún ítem).
        $hayFaltante = false;
        foreach ($items as &$item) {
            $variante = $this->varianteDAO->buscarPorId((int) ($item['variante_id'] ?? 0));
            if (!$variante) {
                throw new InvalidArgumentException('Uno de los productos de la venta no existe.');
            }

            // La cantidad tiene que ser un entero positivo: una cantidad negativa
            // SUMARÍA stock y daría un total negativo.
            $cantidad = $item['cantidad'] ?? null;
            if (!is_numeric($cantidad) || (int) $cantidad != $cantidad || (int) $cantidad < 1) {
                throw new InvalidArgumentException('La cantidad de cada producto tiene que ser un número entero mayor a 0.');
            }
            $item['cantidad'] = (int) $cantidad;

            // El precio sale de la base, NO del navegador: si no, cualquiera podría
            // mandar un precio inventado y vender a cualquier valor.
            $item['precio_unitario'] = $this->varianteDAO->precioVenta((int) $variante['id']);

            if ($variante['stock'] < $item['cantidad']) {
                $hayFaltante = true;
            }
        }
        unset($item);

        $estado = $hayFaltante ? 'pendiente' : 'confirmada';
        $total = round(array_sum(array_map(fn($i) => $i['cantidad'] * $i['precio_unitario'], $items)), 2);
        $datosVenta['total'] = $total; // VentaDAO::crearVenta lo necesita en el mismo array

        // ── Cobro ── solo si la venta quedó CONFIRMADA (una pendiente todavía
        // no se entrega, así que no se cobra). Se valida ANTES de abrir la
        // transacción: si el pago no es válido, no se toca nada.
        $metodo = null; $recibido = null; $vuelto = null;
        if ($estado === 'confirmada') {
            $metodo = $datosVenta['metodo_pago'] ?? null;
            if (!in_array($metodo, self::METODOS_PAGO, true)) {
                throw new InvalidArgumentException('Elegí el método de pago: efectivo, tarjeta o transferencia.');
            }
            if ($metodo === 'efectivo') {
                $bruto = $datosVenta['monto_recibido'] ?? null;
                if ($bruto === null || $bruto === '' || !is_numeric($bruto)) {
                    throw new InvalidArgumentException('Ingresá el monto con el que paga el cliente.');
                }
                $recibido = round((float) $bruto, 2);
                if ($recibido > self::MONTO_MAXIMO) {
                    throw new InvalidArgumentException('El monto recibido es demasiado grande.');
                }
                if ($recibido < $total) {
                    $faltan = number_format($total - $recibido, 2, '.', '');
                    throw new InvalidArgumentException("El monto recibido no alcanza para cubrir el total. Faltan \${$faltan}.");
                }
                $vuelto = round($recibido - $total, 2);
            } else {
                // Tarjeta o transferencia: se cobra el total justo, no hay vuelto.
                $recibido = $total;
                $vuelto   = 0.0;
            }
        }
        $datosVenta['metodo_pago']    = $metodo;
        $datosVenta['monto_recibido'] = $recibido;
        $datosVenta['vuelto']         = $vuelto;

        $this->conexion->beginTransaction();
        try {
            $ventaId = $this->ventaDAO->crearVenta($datosVenta, $vendedorId, $estado);

            foreach ($items as $item) {
                $this->ventaDAO->agregarDetalle(
                    $ventaId, (int) $item['variante_id'], (int) $item['cantidad'], (float) $item['precio_unitario']
                );

                // Solo se descuenta stock si la venta quedó CONFIRMADA.
                // Si quedó pendiente, no se toca stock de ningún ítem —
                // se resuelve manualmente cuando llegue mercadería.
                if ($estado === 'confirmada') {
                    $this->varianteDAO->ajustarStock((int) $item['variante_id'], -(int) $item['cantidad']);

                    // RF 1.8: si tras la venta el stock llegó al mínimo, se avisa
                    $v = $this->varianteDAO->buscarPorId((int) $item['variante_id']);
                    if ($v && $v['stock'] <= $v['stock_min']) {
                        $this->notificacionDAO->crearStockMinimoSiNoExiste(
                            (int) $v['id'],
                            'Stock en el mínimo (' . $v['stock'] . ' u.) para la variante '
                                . ($v['sku'] ?: '#' . $v['id']) . ' — conviene reponer.'
                        );
                    }
                }
            }

            if ($estado === 'pendiente') {
                $this->notificacionDAO->crear(
                    'venta_pendiente', $ventaId,
                    "Venta #{$ventaId} registrada sin stock suficiente — requiere reposición."
                );
            }

            $this->conexion->commit();
            return [
                'id'             => $ventaId,
                'fecha'          => $this->ventaDAO->fechaDe($ventaId),
                'estado'         => $estado,
                'total'          => $total,
                'metodo_pago'    => $metodo,
                'monto_recibido' => $recibido,
                'vuelto'         => $vuelto,
            ];
        } catch (Throwable $e) {
            $this->conexion->rollBack();
            throw $e;
        }
    }
}
