require('dotenv').config()
const express = require('express')
const path = require('path')
const lti = require('ltijs').Provider

const app = express()

// Inicializar ltijs con Mongo
lti.setup('LTIKEY123', {
  url: process.env.MONGO_URL
}, {
  staticPath: path.join(__dirname, '/public'),
  cookies: {
    secure: true,
    sameSite: 'None'
  }
})

// Ruta al conectarse desde Moodle
lti.onConnect(async (token, req, res) => {
  const idToken = res.locals.token
  const nombre = idToken.userInfo.name
  const rol = idToken.userInfo.roles?.[0] || 'Desconocido'
  const email = idToken.userInfo.email
  const curso = idToken.platformContext.title
  const tarea = idToken.resourceLink.title

  return res.send(`
    <h1>Hola, ${nombre}!</h1>
    <p>Tu rol es: ${rol}</p>
    <p>Correo: ${email}</p>
    <p>Estás en el curso: ${curso}</p>
    <p>Entraste desde la tarea: ${tarea}</p>
  `)
})

// Integrar Express y ltijs
const setup = async () => {
  await lti.deploy({ serverless: false, app })

  const PORT = 4000
  app.listen(PORT, () => {
    console.log(`🚀 Servidor LTI escuchando en el puerto ${PORT}`)
  })
}

setup()
