<?php
/**
 * ResumenDAO.php — capa de datos
 * Consultas de solo lectura que arman los números del Dashboard y de la
 * pantalla de Inicio. Antes se calculaban en el navegador sobre datos de
 * localStorage; ahora se calculan en la base, con los datos reales.
 * Solo cuentan las ventas CONFIRMADAS (una venta pendiente todavía no se
 * entregó ni descontó stock, así que no es ingreso).
 */

class ResumenDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    private function una(string $sql, array $params = []): array
    {
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch() ?: [];
    }

    private function varias(string $sql, array $params = []): array
    {
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    private function ventasHoy(?int $vendedorId = null): array
    {
        $filtro = $vendedorId ? 'AND vendedor_id = :v' : '';
        $params = $vendedorId ? ['v' => $vendedorId] : [];
        $r = $this->una(
            "SELECT COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS total
             FROM ventas
             WHERE estado = 'confirmada' AND DATE(fecha) = CURDATE() $filtro",
            $params
        );
        return ['cantidad' => (int) $r['cantidad'], 'total' => (float) $r['total']];
    }

    private function contarStockCritico(): int
    {
        $r = $this->una(
            'SELECT COUNT(*) AS n
             FROM producto_variantes v JOIN productos p ON p.id = v.producto_id
             WHERE p.activo = 1 AND v.stock <= v.stock_min'
        );
        return (int) $r['n'];
    }

    public function dashboard(): array
    {
        $mes = date('Y-m-01');

        $ventasMes = $this->una(
            "SELECT COALESCE(SUM(total), 0) AS total FROM ventas
             WHERE estado = 'confirmada' AND fecha >= :mes",
            ['mes' => $mes]
        );
        $gastosMes = $this->una(
            'SELECT COALESCE(SUM(monto), 0) AS total FROM gastos WHERE fecha >= :mes',
            ['mes' => $mes]
        );
        $stockTotal = $this->una(
            'SELECT COALESCE(SUM(v.stock), 0) AS total
             FROM producto_variantes v JOIN productos p ON p.id = v.producto_id
             WHERE p.activo = 1'
        );

        return [
            'ventas_hoy'     => $this->ventasHoy(),
            'ventas_mes'     => (float) $ventasMes['total'],
            'gastos_mes'     => (float) $gastosMes['total'],
            'stock_total'    => (int) $stockTotal['total'],
            'stock_critico'  => $this->varias(
                'SELECT p.nombre AS producto_nombre, v.sku, v.stock, v.stock_min
                 FROM producto_variantes v JOIN productos p ON p.id = v.producto_id
                 WHERE p.activo = 1 AND v.stock <= v.stock_min
                 ORDER BY v.stock ASC, p.nombre LIMIT 50'
            ),
            'top_productos'  => $this->varias(
                "SELECT p.nombre, SUM(vd.cantidad) AS unidades,
                        SUM(vd.cantidad * vd.precio_unitario) AS total
                 FROM venta_detalle vd
                 JOIN ventas ve ON ve.id = vd.venta_id AND ve.estado = 'confirmada'
                 JOIN producto_variantes v ON v.id = vd.variante_id
                 JOIN productos p ON p.id = v.producto_id
                 GROUP BY p.id, p.nombre
                 ORDER BY unidades DESC LIMIT 5"
            ),
            'rechazos'       => $this->varias(
                "SELECT COALESCE(pr.nombre, 'Sin proveedor especificado') AS proveedor,
                        SUM(i.cantidad - i.cantidad_buena) AS rechazadas,
                        COUNT(*) AS ingresos
                 FROM ingresos i LEFT JOIN proveedores pr ON pr.id = i.proveedor_id
                 GROUP BY i.proveedor_id, pr.nombre
                 HAVING rechazadas > 0
                 ORDER BY rechazadas DESC"
            ),
        ];
    }

    public function inicioAdministrador(): array
    {
        $activos = $this->una('SELECT COUNT(*) AS n FROM productos WHERE activo = 1');
        return [
            'ventas_hoy'       => $this->ventasHoy(),
            'stock_critico'    => $this->contarStockCritico(),
            'productos_activos'=> (int) $activos['n'],
        ];
    }

    public function inicioVendedor(int $vendedorId): array
    {
        return [
            'ventas_hoy' => $this->ventasHoy($vendedorId),
            'ultimas'    => $this->varias(
                'SELECT fecha, cliente_nombre, canal, total, estado
                 FROM ventas WHERE vendedor_id = :v
                 ORDER BY fecha DESC, id DESC LIMIT 6',
                ['v' => $vendedorId]
            ),
        ];
    }

    public function inicioRepositor(): array
    {
        $porVencer = $this->una(
            'SELECT COUNT(*) AS n
             FROM producto_variantes v JOIN productos p ON p.id = v.producto_id
             WHERE p.activo = 1 AND v.stock > 0 AND v.vencimiento IS NOT NULL
               AND v.vencimiento <= DATE_ADD(CURDATE(), INTERVAL 15 DAY)'
        );
        return [
            'stock_critico' => $this->contarStockCritico(),
            'por_vencer'    => (int) $porVencer['n'],
            'ultimos'       => $this->varias(
                'SELECT i.fecha, p.nombre AS producto_nombre, i.cantidad_buena
                 FROM ingresos i
                 JOIN producto_variantes v ON v.id = i.variante_id
                 JOIN productos p ON p.id = v.producto_id
                 ORDER BY i.fecha DESC, i.id DESC LIMIT 6'
            ),
        ];
    }
}
