<?php
/**
 * PersonalService.php — capa de lógica
 * Gestión de empleados. La regla de "no dejar el sistema sin ningún
 * Administrador activo" vivía SOLO en el frontend — acá queda reforzada
 * en el servidor, que es lo que realmente no se puede evitar.
 */

require_once __DIR__ . '/../modelo/UsuarioDAO.php';

class PersonalService
{
    private UsuarioDAO $usuarioDAO;

    public function __construct()
    {
        $this->usuarioDAO = new UsuarioDAO();
    }

    public function listarTodos(): array
    {
        return $this->usuarioDAO->listarTodos();
    }

    public function buscarPorId(int $id): ?array
    {
        return $this->usuarioDAO->buscarPorId($id);
    }

    /** @throws InvalidArgumentException */
    public function crear(array $datos): int
    {
        if ($this->usuarioDAO->buscarPorEmail($datos['email'] ?? '')) {
            throw new InvalidArgumentException('Ya existe un usuario con ese email.');
        }
        return $this->usuarioDAO->crear($datos);
    }

    /** @throws InvalidArgumentException */
    public function actualizar(int $id, array $datos): void
    {
        $usuario = $this->usuarioDAO->buscarPorId($id);
        if (!$usuario) {
            throw new InvalidArgumentException('El usuario no existe.');
        }

        $duplicado = $this->usuarioDAO->buscarPorEmail($datos['email'] ?? '');
        if ($duplicado && (int) $duplicado['id'] !== $id) {
            throw new InvalidArgumentException('Ya existe otro usuario con ese email.');
        }

        // Si se le está bajando el rol de administrador o desactivando,
        // aplica la misma protección que cambiarEstado().
        if ($usuario['rol'] === 'administrador'
            && (($datos['rol'] ?? $usuario['rol']) !== 'administrador' || ($datos['activo'] ?? true) == false)) {
            if ($this->usuarioDAO->contarAdminsActivos($id) === 0) {
                throw new InvalidArgumentException('No se puede quitar el rol de Administrador ni desactivar: es el único activo del sistema.');
            }
        }

        $this->usuarioDAO->actualizar($id, $datos);

        if (!empty($datos['password'])) {
            $this->usuarioDAO->cambiarPassword($id, $datos['password']);
        }
        if (array_key_exists('activo', $datos)) {
            $this->usuarioDAO->cambiarEstado($id, (bool) $datos['activo']);
        }
    }

    /** @throws InvalidArgumentException */
    public function cambiarEstado(int $id, bool $activo, int $idUsuarioActual): void
    {
        $usuario = $this->usuarioDAO->buscarPorId($id);
        if (!$usuario) {
            throw new InvalidArgumentException('El usuario no existe.');
        }

        if ($id === $idUsuarioActual) {
            throw new InvalidArgumentException('No podés activarte o desactivarte a vos mismo.');
        }

        if (!$activo && $usuario['rol'] === 'administrador') {
            if ($this->usuarioDAO->contarAdminsActivos($id) === 0) {
                throw new InvalidArgumentException('No se puede desactivar: es el único Administrador activo del sistema.');
            }
        }

        $this->usuarioDAO->cambiarEstado($id, $activo);
    }

    /**
     * Elimina un usuario. Reglas:
     *  - Las cuentas de Administrador no se eliminan (igual que no se puede desactivar
     *    al último Administrador activo ni a uno mismo): así el sistema nunca queda sin gestión.
     *  - Nadie puede eliminarse a sí mismo.
     *  - Si el usuario ya registró ventas, ingresos, gastos o productos, tampoco se elimina,
     *    para no perder el historial: se lo desactiva.
     * @throws InvalidArgumentException
     */
    public function eliminar(int $id, int $idUsuarioActual): void
    {
        $usuario = $this->usuarioDAO->buscarPorId($id);
        if (!$usuario) {
            throw new InvalidArgumentException('El usuario no existe.');
        }
        if ($id === $idUsuarioActual) {
            throw new InvalidArgumentException('No podés eliminar tu propia cuenta.');
        }
        if ($usuario['rol'] === 'administrador') {
            throw new InvalidArgumentException('Las cuentas de Administrador no se pueden eliminar. Si hace falta, desactivala.');
        }
        if ($this->usuarioDAO->tieneHistorial($id)) {
            throw new InvalidArgumentException('Este usuario tiene ventas, ingresos, gastos o productos registrados. Para conservar el historial no se elimina: desactivalo.');
        }
        $this->usuarioDAO->eliminar($id);
    }
}
