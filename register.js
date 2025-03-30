require('dotenv').config();
const lti = require('ltijs').Provider;

// Configuración de la plataforma Moodle
const PLATFORM_URL = 'https://pruebapilotouca.moodlecloud.com';
const CLIENT_ID = 'UHNXdVQg11yCMDR';
const AUTH_URL = 'https://pruebapilotouca.moodlecloud.com/mod/lti/auth.php';
const TOKEN_URL = 'https://pruebapilotouca.moodlecloud.com/mod/lti/token.php';
const KEYSET_URL = 'https://pruebapilotouca.moodlecloud.com/mod/lti/certs.php';

// Inicializar LTI con MongoDB
lti.setup('LTIKEY123', {
  url: process.env.MONGO_URL,
});

const register = async () => {
  try {
    await lti.deploy({ serverless: true });

    // Registrar plataforma con configuración mejorada
    await lti.registerPlatform({
      url: PLATFORM_URL,
      name: 'MoodleCloud Pilot',
      clientId: CLIENT_ID,
      authenticationEndpoint: AUTH_URL,
      accesstokenEndpoint: TOKEN_URL,
      authConfig: {
        method: 'JWK_SET',
        key: KEYSET_URL
      },
      // Configuración adicional importante
      active: true,
      customFields: {
        custom_userdata: '$User.username' 
      }
    });

    console.log('✅ Moodle registrado correctamente como plataforma.');
  } catch (error) {
    console.error('❌ Error al registrar la plataforma:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    process.exit(1);
  }
};

register();
