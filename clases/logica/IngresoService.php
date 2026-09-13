<?php
/**
 * IngresoService.php — capa de lógica
 * Regla real del negocio (la que motivó todo el rediseño de Agustín):
 * solo "cantidad_buena" suma al stock, nunca la cantidad total recibida.
 * Y el remito duplicado se corta ANTES de tocar la base, con mensaje claro.
 */

require_once __DIR__ . '/../modelo/IngresoDAO.php';
require_once __DIR__ . '/../modelo/VarianteDAO.php';
require_once __DIR__ . '/../modelo/ProveedorDAO.php';

class IngresoService
{
    private IngresoDAO $ingresoDAO;
    private VarianteDAO $varianteDAO;
    private ProveedorDAO $proveedorDAO;
    private PDO $conexion;

    public function __construct()
    {
        $this->ingresoDAO   = new IngresoDAO();
        $this->varianteDAO  = new VarianteDAO();
        $this->proveedorDAO = new ProveedorDAO();
        $this->conexion     = Database::obtenerConexion();
    }

    /**
     * @throws InvalidArgumentException si el remito ya fue cargado, si la
     *         variante no existe, o si cantidad_buena > cantidad
     */
    public function registrarIngreso(array $datos, int $operadorId): int
    {
        if (!$this->varianteDAO->buscarPorId((int) $datos['variante_id'])) {
            throw new InvalidArgumentException('La variante indicada no existe.');
        }

        if ((int) $datos['cantidad_buena'] > (int) $datos['cantidad']) {
            throw new InvalidArgumentException('La cantidad en buen estado no puede ser mayor a la cantidad recibida.');
        }

        // El proveedor se escribe como texto libre (ej: "Textiles del
        // Litoral") — acá se busca si ya existe, o se crea la primera vez.
        // Esto es lo que permite que el catálogo de proveedores quede
        // "derivado" de los ingresos, sin un alta manual aparte.
        if (!empty($datos['proveedor_nombre'])) {
            $datos['proveedor_id'] = $this->proveedorDAO->buscarOCrearPorNombre(
                trim($datos['proveedor_nombre']),
                $datos['proveedor_contacto'] ?? null
            );
        } else {
            $datos['proveedor_id'] = null;
        }

        // Chequeo previo con mensaje claro — la base también lo rechazaría
        // (UNIQUE proveedor_id+lote), pero así el usuario entiende por qué.
        if ($this->ingresoDAO->existeRemito($datos['proveedor_id'], $datos['lote'])) {
            throw new InvalidArgumentException(
                "El remito \"{$datos['lote']}\" ya fue registrado para este proveedor. " .
                'Si es un envío distinto, usá un número de remito diferente.'
            );
        }

        $this->conexion->beginTransaction();
        try {
            $id = $this->ingresoDAO->crear($datos, $operadorId);

            // SOLO la cantidad en buen estado entra a stock — el resto
            // (rechazado) queda registrado en el ingreso pero no suma acá.
            $this->varianteDAO->ajustarStock((int) $datos['variante_id'], (int) $datos['cantidad_buena']);

            $this->conexion->commit();
            return $id;
        } catch (Throwable $e) {
            $this->conexion->rollBack();
            throw $e;
        }
    }
}
