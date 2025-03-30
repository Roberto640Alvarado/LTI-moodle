const dotenv = require('dotenv');
const lti = require('ltijs').Provider;
const express = require('express');
const path = require('path');

dotenv.config();

const setupLTI = async (app) => {
  try {
    // Verificar variables de entorno
    if (!process.env.MONGO_URL) throw new Error('Falta MONGO_URL en .env');
    if (!process.env.LTI_KEY) throw new Error('Falta LTI_KEY en .env');

    // Configurar LTI
    const provider = lti.setup(
      process.env.LTI_KEY,
      { 
        url: process.env.MONGO_URL,
      },
      {
        appRoute: '/lti',
        loginRoute: '/login',  // Esta ruta debe coincidir con la de Moodle
        cookies: { 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'None' 
        },
        devMode: process.env.NODE_ENV !== 'production'
      }
    );

    // Middleware para parsear solicitudes POST
    app.use(express.urlencoded({ extended: true }));

    // 1. Primero desplegar
    await provider.deploy({ app, serverless: true });

    // 2. Manejar ruta /login explícitamente
    app.post('/login', (req, res, next) => {
      console.log('Solicitud POST a /login recibida');
      next(); // Pasar al manejador LTI
    });

    // 3. Registrar plataforma Moodle
    await provider.registerPlatform({
      url: 'https://pruebapilotouca.moodlecloud.com',
      name: 'MoodleCloud',
      clientId: process.env.CLIENT_ID || 'UHNXdVQg11yCMDR',
      authenticationEndpoint: 'https://pruebapilotouca.moodlecloud.com/mod/lti/auth.php',
      accesstokenEndpoint: 'https://pruebapilotouca.moodlecloud.com/mod/lti/token.php',
      authConfig: { 
        method: 'JWK_SET',
        key: 'https://pruebapilotouca.moodlecloud.com/mod/lti/certs.php'
      }
    });

    // 4. Configurar manejador LTI
    provider.onConnect(async (token, req, res) => {
      try {
        const userData = {
          nombre: token.userInfo?.name || 'Usuario',
          email: token.userInfo?.email || 'No proporcionado',
          rol: token.userInfo?.roles?.[0] || 'Desconocido'
        };

        res.send(`
          <h1>Bienvenido ${userData.nombre}</h1>
          <p>Email: ${userData.email}</p>
          <p>Rol: ${userData.rol}</p>
        `);
      } catch (error) {
        console.error('Error en LTI:', error);
        res.status(500).send('Error al cargar los datos');
      }
    });

    console.log('✅ LTI configurado correctamente');
    console.log(`🔑 LTI Key: ${process.env.LTI_KEY}`);
    console.log(`🌐 Login URL: https://iti-moodle.onrender.com/login`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
};

module.exports = setupLTI;