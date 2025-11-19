-- Eliminar permisos de Cursos para roles que NO son Admin ni Director
-- Solo Admin (rol_id = 1) y Director (rol_id = 2) deben ver el módulo

-- Eliminar permiso de Maestro
DELETE FROM permisos 
WHERE rol_id = 3 
  AND menu_id = (SELECT id FROM menus WHERE nombre = 'Cursos');

-- Eliminar permiso de Alumno
DELETE FROM permisos 
WHERE rol_id = 4 
  AND menu_id = (SELECT id FROM menus WHERE nombre = 'Cursos');

-- Eliminar permiso de Padres
DELETE FROM permisos 
WHERE rol_id = 5 
  AND menu_id = (SELECT id FROM menus WHERE nombre = 'Cursos');

-- Verificar permisos actuales de Cursos
SELECT 
    r.nombre as rol,
    m.nombre as menu,
    p.puede_ver,
    p.puede_crear,
    p.puede_editar,
    p.puede_eliminar
FROM permisos p
JOIN roles r ON p.rol_id = r.id
JOIN menus m ON p.menu_id = m.id
WHERE m.nombre = 'Cursos'
ORDER BY r.id;
