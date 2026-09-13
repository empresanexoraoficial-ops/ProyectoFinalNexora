<?php
/**
 * public/api/variantes.php — capa de presentación
 * GET  ?producto_id=X -> lista variantes de un producto, con sus atributos
 * POST -> agrega una variante a un producto EXISTENTE, con un mapa de
 *         atributos { "Color": "Azul", "Talle": "M" } — Administrador o Repositor
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../clases/logica/AuthService.php';
require_once __DIR__ . '/../clases/logica/CatalogoService.php';
require_once __DIR__ . '/../clases/modelo/VarianteDAO.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        AuthService::requerirRol(['administrador', 'vendedor', 'repositor']);
        $dao = new VarianteDAO();
        $productoId = (int) ($_GET['producto_id'] ?? 0);
        if ($productoId) {
            echo json_encode(['ok' => true, 'variantes' => $dao->listarPorProducto($productoId)]);
        } else {
            echo json_encode(['ok' => true, 'variantes' => $dao->listarTodasConProducto()]);
        }
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        AuthService::requerirRol(['administrador', 'repositor']);
        $datos = json_decode(file_get_contents('php://input'), true);

        if (empty($datos['producto_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta producto_id — la variante tiene que pertenecer a un producto ya existente.']);
            exit;
        }

        $servicio = new CatalogoService();
        $id = $servicio->agregarVariante(
            (int) $datos['producto_id'],
            $datos['sku'] ?? null,
            $datos['atributos'] ?? [],
            (int) ($datos['stock_min'] ?? 0)
        );
        echo json_encode(['ok' => true, 'variante_id' => $id]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);

} catch (InvalidArgumentException $e) {
    http_response_code(409);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('Error en variantes.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocurrió un error inesperado.']);
}
