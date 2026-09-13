<?php
/**
 * public/api/me.php — cada página interna llama esto al cargar.
 * Si no hay sesión, devuelve 401 y el frontend redirige a login.html.
 * Este es el reemplazo real de "protegerPagina()" — ahora la verificación
 * pasa por el servidor, no solo por JS en el navegador.
 */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../clases/logica/AuthService.php';

$usuario = AuthService::usuarioActual();

if (!$usuario) {
    http_response_code(401);
    echo json_encode(['error' => 'No hay sesión activa.']);
    exit;
}

echo json_encode(['ok' => true, 'usuario' => $usuario]);
