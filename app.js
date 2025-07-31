// app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const { preguntarIA, respuestaInteligente } = require('./ia');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); 
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

// Variable para controlar el modo de respuesta automática
let autoResponseEnabled = true; // true = respuesta automática con IA, false = solo recibir

// ========== RUTA WEBHOOK - RECIBIR MENSAJES ==========

// Webhook principal - recibe mensajes de WhatsApp
app.post('/webhook', async (req, res) => {
  console.log("🔔 ===== WEBHOOK ACTIVADO =====");
  console.log("📋 Body completo recibido:", req.body);
  console.log("📋 Headers:", req.headers);
  
  const from = req.body.From;
  const msg = req.body.Body;
  const mediaUrl = req.body.MediaUrl0;

  console.log("===== DATOS EXTRAÍDOS =====");
  console.log("📞 Número (From):", from);
  console.log("💬 Mensaje (Body):", msg || '[VACÍO]');
  console.log("🖼️ Media URL:", mediaUrl || '[NO HAY MEDIA]');
  console.log("🤖 Modo automático actual:", autoResponseEnabled);
  
  // Verificaciones paso a paso
  console.log("🔍 ===== VERIFICACIONES =====");
  console.log("1. ¿autoResponseEnabled está true?", autoResponseEnabled);
  console.log("2. ¿msg existe?", !!msg);
  console.log("3. ¿msg tiene contenido después de trim?", msg ? !!msg.trim() : false);
  console.log("4. ¿Condición completa se cumple?", (autoResponseEnabled && msg && msg.trim()));

  // CAMINO 1: Respuesta automática con IA
  if (autoResponseEnabled && msg && msg.trim()) {
    console.log("✅ ENTRANDO A RESPUESTA AUTOMÁTICA");
    try {
      console.log("🤖 Generando respuesta automática con IA...");
      console.log("📝 Mensaje a procesar:", `"${msg}"`);
      
      const respuestaIA = await respuestaInteligente(msg);
      console.log("💡 Respuesta generada:", respuestaIA);

      // Enviar respuesta automática
      console.log("📤 Enviando respuesta a:", from);
      const response = await client.messages.create({
        from: 'whatsapp:+14155238886',
        body: respuestaIA,
        to: from
      });

      console.log("✅ Respuesta automática enviada exitosamente!");
      console.log("📧 SID del mensaje:", response.sid);
    } catch (error) {
      console.error("❌ ERROR al procesar con IA:");
      console.error("Error completo:", error);
      console.error("Stack trace:", error.stack);
    }
  } 
  // CAMINO 2: Solo recibir (para respuesta manual posterior)
  else {
    console.log("⏸️ MODO MANUAL - No se enviará respuesta automática");
    console.log("📥 Mensaje guardado para respuesta manual");
    
    if (!autoResponseEnabled) {
      console.log("🔒 Razón: Modo automático DESACTIVADO");
    }
    if (!msg) {
      console.log("🔒 Razón: No hay mensaje de texto");
    }
    if (msg && !msg.trim()) {
      console.log("🔒 Razón: Mensaje está vacío después de trim");
    }
  }

  console.log("🏁 ===== FIN DEL WEBHOOK =====\n");
  res.status(200).end();
});

// ========== CONTROL DE MODO AUTOMÁTICO ==========

// Activar/desactivar respuestas automáticas
app.post('/toggle-auto-response', (req, res) => {
  const { enabled } = req.body;
  
  if (typeof enabled === 'boolean') {
    autoResponseEnabled = enabled;
  } else {
    autoResponseEnabled = !autoResponseEnabled; // Toggle
  }

  res.json({ 
    success: true, 
    autoResponseEnabled: autoResponseEnabled,
    message: autoResponseEnabled ? 
      "Respuesta automática ACTIVADA" : 
      "Respuesta automática DESACTIVADA" 
  });
});

// Obtener estado actual del modo automático
app.get('/auto-response-status', (req, res) => {
  res.json({
    autoResponseEnabled: autoResponseEnabled,
    status: autoResponseEnabled ? "ACTIVADO" : "DESACTIVADO"
  });
});

// ========== RESPUESTA MANUAL ==========

// Enviar mensaje manual a un número específico
app.post('/send-manual-message', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Se requiere número de destino (to) y mensaje' 
    });
  }

  try {
    const response = await client.messages.create({
      from: 'whatsapp:+14155238886',
      body: message,
      to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    });

    console.log('📤 Mensaje manual enviado. SID:', response.sid);
    res.json({ 
      success: true, 
      sid: response.sid,
      to: to,
      message: message,
      type: "manual"
    });
  } catch (error) {
    console.error('Error al enviar mensaje manual:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Enviar mensaje manual CON asistencia de IA
app.post('/send-assisted-message', async (req, res) => {
  const { to, prompt, context } = req.body;

  if (!to || !prompt) {
    return res.status(400).json({ 
      success: false, 
      error: 'Se requiere número de destino (to) y prompt para la IA' 
    });
  }

  try {
    // Generar mensaje con IA
    console.log("🤖 Generando mensaje asistido por IA...");
    const mensajeGenerado = await preguntarIA(prompt, context);
    
    // Enviar el mensaje generado
    const response = await client.messages.create({
      from: 'whatsapp:+14155238886',
      body: mensajeGenerado,
      to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    });

    console.log('📤 Mensaje asistido por IA enviado. SID:', response.sid);
    res.json({ 
      success: true, 
      sid: response.sid,
      to: to,
      prompt: prompt,
      generatedMessage: mensajeGenerado,
      type: "ai-assisted"
    });
  } catch (error) {
    console.error('Error al enviar mensaje asistido:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ========== UTILIDADES ==========

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    autoResponseEnabled: autoResponseEnabled,
    server: 'Twilio + IA Bot'
  });
});

// Ruta para hacer preguntas directas a la IA (para testing)
app.post('/ask-ai', async (req, res) => {
  const { question, context } = req.body;

  if (!question) {
    return res.status(400).json({ 
      success: false, 
      error: 'Se requiere una pregunta' 
    });
  }

  try {
    const respuesta = await preguntarIA(question, context);
    res.json({ 
      success: true, 
      question: question,
      answer: respuesta 
    });
  } catch (error) {
    console.error('Error en /ask-ai:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor Twilio + IA corriendo en puerto", PORT);
  console.log("🌍 Entorno:", process.env.NODE_ENV || 'development');
  console.log("🔗 Webhook URL:", process.env.NODE_ENV === 'production' ? 
    `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/webhook` : 
    `http://localhost:${PORT}/webhook`);
  console.log(`🤖 Modo automático: ${autoResponseEnabled ? "ACTIVADO" : "DESACTIVADO"}`);
  console.log("\n=== RUTAS DISPONIBLES ===");
  console.log("POST /webhook - Recibe mensajes de WhatsApp");
  console.log("POST /toggle-auto-response - Activar/desactivar IA automática");
  console.log("GET  /auto-response-status - Ver estado del modo automático");
  console.log("POST /send-manual-message - Enviar mensaje manual");
  console.log("POST /send-assisted-message - Enviar mensaje con ayuda de IA");
  console.log("POST /ask-ai - Consultar IA directamente");
  console.log("GET  /health - Estado del servidor");
});
