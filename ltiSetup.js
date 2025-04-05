const dotenv = require('dotenv')
const mongoose = require('mongoose');
const marked = require('marked');
const Feedback = require('./models/Feedback'); //
const lti = require('ltijs').Provider

dotenv.config()

const setupLTI = async (app) => {
  await lti.setup(process.env.LTI_KEY,
    { url: process.env.MONGO_URL },
    {
      appRoute: '/',
      loginRoute: '/login',
      cookies: { secure: false, sameSite: '' },
      devMode: true
    }
  )

  await mongoose.connect(process.env.FEEDBACK_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('✅ Conectado a MongoDB para retroalimentaciones');
  
  

  lti.onConnect(async (token, req, res) => {
    const name = token.userInfo?.name || 'Nombre no disponible'
    const email = token.userInfo?.email || 'Correo no disponible'
    const roles = token.platformContext?.roles || []
    const course = token.platformContext?.context?.title || 'Curso desconocido'
    const assignment = token.platformContext?.resource?.title || 'Actividad desconocida'

    const feedbackData = await Feedback.findOne({ email, task: assignment });

    let feedbackHTML = `<p><em>No se encontró retroalimentación para esta tarea.</em></p>`;
    let gradeHTML = `<p><em>No calificado aún.</em></p>`;

    // Roles legibles
    const readableRoles = roles.map(r => {
      if (r.includes('#Instructor')) return 'Instructor'
      if (r.includes('#Learner')) return 'Estudiante'
      if (r.includes('#Administrator')) return 'Administrador'
      return r
    }).join(', ')

    if (feedbackData) {
      feedbackHTML = marked.parse(feedbackData.feedback || '');
      gradeHTML = `<p><strong>🎯 Nota:</strong> ${feedbackData.grade || 'Sin nota'}</p>`;
    }

    res.send(`
      <html>
        <head>
          <title>Retroalimentación</title>
          <style>
            body {
              font-family: sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 2rem;
              display: flex;
              justify-content: center;
            }
            .container {
              background: #fff;
              padding: 2rem 3rem;
              border-radius: 12px;
              box-shadow: 0 0 12px rgba(0,0,0,0.1);
              max-width: 800px;
              width: 100%;
            }
            h1 {
              text-align: center;
              color: #333;
            }
            .markdown-body p {
              margin: 0.5rem 0;
            }
            .markdown-body pre {
              background: #eee;
              padding: 0.75rem;
              border-radius: 5px;
              overflow-x: auto;
            }
            .markdown-body code {
              background: #eee;
              padding: 0.2rem 0.4rem;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📋 Retroalimentación</h1>
            <p><strong>👤 Nombre:</strong> ${name}</p>
            <p><strong>📧 Correo:</strong> ${email}</p>
            <p><strong>📝 Actividad:</strong> ${assignment}</p>
            <p><strong>🏫 Curso:</strong> ${course}</p>
            <p><strong>🧑‍💼 Rol:</strong> ${readableRoles}</p>
            ${gradeHTML}
            <hr/>
            <div class="markdown-body">
              ${feedbackHTML}
            </div>
          </div>
        </body>
      </html>
    `);
  })

   //await lti.deploy({ serverless: true, app })
   await lti.deploy({ port: 3005 })

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
 
 
 