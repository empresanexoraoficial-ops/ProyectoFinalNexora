<?php
/**
 * public/api/atributos.php — capa de presentación
 * GET    -> lista atributos activos (cualquier rol logueado, para armar formularios)
 * POST   -> crea un atributo nuevo — SOLO Administrador
 * DELETE -> desactiva un atributo (?id=X) — SOLO Administrador
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../clases/logica/AuthService.php';
require_once __DIR__ . '/../clases/logica/CatalogoService.php';
require_once __DIR__ . '/../clases/modelo/AtributoDAO.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        AuthService::requerirRol(['administrador', 'vendedor', 'repositor']);
        $dao = new AtributoDAO();
        echo json_encode(['ok' => true, 'atributos' => $dao->listarActivos()]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        AuthService::requerirRol(['administrador']);
        $datos = json_decode(file_get_contents('php://input'), true);
        if (empty($datos['nombre'])) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre del atributo es obligatorio.']);
            exit;
        }
        $servicio = new CatalogoService();
        $id = $servicio->crearAtributo(
            trim($datos['nombre']),
            array_key_exists('aplica_variante', $datos) ? (bool) $datos['aplica_variante'] : true
        );
        echo json_encode(['ok' => true, 'id' => $id]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        AuthService::requerirRol(['administrador']);
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el id del atributo.']);
            exit;
        }
        (new AtributoDAO())->desactivar($id);
        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);

} catch (InvalidArgumentException $e) {
    http_response_code(409);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('Error en atributos.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocurrió un error inesperado.']);
}
