<?php
/**
 * GastoDAO.php — capa de datos
 * CRUD simple de gastos operativos (mismo patrón que el resto).
 */

class GastoDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    public function listarTodos(): array
    {
        return $this->conexion->query(
            'SELECT g.*, u.nombre AS usuario_nombre
             FROM gastos g
             JOIN usuarios u ON u.id = g.usuario_id
             ORDER BY g.fecha DESC, g.id DESC'
        )->fetchAll();
    }

    public function crear(array $d, int $usuarioId): int
    {
        $stmt = $this->conexion->prepare(
            'INSERT INTO gastos (categoria, monto, fecha, descripcion, usuario_id)
             VALUES (:categoria, :monto, :fecha, :descripcion, :usuario_id)'
        );
        $stmt->execute([
            'categoria'   => $d['categoria'],
            'monto'       => $d['monto'],
            'fecha'       => $d['fecha'] ?? date('Y-m-d'),
            'descripcion' => $d['descripcion'] ?? null,
            'usuario_id'  => $usuarioId,
        ]);
        return (int) $this->conexion->lastInsertId();
    }
}
