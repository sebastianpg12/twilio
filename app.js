// app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Para recibir JSON en POST
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);


// Ruta para recibir mensajes de Twilio
app.post('/webhook', (req, res) => {
  const from = req.body.From;
  const msg = req.body.Body;
  const mediaUrl = req.body.MediaUrl0;

  console.log("Número:", from);
  console.log("Mensaje:", msg || '[No hay texto]');
  if (mediaUrl) console.log("Multimedia recibida:", mediaUrl);

  res.status(200).end();
});

// Ruta para enviar mensaje manual
app.post('/send-message', async (req, res) => {
  const { to, body } = req.body;

  try {
    const message = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${to}`,
      body: body
    });

    console.log('Mensaje enviado. SID:', message.sid);
    res.json({ success: true, sid: message.sid });
  } catch (err) {
    console.error('Error al enviar mensaje:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo en puerto", PORT));
