require('dotenv').config();
const express = require('express');
const path = require('path');
const lti = require('ltijs').Provider;

const app = express();
app.set('trust proxy', 1);

// Configuración LTI
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

// Middleware para log de solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Ruta GET /lti (para pruebas y redirección)
app.get('/lti', (req, res) => {
  if (req.session?.lti) {
    // Si ya tiene sesión LTI, mostrar contenido
    const { nombre, email, rol, curso, tarea } = req.session.lti;
    return res.send(`
      <h1>Bienvenido de nuevo, ${nombre}!</h1>
      <!-- Mostrar información del usuario -->
    `);
  }
  res.status(400).send('Accede a esta herramienta desde Moodle');
});

// Ruta POST /lti (la que usa realmente Moodle)
app.post('/lti', (req, res, next) => {
  // Dejamos que ltijs maneje la autenticación LTI
  next();
}, lti.app);

// Handler principal LTI
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

    // Guardar en sesión
    req.session.lti = userData;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Herramienta LTI</title>
      </head>
      <body>
        <h1>Bienvenido, ${userData.nombre}!</h1>
        <!-- Mostrar información del usuario -->
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error en LTI:', error);
    res.status(500).send('Error al cargar la herramienta');
  }
});

// Iniciar servidor
const start = async () => {
  try {
    await lti.deploy({ app, serverless: true });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Servidor LTI activo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar:', error);
    process.exit(1);
  }
};

start();