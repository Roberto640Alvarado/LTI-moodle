require('dotenv').config();
const express = require('express');
const path = require('path');
const lti = require('ltijs').Provider;

const app = express();
app.set('trust proxy', 1);

// Inicializar LTI
lti.setup('LTIKEY123', {
  url: process.env.MONGO_URL,
}, {
  staticPath: path.join(__dirname, '/public'),
  cookies: {
    secure: process.env.NODE_ENV === 'production', // True solo en producción
    sameSite: 'None'
  },
  devMode: process.env.NODE_ENV !== 'production'
});

// Middleware para log de solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Ruta GET / para manejar solicitudes directas
app.get('/', (req, res) => {
  if (!req.session || !req.session.lti) {
    return res.status(403).send(`
      <h1>Acceso no autorizado</h1>
      <p>Debes acceder a esta herramienta a través de Moodle.</p>
    `);
  }
  res.redirect('/lti');
});

// Ruta principal LTI
lti.onConnect(async (token, req, res) => {
  try {
    const idToken = res.locals.token;
    console.log('Datos recibidos de LTI:', JSON.stringify(idToken, null, 2)); // Depuración
    
    if (!idToken || !idToken.userInfo) {
      throw new Error('No se recibieron datos de usuario');
    }

    const nombre = idToken.userInfo.name || 
                  [idToken.userInfo.given_name, idToken.userInfo.family_name].filter(Boolean).join(' ') || 
                  'Usuario';
    const email = idToken.userInfo.email || 'No proporcionado';
    const rol = idToken.userInfo.roles?.[0] || 'Desconocido';
    const curso = idToken.platformContext?.title || 'Curso no disponible';
    const tarea = idToken.resourceLink?.title || 'Tarea no disponible';

    // Guardar datos en sesión
    req.session.lti = {
      user: { nombre, email, rol },
      context: { curso, tarea }
    };

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Feedback Triángulo</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2c3e50; }
          .info { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Bienvenido al Feedback Triángulo</h1>
        <div class="info">
          <h2>Hola, ${nombre}!</h2>
          <p><strong>Rol:</strong> ${rol}</p>
          <p><strong>Correo:</strong> ${email}</p>
          <p><strong>Curso:</strong> ${curso}</p>
          <p><strong>Tarea:</strong> ${tarea}</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error en onConnect:', error);
    res.status(500).send(`
      <h1>Error</h1>
      <p>No se pudieron cargar los datos del usuario.</p>
      <p>${error.message}</p>
    `);
  }
});

// Manejador de errores
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
      console.log(`🚀 Servidor LTI activo en el puerto ${PORT}`);
      console.log(`🗄️ MongoDB`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

start();
