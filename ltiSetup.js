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
    const name = token.userInfo?.name || 'Nombre no disponible'
    const email = token.userInfo?.email || 'Correo no disponible'
    const roles = token.platformContext?.roles || []
    const course = token.platformContext?.context?.title || 'Curso desconocido'
    const assignment = token.platformContext?.resource?.title || 'Actividad desconocida'

    // Roles legibles
    const readableRoles = roles.map(r => {
      if (r.includes('#Instructor')) return 'Instructor'
      if (r.includes('#Learner')) return 'Estudiante'
      if (r.includes('#Administrator')) return 'Administrador'
      return r
    }).join(', ')

    res.send(`
      <html>
  <head>
    <title>Datos del visitante</title>
    <style>
      body {
        font-family: sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #f4f4f4;
        margin: 0;
      }

      .container {
        background-color: white;
        padding: 2rem 3rem;
        border-radius: 12px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        max-width: 600px;
        width: 100%;
      }

      h1 {
        text-align: center;
        color: #333;
      }

      .info p {
        font-size: 1.1rem;
        margin: 0.7rem 0;
      }

      .info strong {
        color: #444;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>📋 Datos del visitante</h1>
      <div class="info">
        <p><strong>👤 Nombre:</strong> ${name}</p>
        <p><strong>📧 Correo:</strong> ${email}</p>
        <p><strong>🧑‍💼 Roles:</strong> ${readableRoles}</p>
        <p><strong>🏫 Curso:</strong> ${course}</p>
        <p><strong>📝 Tarea:</strong> ${assignment}</p>
      </div>
    </div>
  </body>
</html>

    `)
  })

   //await lti.deploy({ serverless: true, app })
   await lti.deploy({ serverless: true, app })

   const platformConfig = {
     url: 'https://pruebapilotouca.moodlecloud.com',
     name: 'MoodleCloudUCA',
     clientId: 'UHNXdVQg11yCMDR',
     authenticationEndpoint: 'https://pruebapilotouca.moodlecloud.com/mod/lti/auth.php',
     accesstokenEndpoint: 'https://pruebapilotouca.moodlecloud.com/mod/lti/token.php',
     authConfig: {
       method: 'JWK_SET',
       key: 'https://pruebapilotouca.moodlecloud.com/mod/lti/certs.php' // ✅ CORRECTO
     }
   }
   
 
   await lti.registerPlatform(platformConfig) 
 
   console.log('✅ Plataforma registrada correctamente:', platformConfig.name)
 }
 
 module.exports = setupLTI
 
 
 