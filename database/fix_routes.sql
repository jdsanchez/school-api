-- Actualizar submenús para que apunten a las páginas principales que existen
-- En lugar de /dashboard/usuarios/lista, usar /dashboard/usuarios

-- Usuarios: apuntar todo a /dashboard/usuarios
UPDATE submenus SET ruta = '/dashboard/usuarios' WHERE menu_id = 2;

-- Roles: apuntar todo a /dashboard/roles
UPDATE submenus SET ruta = '/dashboard/roles' WHERE menu_id = 3;

-- Materias: apuntar todo a /dashboard/materias
UPDATE submenus SET ruta = '/dashboard/materias' WHERE menu_id = 4;

-- Asistencia: apuntar todo a /dashboard/asistencia
UPDATE submenus SET ruta = '/dashboard/asistencia' WHERE menu_id = 5;

-- Calificaciones: apuntar todo a /dashboard/calificaciones
UPDATE submenus SET ruta = '/dashboard/calificaciones' WHERE menu_id = 6;

-- Configuración: apuntar todo a /dashboard/configuracion
UPDATE submenus SET ruta = '/dashboard/configuracion' WHERE menu_id = 7;
