import db from '../config/database.js';

// Obtener permisos por rol
export const obtenerPermisosPorRol = async (req, res) => {
  try {
    const { rolId } = req.params;
    
    const [permisos] = await db.query(
      `SELECT p.*, m.nombre as menu_nombre, m.icono as menu_icono, s.nombre as submenu_nombre
       FROM permisos p
       LEFT JOIN menus m ON p.menu_id = m.id
       LEFT JOIN submenus s ON p.submenu_id = s.id
       WHERE p.rol_id = ?
       ORDER BY m.orden, s.orden`,
      [rolId]
    );
    
    res.json(permisos);
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({ error: 'Error al obtener permisos' });
  }
};

// Obtener todos los menús y submenús disponibles
export const obtenerMenusDisponibles = async (req, res) => {
  try {
    const [menus] = await db.query(
      `SELECT id, nombre, icono, ruta, orden 
       FROM menus 
       WHERE activo = TRUE 
       ORDER BY orden`
    );

    const [submenus] = await db.query(
      `SELECT id, menu_id, nombre, ruta, orden 
       FROM submenus 
       WHERE activo = TRUE 
       ORDER BY menu_id, orden`
    );

    // Agrupar submenús por menú
    const menusConSubmenus = menus.map((menu) => ({
      ...menu,
      submenus: submenus.filter((s) => s.menu_id === menu.id),
    }));

    res.json(menusConSubmenus);
  } catch (error) {
    console.error('Error al obtener menús:', error);
    res.status(500).json({ mensaje: 'Error al obtener menús disponibles' });
  }
};

// Obtener matriz de permisos (todos los roles vs todos los menús)
export const obtenerMatrizPermisos = async (req, res) => {
  try {
    const [roles] = await db.query('SELECT id, nombre FROM roles WHERE activo = TRUE ORDER BY id');
    const [menus] = await db.query('SELECT id, nombre, icono FROM menus WHERE activo = TRUE ORDER BY orden');
    
    const [permisos] = await db.query(
      `SELECT rol_id, menu_id, puede_ver, puede_crear, puede_editar, puede_eliminar
       FROM permisos 
       WHERE submenu_id IS NULL`
    );

    // Crear matriz
    const matriz = roles.map((rol) => ({
      rol_id: rol.id,
      rol_nombre: rol.nombre,
      permisos: menus.map((menu) => {
        const permiso = permisos.find(
          (p) => p.rol_id === rol.id && p.menu_id === menu.id
        );
        return {
          menu_id: menu.id,
          menu_nombre: menu.nombre,
          menu_icono: menu.icono,
          puede_ver: permiso?.puede_ver || false,
          puede_crear: permiso?.puede_crear || false,
          puede_editar: permiso?.puede_editar || false,
          puede_eliminar: permiso?.puede_eliminar || false,
        };
      }),
    }));

    res.json({ roles, menus, matriz });
  } catch (error) {
    console.error('Error al obtener matriz de permisos:', error);
    res.status(500).json({ mensaje: 'Error al obtener matriz de permisos' });
  }
};

// Asignar o actualizar permisos
export const asignarPermisos = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { rol_id, permisos } = req.body;

    if (!rol_id || !Array.isArray(permisos)) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    await connection.beginTransaction();

    // Eliminar permisos existentes del rol
    await connection.query('DELETE FROM permisos WHERE rol_id = ?', [rol_id]);

    // Insertar nuevos permisos
    if (permisos.length > 0) {
      const values = permisos.map((p) => [
        rol_id,
        p.menu_id,
        p.submenu_id || null,
        p.puede_ver !== false, // Por defecto true
        p.puede_crear || false,
        p.puede_editar || false,
        p.puede_eliminar || false,
      ]);

      await connection.query(
        `INSERT INTO permisos 
         (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar) 
         VALUES ?`,
        [values]
      );
    }

    await connection.commit();
    res.json({ mensaje: 'Permisos actualizados exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al asignar permisos:', error);
    res.status(500).json({ error: 'Error al asignar permisos' });
  } finally {
    connection.release();
  }
};

// Actualizar un permiso individual
export const actualizarPermiso = async (req, res) => {
  try {
    const { rol_id, menu_id, campo, valor } = req.body;

    if (!rol_id || !menu_id || !campo) {
      return res.status(400).json({ error: 'Datos insuficientes' });
    }

    // Validar campo
    const camposValidos = ['puede_ver', 'puede_crear', 'puede_editar', 'puede_eliminar'];
    if (!camposValidos.includes(campo)) {
      return res.status(400).json({ error: 'Campo inválido' });
    }

    await db.query(
      `UPDATE permisos 
       SET ${campo} = ?
       WHERE rol_id = ? AND menu_id = ? AND submenu_id IS NULL`,
      [valor, rol_id, menu_id]
    );

    res.json({ mensaje: 'Permiso actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar permiso:', error);
    res.status(500).json({ error: 'Error al actualizar permiso' });
  }
};
