<?php
/**
 * public/api/login.php — capa de presentación
 * Recibe el POST del formulario de login (vía fetch desde login.js) y devuelve JSON.
 * No tiene lógica de negocio ni SQL — solo llama a AuthService.
 */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../clases/logica/AuthService.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);
    exit;
}

$datos = json_decode(file_get_contents('php://input'), true);
$email    = trim($datos['email'] ?? '');
$password = $datos['password'] ?? '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Email y contraseña son obligatorios.']);
    exit;
}

try {
    $auth = new AuthService();
    $usuario = $auth->login($email, $password);

    if (!$usuario) {
        http_response_code(401);
        echo json_encode(['error' => 'Email o contraseña incorrectos.']);
        exit;
    }

    $auth->iniciarSesion($usuario);
    echo json_encode(['ok' => true, 'usuario' => $usuario]);

} catch (Throwable $e) {
    error_log('Error en login.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ocurrió un error inesperado. Intentá de nuevo.']);
}
