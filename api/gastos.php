<?php
/**
 * public/api/gastos.php — capa de presentación
 * GET  -> lista todos los gastos (solo Administrador)
 * POST -> registra un gasto (solo Administrador)
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../clases/logica/AuthService.php';
require_once __DIR__ . '/../clases/modelo/GastoDAO.php';

try {
    $usuario = AuthService::requerirRol(['administrador']);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $dao = new GastoDAO();
        echo json_encode(['ok' => true, 'gastos' => $dao->listarTodos()]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $datos = json_decode(file_get_contents('php://input'), true);

        if (empty($datos['categoria']) || empty($datos['monto']) || $datos['monto'] <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Categoría y monto (mayor a 0) son obligatorios.']);
            exit;
        }

        $dao = new GastoDAO();
        $id = $dao->crear($datos, $usuario['id']);
        echo json_encode(['ok' => true, 'id' => $id]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);

} catch (Throwable $e) {
    error_log('Error en gastos.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocurrió un error inesperado.']);
}
