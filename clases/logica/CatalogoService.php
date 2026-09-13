<?php
/**
 * CatalogoService.php — capa de lógica
 * - Crear PRODUCTO nuevo: solo Administrador.
 * - Crear/editar ATRIBUTOS del catálogo (Color, Talle, Sabor...): solo Administrador.
 * - Agregar VARIANTE con valores de atributos a un producto existente:
 *   Administrador o Repositor, nunca crea un producto nuevo desde ahí,
 *   y nunca duplica una combinación de atributos ya cargada.
 */

require_once __DIR__ . '/../modelo/ProductoDAO.php';
require_once __DIR__ . '/../modelo/VarianteDAO.php';
require_once __DIR__ . '/../modelo/AtributoDAO.php';
require_once __DIR__ . '/../modelo/TipoDAO.php';
require_once __DIR__ . '/../modelo/ProductoAtributoDAO.php';

class CatalogoService
{
    private ProductoDAO $productoDAO;
    private VarianteDAO $varianteDAO;
    private AtributoDAO $atributoDAO;
    private TipoDAO $tipoDAO;
    private ProductoAtributoDAO $productoAtributoDAO;

    public function __construct()
    {
        $this->productoDAO         = new ProductoDAO();
        $this->varianteDAO         = new VarianteDAO();
        $this->atributoDAO         = new AtributoDAO();
        $this->tipoDAO             = new TipoDAO();
        $this->productoAtributoDAO = new ProductoAtributoDAO();
    }

    // ── Tipos de producto (solo Administrador los gestiona) ──────────

    public function crearTipo(string $nombre, bool $requiereVencimiento, array $atributoIds = []): int
    {
        $existente = $this->tipoDAO->buscarPorNombre($nombre);
        if ($existente && $existente['activo']) {
            throw new InvalidArgumentException("El tipo \"{$nombre}\" ya existe.");
        }
        $tipoId = $this->tipoDAO->crear($nombre, $requiereVencimiento);
        foreach ($atributoIds as $atributoId) {
            $this->tipoDAO->vincularAtributo($tipoId, (int) $atributoId);
        }
        return $tipoId;
    }

    // Para que el formulario de "nuevo producto" sepa qué atributos
    // sugerir apenas el Admin elige el tipo (ej: elegir "Ropa" -> sugiere
    // Talle y Color automáticamente, en vez de una lista larga de todos).
    // Cada atributo ya viene marcado con aplica_variante, para que el
    // frontend sepa si va en el formulario del PRODUCTO (una vez, ej.
    // Marca) o en el de cada VARIANTE (ej. Talle, Color).
    public function atributosSugeridosPorTipo(int $tipoId): array
    {
        return $this->tipoDAO->atributosDeTipo($tipoId);
    }

    /**
     * $datos puede incluir 'atributos_producto': ej ['Marca' => 'Nike'] —
     * valores de atributos NO variantes (aplica_variante = false),
     * que se guardan una sola vez para el producto.
     */
    public function crearProducto(array $datos, int $creadoPor): int
    {
        $existente = $this->productoDAO->buscarPorNombreYMarca($datos['nombre'], $datos['marca'] ?? null);
        if ($existente) {
            throw new InvalidArgumentException(
                "Ya existe un producto \"{$datos['nombre']}\"" .
                (!empty($datos['marca']) ? " de la marca {$datos['marca']}" : '') .
                ' (id ' . $existente['id'] . '). Agregá una variante a ese producto en vez de crear uno nuevo.'
            );
        }

        $productoId = $this->productoDAO->crear($datos, $creadoPor);

        foreach (($datos['atributos_producto'] ?? []) as $nombreAtributo => $valor) {
            $atributo = $this->atributoDAO->buscarPorNombre($nombreAtributo);
            if (!$atributo || !$atributo['activo']) continue; // silencioso: no bloquea la creación del producto por esto
            if ($atributo['aplica_variante']) {
                throw new InvalidArgumentException(
                    "\"{$nombreAtributo}\" define variantes (como Talle o Color) — no puede cargarse como dato fijo del producto."
                );
            }
            $this->productoAtributoDAO->guardar($productoId, (int) $atributo['id'], (string) $valor);
        }

        return $productoId;
    }

    public function crearAtributo(string $nombre, bool $aplicaVariante = true): int
    {
        $existente = $this->atributoDAO->buscarPorNombre($nombre);
        if ($existente && $existente['activo']) {
            throw new InvalidArgumentException("El atributo \"{$nombre}\" ya existe.");
        }
        return $this->atributoDAO->crear($nombre, $aplicaVariante);
    }

    /**
     * $atributosPorNombre: ej ['Color' => 'Azul', 'Talle' => 'M']
     * Traduce nombres a atributo_id (deben existir en el catálogo, el Admin
     * los da de alta antes) y crea la variante, o reutiliza si la
     * combinación ya existe. Rechaza atributos con aplica_variante=false
     * (esos van en crearProducto, no acá — ej. no tiene sentido una
     * variante nueva solo porque cambia la Marca).
     * @throws InvalidArgumentException
     */
    public function agregarVariante(int $productoId, ?string $sku, array $atributosPorNombre, int $stockMin = 0): int
    {
        $producto = $this->productoDAO->buscarPorId($productoId);
        if (!$producto || !$producto['activo']) {
            throw new InvalidArgumentException('El producto indicado no existe o está inactivo. Si es un artículo nuevo, primero tiene que darlo de alta un Administrador.');
        }

        $atributosPorId = [];
        foreach ($atributosPorNombre as $nombre => $valor) {
            $atributo = $this->atributoDAO->buscarPorNombre($nombre);
            if (!$atributo || !$atributo['activo']) {
                throw new InvalidArgumentException("El atributo \"{$nombre}\" no existe en el catálogo. Un Administrador tiene que darlo de alta primero.");
            }
            if (!$atributo['aplica_variante']) {
                throw new InvalidArgumentException(
                    "\"{$nombre}\" es un dato fijo del producto (no genera variantes) — cargalo al crear el producto, no en la variante."
                );
            }
            $atributosPorId[$atributo['id']] = (string) $valor;
        }

        $existente = $this->varianteDAO->buscarPorCombinacion($productoId, $atributosPorId);
        if ($existente) {
            return $existente; // ya existe esa combinación exacta, se reutiliza
        }

        return $this->varianteDAO->crear($productoId, $sku, $atributosPorId, $stockMin);
    }
}
