import db from '../config/database.js';

// Obtener todos los menús con sus submenús
export const obtenerMenus = async (req, res) => {
  try {
    const [menus] = await db.query('SELECT * FROM menus WHERE activo = TRUE ORDER BY orden');
    
    // Obtener submenús para cada menú
    for (let menu of menus) {
      const [submenus] = await db.query(
        'SELECT * FROM submenus WHERE menu_id = ? AND activo = TRUE ORDER BY orden',
        [menu.id]
      );
      menu.submenus = submenus;
    }
    
    res.json(menus);
  } catch (error) {
    console.error('Error al obtener menús:', error);
    res.status(500).json({ error: 'Error al obtener menús' });
  }
};

// Obtener menús por rol
export const obtenerMenusPorRol = async (req, res) => {
  try {
    const { rolId } = req.params;
    
    const [menus] = await db.query(
      `SELECT DISTINCT m.* 
       FROM menus m
       INNER JOIN permisos p ON m.id = p.menu_id
       WHERE p.rol_id = ? AND p.puede_ver = TRUE AND m.activo = TRUE
       ORDER BY m.orden`,
      [rolId]
    );
    
    for (let menu of menus) {
      const [submenus] = await db.query(
        `SELECT s.* 
         FROM submenus s
         INNER JOIN permisos p ON s.id = p.submenu_id
         WHERE s.menu_id = ? AND p.rol_id = ? AND p.puede_ver = TRUE AND s.activo = TRUE
         ORDER BY s.orden`,
        [menu.id, rolId]
      );
      menu.submenus = submenus;
    }
    
    res.json(menus);
  } catch (error) {
    console.error('Error al obtener menús por rol:', error);
    res.status(500).json({ error: 'Error al obtener menús' });
  }
};

// Crear un menú
export const crearMenu = async (req, res) => {
  try {
    const { nombre, icono, ruta, orden, activo } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del menú es requerido' });
    }

    const [resultado] = await db.query(
      'INSERT INTO menus (nombre, icono, ruta, orden, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre, icono || null, ruta || null, orden || 0, activo !== undefined ? activo : true]
    );

    res.status(201).json({
      mensaje: 'Menú creado exitosamente',
      id: resultado.insertId
    });
  } catch (error) {
    console.error('Error al crear menú:', error);
    res.status(500).json({ error: 'Error al crear menú' });
  }
};

// Crear un submenú
export const crearSubmenu = async (req, res) => {
  try {
    const { menu_id, nombre, ruta, orden, activo } = req.body;

    if (!menu_id || !nombre || !ruta) {
      return res.status(400).json({ error: 'Menu ID, nombre y ruta son requeridos' });
    }

    const [resultado] = await db.query(
      'INSERT INTO submenus (menu_id, nombre, ruta, orden, activo) VALUES (?, ?, ?, ?, ?)',
      [menu_id, nombre, ruta, orden || 0, activo !== undefined ? activo : true]
    );

    res.status(201).json({
      mensaje: 'Submenú creado exitosamente',
      id: resultado.insertId
    });
  } catch (error) {
    console.error('Error al crear submenú:', error);
    res.status(500).json({ error: 'Error al crear submenú' });
  }
};
