<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../clases/logica/AuthService.php';

(new AuthService())->cerrarSesion();
echo json_encode(['ok' => true]);
