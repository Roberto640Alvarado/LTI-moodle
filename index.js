const express = require('express')
const cors = require('cors')
const setupLTI = require('./ltiSetup');

const app = express()

app.use(cors())

setupLTI(app)
  .then(() => {
    console.log('✅ LTI configurado correctamente');
  })
  .catch((err) => {
    console.error('❌ Error al configurar LTI:', err.message, err);
  });

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto:${PORT}`);
});
