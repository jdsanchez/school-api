-- Crear tabla de Cursos (Cursos Técnicos)
CREATE TABLE IF NOT EXISTS cursos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  maestro_id INT NOT NULL,
  cupo_maximo INT DEFAULT 30,
  creditos INT DEFAULT 0,
  horario VARCHAR(100),
  aula VARCHAR(50),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (maestro_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  INDEX idx_maestro (maestro_id),
  INDEX idx_fecha (fecha_inicio, fecha_fin)
) ENGINE=InnoDB;

-- Tabla de inscripciones de alumnos a cursos
CREATE TABLE IF NOT EXISTS curso_alumnos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  curso_id INT NOT NULL,
  alumno_id INT NOT NULL,
  fecha_inscripcion DATE DEFAULT (CURRENT_DATE),
  estado ENUM('Inscrito', 'Activo', 'Retirado', 'Completado') DEFAULT 'Inscrito',
  nota_final DECIMAL(5,2),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
  FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_inscripcion (curso_id, alumno_id)
) ENGINE=InnoDB;

-- Insertar menú de Cursos
INSERT INTO menus (nombre, icono, ruta, orden, activo) 
VALUES ('Cursos', 'book', '/dashboard/cursos', 4, TRUE);

-- Asignar permisos de Cursos
-- Admin: acceso completo
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) 
VALUES (1, (SELECT id FROM menus WHERE nombre = 'Cursos'), NULL, TRUE, TRUE, TRUE, TRUE);

-- Director: acceso completo
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) 
VALUES (2, (SELECT id FROM menus WHERE nombre = 'Cursos'), NULL, TRUE, TRUE, TRUE, TRUE);

-- Maestro: puede ver sus cursos
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) 
VALUES (3, (SELECT id FROM menus WHERE nombre = 'Cursos'), NULL, TRUE, FALSE, FALSE, FALSE);

-- Alumno: puede ver cursos disponibles
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) 
VALUES (4, (SELECT id FROM menus WHERE nombre = 'Cursos'), NULL, TRUE, FALSE, FALSE, FALSE);

-- Padres: puede ver cursos de sus hijos
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) 
VALUES (5, (SELECT id FROM menus WHERE nombre = 'Cursos'), NULL, TRUE, FALSE, FALSE, FALSE);

-- Insertar cursos técnicos de ejemplo
INSERT INTO cursos (nombre, codigo, descripcion, fecha_inicio, fecha_fin, maestro_id, cupo_maximo, creditos, horario, aula) VALUES
('Desarrollo Web Front-End', 'DEV-101', 'HTML, CSS, JavaScript y React', '2025-01-15', '2025-06-30', 3, 30, 5, 'Lun-Mie-Vie 08:00-09:00', 'Lab 101'),
('Diseño Gráfico Digital', 'DIS-101', 'Adobe Photoshop, Illustrator y Figma', '2025-01-15', '2025-06-30', 4, 30, 5, 'Mar-Jue 08:00-09:30', 'Lab 102'),
('Programación en Python', 'PRO-101', 'Python básico e intermedio', '2025-01-15', '2025-06-30', 5, 25, 4, 'Lun-Mie 10:00-11:00', 'Lab 201');

-- Verificar cursos creados
SELECT 
    c.codigo,
    c.nombre,
    c.fecha_inicio,
    c.fecha_fin,
    CONCAT(u.nombre, ' ', u.apellido) as maestro,
    c.cupo_maximo,
    c.aula
FROM cursos c
JOIN usuarios u ON c.maestro_id = u.id;
