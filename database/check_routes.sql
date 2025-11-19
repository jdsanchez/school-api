SELECT 'MENUS:' as tipo;
SELECT id, nombre, ruta FROM menus ORDER BY orden;

SELECT 'SUBMENUS:' as tipo;
SELECT id, menu_id, nombre, ruta FROM submenus ORDER BY menu_id, orden;
