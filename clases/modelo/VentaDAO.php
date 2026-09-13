<?php
/**
 * VentaDAO.php — capa de datos
 * Venta + detalle (líneas de venta, relación N:M con variantes).
 */

class VentaDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    public function crearVenta(array $d, int $vendedorId, string $estado): int
    {
        $stmt = $this->conexion->prepare(
            'INSERT INTO ventas
               (canal, cliente_nombre, cliente_email, cliente_telefono,
                calle, numero, barrio, ciudad, vendedor_id, total, estado)
             VALUES
               (:canal, :cliente_nombre, :cliente_email, :cliente_telefono,
                :calle, :numero, :barrio, :ciudad, :vendedor_id, :total, :estado)'
        );
        $stmt->execute([
            'canal'            => $d['canal'] ?? null,
            'cliente_nombre'   => $d['cliente_nombre'] ?? null,
            'cliente_email'    => $d['cliente_email'] ?? null,
            'cliente_telefono' => $d['cliente_telefono'] ?? null,
            'calle'            => $d['calle'] ?? null,
            'numero'           => $d['numero'] ?? null,
            'barrio'           => $d['barrio'] ?? null,
            'ciudad'           => $d['ciudad'] ?? null,
            'vendedor_id'      => $vendedorId,
            'total'            => $d['total'],
            'estado'           => $estado,
        ]);
        return (int) $this->conexion->lastInsertId();
    }

    public function agregarDetalle(int $ventaId, int $varianteId, int $cantidad, float $precioUnitario): void
    {
        $stmt = $this->conexion->prepare(
            'INSERT INTO venta_detalle (venta_id, variante_id, cantidad, precio_unitario)
             VALUES (:venta_id, :variante_id, :cantidad, :precio_unitario)'
        );
        $stmt->execute([
            'venta_id'        => $ventaId,
            'variante_id'     => $varianteId,
            'cantidad'        => $cantidad,
            'precio_unitario' => $precioUnitario,
        ]);
    }

    public function historialPorVendedor(int $vendedorId): array
    {
        $stmt = $this->conexion->prepare(
            'SELECT * FROM ventas WHERE vendedor_id = :vid ORDER BY fecha DESC'
        );
        $stmt->execute(['vid' => $vendedorId]);
        return $stmt->fetchAll();
    }
}
