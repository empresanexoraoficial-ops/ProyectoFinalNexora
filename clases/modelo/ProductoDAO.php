<?php
/**
 * ProductoDAO.php — capa de datos
 * Catálogo MAESTRO de artículos. Solo Administrador puede crear productos
 * nuevos (la regla de permiso se aplica en el endpoint, no acá — este DAO
 * solo habla con la base).
 */

class ProductoDAO
{
    private PDO $conexion;

    public function __construct()
    {
        $this->conexion = Database::obtenerConexion();
    }

    public function listarTodos(bool $soloActivos = true): array
    {
        $sql = 'SELECT p.*, pr.nombre AS proveedor_nombre, tp.nombre AS tipo_nombre,
                       tp.requiere_vencimiento,
                       COUNT(v.id) AS variantes_count,
                       COALESCE(SUM(v.stock), 0) AS stock_total
                FROM productos p
                LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
                LEFT JOIN tipos_producto tp ON tp.id = p.tipo_id
                LEFT JOIN producto_variantes v ON v.producto_id = p.id';
        if ($soloActivos) $sql .= ' WHERE p.activo = 1';
        $sql .= ' GROUP BY p.id ORDER BY p.nombre';
        return $this->conexion->query($sql)->fetchAll();
    }

    public function buscarPorId(int $id): ?array
    {
        $stmt = $this->conexion->prepare('SELECT * FROM productos WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    // Para chequear duplicados ANTES de insertar y dar un mensaje claro
    // (la base también lo rechaza por el UNIQUE, pero esto da mejor UX)
    public function buscarPorNombreYMarca(string $nombre, ?string $marca): ?array
    {
        $stmt = $this->conexion->prepare(
            'SELECT * FROM productos WHERE nombre = :nombre AND (marca <=> :marca)'
        );
        $stmt->execute(['nombre' => $nombre, 'marca' => $marca]);
        return $stmt->fetch() ?: null;
    }

    public function crear(array $d, int $creadoPor): int
    {
        $stmt = $this->conexion->prepare(
            'INSERT INTO productos
               (codigo, nombre, categoria, tipo_id, marca, descripcion, temporada,
                precio_costo, precio_venta, proveedor_id, creado_por)
             VALUES
               (:codigo, :nombre, :categoria, :tipo_id, :marca, :descripcion, :temporada,
                :precio_costo, :precio_venta, :proveedor_id, :creado_por)'
        );
        $stmt->execute([
            'codigo'       => $d['codigo']       ?? null,
            'nombre'       => $d['nombre'],
            'categoria'    => $d['categoria']    ?? null,
            'tipo_id'      => $d['tipo_id']      ?? null,
            'marca'        => $d['marca']        ?? null,
            'descripcion'  => $d['descripcion']  ?? null,
            'temporada'    => $d['temporada']    ?? null,
            'precio_costo' => $d['precio_costo'] ?? 0,
            'precio_venta' => $d['precio_venta'] ?? 0,
            'proveedor_id' => $d['proveedor_id'] ?? null,
            'creado_por'   => $creadoPor,
        ]);
        return (int) $this->conexion->lastInsertId();
    }

    public function actualizar(int $id, array $d): void
    {
        $stmt = $this->conexion->prepare(
            'UPDATE productos SET nombre=:nombre, categoria=:categoria, tipo_id=:tipo_id, marca=:marca,
               descripcion=:descripcion, precio_costo=:precio_costo, precio_venta=:precio_venta
             WHERE id = :id'
        );
        $stmt->execute([
            'nombre'       => $d['nombre'],
            'categoria'    => $d['categoria']    ?? null,
            'tipo_id'      => $d['tipo_id']      ?? null,
            'marca'        => $d['marca']        ?? null,
            'descripcion'  => $d['descripcion']  ?? null,
            'precio_costo' => $d['precio_costo'] ?? 0,
            'precio_venta' => $d['precio_venta'] ?? 0,
            'id'           => $id,
        ]);
    }

    // Baja lógica — nunca se borra físicamente (preserva historial de ventas/ingresos)
    public function desactivar(int $id): void
    {
        $stmt = $this->conexion->prepare('UPDATE productos SET activo = 0 WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
