const express = require('express');
const setupLTI = require('./ltiSetup');

const app = express();
app.set('trust proxy', 1);

setupLTI(app)
  .then(() => {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al iniciar la aplicación:', err);
    process.exit(1);
  });