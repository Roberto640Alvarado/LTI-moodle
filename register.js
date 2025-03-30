require('dotenv').config()
const lti = require('ltijs').Provider

const PLATFORM_URL = 'https://pruebapilotouca.moodlecloud.com'
const CLIENT_ID = 'UHNXdVQg11yCMDR'
const AUTH_URL = 'https://pruebapilotouca.moodlecloud.com/mod/lti/auth.php'
const TOKEN_URL = 'https://pruebapilotouca.moodlecloud.com/mod/lti/token.php'
const KEYSET_URL = 'https://pruebapilotouca.moodlecloud.com/mod/lti/certs.php'

lti.setup('LTIKEY123', {
  url: process.env.MONGO_URL
})

const register = async () => {
  await lti.deploy({ serverless: true })

  await lti.registerPlatform({
    url: PLATFORM_URL,
    name: 'MoodleCloud',
    clientId: CLIENT_ID,
    authenticationEndpoint: AUTH_URL,
    accesstokenEndpoint: TOKEN_URL,
    authConfig: {
      method: 'JWK_SET',
      key: KEYSET_URL
    }
  })

  console.log('✅ Moodle registrado correctamente como plataforma.')
}

register()

