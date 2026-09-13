-- =====================================================
-- StockFlow — usuarios de prueba
-- Contraseña para los 3: 1234
-- Corré esto DESPUÉS de db/ddl_stockflow.sql
-- (probado de verdad: el hash de abajo funciona con password_verify)
-- =====================================================

USE stockflow;

INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Agustín Giacobone',   'admin@nexora.com',     '$2y$10$rQUKmOKeqyBHzhiYHZnch.knirS5SwQsmTVSAXr0drPgTWD702vmG', 'administrador'),
('Vendedor Prueba',     'vendedor@nexora.com',  '$2y$10$rQUKmOKeqyBHzhiYHZnch.knirS5SwQsmTVSAXr0drPgTWD702vmG', 'vendedor'),
('Repositor Prueba',    'repositor@nexora.com', '$2y$10$rQUKmOKeqyBHzhiYHZnch.knirS5SwQsmTVSAXr0drPgTWD702vmG', 'repositor');
