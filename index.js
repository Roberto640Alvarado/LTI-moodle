require('dotenv').config();
const express = require('express');
const path = require('path');
const lti = require('ltijs').Provider;

const app = express();
app.set('trust proxy', 1);

// Configuración LTI mejorada
lti.setup(process.env.LTI_KEY || 'UHNXdVQg11yCMDR', {
  url: process.env.MONGO_URL,
}, {
  staticPath: path.join(__dirname, '/public'),
  cookies: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  },
  devMode: process.env.NODE_ENV !== 'production',
  tokenMaxAge: 3600 // Tiempo de vida del token en segundos
});

// Middleware para logs detallados
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// Ruta principal LTI
lti.onConnect(async (token, req, res) => {
  try {
    console.log('Token recibido:', res.locals.token);
    
    if (!res.locals.token) {
      throw new Error('No se recibió token válido');
    }

    const idToken = res.locals.token;
    const userData = {
      nombre: idToken.userInfo?.name || 'Usuario',
      email: idToken.userInfo?.email || 'No proporcionado',
      rol: idToken.userInfo?.roles?.[0] || 'Desconocido',
      curso: idToken.platformContext?.title || 'Curso no disponible',
      tarea: idToken.resourceLink?.title || 'Tarea no disponible'
    };

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Herramienta LTI</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2c3e50; }
          .info { background: #f8f9fa; padding: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Bienvenido, ${userData.nombre}!</h1>
        <div class="info">
          <p><strong>Rol:</strong> ${userData.rol}</p>
          <p><strong>Email:</strong> ${userData.email}</p>
          <p><strong>Curso:</strong> ${userData.curso}</p>
          <p><strong>Tarea:</strong> ${userData.tarea}</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error en LTI:', error);
    res.status(401).send(`
      <h1>Error de autenticación</h1>
      <p>${error.message}</p>
      <p>Por favor, inténtalo de nuevo o contacta al administrador.</p>
    `);
  }
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).send('Error interno del servidor');
});

// Iniciar servidor
const start = async () => {
  try {
    await lti.deploy({ app, serverless: true });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor LTI activo en puerto ${PORT}`);
      console.log(`🔑 LTI Key: ${process.env.LTI_KEY || 'UHNXdVQg11yCMDR'}`);
    });
  } catch (error) {
    console.error('Error al iniciar:', error);
    process.exit(1);
  }
};

start();