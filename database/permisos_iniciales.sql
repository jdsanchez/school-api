-- Script para configurar permisos granulares para todos los roles
-- Este script asigna permisos específicos a cada rol según su función

-- Limpiar permisos existentes
DELETE FROM permisos;

-- ============================================
-- ADMIN: Acceso completo a todo el sistema
-- ============================================
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
-- Dashboard
(1, 1, NULL, TRUE, FALSE, FALSE, FALSE),
-- Usuarios
(1, 2, NULL, TRUE, TRUE, TRUE, TRUE),
-- Roles
(1, 3, NULL, TRUE, TRUE, TRUE, TRUE),
-- Materias
(1, 4, NULL, TRUE, TRUE, TRUE, TRUE),
-- Asistencia
(1, 5, NULL, TRUE, TRUE, TRUE, TRUE),
-- Calificaciones
(1, 6, NULL, TRUE, TRUE, TRUE, TRUE),
-- Configuración
(1, 7, NULL, TRUE, TRUE, TRUE, TRUE);

-- ============================================
-- DIRECTOR: Acceso administrativo (sin configuración del sistema)
-- ============================================
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
-- Dashboard
(2, 1, NULL, TRUE, FALSE, FALSE, FALSE),
-- Usuarios (puede ver, crear y editar, pero no eliminar)
(2, 2, NULL, TRUE, TRUE, TRUE, FALSE),
-- Roles (solo lectura)
(2, 3, NULL, TRUE, FALSE, FALSE, FALSE),
-- Materias
(2, 4, NULL, TRUE, TRUE, TRUE, TRUE),
-- Asistencia (puede ver y consultar reportes)
(2, 5, NULL, TRUE, FALSE, FALSE, FALSE),
-- Calificaciones (puede ver reportes)
(2, 6, NULL, TRUE, FALSE, FALSE, FALSE);
-- No tiene acceso a Configuración

-- ============================================
-- MAESTRO: Acceso limitado a sus materias, asistencia y calificaciones
-- ============================================
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
-- Dashboard
(3, 1, NULL, TRUE, FALSE, FALSE, FALSE),
-- Materias (solo lectura - ve sus materias asignadas)
(3, 4, NULL, TRUE, FALSE, FALSE, FALSE),
-- Asistencia (puede registrar y ver)
(3, 5, NULL, TRUE, TRUE, TRUE, FALSE),
-- Calificaciones (puede registrar y modificar)
(3, 6, NULL, TRUE, TRUE, TRUE, FALSE);
-- No tiene acceso a Usuarios, Roles ni Configuración

-- ============================================
-- ALUMNO: Solo puede ver su información
-- ============================================
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
-- Dashboard (información personal)
(4, 1, NULL, TRUE, FALSE, FALSE, FALSE),
-- Materias (solo ve sus materias inscritas)
(4, 4, NULL, TRUE, FALSE, FALSE, FALSE),
-- Asistencia (solo ve su propia asistencia)
(4, 5, NULL, TRUE, FALSE, FALSE, FALSE),
-- Calificaciones (solo ve sus calificaciones)
(4, 6, NULL, TRUE, FALSE, FALSE, FALSE);
-- No tiene acceso a gestión de usuarios, roles ni configuración

-- ============================================
-- PADRES: Solo puede ver información de sus hijos
-- ============================================
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
-- Dashboard (resumen de información de hijos)
(5, 1, NULL, TRUE, FALSE, FALSE, FALSE),
-- Materias (ve las materias de sus hijos)
(5, 4, NULL, TRUE, FALSE, FALSE, FALSE),
-- Asistencia (ve la asistencia de sus hijos)
(5, 5, NULL, TRUE, FALSE, FALSE, FALSE),
-- Calificaciones (ve las calificaciones de sus hijos)
(5, 6, NULL, TRUE, FALSE, FALSE, FALSE);
-- No tiene acceso a gestión administrativa

-- Verificar permisos insertados
SELECT 
    r.nombre as Rol,
    m.nombre as Menu,
    IF(p.puede_ver, '✓', '✗') as Ver,
    IF(p.puede_crear, '✓', '✗') as Crear,
    IF(p.puede_editar, '✓', '✗') as Editar,
    IF(p.puede_eliminar, '✓', '✗') as Eliminar
FROM permisos p
JOIN roles r ON p.rol_id = r.id
JOIN menus m ON p.menu_id = m.id
WHERE p.submenu_id IS NULL
ORDER BY r.id, m.orden;
