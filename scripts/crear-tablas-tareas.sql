-- Tabla de tareas
CREATE TABLE IF NOT EXISTS tareas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  curso_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_entrega DATETIME NOT NULL,
  puntos_totales DECIMAL(5,2) DEFAULT 100.00,
  archivo_adjunto VARCHAR(500),
  creado_por INT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id),
  INDEX idx_curso_fecha (curso_id, fecha_entrega),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de entregas de tareas
CREATE TABLE IF NOT EXISTS tarea_entregas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tarea_id INT NOT NULL,
  alumno_id INT NOT NULL,
  fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archivo_entrega VARCHAR(500),
  comentarios TEXT,
  estado ENUM('Entregada', 'Revision', 'Calificada', 'Rechazada') DEFAULT 'Entregada',
  calificacion DECIMAL(5,2),
  comentarios_calificacion TEXT,
  calificado_por INT,
  fecha_calificacion DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
  FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (calificado_por) REFERENCES usuarios(id),
  UNIQUE KEY unique_tarea_alumno (tarea_id, alumno_id),
  INDEX idx_alumno (alumno_id),
  INDEX idx_estado (estado),
  INDEX idx_fecha (fecha_entrega)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
