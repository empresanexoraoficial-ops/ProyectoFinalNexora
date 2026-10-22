<?php
/**
 * api/notificaciones.php — capa de presentación
 * GET                → lista los avisos NO leídos (Administrador y Repositor)
 * PATCH ?id=N        → marca un aviso como leído
 * PATCH ?todas=1     → marca todos como leídos
 * RF 1.8 / RF 2.3 / RNF08: los avisos se muestran en pantalla.
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../clases/logica/AuthService.php';
require_once __DIR__ . '/../clases/modelo/NotificacionDAO.php';

try {
    AuthService::requerirRol(['administrador', 'repositor']);
    $dao = new NotificacionDAO();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode(['ok' => true, 'notificaciones' => $dao->listarNoLeidas()]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
        if (!empty($_GET['todas'])) {
            $dao->marcarTodasLeidas();
            echo json_encode(['ok' => true]);
            exit;
        }
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el id del aviso.']);
            exit;
        }
        if (!$dao->marcarLeida($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Ese aviso no existe.']);
            exit;
        }
        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);

} catch (Throwable $e) {
    error_log('Error en notificaciones.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocurrió un error inesperado.']);
}
