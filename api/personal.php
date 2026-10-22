<?php
/**
 * public/api/personal.php — capa de presentación
 * GET    -> lista usuarios
 * POST   -> crea usuario
 * PUT    ?id=X -> edita usuario (nombre, email, rol, password opcional)
 * PATCH  ?id=X -> cambia solo el estado activo/inactivo
 * Todo — solo Administrador.
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../clases/logica/AuthService.php';
require_once __DIR__ . '/../clases/logica/PersonalService.php';

try {
    $usuarioActual = AuthService::requerirRol(['administrador']);
    $servicio = new PersonalService();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode(['ok' => true, 'usuarios' => $servicio->listarTodos()]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $datos = json_decode(file_get_contents('php://input'), true);
        foreach (['nombre', 'email', 'rol', 'password'] as $campo) {
            if (empty($datos[$campo])) {
                http_response_code(400);
                echo json_encode(['error' => "Falta el campo obligatorio: {$campo}."]);
                exit;
            }
        }
        $id = $servicio->crear($datos);
        echo json_encode(['ok' => true, 'id' => $id]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'Falta id.']); exit; }
        if (!$servicio->buscarPorId($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Ese usuario no existe.']);
            exit;
        }
        $datos = json_decode(file_get_contents('php://input'), true);
        $servicio->actualizar($id, $datos);
        echo json_encode(['ok' => true]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'Falta id.']); exit; }
        if (!$servicio->buscarPorId($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Ese usuario no existe.']);
            exit;
        }
        $datos = json_decode(file_get_contents('php://input'), true);
        $servicio->cambiarEstado($id, (bool) ($datos['activo'] ?? false), $usuarioActual['id']);
        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);

} catch (InvalidArgumentException $e) {
    http_response_code(409);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('Error en personal.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocurrió un error inesperado.']);
}
