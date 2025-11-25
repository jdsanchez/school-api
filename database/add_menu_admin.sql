-- Script para agregar el módulo de administración de menús al sistema

-- Crear menú Sistema si no existe
INSERT IGNORE INTO menus (nombre, icono, ruta, orden, activo)
VALUES ('Sistema', 'FiSettings', NULL, 999, 1);

-- Agregar submenú de Administración de Menús
INSERT INTO submenus (menu_id, nombre, ruta, orden, activo)
SELECT m.id, 'Administrar Menús', '/dashboard/menu-admin', 10, 1
FROM menus m
WHERE m.nombre = 'Sistema'
AND NOT EXISTS (SELECT 1 FROM submenus WHERE ruta = '/dashboard/menu-admin');

-- Asignar permisos al rol Admin
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.id, m.id, s.id, 1, 1, 1, 1
FROM roles r
CROSS JOIN menus m
CROSS JOIN submenus s
WHERE r.nombre = 'Admin' 
  AND m.nombre = 'Sistema'
  AND s.ruta = '/dashboard/menu-admin'
  AND NOT EXISTS (
    SELECT 1 FROM permisos p 
    WHERE p.rol_id = r.id 
      AND p.submenu_id = s.id
  );
