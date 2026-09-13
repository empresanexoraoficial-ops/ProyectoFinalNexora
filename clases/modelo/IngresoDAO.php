<?php
/**
 * IngresoDAO.php — capa de datos
 * Registra ingresos de mercadería. Solo "cantidad_buena" suma al stock de
 * la variante — el resto (rechazado por el proveedor) NO entra a Inventario.
 */

class IngresoDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    public function listarPorVariante(int $varianteId): array
    {
        $stmt = $this->conexion->prepare(
            'SELECT * FROM ingresos WHERE variante_id = :vid ORDER BY fecha_hora_registro DESC'
        );
        $stmt->execute(['vid' => $varianteId]);
        return $stmt->fetchAll();
    }

    // Para la tabla de historial general de Ingresos y el resumen de
    // Proveedores — trae todo con nombre de producto/atributos/proveedor
    // ya resueltos, no solo los IDs crudos.
    public function listarTodosConDetalle(): array
    {
        $stmt = $this->conexion->query(
            "SELECT i.*, p.nombre AS producto_nombre, pr.nombre AS proveedor_nombre,
                    u.nombre AS operador_nombre
             FROM ingresos i
             JOIN producto_variantes v ON v.id = i.variante_id
             JOIN productos p ON p.id = v.producto_id
             LEFT JOIN proveedores pr ON pr.id = i.proveedor_id
             JOIN usuarios u ON u.id = i.operador_id
             ORDER BY i.fecha_hora_registro DESC"
        );
        $filas = $stmt->fetchAll();

        // Atributos de cada variante (Talle, Color, etc.) armados en texto
        foreach ($filas as &$f) {
            $stmtA = $this->conexion->prepare(
                'SELECT a.nombre, va.valor FROM variante_atributos va
                 JOIN atributos a ON a.id = va.atributo_id WHERE va.variante_id = :vid'
            );
            $stmtA->execute(['vid' => $f['variante_id']]);
            $f['variante_detalle'] = implode(', ', array_map(
                fn($a) => "{$a['nombre']}: {$a['valor']}", $stmtA->fetchAll()
            ));
        }
        return $filas;
    }

    // Chequeo previo para dar un mensaje claro antes de que la base rechace
    // por el UNIQUE(proveedor_id, lote) — mismo espíritu que el chequeo de
    // productos duplicados en CatalogoService.
    public function existeRemito(?int $proveedorId, string $lote): bool
    {
        $stmt = $this->conexion->prepare(
            'SELECT COUNT(*) FROM ingresos WHERE (proveedor_id <=> :pid) AND lote = :lote'
        );
        $stmt->execute(['pid' => $proveedorId, 'lote' => $lote]);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function crear(array $d, int $operadorId): int
    {
        $stmt = $this->conexion->prepare(
            'INSERT INTO ingresos
               (variante_id, cantidad, cantidad_buena, proveedor_id, proveedor_contacto,
                lote, fecha, observaciones, operador_id)
             VALUES
               (:variante_id, :cantidad, :cantidad_buena, :proveedor_id, :proveedor_contacto,
                :lote, :fecha, :observaciones, :operador_id)'
        );
        $stmt->execute([
            'variante_id'        => $d['variante_id'],
            'cantidad'           => $d['cantidad'],
            'cantidad_buena'     => $d['cantidad_buena'],
            'proveedor_id'       => $d['proveedor_id'] ?? null,
            'proveedor_contacto' => $d['proveedor_contacto'] ?? null,
            'lote'               => $d['lote'],
            'fecha'              => $d['fecha'] ?? date('Y-m-d'),
            'observaciones'      => $d['observaciones'] ?? null,
            'operador_id'        => $operadorId,
        ]);
        return (int) $this->conexion->lastInsertId();
    }
}
