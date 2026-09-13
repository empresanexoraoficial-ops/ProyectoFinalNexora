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
}
