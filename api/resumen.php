<?php
/**
 * api/resumen.php — capa de presentación
 * GET ?vista=dashboard  → solo Administrador
 * GET ?vista=inicio     → cualquier rol; devuelve lo que corresponde al rol
 * Reemplaza los cálculos que hacían dashboard.js e inicio.js sobre localStorage.
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../clases/logica/AuthService.php';
require_once __DIR__ . '/../clases/modelo/ResumenDAO.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido.']);
        exit;
    }

    $vista = $_GET['vista'] ?? '';
    $dao = new ResumenDAO();

    if ($vista === 'dashboard') {
        AuthService::requerirRol(['administrador']);
        echo json_encode(['ok' => true, 'datos' => $dao->dashboard()]);
        exit;
    }

    if ($vista === 'inicio') {
        $usuario = AuthService::requerirRol(['administrador', 'vendedor', 'repositor']);
        $datos = match ($usuario['rol']) {
            'administrador' => $dao->inicioAdministrador(),
            'vendedor'      => $dao->inicioVendedor((int) $usuario['id']),
            'repositor'     => $dao->inicioRepositor(),
        };
        echo json_encode(['ok' => true, 'rol' => $usuario['rol'], 'datos' => $datos]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Vista inválida. Usá: dashboard o inicio.']);

} catch (Throwable $e) {
    error_log('Error en resumen.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocurrió un error inesperado.']);
}
