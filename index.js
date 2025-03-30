require('dotenv').config();
const express = require('express');
const path = require('path');
const lti = require('ltijs').Provider;

const app = express();
app.set('trust proxy', 1);

// Configuración LTI mejorada
lti.setup('LTIKEY123', {
  url: process.env.MONGO_URL,
}, {
  staticPath: path.join(__dirname, '/public'),
  cookies: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  },
  devMode: process.env.NODE_ENV !== 'production'
});

// Middleware para logs
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Ruta POST /login - Compatibilidad con Moodle
app.post('/login', (req, res) => {
  console.log('Solicitud POST a /login recibida, redirigiendo a /lti');
  res.redirect(307, '/lti'); // 307 preserva el método POST
});

// Ruta principal LTI
lti.onConnect(async (token, req, res) => {
  try {
    const idToken = res.locals.token;
    console.log('Datos LTI recibidos:', idToken);

    const userData = {
      nombre: idToken.userInfo.name || 'Usuario',
      email: idToken.userInfo.email || 'No proporcionado',
      rol: idToken.userInfo.roles?.[0] || 'Desconocido',
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
          .user-info { background: #f8f9fa; padding: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Bienvenido, ${userData.nombre}!</h1>
        <div class="user-info">
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
    res.status(500).send('Error al cargar la herramienta');
  }
});

// Configuración de rutas LTI
app.use('/lti', lti.app);

// Iniciar servidor
const start = async () => {
  try {
    await lti.deploy({ app, serverless: true });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Servidor LTI activo en puerto ${PORT}`);
      console.log('Endpoints disponibles:');
      console.log(`- POST /login (para Moodle)`);
      console.log(`- POST /lti (endpoint principal LTI)`);
    });
  } catch (error) {
    console.error('Error al iniciar:', error);
    process.exit(1);
  }
};

start();