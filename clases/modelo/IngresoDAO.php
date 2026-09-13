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
