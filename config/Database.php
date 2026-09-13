<?php
/**
 * Database.php — capa de datos
 * Conexión PDO única a MariaDB/MySQL, usando el patrón Singleton:
 * garantiza que toda la app comparta la misma conexión en vez de abrir
 * una nueva cada vez, ahorrando recursos.
 */

class Database
{
    private static ?PDO $instancia = null;

    // Constructor privado: nadie puede hacer "new Database()" desde afuera,
    // solo se accede vía Database::obtenerConexion()
    private function __construct() {}

    public static function obtenerConexion(): PDO
    {
        if (self::$instancia === null) {
            $env = self::cargarEnv();

            $dsn = "mysql:host={$env['DB_HOST']};dbname={$env['DB_NAME']};charset={$env['DB_CHARSET']}";

            try {
                self::$instancia = new PDO($dsn, $env['DB_USER'], $env['DB_PASS'], [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false, // fuerza prepared statements reales
                ]);
            } catch (PDOException $e) {
                // Nunca mostrar el error técnico real al usuario final
                error_log('Error de conexión a BD: ' . $e->getMessage());
                throw new RuntimeException('No se pudo conectar a la base de datos.');
            }
        }

        return self::$instancia;
    }

    // Lee el archivo .env de la raíz del proyecto (no usa librerías externas)
    private static function cargarEnv(): array
    {
        $rutaEnv = __DIR__ . '/../.env';
        if (!file_exists($rutaEnv)) {
            throw new RuntimeException('Falta el archivo .env — copiá .env.example y completá los datos reales.');
        }

        $valores = [];
        foreach (file($rutaEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
            if (str_starts_with(trim($linea), '#')) continue;
            [$clave, $valor] = array_pad(explode('=', $linea, 2), 2, '');
            $valores[trim($clave)] = trim($valor);
        }

        return $valores;
    }
}
