<?php
/**
 * ReporteDAO.php — capa de datos
 * Consultas de solo lectura para la pantalla de Reportes.
 */

class ReporteDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    private function filtroFecha(?string $desde, ?string $hasta, string $columna): array
    {
        $condiciones = [];
        $params = [];
        if ($desde) { $condiciones[] = "$columna >= :desde"; $params['desde'] = $desde; }
        if ($hasta) { $condiciones[] = "$columna <= :hasta"; $params['hasta'] = $hasta; }
        return [$condiciones ? 'AND ' . implode(' AND ', $condiciones) : '', $params];
    }

    public function ventas(?string $desde, ?string $hasta): array
    {
        [$filtro, $params] = $this->filtroFecha($desde, $hasta, 've.fecha');
        $stmt = $this->conexion->prepare(
            "SELECT ve.id, ve.fecha, ve.canal, ve.total, ve.estado, u.nombre AS vendedor_nombre
             FROM ventas ve
             JOIN usuarios u ON u.id = ve.vendedor_id
             WHERE ve.estado = 'confirmada' $filtro
             ORDER BY ve.fecha DESC"
        );
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function gastos(?string $desde, ?string $hasta): array
    {
        [$filtro, $params] = $this->filtroFecha($desde, $hasta, 'g.fecha');
        $stmt = $this->conexion->prepare(
            "SELECT g.fecha, g.categoria, g.monto
             FROM gastos g
             WHERE 1=1 $filtro
             ORDER BY g.fecha DESC"
        );
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function stockActual(): array
    {
        return $this->conexion->query(
            "SELECT p.nombre AS producto_nombre, v.sku, v.stock, v.stock_min
             FROM producto_variantes v
             JOIN productos p ON p.id = v.producto_id
             WHERE p.activo = 1
             ORDER BY p.nombre"
        )->fetchAll();
    }

    // RF 1.9: rentabilidad estimada por producto — unidades vendidas,
    // margen, y rotación (unidades vendidas / stock actual).
    public function rentabilidad(?string $desde, ?string $hasta): array
    {
        [$filtro, $params] = $this->filtroFecha($desde, $hasta, 've.fecha');
        $stmt = $this->conexion->prepare(
            "SELECT p.id, p.nombre, p.precio_costo, p.precio_venta,
                    COALESCE(SUM(CASE WHEN ve.estado = 'confirmada' $filtro THEN vd.cantidad ELSE 0 END), 0) AS unidades_vendidas,
                    COALESCE(SUM(v.stock), 0) AS stock_actual
             FROM productos p
             LEFT JOIN producto_variantes v ON v.producto_id = p.id
             LEFT JOIN venta_detalle vd ON vd.variante_id = v.id
             LEFT JOIN ventas ve ON ve.id = vd.venta_id
             WHERE p.activo = 1
             GROUP BY p.id
             ORDER BY unidades_vendidas DESC"
        );
        $stmt->execute($params);
        $filas = $stmt->fetchAll();

        foreach ($filas as &$f) {
            $f['margen_pct'] = $f['precio_venta'] > 0
                ? round((($f['precio_venta'] - $f['precio_costo']) / $f['precio_venta']) * 100, 1)
                : null;
            $f['rotacion'] = $f['stock_actual'] > 0
                ? round($f['unidades_vendidas'] / $f['stock_actual'], 2)
                : null;
        }
        return $filas;
    }
}
