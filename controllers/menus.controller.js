import db from '../config/database.js';

// Obtener todos los menús con sus submenús
export const obtenerMenus = async (req, res) => {
  try {
    const [menus] = await db.query(`
      SELECT m.*, COUNT(s.id) as submenus_count 
      FROM menus m
      LEFT JOIN submenus s ON m.id = s.menu_id
      GROUP BY m.id
      ORDER BY m.orden
    `);
    
    res.json(menus);
  } catch (error) {
    console.error('Error al obtener menús:', error);
    res.status(500).json({ error: 'Error al obtener menús' });
  }
};

// Obtener todos los submenús
export const obtenerSubmenus = async (req, res) => {
  try {
    const [submenus] = await db.query(`
      SELECT s.*, m.nombre as menu_nombre
      FROM submenus s
      INNER JOIN menus m ON s.menu_id = m.id
      ORDER BY m.orden, s.orden
    `);
    
    res.json(submenus);
  } catch (error) {
    console.error('Error al obtener submenús:', error);
    res.status(500).json({ error: 'Error al obtener submenús' });
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

// Actualizar un menú
export const actualizarMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, icono, ruta, orden, activo } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del menú es requerido' });
    }

    await db.query(
      'UPDATE menus SET nombre = ?, icono = ?, ruta = ?, orden = ?, activo = ? WHERE id = ?',
      [nombre, icono || null, ruta || null, orden || 0, activo !== undefined ? activo : true, id]
    );

    res.json({ mensaje: 'Menú actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar menú:', error);
    res.status(500).json({ error: 'Error al actualizar menú' });
  }
};

// Eliminar un menú
export const eliminarMenu = async (req, res) => {
  try {
    const { id } = req.params;

    // Primero eliminar permisos asociados
    await db.query('DELETE FROM permisos WHERE menu_id = ?', [id]);
    
    // Eliminar submenús asociados
    await db.query('DELETE FROM submenus WHERE menu_id = ?', [id]);
    
    // Eliminar el menú
    await db.query('DELETE FROM menus WHERE id = ?', [id]);

    res.json({ mensaje: 'Menú eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar menú:', error);
    res.status(500).json({ error: 'Error al eliminar menú' });
  }
};

// Actualizar un submenú
export const actualizarSubmenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { menu_id, nombre, ruta, orden, activo } = req.body;

    if (!menu_id || !nombre || !ruta) {
      return res.status(400).json({ error: 'Menu ID, nombre y ruta son requeridos' });
    }

    await db.query(
      'UPDATE submenus SET menu_id = ?, nombre = ?, ruta = ?, orden = ?, activo = ? WHERE id = ?',
      [menu_id, nombre, ruta, orden || 0, activo !== undefined ? activo : true, id]
    );

    res.json({ mensaje: 'Submenú actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar submenú:', error);
    res.status(500).json({ error: 'Error al actualizar submenú' });
  }
};

// Eliminar un submenú
export const eliminarSubmenu = async (req, res) => {
  try {
    const { id } = req.params;

    // Primero eliminar permisos asociados
    await db.query('DELETE FROM permisos WHERE submenu_id = ?', [id]);
    
    // Eliminar el submenú
    await db.query('DELETE FROM submenus WHERE id = ?', [id]);

    res.json({ mensaje: 'Submenú eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar submenú:', error);
    res.status(500).json({ error: 'Error al eliminar submenú' });
  }
};
