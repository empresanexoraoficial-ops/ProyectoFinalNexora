<?php
/**
 * public/api/reportes.php — capa de presentación
 * GET ?tipo=ventas|stock|gastos|rentabilidad&desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Solo Administrador.
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../clases/logica/AuthService.php';
require_once __DIR__ . '/../clases/modelo/ReporteDAO.php';

try {
    AuthService::requerirRol(['administrador']);

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido.']);
        exit;
    }

    $tipo  = $_GET['tipo'] ?? '';
    $desde = $_GET['desde'] ?? null;
    $hasta = $_GET['hasta'] ?? null;

    $dao = new ReporteDAO();
    $datos = match ($tipo) {
        'ventas'       => $dao->ventas($desde, $hasta),
        'gastos'       => $dao->gastos($desde, $hasta),
        'stock'        => $dao->stockActual(),
        'rentabilidad' => $dao->rentabilidad($desde, $hasta),
        default        => null,
    };

    if ($datos === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Tipo de reporte inválido. Usá: ventas, stock, gastos o rentabilidad.']);
        exit;
    }

    echo json_encode(['ok' => true, 'datos' => $datos]);

} catch (Throwable $e) {
    error_log('Error en reportes.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocurrió un error inesperado.']);
}
