-- Crear menú "Mis Cursos" para alumnos
INSERT INTO menus (nombre, icono, ruta, orden, activo) 
VALUES ('Mis Cursos', 'book', '/dashboard/mis-cursos', 5, TRUE);

-- Asignar permiso SOLO para Alumno
INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) 
VALUES (4, (SELECT id FROM menus WHERE nombre = 'Mis Cursos'), NULL, TRUE, TRUE, FALSE, FALSE);

-- Verificar el nuevo menú y permiso
SELECT 
    m.nombre as menu,
    m.ruta,
    r.nombre as rol,
    p.puede_ver,
    p.puede_crear
FROM menus m
LEFT JOIN permisos p ON m.id = p.menu_id
LEFT JOIN roles r ON p.rol_id = r.id
WHERE m.nombre = 'Mis Cursos';
