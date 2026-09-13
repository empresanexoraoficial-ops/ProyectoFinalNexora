<?php
/**
 * AuthService.php — capa de lógica
 * Reglas de negocio de autenticación. No sabe nada de HTML ni de SQL directo:
 * usa UsuarioDAO para los datos y expone métodos simples a la capa de presentación.
 */

require_once __DIR__ . '/../modelo/UsuarioDAO.php';

class AuthService
{
    // RNF05: cerrar sesión sola tras N minutos de inactividad
    private const TIMEOUT_MINUTOS = 30;

    private UsuarioDAO $usuarioDAO;

    public function __construct()
    {
        $this->usuarioDAO = new UsuarioDAO();
    }

    /**
     * Devuelve el usuario (sin el hash) si las credenciales son válidas, o null.
     */
    public function login(string $email, string $password): ?array
    {
        $usuario = $this->usuarioDAO->buscarPorEmail($email);

        if (!$usuario || !$usuario['activo']) {
            return null;
        }

        if (!password_verify($password, $usuario['password_hash'])) {
            return null;
        }

        unset($usuario['password_hash']); // nunca circula el hash fuera de esta clase
        return $usuario;
    }

    public function iniciarSesion(array $usuario): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION['usuario'] = [
            'id'     => $usuario['id'],
            'nombre' => $usuario['nombre'],
            'email'  => $usuario['email'],
            'rol'    => $usuario['rol'],
        ];
        $_SESSION['ultima_actividad'] = time();
    }

    public function cerrarSesion(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION = [];
        session_destroy();
    }

    public static function usuarioActual(): ?array
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['usuario'])) return null;

        // RNF05: si pasaron más de TIMEOUT_MINUTOS sin actividad, cerrar sola
        $ultima = $_SESSION['ultima_actividad'] ?? 0;
        if (time() - $ultima > self::TIMEOUT_MINUTOS * 60) {
            $_SESSION = [];
            session_destroy();
            return null;
        }

        $_SESSION['ultima_actividad'] = time(); // renueva el contador en cada request
        return $_SESSION['usuario'];
    }

    /**
     * Corta la ejecución con 401/403 si no hay sesión o el rol no está permitido.
     * Se llama al principio de CADA endpoint protegido — la protección real
     * pasa siempre por acá, nunca solo por esconder un link en el frontend.
     */
    public static function requerirRol(array $rolesPermitidos): array
    {
        $usuario = self::usuarioActual();

        if (!$usuario) {
            http_response_code(401);
            echo json_encode(['error' => 'No hay sesión activa.']);
            exit;
        }

        if (!in_array($usuario['rol'], $rolesPermitidos, true)) {
            http_response_code(403);
            echo json_encode(['error' => 'No tenés permiso para esta acción.']);
            exit;
        }

        return $usuario;
    }
}
