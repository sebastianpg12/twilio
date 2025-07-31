// app-ia-only.js - Servidor solo para probar la IA sin Twilio
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { preguntarIA, responderMensajeWhatsApp, respuestaInteligente } = require('./ia');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Ruta para hacer pregunta directa a la IA
app.post('/ask-ai', async (req, res) => {
  const { question, context } = req.body;

  if (!question) {
    return res.status(400).json({ success: false, error: 'Se requiere una pregunta' });
  }

  try {
    console.log(`🤖 Pregunta recibida: ${question}`);
    const respuesta = await preguntarIA(question, context);
    console.log(`✅ Respuesta generada: ${respuesta}`);
    res.json({ success: true, respuesta });
  } catch (error) {
    console.error('❌ Error al consultar IA:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta para simular respuesta de WhatsApp
app.post('/whatsapp-response', async (req, res) => {
  const { mensaje, telefono } = req.body;

  if (!mensaje) {
    return res.status(400).json({ success: false, error: 'Se requiere un mensaje' });
  }

  try {
    console.log(`📱 Mensaje de WhatsApp simulado: ${mensaje}`);
    const respuesta = await responderMensajeWhatsApp(mensaje, telefono);
    console.log(`💬 Respuesta para WhatsApp: ${respuesta}`);
    res.json({ success: true, respuesta });
  } catch (error) {
    console.error('❌ Error al generar respuesta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta para respuesta inteligente
app.post('/smart-response', async (req, res) => {
  const { mensaje } = req.body;

  if (!mensaje) {
    return res.status(400).json({ success: false, error: 'Se requiere un mensaje' });
  }

  try {
    console.log(`🧠 Generando respuesta inteligente para: ${mensaje}`);
    const respuesta = await respuestaInteligente(mensaje);
    console.log(`🎯 Respuesta inteligente: ${respuesta}`);
    res.json({ success: true, respuesta });
  } catch (error) {
    console.error('❌ Error en respuesta inteligente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta de estado
app.get('/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor de IA funcionando correctamente',
    endpoints: [
      'POST /ask-ai - Pregunta directa a la IA',
      'POST /whatsapp-response - Respuesta para WhatsApp',
      'POST /smart-response - Respuesta inteligente',
      'GET /status - Estado del servidor'
    ]
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de IA corriendo en puerto ${PORT}`);
  console.log(`🔗 Pruébalo en: http://localhost:${PORT}/status`);
  console.log(`\n📚 Endpoints disponibles:`);
  console.log(`   POST /ask-ai`);
  console.log(`   POST /whatsapp-response`);
  console.log(`   POST /smart-response`);
  console.log(`   GET /status`);
});
