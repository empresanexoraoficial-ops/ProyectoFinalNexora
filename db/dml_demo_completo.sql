-- =====================================================
-- StockFlow — Datos de demostración completos
-- Corré esto DESPUÉS de db/ddl_stockflow.sql
-- Contraseña para TODOS los usuarios: 1234
-- =====================================================

USE stockflow;

-- ── Usuarios ─────────────────────────────────────────
INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES
(1, 'Agustín Giacobone', 'admin@nexora.com',     '$2y$10$os5BHq2N3ocBLy25noPEYuQVSkSUuUYgWaFvuzXZm3m4f02Rb9Muq', 'administrador'),
(2, 'Renzo Corbo',       'vendedor@nexora.com',  '$2y$10$os5BHq2N3ocBLy25noPEYuQVSkSUuUYgWaFvuzXZm3m4f02Rb9Muq', 'vendedor'),
(3, 'Darío Prieto',      'repositor@nexora.com', '$2y$10$os5BHq2N3ocBLy25noPEYuQVSkSUuUYgWaFvuzXZm3m4f02Rb9Muq', 'repositor');

-- ── Proveedores ──────────────────────────────────────
INSERT INTO proveedores (id, nombre, contacto) VALUES
(1, 'Textiles del Litoral', '099 111 222'),
(2, 'Distribuidora Salus', '099 333 444');

-- ── Atributos ────────────────────────────────────────
INSERT INTO atributos (id, nombre, aplica_variante) VALUES
(1, 'Talle', 1),
(2, 'Color', 1),
(3, 'Tamaño', 1),
(4, 'Marca', 0);

-- ── Tipos de producto ────────────────────────────────
INSERT INTO tipos_producto (id, nombre, requiere_vencimiento) VALUES
(1, 'Ropa', 0),
(2, 'Bebida', 1);

INSERT INTO tipo_atributos (tipo_id, atributo_id) VALUES
(1, 1), (1, 2), (1, 4),
(2, 3), (2, 4);

-- ── Productos ────────────────────────────────────────
INSERT INTO productos (id, nombre, categoria, tipo_id, precio_costo, precio_venta, proveedor_id, creado_por) VALUES
(1, 'Remera Dry-Fit',     'Ropa deportiva', 1, 3000, 5500, 1, 1),
(2, 'Pantalón Cargo',     'Ropa casual',    1, 4500, 7900, 1, 1),
(3, 'Agua Mineral 500ml', 'Bebidas',        2,  50,   120, 2, 1);

INSERT INTO producto_atributos (producto_id, atributo_id, valor) VALUES
(1, 4, 'Nike'),
(2, 4, 'Wrangler'),
(3, 4, 'Salus');

-- ── Variantes ────────────────────────────────────────
INSERT INTO producto_variantes (id, producto_id, sku, stock, stock_min) VALUES
(1, 1, 'REM-AZ-M', 12, 5),
(2, 1, 'REM-AZ-L', 3,  5),
(3, 1, 'REM-NE-M', 8,  5),
(4, 2, 'PAN-BE-40', 6, 3),
(5, 2, 'PAN-BE-42', 6, 3);

INSERT INTO producto_variantes (id, producto_id, sku, stock, stock_min, vencimiento) VALUES
(6, 3, 'AGUA-500', 40, 10, DATE_ADD(CURDATE(), INTERVAL 10 DAY));

INSERT INTO variante_atributos (variante_id, atributo_id, valor) VALUES
(1, 1, 'M'), (1, 2, 'Azul'),
(2, 1, 'L'), (2, 2, 'Azul'),
(3, 1, 'M'), (3, 2, 'Negro'),
(4, 1, '40'), (4, 2, 'Beige'),
(5, 1, '42'), (5, 2, 'Beige'),
(6, 3, '500ml');

-- ── Ingresos (historial) ─────────────────────────────
INSERT INTO ingresos (variante_id, cantidad, cantidad_buena, proveedor_id, lote, fecha, operador_id) VALUES
(1, 15, 12, 1, 'R-1001', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 3),
(4, 8,  6,  1, 'R-1002', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 3),
(6, 40, 40, 2, 'R-2001', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 3);

-- ── Ventas (historial) ───────────────────────────────
INSERT INTO ventas (id, fecha, canal, cliente_nombre, cliente_email, ciudad, vendedor_id, total, estado) VALUES
(1, DATE_SUB(NOW(), INTERVAL 2 DAY), 'WhatsApp',   'Lucía Fernández', 'lucia@mail.com', 'Montevideo', 2, 11000, 'confirmada'),
(2, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Presencial', 'Martín Silva',    'martin@mail.com','Montevideo', 2, 7900,  'confirmada');

INSERT INTO venta_detalle (venta_id, variante_id, cantidad, precio_unitario) VALUES
(1, 1, 2, 5500),
(2, 4, 1, 7900);

-- ── Gastos ───────────────────────────────────────────
INSERT INTO gastos (categoria, monto, fecha, descripcion, usuario_id) VALUES
('Logística',   1200, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Envío de mercadería a domicilio', 1),
('Publicidad',   800, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Promoción en redes sociales',      1);
