require('dotenv').config();
const express = require('express');
const path = require('path');
const lti = require('ltijs').Provider;

const app = express();
app.set('trust proxy', 1);

// Configuración crítica para procesar solicitudes POST
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Configuración LTI mejorada
lti.setup('UHNXdVQg11yCMDR', {
  url: process.env.MONGO_URL,
}, {
  staticPath: path.join(__dirname, '/public'),
  cookies: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  },
  devMode: process.env.NODE_ENV !== 'production'
});

// Middleware para logs detallados
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Ruta POST /login - Manejo mejorado
app.post('/login', (req, res) => {
  try {
    console.log('Datos recibidos en /login:', req.body);
    
    // Validación básica de los parámetros LTI
    if (!req.body.iss || !req.body.client_id) {
      return res.status(400).send('Parámetros LTI faltantes');
    }

    // Redirigir a la ruta LTI principal
    return res.redirect(307, '/lti');
  } catch (error) {
    console.error('Error en /login:', error);
    return res.status(500).send('Error interno del servidor');
  }
});

// Ruta principal LTI con manejo de errores robusto
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

    return res.send(`
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
    return res.status(500).send(`
      <h1>Error en la herramienta LTI</h1>
      <p>Por favor, inténtalo de nuevo o contacta al administrador.</p>
    `);
  }
});

// Configuración de rutas LTI
app.use('/lti', lti.app);

// Ruta para el keyset JWK
app.get('/.well-known/jwks.json', (req, res) => {
  try {
    return res.json(lti.provider.keyset);
  } catch (error) {
    console.error('Error al generar JWKS:', error);
    return res.status(500).json({ error: 'Error al generar keyset' });
  }
});

// Manejador de errores global mejorado
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  return res.status(500).send(`
    <h1>Error interno del servidor</h1>
    <p>Por favor, inténtalo de nuevo más tarde.</p>
  `);
});

// Iniciar servidor con validación
const start = async () => {
  try {
    await lti.deploy({ app, serverless: true });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor LTI activo en puerto ${PORT}`);
      console.log('🔑 Client ID:', 'UHNXdVQg11yCMDR');
      console.log('🔗 Initiate login URL:', 'https://lti-moodle.onrender.com/login');
      console.log('🔄 Redirection URI:', 'https://lti-moodle.onrender.com/lti');
      console.log('🔐 JWKS Endpoint:', 'https://lti-moodle.onrender.com/.well-known/jwks.json');
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

start();