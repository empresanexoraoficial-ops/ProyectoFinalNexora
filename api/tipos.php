<?php
/**
 * public/api/tipos.php — capa de presentación
 * GET  -> lista tipos con sus atributos sugeridos (cualquier rol logueado,
 *         lo usa el formulario de creación de producto/variante)
 * POST -> crea un tipo nuevo con sus atributos típicos — SOLO Administrador
 *         body: { "nombre": "Ropa", "requiere_vencimiento": false, "atributos": [1,2] }
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../clases/logica/AuthService.php';
require_once __DIR__ . '/../clases/logica/CatalogoService.php';
require_once __DIR__ . '/../clases/modelo/TipoDAO.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        AuthService::requerirRol(['administrador', 'vendedor', 'repositor']);
        $dao = new TipoDAO();
        echo json_encode(['ok' => true, 'tipos' => $dao->listarActivos()]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        AuthService::requerirRol(['administrador']);
        $datos = json_decode(file_get_contents('php://input'), true);

        if (empty($datos['nombre'])) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre del tipo es obligatorio.']);
            exit;
        }

        $servicio = new CatalogoService();
        $id = $servicio->crearTipo(
            trim($datos['nombre']),
            (bool) ($datos['requiere_vencimiento'] ?? false),
            $datos['atributos'] ?? []
        );
        echo json_encode(['ok' => true, 'id' => $id]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        AuthService::requerirRol(['administrador']);
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el id del tipo.']);
            exit;
        }
        (new TipoDAO())->desactivar($id);
        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);

} catch (InvalidArgumentException $e) {
    http_response_code(409);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('Error en tipos.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocurrió un error inesperado.']);
}
