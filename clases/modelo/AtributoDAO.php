<?php
/**
 * AtributoDAO.php — capa de datos
 * Catálogo de atributos (Color, Talle, Tamaño, Sabor...) que el
 * Administrador da de alta según qué tipo de producto venda.
 */

class AtributoDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    public function listarActivos(): array
    {
        return $this->conexion->query(
            'SELECT * FROM atributos WHERE activo = 1 ORDER BY nombre'
        )->fetchAll();
    }

    public function buscarPorNombre(string $nombre): ?array
    {
        $stmt = $this->conexion->prepare('SELECT * FROM atributos WHERE nombre = :nombre');
        $stmt->execute(['nombre' => $nombre]);
        return $stmt->fetch() ?: null;
    }

    public function buscarPorId(int $id): ?array
    {
        $stmt = $this->conexion->prepare('SELECT * FROM atributos WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public function crear(string $nombre, bool $aplicaVariante = true): int
    {
        $stmt = $this->conexion->prepare(
            'INSERT INTO atributos (nombre, aplica_variante) VALUES (:nombre, :av)'
        );
        $stmt->execute(['nombre' => $nombre, 'av' => $aplicaVariante ? 1 : 0]);
        return (int) $this->conexion->lastInsertId();
    }

    // Baja lógica — nunca se borra físicamente, puede haber variantes que lo usan
    public function desactivar(int $id): void
    {
        $stmt = $this->conexion->prepare('UPDATE atributos SET activo = 0 WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
