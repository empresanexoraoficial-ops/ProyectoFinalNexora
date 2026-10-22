-- =====================================================
-- StockFlow — Nexora · Segunda Entrega — DDL v3
-- Catálogo de atributos flexible (Color, Talle, Tamaño, Sabor, lo que sea)
-- manejado por el Administrador, en vez de columnas fijas talle/color.
-- Motor: MySQL / MariaDB
-- =====================================================

DROP DATABASE IF EXISTS stockflow;
CREATE DATABASE stockflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stockflow;

CREATE TABLE usuarios (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  nombre             VARCHAR(100) NOT NULL,
  email              VARCHAR(150) NOT NULL UNIQUE,
  password_hash      VARCHAR(255) NOT NULL,
  rol                ENUM('administrador','vendedor','repositor') NOT NULL,
  telefono           VARCHAR(30),
  activo             BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_ingreso      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE proveedores (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(150) NOT NULL UNIQUE,
  contacto  VARCHAR(150)
) ENGINE=InnoDB;

-- ── atributos (CATÁLOGO manejado por el Administrador) ──
-- Ej: "Color", "Talle", "Tamaño", "Sabor", "Presentación" — el Admin da de
-- alta los que necesite según qué tipo de producto venda, y puede
-- desactivar los que ya no usa (nunca se borran físicamente, por si hay
-- variantes viejas que los referencian).
CREATE TABLE atributos (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(50) NOT NULL UNIQUE,
  -- true (Talle, Color): cada valor distinto genera una VARIANTE/SKU nueva.
  -- false (Marca, Material): es un dato fijo del producto, se carga una
  -- sola vez y no fragmenta el stock — mismo patrón que "used for
  -- variations" en WooCommerce / "options" vs. metadatos en Shopify.
  aplica_variante   BOOLEAN NOT NULL DEFAULT TRUE,
  activo            BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ── tipos_producto (CATÁLOGO manejado por el Administrador) ──
-- Ej: "Ropa", "Bebida", "Alimento envasado", "Objeto/Decoración".
-- Cada tipo dice si tiene sentido pedir vencimiento, y qué atributos son
-- los típicos de ese tipo (ver tipo_atributos) — así al crear un producto
-- el formulario ya sugiere Talle/Color para Ropa, o Tamaño para Bebida,
-- en vez de mostrar una lista larga de todos los atributos posibles.
CREATE TABLE tipos_producto (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  nombre                VARCHAR(50) NOT NULL UNIQUE,
  requiere_vencimiento  BOOLEAN NOT NULL DEFAULT FALSE,
  activo                BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE productos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  codigo        VARCHAR(50),
  nombre        VARCHAR(150) NOT NULL,
  categoria     VARCHAR(80),
  tipo_id       INT NULL,
  marca         VARCHAR(80),
  descripcion   VARCHAR(255),
  temporada     VARCHAR(40),
  precio_costo  DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_venta  DECIMAL(10,2) NOT NULL DEFAULT 0,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_alta    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  proveedor_id  INT NULL,
  creado_por    INT NOT NULL,
  CONSTRAINT fk_producto_tipo      FOREIGN KEY (tipo_id) REFERENCES tipos_producto(id),
  CONSTRAINT fk_producto_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
  CONSTRAINT fk_producto_creador   FOREIGN KEY (creado_por) REFERENCES usuarios(id),
  CONSTRAINT chk_precio_venta CHECK (precio_venta = 0 OR precio_venta >= precio_costo),
  CONSTRAINT uq_producto_nombre_marca UNIQUE (nombre, marca)
) ENGINE=InnoDB;

-- ── tipo_atributos (qué atributos son "típicos" de cada tipo) ──
CREATE TABLE tipo_atributos (
  tipo_id      INT NOT NULL,
  atributo_id  INT NOT NULL,
  PRIMARY KEY (tipo_id, atributo_id),
  CONSTRAINT fk_ta_tipo     FOREIGN KEY (tipo_id) REFERENCES tipos_producto(id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_atributo FOREIGN KEY (atributo_id) REFERENCES atributos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── producto_atributos (valores de atributos FIJOS por producto, ej. Marca) ──
-- Contraparte de variante_atributos, pero a nivel producto — para
-- atributos con aplica_variante = false.
CREATE TABLE producto_atributos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  producto_id  INT NOT NULL,
  atributo_id  INT NOT NULL,
  valor        VARCHAR(80) NOT NULL,
  CONSTRAINT fk_pa_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_atributo FOREIGN KEY (atributo_id) REFERENCES atributos(id),
  CONSTRAINT uq_producto_atributo UNIQUE (producto_id, atributo_id)
) ENGINE=InnoDB;

-- ── producto_variantes (ya NO tiene talle/color fijos) ──
CREATE TABLE producto_variantes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  producto_id   INT NOT NULL,
  sku           VARCHAR(50) UNIQUE,
  stock         INT NOT NULL DEFAULT 0,
  stock_min     INT NOT NULL DEFAULT 0,
  vencimiento   DATE NULL,
  CONSTRAINT fk_variante_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  CONSTRAINT chk_stock_no_negativo CHECK (stock >= 0)
) ENGINE=InnoDB;

-- ── variante_atributos (EAV: valores concretos de cada variante) ──
-- Ej: variante 7 -> (atributo "Color", valor "Azul"), (atributo "Talle", valor "M")
CREATE TABLE variante_atributos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  variante_id   INT NOT NULL,
  atributo_id   INT NOT NULL,
  valor         VARCHAR(80) NOT NULL,
  CONSTRAINT fk_va_variante FOREIGN KEY (variante_id) REFERENCES producto_variantes(id) ON DELETE CASCADE,
  CONSTRAINT fk_va_atributo FOREIGN KEY (atributo_id) REFERENCES atributos(id),
  -- Una variante no puede tener dos valores distintos para el mismo atributo
  CONSTRAINT uq_variante_atributo UNIQUE (variante_id, atributo_id)
) ENGINE=InnoDB;

CREATE TABLE ingresos (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  variante_id           INT NOT NULL,
  cantidad              INT NOT NULL,
  cantidad_buena        INT NOT NULL,
  proveedor_id          INT NULL,
  proveedor_contacto    VARCHAR(150),
  lote                  VARCHAR(50) NOT NULL,
  fecha                 DATE NOT NULL,
  fecha_hora_registro   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observaciones         VARCHAR(255),
  operador_id           INT NOT NULL,
  CONSTRAINT fk_ingreso_variante  FOREIGN KEY (variante_id) REFERENCES producto_variantes(id),
  CONSTRAINT fk_ingreso_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
  CONSTRAINT fk_ingreso_operador  FOREIGN KEY (operador_id) REFERENCES usuarios(id),
  CONSTRAINT chk_cantidad_buena CHECK (cantidad_buena <= cantidad),
  CONSTRAINT uq_ingreso_remito UNIQUE (proveedor_id, lote)
) ENGINE=InnoDB;

CREATE TABLE ventas (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  fecha            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  canal            VARCHAR(40),
  cliente_nombre   VARCHAR(150),
  cliente_email    VARCHAR(150),
  cliente_telefono VARCHAR(30),
  calle            VARCHAR(150),
  numero           VARCHAR(20),
  barrio           VARCHAR(80),
  ciudad           VARCHAR(80),
  vendedor_id      INT NOT NULL,
  total            DECIMAL(10,2) NOT NULL DEFAULT 0,
  -- RF 2.3: si se vende sin stock, queda "pendiente" y se notifica al Repositor
  estado           ENUM('confirmada','pendiente') NOT NULL DEFAULT 'confirmada',
  -- Cobro: solo se completa si la venta queda CONFIRMADA. Una venta pendiente
  -- (sin stock) todavía no se cobra, por eso estas tres columnas admiten NULL.
  -- Con tarjeta o transferencia: monto_recibido = total y vuelto = 0.
  metodo_pago      ENUM('efectivo','tarjeta','transferencia') NULL,
  monto_recibido   DECIMAL(10,2) NULL,
  vuelto           DECIMAL(10,2) NULL,
  CONSTRAINT chk_vuelto_no_negativo CHECK (vuelto IS NULL OR vuelto >= 0),
  CONSTRAINT fk_venta_vendedor FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- RF 1.8 / RF 2.3: notificaciones al Administrador/Repositor (stock mínimo,
-- pedidos pendientes). Guardamos en tabla en vez de solo mandar mail, para
-- que también se puedan listar en pantalla (RNF08 pide "correo o pantalla").
CREATE TABLE notificaciones (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tipo          ENUM('stock_minimo','venta_pendiente') NOT NULL,
  referencia_id INT NOT NULL,        -- id de variante o de venta, según el tipo
  mensaje       VARCHAR(255) NOT NULL,
  leida         BOOLEAN NOT NULL DEFAULT FALSE,
  creada_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE venta_detalle (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  venta_id         INT NOT NULL,
  variante_id      INT NOT NULL,
  cantidad         INT NOT NULL,
  precio_unitario  DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_detalle_venta    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_variante FOREIGN KEY (variante_id) REFERENCES producto_variantes(id)
) ENGINE=InnoDB;

CREATE TABLE gastos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  categoria    VARCHAR(80) NOT NULL,
  monto        DECIMAL(10,2) NOT NULL,
  fecha        DATE NOT NULL,
  descripcion  VARCHAR(255),
  usuario_id   INT NOT NULL,
  CONSTRAINT fk_gasto_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;
