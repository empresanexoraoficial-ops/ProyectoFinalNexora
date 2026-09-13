<?php
/**
 * public/api/ingresos.php — capa de presentación
 * GET  ?variante_id=X -> historial de ingresos de una variante
 * POST -> registra un ingreso — Administrador o Repositor
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../clases/logica/AuthService.php';
require_once __DIR__ . '/../clases/logica/IngresoService.php';
require_once __DIR__ . '/../clases/modelo/IngresoDAO.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        AuthService::requerirRol(['administrador', 'repositor']);
        $varianteId = (int) ($_GET['variante_id'] ?? 0);
        if (!$varianteId) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta variante_id.']);
            exit;
        }
        $dao = new IngresoDAO();
        echo json_encode(['ok' => true, 'ingresos' => $dao->listarPorVariante($varianteId)]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $usuario = AuthService::requerirRol(['administrador', 'repositor']);
        $datos = json_decode(file_get_contents('php://input'), true);

        foreach (['variante_id', 'cantidad', 'cantidad_buena', 'lote'] as $campo) {
            if (!isset($datos[$campo]) || $datos[$campo] === '') {
                http_response_code(400);
                echo json_encode(['error' => "Falta el campo obligatorio: {$campo}."]);
                exit;
            }
        }

        $servicio = new IngresoService();
        $id = $servicio->registrarIngreso($datos, $usuario['id']);
        echo json_encode(['ok' => true, 'id' => $id]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);

} catch (InvalidArgumentException $e) {
    http_response_code(409);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('Error en ingresos.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocurrió un error inesperado.']);
}
