-- Agregar campos para recuperación de contraseña
USE school_management;

ALTER TABLE usuarios 
ADD COLUMN reset_token VARCHAR(500) NULL AFTER password,
ADD COLUMN reset_token_expira DATETIME NULL AFTER reset_token;

-- Crear índice para búsqueda rápida
CREATE INDEX idx_reset_token ON usuarios(reset_token);
