-- Script para insertar pagos de prueba
USE school_management;

-- Verificar si hay alumnos disponibles
SELECT 
    u.id, 
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
    u.codigo_estudiante,
    r.nombre as rol
FROM usuarios u
INNER JOIN roles r ON u.rol_id = r.id
WHERE r.nombre = 'Alumno'
LIMIT 5;

-- Verificar cursos disponibles con costo
SELECT id, codigo, nombre, costo 
FROM cursos 
WHERE costo > 0
LIMIT 5;

-- Limpiar pagos existentes (CUIDADO: esto borra todos los pagos)
-- DELETE FROM pagos;

-- Insertar pagos de ejemplo
-- Asegúrate de usar IDs válidos de tu base de datos
-- Puedes cambiar los IDs según los resultados de las consultas anteriores

-- Ejemplo: Si tienes alumno_id=6 y curso_id=1
INSERT INTO pagos (curso_id, alumno_id, monto, metodo_pago, estado, fecha_limite, fecha_pago, numero_referencia, observaciones) VALUES
(1, 6, 500.00, 'Transferencia', 'Pendiente', '2025-12-20', '2025-11-18 10:30:00', 'TRF-2025-001', 'Pago del curso de Desarrollo Web'),
(2, 6, 450.00, 'Efectivo', 'Pendiente', '2025-12-20', '2025-11-18 11:00:00', NULL, 'Pago en efectivo'),
(1, 7, 500.00, 'Tarjeta', 'Pendiente', '2025-12-20', '2025-11-18 14:15:00', 'CARD-2025-001', 'Pago con tarjeta de crédito');

-- Verificar los pagos insertados
SELECT 
    p.id,
    c.nombre as curso,
    c.codigo as codigo_curso,
    CONCAT(u.nombre, ' ', u.apellido) as alumno,
    u.codigo_estudiante,
    p.monto,
    p.metodo_pago,
    p.estado,
    p.fecha_limite,
    p.fecha_pago,
    p.numero_referencia
FROM pagos p
INNER JOIN cursos c ON p.curso_id = c.id
INNER JOIN usuarios u ON p.alumno_id = u.id
ORDER BY p.created_at DESC;
