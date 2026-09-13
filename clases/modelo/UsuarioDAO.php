<?php
/**
 * UsuarioDAO.php — capa de datos
 * Todo el acceso SQL a la tabla `usuarios` vive acá. Ninguna otra clase
 * escribe SQL directamente sobre esta tabla.
 */

class UsuarioDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    public function buscarPorEmail(string $email): ?array
    {
        $stmt = $this->conexion->prepare(
            'SELECT * FROM usuarios WHERE email = :email LIMIT 1'
        );
        $stmt->execute(['email' => $email]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    public function buscarPorId(int $id): ?array
    {
        $stmt = $this->conexion->prepare('SELECT * FROM usuarios WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $fila = $stmt->fetch();
        return $fila ?: null;
    }

    public function listarTodos(): array
    {
        return $this->conexion->query('SELECT id, nombre, email, rol, telefono, activo, fecha_ingreso FROM usuarios ORDER BY nombre')->fetchAll();
    }

    public function crear(array $datos): int
    {
        $stmt = $this->conexion->prepare(
            'INSERT INTO usuarios (nombre, email, password_hash, rol, telefono, activo)
             VALUES (:nombre, :email, :password_hash, :rol, :telefono, 1)'
        );
        $stmt->execute([
            'nombre'        => $datos['nombre'],
            'email'         => $datos['email'],
            'password_hash' => password_hash($datos['password'], PASSWORD_DEFAULT),
            'rol'           => $datos['rol'],
            'telefono'      => $datos['telefono'] ?? null,
        ]);
        return (int) $this->conexion->lastInsertId();
    }

    public function actualizar(int $id, array $datos): void
    {
        $stmt = $this->conexion->prepare(
            'UPDATE usuarios SET nombre = :nombre, telefono = :telefono, rol = :rol
             WHERE id = :id'
        );
        $stmt->execute([
            'nombre'   => $datos['nombre'],
            'telefono' => $datos['telefono'] ?? null,
            'rol'      => $datos['rol'],
            'id'       => $id,
        ]);
    }

    public function cambiarEstado(int $id, bool $activo): void
    {
        $stmt = $this->conexion->prepare('UPDATE usuarios SET activo = :activo WHERE id = :id');
        $stmt->execute(['activo' => $activo ? 1 : 0, 'id' => $id]);
    }

    public function cambiarPassword(int $id, string $passwordPlano): void
    {
        $stmt = $this->conexion->prepare('UPDATE usuarios SET password_hash = :hash WHERE id = :id');
        $stmt->execute(['hash' => password_hash($passwordPlano, PASSWORD_DEFAULT), 'id' => $id]);
    }

    // Para la regla "no dejar el sistema sin ningún Administrador activo"
    public function contarAdminsActivos(?int $excluirId = null): int
    {
        $sql = "SELECT COUNT(*) FROM usuarios WHERE rol = 'administrador' AND activo = 1";
        $params = [];
        if ($excluirId !== null) { $sql .= ' AND id != :excluir'; $params['excluir'] = $excluirId; }
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }
}
