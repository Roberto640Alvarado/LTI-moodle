const dotenv = require('dotenv');
const lti = require('ltijs').Provider;
const express = require('express');
const path = require('path');

dotenv.config();

const setupLTI = async (app) => {
  try {
    // Verificar variables de entorno requeridas
    if (!process.env.MONGO_URL) {
      throw new Error('La variable MONGO_URL no está configurada en .env');
    }
    if (!process.env.LTI_KEY) {
      throw new Error('La variable LTI_KEY no está configurada en .env');
    }

    // Configuración LTI con MongoDB
    const provider = lti.setup(
      process.env.LTI_KEY,
      { 
        url: process.env.MONGO_URL,
      },
      {
        appRoute: '/lti',
        loginRoute: '/login',
        cookies: { 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'None' 
        },
        devMode: process.env.NODE_ENV !== 'production',
        staticPath: path.join(__dirname, '../public')
      }
    );

    // Middleware para parsear solicitudes
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Primero: Desplegar la aplicación
    await provider.deploy({ 
      app,
      serverless: true,
      silent: false
    });

    // Segundo: Registrar la plataforma Moodle
    const platformConfig = {
      url: 'https://pruebapilotouca.moodlecloud.com',
      name: 'MoodleCloudUCA',
      clientId: process.env.CLIENT_ID || 'UHNXdVQg11yCMDR',
      authenticationEndpoint: 'https://pruebapilotouca.moodlecloud.com/mod/lti/auth.php',
      accesstokenEndpoint: 'https://pruebapilotouca.moodlecloud.com/mod/lti/token.php',
      authConfig: {
        method: 'JWK_SET',
        key: 'https://pruebapilotouca.moodlecloud.com/mod/lti/certs.php'
      }
    };

    await provider.registerPlatform(platformConfig);

    // Tercero: Configurar el handler LTI
    provider.onConnect(async (token, req, res) => {
      try {
        const userData = {
          nombre: token.userInfo?.name || 'Usuario',
          email: token.userInfo?.email || 'No proporcionado',
          rol: token.userInfo?.roles?.[0] || 'Desconocido',
          curso: token.platformContext?.title || 'Curso no disponible',
          tarea: token.resourceLink?.title || 'Tarea no disponible'
        };

        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Datos del Usuario LTI</title>
            <style>
              body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
              .user-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px; }
              .user-info p { margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>Información del Usuario</h1>
            <div class="user-info">
              <h2>Bienvenido, ${userData.nombre}!</h2>
              <p><strong>Rol:</strong> ${userData.rol}</p>
              <p><strong>Email:</strong> ${userData.email}</p>
              <p><strong>Curso:</strong> ${userData.curso}</p>
              <p><strong>Tarea:</strong> ${userData.tarea}</p>
              <p><small>ID de usuario: ${token.userInfo?.id || 'N/A'}</small></p>
            </div>
          </body>
          </html>
        `);
      } catch (error) {
        console.error('Error en onConnect:', error);
        res.status(500).send(`
          <h1>Error</h1>
          <p>No se pudieron obtener los datos del usuario.</p>
          <p>${error.message}</p>
        `);
      }
    });

    console.log('✅ Configuración LTI completada correctamente');
    console.log('🔑 Client ID:', platformConfig.clientId);
    console.log('🌐 LTI Key:', process.env.LTI_KEY);
    console.log('🗄️ MongoDB URL:', process.env.MONGO_URL);
    console.log('🚀 Endpoints:');
    console.log('   POST /login');
    console.log('   POST /lti');

    return provider;

  } catch (error) {
    console.error('❌ Error al configurar LTI:', error);
    throw error;
  }
};

module.exports = setupLTI;