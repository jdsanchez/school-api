# Configuración de Email para Recuperación de Contraseña

## Opción 1: Gmail (Recomendado)

### Paso 1: Habilitar Autenticación de 2 Factores
1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. En el menú lateral, selecciona "Seguridad"
3. En "Acceso a Google", habilita la "Verificación en dos pasos"
4. Sigue las instrucciones para configurarla

### Paso 2: Generar App Password
1. Una vez habilitada la verificación en dos pasos, ve a: https://myaccount.google.com/apppasswords
2. En "Selecciona la app", elige "Correo"
3. En "Selecciona el dispositivo", elige "Otro (nombre personalizado)"
4. Escribe "Sistema Escolar" o el nombre que prefieras
5. Haz clic en "Generar"
6. Google te mostrará una contraseña de 16 dígitos (ejemplo: `abcd efgh ijkl mnop`)
7. Copia esta contraseña (sin espacios)

### Paso 3: Configurar Variables de Entorno

En tu archivo `.env` (local) o `.env.production` (producción), agrega:

```env
# Configuración de Email - Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=tu-email@gmail.com
EMAIL_FROM_NAME=Sistema Escolar

# Frontend URL (necesario para el link de recuperación)
FRONTEND_URL=http://localhost:3000
```

**Importante:** 
- La `EMAIL_PASSWORD` debe ser la app password de 16 caracteres (sin espacios)
- NO uses tu contraseña normal de Gmail
- En producción, cambia `FRONTEND_URL` a tu dominio real

### Paso 4: Instalar dependencias
```bash
npm install nodemailer
```

### Paso 5: Reiniciar el servidor
```bash
npm run dev
```

---

## Opción 2: SMTP Genérico (SendGrid, Mailgun, etc.)

Para servicios SMTP profesionales:

```env
# Configuración SMTP
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=tu-api-key-de-sendgrid
EMAIL_FROM=noreply@tu-dominio.com
EMAIL_FROM_NAME=Sistema Escolar
```

---

## Probar la Configuración

1. Inicia el servidor backend
2. Ve a la página de login en el frontend
3. Haz clic en "¿Olvidaste tu contraseña?"
4. Ingresa un email registrado
5. Revisa tu bandeja de entrada (y spam si es necesario)

---

## Solución de Problemas

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"
- Asegúrate de usar la App Password, no tu contraseña normal
- Verifica que la verificación en dos pasos esté habilitada

### No llega el correo
- Revisa la carpeta de spam
- Verifica los logs del servidor: `pm2 logs school-backend`
- Confirma que las variables de entorno estén correctas

### Error de conexión SMTP
- Verifica que el puerto sea correcto (587 para TLS, 465 para SSL)
- Confirma que tu servidor permita conexiones SMTP salientes
- Algunos proveedores de hosting bloquean el puerto 25

---

## Seguridad

⚠️ **Importante:**
- NUNCA subas el archivo `.env` a GitHub
- Usa variables de entorno en producción
- Cambia las credenciales regularmente
- Considera usar servicios profesionales como SendGrid para producción

---

## Servicios de Email Recomendados

**Para desarrollo:**
- Gmail (gratuito, 500 emails/día)

**Para producción:**
- SendGrid (gratuito: 100 emails/día, pagos desde $15/mes)
- Mailgun (gratuito: 5,000 emails/mes)
- Amazon SES (muy económico, $0.10 por 1,000 emails)
- Resend (moderno, gratuito: 3,000 emails/mes)
