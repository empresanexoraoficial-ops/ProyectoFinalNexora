<?php
/**
 * public/api/productos.php — capa de presentación
 * GET  -> lista el catálogo (cualquier rol logueado)
 * POST -> crea un producto NUEVO — SOLO Administrador
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../clases/logica/AuthService.php';
require_once __DIR__ . '/../clases/logica/CatalogoService.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        AuthService::requerirRol(['administrador', 'vendedor', 'repositor']);
        $dao = new ProductoDAO();
        echo json_encode(['ok' => true, 'productos' => $dao->listarTodos()]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // SOLO Administrador — este es el cambio que pidió Agustín
        $usuario = AuthService::requerirRol(['administrador']);
        $datos = json_decode(file_get_contents('php://input'), true);

        if (empty($datos['nombre'])) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre del producto es obligatorio.']);
            exit;
        }

        $servicio = new CatalogoService();
        $id = $servicio->crearProducto($datos, $usuario['id']);
        echo json_encode(['ok' => true, 'id' => $id]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);

} catch (InvalidArgumentException $e) {
    http_response_code(409); // 409 Conflict: ya existe
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('Error en productos.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocurrió un error inesperado.']);
}
