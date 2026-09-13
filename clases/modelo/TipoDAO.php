<?php
/**
 * TipoDAO.php — capa de datos
 * Catálogo de tipos de producto (Ropa, Bebida, Alimento envasado, etc.)
 * que el Administrador da de alta, cada uno con sus atributos típicos.
 */

class TipoDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    public function listarActivos(): array
    {
        $tipos = $this->conexion->query(
            'SELECT * FROM tipos_producto WHERE activo = 1 ORDER BY nombre'
        )->fetchAll();

        foreach ($tipos as &$t) {
            $t['atributos_sugeridos'] = $this->atributosDeTipo((int) $t['id']);
        }
        return $tipos;
    }

    public function atributosDeTipo(int $tipoId): array
    {
        $stmt = $this->conexion->prepare(
            'SELECT a.id, a.nombre, a.aplica_variante
             FROM tipo_atributos ta
             JOIN atributos a ON a.id = ta.atributo_id
             WHERE ta.tipo_id = :tid AND a.activo = 1
             ORDER BY a.aplica_variante DESC, a.nombre'
        );
        $stmt->execute(['tid' => $tipoId]);
        return $stmt->fetchAll();
    }

    public function buscarPorId(int $id): ?array
    {
        $stmt = $this->conexion->prepare('SELECT * FROM tipos_producto WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public function buscarPorNombre(string $nombre): ?array
    {
        $stmt = $this->conexion->prepare('SELECT * FROM tipos_producto WHERE nombre = :nombre');
        $stmt->execute(['nombre' => $nombre]);
        return $stmt->fetch() ?: null;
    }

    public function crear(string $nombre, bool $requiereVencimiento): int
    {
        $stmt = $this->conexion->prepare(
            'INSERT INTO tipos_producto (nombre, requiere_vencimiento) VALUES (:nombre, :rv)'
        );
        $stmt->execute(['nombre' => $nombre, 'rv' => $requiereVencimiento ? 1 : 0]);
        return (int) $this->conexion->lastInsertId();
    }

    // Vincula un atributo como "típico" de un tipo (ej: Ropa -> Talle)
    public function vincularAtributo(int $tipoId, int $atributoId): void
    {
        $stmt = $this->conexion->prepare(
            'INSERT IGNORE INTO tipo_atributos (tipo_id, atributo_id) VALUES (:tid, :aid)'
        );
        $stmt->execute(['tid' => $tipoId, 'aid' => $atributoId]);
    }

    public function desactivar(int $id): void
    {
        $stmt = $this->conexion->prepare('UPDATE tipos_producto SET activo = 0 WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
