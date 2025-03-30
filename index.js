require('dotenv').config();
const express = require('express');
const path = require('path');
const lti = require('ltijs').Provider;
const session = require('express-session');

const app = express();
app.set('trust proxy', 1);

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_secreto_super_seguro',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  }
}));

// Inicializar LTI
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

// Middleware para depuración
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Ruta GET / para acceso directo
app.get('/', (req, res) => {
  res.status(403).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Acceso no autorizado</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #d9534f; }
      </style>
    </head>
    <body>
      <h1>Acceso no autorizado</h1>
      <p>Debes acceder a esta herramienta a través de Moodle.</p>
    </body>
    </html>
  `);
});

// Ruta POST /login para Moodle
app.post('/login', (req, res) => {
  console.log('Solicitud POST a /login recibida');
  res.redirect('/lti');
});

// Ruta principal LTI
lti.onConnect(async (token, req, res) => {
  try {
    console.log('Datos LTI recibidos:', JSON.stringify(res.locals.token, null, 2));
    
    const idToken = res.locals.token;
    if (!idToken || !idToken.userInfo) {
      throw new Error('No se recibieron datos de usuario de Moodle');
    }

    const nombre = idToken.userInfo.name || 
                  [idToken.userInfo.given_name, idToken.userInfo.family_name].filter(Boolean).join(' ') || 
                  'Usuario';
    const email = idToken.userInfo.email || 'No proporcionado';
    const rol = idToken.userInfo.roles?.[0] || 'Desconocido';
    const curso = idToken.platformContext?.title || 'Curso no disponible';
    const tarea = idToken.resourceLink?.title || 'Tarea no disponible';

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Feedback Triángulo</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          .user-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px; }
          .user-info p { margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>Feedback Triángulo</h1>
        <div class="user-info">
          <h2>Bienvenido, ${nombre}!</h2>
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
      <p>${error.message}</p>
      <p>Por favor, contacta al administrador.</p>
    `);
  }
});

// Manejador de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).send(`
    <h1>Error interno del servidor</h1>
    <p>Por favor, intenta nuevamente más tarde.</p>
  `);
});

// Iniciar servidor
const start = async () => {
  try {
    await lti.deploy({ app, serverless: true });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor LTI activo en: http://localhost:${PORT}`);
      console.log(`🔑 LTI Key: LTIKEY123`);
      console.log(`📦 MongoDB`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

start();