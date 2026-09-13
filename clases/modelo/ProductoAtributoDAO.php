<?php
/**
 * ProductoAtributoDAO.php — capa de datos
 * Valores de atributos FIJOS por producto (ej: Marca=Nike), para atributos
 * con aplica_variante = false. Es la contraparte de VarianteDAO pero a
 * nivel producto — mismo patrón que WooCommerce con atributos no marcados
 * "Used for variations".
 */

class ProductoAtributoDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    public function listarPorProducto(int $productoId): array
    {
        $stmt = $this->conexion->prepare(
            'SELECT a.nombre, pa.valor
             FROM producto_atributos pa
             JOIN atributos a ON a.id = pa.atributo_id
             WHERE pa.producto_id = :pid
             ORDER BY a.nombre'
        );
        $stmt->execute(['pid' => $productoId]);
        $resultado = [];
        foreach ($stmt->fetchAll() as $fila) $resultado[$fila['nombre']] = $fila['valor'];
        return $resultado;
    }

    public function guardar(int $productoId, int $atributoId, string $valor): void
    {
        $stmt = $this->conexion->prepare(
            'INSERT INTO producto_atributos (producto_id, atributo_id, valor)
             VALUES (:pid, :aid, :valor)
             ON DUPLICATE KEY UPDATE valor = :valor2'
        );
        $stmt->execute(['pid' => $productoId, 'aid' => $atributoId, 'valor' => $valor, 'valor2' => $valor]);
    }
}
