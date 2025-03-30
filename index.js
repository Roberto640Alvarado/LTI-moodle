require('dotenv').config();
const express = require('express');
const path = require('path');
const lti = require('ltijs').Provider;

const app = express();
app.set('trust proxy', 1);

// Inicializar LTI con configuración mejorada
lti.setup('LTIKEY123', {
  url: process.env.MONGO_URL,
}, {
  staticPath: path.join(__dirname, '/public'),
  cookies: {
    secure: process.env.NODE_ENV === 'production', // Solo true en producción
    sameSite: 'None'
  },
  devMode: process.env.NODE_ENV !== 'production'
});

// Middleware para depuración
app.use((req, res, next) => {
  console.log('Solicitud recibida:', req.method, req.url);
  next();
});

// Ruta principal LTI - Versión mejorada con manejo de errores
lti.onConnect(async (token, req, res) => {
  try {
    console.log('Token recibido:', res.locals.token); // Depuración
    
    const idToken = res.locals.token;
    if (!idToken || !idToken.userInfo) {
      throw new Error('No se recibieron datos de usuario');
    }

    // Datos con valores por defecto para evitar errores
    const nombre = idToken.userInfo.name || 
                  [idToken.userInfo.given_name, idToken.userInfo.family_name].filter(Boolean).join(' ') || 
                  'Usuario';
    const email = idToken.userInfo.email || 'No proporcionado';
    const rol = idToken.userInfo.roles?.[0] || 'Desconocido';
    const curso = idToken.platformContext?.title || 'Curso no disponible';
    const tarea = idToken.resourceLink?.title || 'Tarea no disponible';

    // Respuesta mejorada
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Información de Usuario</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2c3e50; }
          .info-container { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Bienvenido al Sistema LTI</h1>
        <div class="info-container">
          <h2>Hola, ${nombre}!</h2>
          <p><strong>Rol:</strong> ${rol}</p>
          <p><strong>Correo:</strong> ${email}</p>
          <p><strong>Curso:</strong> ${curso}</p>
          <p><strong>Tarea:</strong> ${tarea}</p>
          <p><small>ID de usuario: ${idToken.userInfo.id || 'N/A'}</small></p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error en onConnect:', error);
    return res.status(500).send(`
      <h1>Error</h1>
      <p>No se pudieron obtener los datos del usuario.</p>
      <p>${error.message}</p>
    `);
  }
});

// Ruta adicional para manejar posibles solicitudes a /login
app.post('/login', (req, res) => {
  console.log('Intento de login detectado, redirigiendo...');
  res.redirect('/');
});

// Iniciar servidor con manejo de errores
const start = async () => {
  try {
    await lti.deploy({ app, serverless: true });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor LTI activo en el puerto ${PORT}`);
      console.log(`🔑 MongoDB`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

start();
