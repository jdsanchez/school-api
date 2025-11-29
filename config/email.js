import nodemailer from 'nodemailer';

// Crear transporter de nodemailer
const createTransporter = () => {
  // Configuración para Gmail
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App Password de Gmail
      },
    });
  }

  // Configuración SMTP genérica
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Enviar email de recuperación de contraseña
export const enviarEmailRecuperacion = async (email, nombre, token) => {
  try {
    const transporter = createTransporter();
    
    const resetLink = `${process.env.FRONTEND_URL}/recuperar-password/${token}`;
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Recuperación de contraseña - Sistema Escolar',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Recuperación de Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Gestión Escolar.</p>
              
              <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Restablecer Contraseña</a>
              </div>
              
              <p>O copia y pega el siguiente enlace en tu navegador:</p>
              <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                ${resetLink}
              </p>
              
              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Importante:</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Este enlace expirará en <strong>1 hora</strong></li>
                  <li>Si no solicitaste este cambio, ignora este correo</li>
                  <li>Tu contraseña actual no cambiará hasta que crees una nueva</li>
                </ul>
              </div>
              
              <p>Si tienes problemas con el botón, contacta al administrador del sistema.</p>
              
              <p>Saludos,<br>
              <strong>Equipo de ${process.env.EMAIL_FROM_NAME || 'Sistema Escolar'}</strong></p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              <p>&copy; ${new Date().getFullYear()} Sistema de Gestión Escolar. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Recuperación de Contraseña

Hola ${nombre},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Haz clic en el siguiente enlace para crear una nueva contraseña:
${resetLink}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, ignora este correo.

Saludos,
Equipo de Sistema Escolar
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return { success: false, error: error.message };
  }
};

export default { enviarEmailRecuperacion };
