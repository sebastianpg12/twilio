// app.js - Backend para WhatsApp Business con IA y MongoDB
console.log('🔧 [SERVER.JS] Iniciando servidor...');
console.log('📂 Directorio de trabajo:', process.cwd());
console.log('🔑 Verificando variables de entorno...');

require('dotenv').config();

// Verificar variables de entorno críticas
const requiredEnvVars = ['TWILIO_SID', 'TWILIO_AUTH_TOKEN', 'OPENAI_API_KEY', 'MONGODB_URI'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars);
  console.error('🔍 Variables disponibles:', Object.keys(process.env).filter(key => key.startsWith('TWILIO') || key.startsWith('OPENAI') || key.startsWith('MONGODB')));
  process.exit(1);
} else {
  console.log('✅ Variables de entorno configuradas correctamente');
}

const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const cors = require('cors');

// Importar servicios y configuración
const database = require('./src/config/database');
const ConversationService = require('./src/services/conversationService');
const { preguntarIA, respuestaInteligente } = require('./src/services/aiService');

// Importar rutas
const conversationsRoutes = require('./src/routes/conversations');
const statsRoutes = require('./src/routes/stats');

const app = express();

// Configuración de CORS
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  'https://twilio-9ubt.onrender.com', // Tu dominio de producción
  'http://localhost:3000', // Para desarrollo local del backend
  'http://127.0.0.1:5173', // Alternativa local
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman, mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware de logging para CORS
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'No origin'}`);
  next();
}); 

// Configuración de Twilio
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

// Variable para controlar el modo de respuesta automática
let autoResponseEnabled = true;

// ========== WEBHOOK - RECIBIR MENSAJES DE WHATSAPP ==========

app.post('/webhook', async (req, res) => {
  console.log("🔔 ===== WEBHOOK ACTIVADO =====");
  console.log("📋 Body:", req.body);
  
  const from = req.body.From;
  const msg = req.body.Body;
  const mediaUrl = req.body.MediaUrl0;

  console.log("📞 De:", from);
  console.log("💬 Mensaje:", msg || '[VACÍO]');
  console.log("🤖 Modo automático:", autoResponseEnabled);

  try {
    // SIEMPRE guardar el mensaje entrante en la BD
    if (msg && msg.trim()) {
      const phoneNumber = from;
      await ConversationService.processIncomingMessage(phoneNumber, msg, mediaUrl);
      console.log("💾 Mensaje guardado en BD");
    }

    // RESPUESTA AUTOMÁTICA CON IA (si está activada)
    if (autoResponseEnabled && msg && msg.trim()) {
      console.log("🤖 Generando respuesta automática...");
      
      const respuestaIA = await respuestaInteligente(msg);
      console.log("💡 Respuesta generada:", respuestaIA);

      // Enviar respuesta
      const response = await client.messages.create({
        from: 'whatsapp:+14155238886',
        body: respuestaIA,
        to: from
      });

      // Guardar respuesta automática en BD
      await ConversationService.sendMessage(from, respuestaIA, 'ai-auto', {
        twilioSid: response.sid,
        isAiGenerated: true
      });

      console.log("✅ Respuesta automática enviada y guardada. SID:", response.sid);
    }
    
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);
  }

  console.log("🏁 ===== FIN WEBHOOK =====\n");
  res.status(200).end();
});

// ========== RUTAS API ==========

// Rutas de conversaciones
app.use('/api/conversations', conversationsRoutes);

// Rutas de estadísticas  
app.use('/api/stats', statsRoutes);

// ========== CONTROL DE MODO AUTOMÁTICO ==========

// Activar/desactivar respuestas automáticas
app.post('/api/auto-response/toggle', (req, res) => {
  const { enabled } = req.body;
  
  if (typeof enabled === 'boolean') {
    autoResponseEnabled = enabled;
  } else {
    autoResponseEnabled = !autoResponseEnabled;
  }

  console.log(`🤖 Modo automático ${autoResponseEnabled ? 'ACTIVADO' : 'DESACTIVADO'}`);

  res.json({ 
    success: true, 
    autoResponseEnabled,
    message: `Modo automático ${autoResponseEnabled ? 'ACTIVADO' : 'DESACTIVADO'}` 
  });
});

// Ver estado del modo automático
app.get('/api/auto-response/status', (req, res) => {
  res.json({
    success: true,
    autoResponseEnabled,
    status: autoResponseEnabled ? "ACTIVADO" : "DESACTIVADO"
  });
});

// ========== ENVÍO DE MENSAJES ==========

// Enviar mensaje manual
app.post('/api/send-message', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Se requiere destinatario (to) y mensaje' 
    });
  }

  try {
    const phoneNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    // Enviar con Twilio
    const response = await client.messages.create({
      from: 'whatsapp:+14155238886',
      body: message,
      to: phoneNumber
    });

    // Guardar en BD
    await ConversationService.sendMessage(phoneNumber, message, 'sent', {
      twilioSid: response.sid
    });

    console.log('📤 Mensaje manual enviado y guardado. SID:', response.sid);
    
    res.json({ 
      success: true, 
      sid: response.sid,
      to: phoneNumber,
      message,
      type: "manual"
    });
  } catch (error) {
    console.error('Error enviando mensaje manual:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Enviar mensaje con asistencia de IA
app.post('/api/send-ai-message', async (req, res) => {
  const { to, prompt, context } = req.body;

  if (!to || !prompt) {
    return res.status(400).json({ 
      success: false, 
      error: 'Se requiere destinatario (to) y prompt para la IA' 
    });
  }

  try {
    const phoneNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    // Generar mensaje con IA
    console.log("🤖 Generando mensaje con IA...");
    const mensajeGenerado = await preguntarIA(prompt, context);
    
    // Enviar con Twilio
    const response = await client.messages.create({
      from: 'whatsapp:+14155238886',
      body: mensajeGenerado,
      to: phoneNumber
    });

    // Guardar en BD
    await ConversationService.sendMessage(phoneNumber, mensajeGenerado, 'ai-assisted', {
      twilioSid: response.sid,
      isAiGenerated: true,
      aiPrompt: prompt
    });

    console.log('📤 Mensaje asistido por IA enviado y guardado. SID:', response.sid);
    
    res.json({ 
      success: true, 
      sid: response.sid,
      to: phoneNumber,
      prompt,
      generatedMessage: mensajeGenerado,
      type: "ai-assisted"
    });
  } catch (error) {
    console.error('Error enviando mensaje asistido:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ========== UTILIDADES ==========

// Estado de salud del servidor
app.get('/api/health', async (req, res) => {
  try {
    const stats = await ConversationService.getStats();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      autoResponseEnabled,
      database: 'connected',
      server: 'WhatsApp Business Backend',
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Consultar IA directamente
app.post('/api/ask-ai', async (req, res) => {
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
      question,
      answer: respuesta 
    });
  } catch (error) {
    console.error('Error consultando IA:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ========== INICIO DEL SERVIDOR ==========

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Conectar a MongoDB
    await database.connect();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log("🚀 Servidor WhatsApp Business Backend corriendo en puerto", PORT);
      console.log("🌍 Entorno:", process.env.NODE_ENV || 'development');
      console.log(`🤖 Modo automático: ${autoResponseEnabled ? "ACTIVADO" : "DESACTIVADO"}`);
      console.log("💾 Base de datos: MongoDB conectada");
      console.log("\n=== RUTAS API DISPONIBLES ===");
      console.log("POST /webhook - Webhook de Twilio");
      console.log("GET  /api/conversations - Listar conversaciones");
      console.log("GET  /api/conversations/:phone - Historial de conversación");
      console.log("POST /api/conversations/:phone/read - Marcar como leída");
      console.log("GET  /api/stats - Estadísticas");
      console.log("POST /api/send-message - Enviar mensaje manual");
      console.log("POST /api/send-ai-message - Enviar con IA");
      console.log("GET  /api/auto-response/status - Estado automático");
      console.log("POST /api/auto-response/toggle - Cambiar modo automático");
      console.log("GET  /api/health - Estado del servidor");
      console.log("POST /api/ask-ai - Consultar IA directamente");
    });
    
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await database.disconnect();
  process.exit(0);
});

startServer();
