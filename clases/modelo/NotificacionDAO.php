<?php
/**
 * NotificacionDAO.php — capa de datos
 * RF 1.8 / RF 2.3 / RNF08: notificaciones en pantalla ante stock mínimo o
 * ventas pendientes (además/en vez de correo — RNF08 pide "correo O pantalla").
 */

class NotificacionDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    public function crear(string $tipo, int $referenciaId, string $mensaje): void
    {
        $stmt = $this->conexion->prepare(
            'INSERT INTO notificaciones (tipo, referencia_id, mensaje) VALUES (:tipo, :ref, :msg)'
        );
        $stmt->execute(['tipo' => $tipo, 'ref' => $referenciaId, 'msg' => $mensaje]);
    }

    public function listarNoLeidas(): array
    {
        return $this->conexion->query(
            'SELECT * FROM notificaciones WHERE leida = 0 ORDER BY creada_en DESC'
        )->fetchAll();
    }

    // Aviso de stock mínimo (RF 1.8): se crea solo si no hay ya uno SIN leer
    // para esa misma variante, así no se llena la lista de repetidos.
    public function crearStockMinimoSiNoExiste(int $varianteId, string $mensaje): void
    {
        $stmt = $this->conexion->prepare(
            "SELECT 1 FROM notificaciones
             WHERE tipo = 'stock_minimo' AND referencia_id = :ref AND leida = 0 LIMIT 1"
        );
        $stmt->execute(['ref' => $varianteId]);
        if (!$stmt->fetchColumn()) {
            $this->crear('stock_minimo', $varianteId, $mensaje);
        }
    }

    // Devuelve false si el aviso no existe (el endpoint responde 404).
    public function marcarLeida(int $id): bool
    {
        $stmt = $this->conexion->prepare('SELECT 1 FROM notificaciones WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetchColumn()) return false;
        $upd = $this->conexion->prepare('UPDATE notificaciones SET leida = 1 WHERE id = :id');
        $upd->execute(['id' => $id]);
        return true;
    }

    public function marcarTodasLeidas(): void
    {
        $this->conexion->exec('UPDATE notificaciones SET leida = 1 WHERE leida = 0');
    }
}
