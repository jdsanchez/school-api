-- Actualizar rutas de menús
UPDATE menus SET ruta = '/dashboard/usuarios' WHERE nombre = 'Usuarios';
UPDATE menus SET ruta = '/dashboard/roles' WHERE nombre = 'Roles';
UPDATE menus SET ruta = '/dashboard/materias' WHERE nombre = 'Materias';
UPDATE menus SET ruta = '/dashboard/asistencia' WHERE nombre = 'Asistencia';
UPDATE menus SET ruta = '/dashboard/calificaciones' WHERE nombre = 'Calificaciones';
UPDATE menus SET ruta = '/dashboard/configuracion' WHERE nombre = 'Configuración';

-- Actualizar rutas de submenús
UPDATE submenus SET ruta = '/dashboard/usuarios/lista' WHERE nombre = 'Lista de Usuarios';
UPDATE submenus SET ruta = '/dashboard/usuarios/nuevo' WHERE nombre = 'Nuevo Usuario';
UPDATE submenus SET ruta = '/dashboard/roles/lista' WHERE nombre = 'Lista de Roles';
UPDATE submenus SET ruta = '/dashboard/roles/nuevo' WHERE nombre = 'Nuevo Rol';
UPDATE submenus SET ruta = '/dashboard/roles/permisos' WHERE nombre = 'Permisos';
UPDATE submenus SET ruta = '/dashboard/materias/lista' WHERE nombre = 'Lista de Materias';
UPDATE submenus SET ruta = '/dashboard/materias/nueva' WHERE nombre = 'Nueva Materia';
UPDATE submenus SET ruta = '/dashboard/materias/asignar' WHERE nombre = 'Asignar a Maestros';
UPDATE submenus SET ruta = '/dashboard/asistencia/registrar' WHERE nombre = 'Registrar Asistencia';
UPDATE submenus SET ruta = '/dashboard/asistencia/reportes' WHERE ruta = '/asistencia/reportes';
UPDATE submenus SET ruta = '/dashboard/calificaciones/registrar' WHERE nombre = 'Registrar Notas';
UPDATE submenus SET ruta = '/dashboard/calificaciones/reportes' WHERE ruta = '/calificaciones/reportes';
UPDATE submenus SET ruta = '/dashboard/configuracion/general' WHERE nombre = 'General';
UPDATE submenus SET ruta = '/dashboard/configuracion/sistema' WHERE nombre = 'Sistema';
