require('dotenv').config()
const lti = require('ltijs').Provider

//Inicialización del servidor LTI
lti.setup(
  'LTIKEY123', 
  {
    url: process.env.MONGO_URL
  },
  {
    appUrl: '/', 
    loginUrl: '/login',
    cookies: {
      secure: true,
      sameSite: 'None'
    }
  }
)

//Manejador de conexión LTI
lti.onConnect(async (token, req, res) => {
  const idToken = res.locals.token
  const nombre = idToken.userInfo.name
  const rol = idToken.userInfo.roles?.[0] || 'Desconocido'
  const curso = idToken.platformContext.title
  const tarea = idToken.resourceLink.title
  const email = idToken.userInfo.email

  return res.send(`
    <h1>Hola, ${nombre}!</h1>
    <p>Correo: ${email}</p>
    <p>Tu rol es: ${rol}</p>
    <p>Estás en el curso: ${curso}</p>
    <p>Entraste desde la tarea: ${tarea}</p>
  `)
})

// Inicia el servidor LTI
lti.deploy({ serverless: true }).then(() => {
  console.log('Servidor LTI activo en Render.')
})
