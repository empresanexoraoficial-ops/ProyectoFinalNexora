<?php
/**
 * VentaService.php — capa de lógica
 * RF 2.1/2.2: registra la venta y descuenta stock.
 * RF 2.3: si no hay stock suficiente, la venta queda "pendiente" (no se
 * descuenta nada) y se notifica al Repositor — en vez de simplemente
 * rechazar la venta como hacía el sistema viejo.
 */

require_once __DIR__ . '/../modelo/VentaDAO.php';
require_once __DIR__ . '/../modelo/VarianteDAO.php';
require_once __DIR__ . '/../modelo/NotificacionDAO.php';

class VentaService
{
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
        foreach ($items as $item) {
            $variante = $this->varianteDAO->buscarPorId((int) $item['variante_id']);
            if (!$variante) {
                throw new InvalidArgumentException("La variante {$item['variante_id']} no existe.");
            }
            if ($variante['stock'] < $item['cantidad']) {
                $hayFaltante = true;
            }
        }

        $estado = $hayFaltante ? 'pendiente' : 'confirmada';
        $total = array_sum(array_map(fn($i) => $i['cantidad'] * $i['precio_unitario'], $items));
        $datosVenta['total'] = $total; // VentaDAO::crearVenta lo necesita en el mismo array

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
                }
            }

            if ($estado === 'pendiente') {
                $this->notificacionDAO->crear(
                    'venta_pendiente', $ventaId,
                    "Venta #{$ventaId} registrada sin stock suficiente — requiere reposición."
                );
            }

            $this->conexion->commit();
            return ['id' => $ventaId, 'estado' => $estado, 'total' => $total];
        } catch (Throwable $e) {
            $this->conexion->rollBack();
            throw $e;
        }
    }
}
