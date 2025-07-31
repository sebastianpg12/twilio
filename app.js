// app.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/webhook', (req, res) => {
  const from = req.body.From;           // Ej: 'whatsapp:+573001234567'
  const msg = req.body.Body;            // Texto recibido
  const mediaUrl = req.body.MediaUrl0;  // Si te mandan imagen/audio/documento

  console.log("Número:", from);
  console.log("Mensaje:", msg || '[No hay texto]');
  if (mediaUrl) console.log("Multimedia recibida:", mediaUrl);

  // Aquí puedes guardar, responder, procesar el mensaje...

  res.status(200).end(); // No respondemos nada (pero puedes hacerlo)
});

app.listen(3000, () => console.log("Webhook escuchando en puerto 3000"));
