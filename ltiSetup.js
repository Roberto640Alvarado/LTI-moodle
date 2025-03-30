const dotenv = require('dotenv')
const lti = require('ltijs').Provider

dotenv.config()

const setupLTI = async (app) => {
  await lti.setup(process.env.LTI_KEY,
    { url: process.env.MONGO_URL },
    {
      appRoute: '/',
      loginRoute: '/login',
      cookies: { secure: true, sameSite: 'None' },
      devMode: false
    }
  )
  

  lti.onConnect(async (token, req, res) => {

    res.send(`
      <html>
        <body style="font-family: sans-serif">
          <h1>Hola ${token.user}</h1>
          <p><strong>Repositorio:</strong> </p>
          <pre>${'No se encontró retroalimentación'}</pre>
        </body>
      </html>
    `)
  })

  await lti.deploy({ serverless: true, app })

  const platformConfig = {
    url: 'https://pruebapilotouca.moodlecloud.com',
    name: 'MoodleCloudUCA',
    clientId: 'UHNXdVQg11yCMDR',
    authenticationEndpoint: 'https://pruebapilotouca.moodlecloud.com/mod/lti/auth.php',
    accesstokenEndpoint: 'https://pruebapilotouca.moodlecloud.com/mod/lti/token.php',
    authConfig: {
      method: 'JWK_SET',
      key: 'https://pruebapilotouca.moodlecloud.com/mod/lti/certs.php'
    }
  }
  

  await lti.registerPlatform(platformConfig) 

  console.log('✅ Plataforma registrada correctamente:', platformConfig.name)
}

module.exports = setupLTI
