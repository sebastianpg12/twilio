// app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const path = require('path');
const { preguntarIA, respuestaInteligente } = require('./ia');

// Importar base de datos y modelos
const database = require('./database');
const ConversationModel = require('./models/Conversation');
const MessageModel = require('./models/Message');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); 

// Servir archivos estáticos para la interfaz web
app.use(express.static(path.join(__dirname, 'public')));

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

// Variable para controlar el modo de respuesta automática
let autoResponseEnabled = true; // true = respuesta automática con IA, false = solo recibir

// Inicializar base de datos
async function initializeDatabase() {
  try {
    await database.connect();
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
}

// ========== RUTA WEBHOOK - RECIBIR MENSAJES ==========

// Webhook principal - recibe mensajes de WhatsApp
app.post('/webhook', async (req, res) => {
  console.log("🔔 ===== WEBHOOK ACTIVADO =====");
  console.log("📋 Body completo recibido:", req.body);
  
  const from = req.body.From;
  const msg = req.body.Body;
  const mediaUrl = req.body.MediaUrl0;

  console.log("===== DATOS EXTRAÍDOS =====");
  console.log("📞 Número (From):", from);
  console.log("💬 Mensaje (Body):", msg || '[VACÍO]');
  console.log("🖼️ Media URL:", mediaUrl || '[NO HAY MEDIA]');
  console.log("🤖 Modo automático actual:", autoResponseEnabled);

  try {
    // Guardar conversación y mensaje en MongoDB
    if (from && msg) {
      console.log("� Guardando en base de datos...");
      
      // Crear/actualizar conversación
      await ConversationModel.upsertConversation(from);
      
      // Guardar mensaje recibido
      const savedMessage = await MessageModel.saveIncomingMessage(from, msg, mediaUrl);
      console.log("✅ Mensaje guardado con ID:", savedMessage._id);
      
      // Actualizar contador de mensajes
      await ConversationModel.incrementMessageCount(from);
    }

    // CAMINO 1: Respuesta automática con IA
    if (autoResponseEnabled && msg && msg.trim()) {
      console.log("✅ ENTRANDO A RESPUESTA AUTOMÁTICA");
      try {
        console.log("🤖 Generando respuesta automática con IA...");
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

        // Guardar mensaje enviado en BD
        await MessageModel.saveOutgoingMessage(from, respuestaIA, response.sid, 'auto');
        console.log("💾 Respuesta automática guardada en BD");

      } catch (error) {
        console.error("❌ ERROR al procesar con IA:", error);
      }
    } 
    // CAMINO 2: Solo recibir (para respuesta manual posterior)
    else {
      console.log("⏸️ MODO MANUAL - No se enviará respuesta automática");
      console.log("📥 Mensaje guardado para respuesta manual");
    }

  } catch (dbError) {
    console.error("❌ Error con base de datos:", dbError);
  }

  console.log("🏁 ===== FIN DEL WEBHOOK =====\n");
  res.status(200).end();
});

// ========== INTERFAZ WEB - RUTAS API ==========

// Ruta principal - servir interfaz web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Obtener todas las conversaciones
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await ConversationModel.getAllConversations();
    
    // Obtener último mensaje para cada conversación
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await MessageModel.getMessagesByPhone(conv.phone, 1);
        const lastMessage = messages[0] || null;
        
        return {
          ...conv,
          lastMessage: lastMessage
        };
      })
    );

    res.json({
      success: true,
      conversations: conversationsWithLastMessage
    });
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: Obtener mensajes de una conversación específica
app.get('/api/conversations/:phone/messages', async (req, res) => {
  try {
    const { phone } = req.params;
    const { page = 0, limit = 50 } = req.query;
    
    const messages = await MessageModel.getMessagesByPhone(
      phone, 
      parseInt(limit), 
      parseInt(page)
    );
    
    // Marcar mensajes como leídos
    await MessageModel.markMessagesAsRead(phone);
    
    res.json({
      success: true,
      phone: phone,
      messages: messages,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: Obtener estadísticas generales
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await MessageModel.getMessageStats();
    const totalConversations = await ConversationModel.getAllConversations();
    
    res.json({
      success: true,
      stats: {
        ...stats[0],
        totalConversations: totalConversations.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: Buscar en mensajes
app.get('/api/search', async (req, res) => {
  try {
    const { q, phone } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere parámetro de búsqueda "q"'
      });
    }
    
    const results = await MessageModel.searchMessages(q, phone);
    
    res.json({
      success: true,
      query: q,
      results: results
    });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
    // Limpiar el número de teléfono
    const cleanPhone = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    const response = await client.messages.create({
      from: 'whatsapp:+14155238886',
      body: message,
      to: cleanPhone
    });

    console.log('📤 Mensaje manual enviado. SID:', response.sid);
    
    // Guardar en base de datos
    await ConversationModel.upsertConversation(cleanPhone);
    await MessageModel.saveOutgoingMessage(cleanPhone, message, response.sid, 'manual');
    console.log('💾 Mensaje manual guardado en BD');
    
    res.json({ 
      success: true, 
      sid: response.sid,
      to: cleanPhone,
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

// Inicializar aplicación
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log("🚀 Servidor Twilio + IA + MongoDB corriendo en puerto", PORT);
    console.log("🌍 Entorno:", process.env.NODE_ENV || 'development');
    console.log("🔗 Interfaz Web:", `http://localhost:${PORT}`);
    console.log("🔗 Webhook URL:", process.env.NODE_ENV === 'production' ? 
      `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/webhook` : 
      `http://localhost:${PORT}/webhook`);
    console.log(`🤖 Modo automático: ${autoResponseEnabled ? "ACTIVADO" : "DESACTIVADO"}`);
    console.log("\n=== RUTAS DISPONIBLES ===");
    console.log("GET  / - Interfaz Web WhatsApp Business");
    console.log("GET  /api/conversations - Lista de conversaciones");
    console.log("GET  /api/conversations/:phone/messages - Mensajes de conversación");
    console.log("GET  /api/stats - Estadísticas generales");
    console.log("GET  /api/search - Buscar mensajes");
    console.log("POST /webhook - Recibe mensajes de WhatsApp");
    console.log("POST /toggle-auto-response - Activar/desactivar IA automática");
    console.log("GET  /auto-response-status - Ver estado del modo automático");
    console.log("POST /send-manual-message - Enviar mensaje manual");
    console.log("POST /send-assisted-message - Enviar mensaje con ayuda de IA");
    console.log("POST /ask-ai - Consultar IA directamente");
    console.log("GET  /health - Estado del servidor");
  });
}

// Manejar cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🔄 Cerrando servidor...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Cerrando servidor...');
  await database.close();
  process.exit(0);
});

// Iniciar servidor
startServer().catch(console.error);
