<?php
/**
 * VarianteDAO.php — capa de datos
 * Variante = una combinación concreta de valores de atributos para un
 * producto (ej: Color=Azul + Talle=M), con su propio stock.
 */

class VarianteDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    // Trae cada variante del producto CON sus atributos ya armados en un
    // array asociativo (nombre_atributo => valor), listo para mostrar.
    public function listarPorProducto(int $productoId): array
    {
        $stmt = $this->conexion->prepare(
            'SELECT id, sku, stock, stock_min, vencimiento FROM producto_variantes WHERE producto_id = :pid ORDER BY id'
        );
        $stmt->execute(['pid' => $productoId]);
        $variantes = $stmt->fetchAll();

        foreach ($variantes as &$v) {
            $v['atributos'] = $this->atributosDeVariante((int) $v['id']);
        }
        return $variantes;
    }

    public function atributosDeVariante(int $varianteId): array
    {
        $stmt = $this->conexion->prepare(
            'SELECT a.nombre, va.valor
             FROM variante_atributos va
             JOIN atributos a ON a.id = va.atributo_id
             WHERE va.variante_id = :vid
             ORDER BY a.nombre'
        );
        $stmt->execute(['vid' => $varianteId]);
        $filas = $stmt->fetchAll();

        $resultado = [];
        foreach ($filas as $f) $resultado[$f['nombre']] = $f['valor'];
        return $resultado;
    }

    public function buscarPorId(int $id): ?array
    {
        $stmt = $this->conexion->prepare('SELECT * FROM producto_variantes WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Busca si YA existe una variante de este producto con exactamente el
     * mismo conjunto de atributo_id => valor. Devuelve su id o null.
     * Esto reemplaza al UNIQUE(talle,color) que teníamos antes — con
     * atributos libres, el chequeo de "combinación repetida" se hace en
     * PHP (traemos las pocas variantes del producto y comparamos, no vale
     * la pena un SQL dinámico frágil para esta escala de datos).
     */
    public function buscarPorCombinacion(int $productoId, array $atributosPorId): ?int
    {
        if (empty($atributosPorId)) return null;
        ksort($atributosPorId);

        $stmt = $this->conexion->prepare('SELECT id FROM producto_variantes WHERE producto_id = :pid');
        $stmt->execute(['pid' => $productoId]);
        $idsExistentes = $stmt->fetchAll(PDO::FETCH_COLUMN);

        foreach ($idsExistentes as $varianteId) {
            $stmt2 = $this->conexion->prepare(
                'SELECT atributo_id, valor FROM variante_atributos WHERE variante_id = :vid'
            );
            $stmt2->execute(['vid' => $varianteId]);
            $actuales = [];
            foreach ($stmt2->fetchAll() as $fila) $actuales[(int) $fila['atributo_id']] = $fila['valor'];
            ksort($actuales);

            if ($actuales === $atributosPorId) return (int) $varianteId;
        }

        return null;
    }

    public function crear(int $productoId, ?string $sku, array $atributos, int $stockMin = 0): int
    {
        $this->conexion->beginTransaction();
        try {
            $stmt = $this->conexion->prepare(
                'INSERT INTO producto_variantes (producto_id, sku, stock, stock_min) VALUES (:pid, :sku, 0, :stock_min)'
            );
            $stmt->execute(['pid' => $productoId, 'sku' => $sku, 'stock_min' => $stockMin]);
            $varianteId = (int) $this->conexion->lastInsertId();

            $stmtAtr = $this->conexion->prepare(
                'INSERT INTO variante_atributos (variante_id, atributo_id, valor) VALUES (:vid, :aid, :valor)'
            );
            foreach ($atributos as $atributoId => $valor) {
                $stmtAtr->execute(['vid' => $varianteId, 'aid' => $atributoId, 'valor' => $valor]);
            }

            $this->conexion->commit();
            return $varianteId;
        } catch (Throwable $e) {
            $this->conexion->rollBack();
            throw $e;
        }
    }

    public function ajustarStock(int $varianteId, int $delta): void
    {
        $stmt = $this->conexion->prepare('UPDATE producto_variantes SET stock = stock + :delta WHERE id = :id');
        $stmt->execute(['delta' => $delta, 'id' => $varianteId]);
    }

    public function conStockCritico(): array
    {
        return $this->conexion->query(
            'SELECT v.*, p.nombre AS producto_nombre
             FROM producto_variantes v
             JOIN productos p ON p.id = v.producto_id
             WHERE v.stock <= v.stock_min AND p.activo = 1
             ORDER BY v.stock ASC'
        )->fetchAll();
    }

    // Para el buscador de Nueva Venta: todas las variantes de todos los
    // productos activos, con el nombre/precio del producto ya incluido.
    public function listarTodasConProducto(): array
    {
        $stmt = $this->conexion->query(
            'SELECT v.id, v.sku, v.stock, v.stock_min,
                    p.id AS producto_id, p.nombre AS producto_nombre, p.precio_venta
             FROM producto_variantes v
             JOIN productos p ON p.id = v.producto_id
             WHERE p.activo = 1
             ORDER BY p.nombre'
        );
        $variantes = $stmt->fetchAll();
        foreach ($variantes as &$v) {
            $v['atributos'] = $this->atributosDeVariante((int) $v['id']);
        }
        return $variantes;
    }
}
