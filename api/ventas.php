<?php
/**
 * public/api/ventas.php — capa de presentación
 * GET  -> historial de ventas del vendedor logueado
 * POST -> registra una venta (RF 2.1/2.2/2.3) — solo Vendedor
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../clases/logica/AuthService.php';
require_once __DIR__ . '/../clases/logica/VentaService.php';
require_once __DIR__ . '/../clases/modelo/VentaDAO.php';

try {
    $usuario = AuthService::requerirRol(['vendedor', 'administrador']);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $dao = new VentaDAO();
        echo json_encode(['ok' => true, 'ventas' => $dao->historialPorVendedor($usuario['id'])]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $datos = json_decode(file_get_contents('php://input'), true);
        if (empty($datos['items'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta al menos un producto en la venta.']);
            exit;
        }

        $servicio = new VentaService();
        $resultado = $servicio->registrarVenta($datos, $datos['items'], $usuario['id']);
        echo json_encode(['ok' => true] + $resultado);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);

} catch (InvalidArgumentException $e) {
    http_response_code(409);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('Error en ventas.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocurrió un error inesperado.']);
}
