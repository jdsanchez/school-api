-- Tabla para gestionar banners del slider de login
CREATE TABLE IF NOT EXISTS `banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `imagen` varchar(500) NOT NULL,
  `orden` int(11) DEFAULT 0,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_activo_orden` (`activo`, `orden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar banners por defecto (con URLs de Unsplash)
INSERT INTO `banners` (`titulo`, `descripcion`, `imagen`, `orden`, `activo`) VALUES
('Aprende en Comunidad', 'Colabora con compañeros y alcanza tus metas académicas', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80', 1, 1),
('Educación Moderna', 'Accede a recursos educativos de última generación', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80', 2, 1),
('Aprende a tu Ritmo', 'Gestiona tu horario y estudia desde cualquier lugar', 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&q=80', 3, 1),
('Crece Profesionalmente', 'Desarrolla habilidades que transformarán tu futuro', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80', 4, 1);
