-- Módulo de Pagos - Base de datos

-- Agregar columna de costo a la tabla cursos
ALTER TABLE cursos ADD COLUMN costo DECIMAL(10,2) DEFAULT 0.00 AFTER creditos;

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  curso_id INT NOT NULL,
  alumno_id INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  metodo_pago ENUM('Efectivo', 'Transferencia', 'Tarjeta', 'Depósito') NOT NULL,
  estado ENUM('Pendiente', 'Pagado', 'Atrasado', 'Parcial', 'Cancelado') DEFAULT 'Pendiente',
  fecha_limite DATE NOT NULL,
  fecha_pago DATETIME NULL,
  comprobante VARCHAR(255) NULL,
  numero_referencia VARCHAR(100) NULL,
  observaciones TEXT,
  confirmado_por INT NULL,
  fecha_confirmacion DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
  FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (confirmado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_estado (estado),
  INDEX idx_alumno (alumno_id),
  INDEX idx_curso (curso_id),
  INDEX idx_fecha_limite (fecha_limite)
) ENGINE=InnoDB;

-- Tabla de historial de pagos (para pagos parciales o cambios de estado)
CREATE TABLE IF NOT EXISTS pago_historial (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pago_id INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  estado_anterior VARCHAR(20),
  estado_nuevo VARCHAR(20) NOT NULL,
  metodo_pago VARCHAR(20),
  comprobante VARCHAR(255),
  observaciones TEXT,
  registrado_por INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de notificaciones de pago
CREATE TABLE IF NOT EXISTS notificaciones_pago (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pago_id INT NOT NULL,
  alumno_id INT NOT NULL,
  tipo ENUM('Recordatorio', 'Vencimiento', 'Atrasado', 'Confirmado') NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE,
  FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_alumno_leido (alumno_id, leido)
) ENGINE=InnoDB;

-- Actualizar costos de cursos existentes
UPDATE cursos SET costo = 500.00 WHERE codigo = 'DEV-101';
UPDATE cursos SET costo = 450.00 WHERE codigo = 'DIS-101';
UPDATE cursos SET costo = 400.00 WHERE codigo = 'PRO-101';

-- Insertar menú de Pagos
INSERT INTO menus (nombre, icono, ruta, orden, activo) 
VALUES ('Pagos', 'dollar-sign', '/dashboard/pagos', 5, TRUE);

-- Asignar permisos de Pagos
-- Admin: acceso completo + confirmar pagos
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) 
VALUES (1, (SELECT id FROM menus WHERE nombre = 'Pagos'), NULL, TRUE, TRUE, TRUE, TRUE);

-- Director: acceso completo + confirmar pagos
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) 
VALUES (2, (SELECT id FROM menus WHERE nombre = 'Pagos'), NULL, TRUE, TRUE, TRUE, TRUE);

-- Maestro: solo ver pagos de sus cursos
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) 
VALUES (3, (SELECT id FROM menus WHERE nombre = 'Pagos'), NULL, TRUE, FALSE, FALSE, FALSE);

-- Alumno: ver y registrar sus pagos
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) 
VALUES (4, (SELECT id FROM menus WHERE nombre = 'Pagos'), NULL, TRUE, TRUE, FALSE, FALSE);

-- Padres: ver pagos de sus hijos
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) 
VALUES (5, (SELECT id FROM menus WHERE nombre = 'Pagos'), NULL, TRUE, FALSE, FALSE, FALSE);

-- Crear directorio para comprobantes
-- mkdir -p uploads/comprobantes

-- Insertar pagos de ejemplo
INSERT INTO pagos (curso_id, alumno_id, monto, metodo_pago, estado, fecha_limite, fecha_pago) VALUES
(1, 6, 500.00, 'Transferencia', 'Pagado', '2025-01-20', '2025-01-18 10:30:00'),
(1, 7, 500.00, 'Efectivo', 'Pendiente', '2025-01-20', NULL),
(2, 6, 450.00, 'Tarjeta', 'Pagado', '2025-01-20', '2025-01-19 14:15:00');

-- Ver resumen de pagos
SELECT 
    p.id,
    c.nombre as curso,
    c.codigo,
    CONCAT(u.nombre, ' ', u.apellido) as alumno,
    p.monto,
    p.metodo_pago,
    p.estado,
    p.fecha_limite,
    p.fecha_pago
FROM pagos p
JOIN cursos c ON p.curso_id = c.id
JOIN usuarios u ON p.alumno_id = u.id
ORDER BY p.fecha_limite DESC;
