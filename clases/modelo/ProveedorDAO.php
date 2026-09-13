<?php
/**
 * ProveedorDAO.php — capa de datos
 * El catálogo de proveedores sigue siendo "derivado" (no hay alta manual
 * separada) — se crea solo la primera vez que alguien lo escribe en un
 * ingreso, y se reutiliza después. Ver buscarOCrearPorNombre().
 */

class ProveedorDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    public function listarTodos(): array
    {
        return $this->conexion->query('SELECT * FROM proveedores ORDER BY nombre')->fetchAll();
    }

    public function buscarPorNombre(string $nombre): ?array
    {
        $stmt = $this->conexion->prepare('SELECT * FROM proveedores WHERE nombre = :nombre');
        $stmt->execute(['nombre' => $nombre]);
        return $stmt->fetch() ?: null;
    }

    public function crear(string $nombre, ?string $contacto): int
    {
        $stmt = $this->conexion->prepare('INSERT INTO proveedores (nombre, contacto) VALUES (:nombre, :contacto)');
        $stmt->execute(['nombre' => $nombre, 'contacto' => $contacto]);
        return (int) $this->conexion->lastInsertId();
    }

    // Si ya existe (por nombre) lo reutiliza; si no, lo crea. Así el
    // Repositor nunca tiene que "dar de alta" un proveedor a mano.
    public function buscarOCrearPorNombre(string $nombre, ?string $contacto = null): int
    {
        $existente = $this->buscarPorNombre($nombre);
        if ($existente) {
            // Si no tenía contacto guardado y ahora nos pasan uno, lo completamos
            if (!$existente['contacto'] && $contacto) {
                $stmt = $this->conexion->prepare('UPDATE proveedores SET contacto = :c WHERE id = :id');
                $stmt->execute(['c' => $contacto, 'id' => $existente['id']]);
            }
            return (int) $existente['id'];
        }
        return $this->crear($nombre, $contacto);
    }
}
