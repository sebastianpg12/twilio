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
const Client = require('./src/models/Client');

// Importar rutas
const conversationsRoutes = require('./src/routes/conversations');
const statsRoutes = require('./src/routes/stats');
const clientsRoutes = require('./src/routes/clients');
const dashboardRoutes = require('./src/routes/dashboard');
const setupRoutes = require('./src/routes/setup');
const adminRoutes = require('./src/routes/admin');

const app = express();

// Configuración de CORS
const allowedOrigins = [
  'http://localhost:3000',      // Backend local
  'http://localhost:5173',      // Vite dev server por defecto
  'http://localhost:5174',      // Vite dev server alternativo
  'http://localhost:8080',      // Webpack dev server
  'http://127.0.0.1:5173',      // Alternativa local IP
  'http://127.0.0.1:5174',      // Alternativa local IP
  'https://twilio-9ubt.onrender.com', // Producción
];

// Agregar orígenes desde variables de entorno
if (process.env.ALLOWED_ORIGINS) {
  const envOrigins = process.env.ALLOWED_ORIGINS.split(',');
  allowedOrigins.push(...envOrigins);
}

const corsOptions = {
  origin: function (origin, callback) {
    console.log('🌐 CORS request from origin:', origin || 'NO ORIGIN');
    
    // Permitir requests sin origin (Postman, mobile apps, curl, etc.)
    if (!origin) {
      console.log('✅ CORS: Allowing request without origin');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('🚫 CORS: Origin blocked:', origin);
      console.log('📋 CORS: Allowed origins:', allowedOrigins);
      callback(new Error(`CORS blocked: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200 // Para soportar browsers legacy
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware de logging para CORS y requests
app.use((req, res, next) => {
  const origin = req.get('Origin');
  const method = req.method;
  const path = req.path;
  
  console.log(`🌐 ${method} ${path} - Origin: ${origin || 'No origin'}`);
  
  // Log específico para OPTIONS (preflight requests)
  if (method === 'OPTIONS') {
    console.log('🔍 CORS Preflight request detected');
    console.log('📋 Request headers:', req.headers);
  }
  
  next();
}); 

// Configuración de Twilio
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';
const client = require('twilio')(accountSid, authToken);

console.log('📞 Número de WhatsApp configurado:', twilioPhoneNumber);

// Variable para controlar el modo de respuesta automática
let autoResponseEnabled = true;

// ========== WEBHOOK - RECIBIR MENSAJES DE WHATSAPP ==========

app.post('/webhook', async (req, res) => {
  console.log("🔔 ===== WEBHOOK ACTIVADO =====");
  console.log("📋 Body:", req.body);
  
  const from = req.body.From;
  const msg = req.body.Body;
  const mediaUrl = req.body.MediaUrl0;
  const to = req.body.To; // Número de Twilio que recibió el mensaje

  console.log("📞 De:", from);
  console.log("� A:", to);
  console.log("💬 Mensaje:", msg || '[VACÍO]');

  try {
    // SIEMPRE guardar el mensaje entrante en la BD con sistema multi-cliente
    if (msg && msg.trim()) {
      const result = await ConversationService.processIncomingMessage(to, from, msg, mediaUrl);
      const { client, conversation } = result;
      console.log(`💾 Mensaje guardado para cliente: ${client.name} (${client._id})`);

      // RESPUESTA AUTOMÁTICA CON IA (verificar configuraciones del cliente y conversación)
      const aiEnabled = await ConversationService.isAIEnabled(conversation, client);
      const autoResponseEnabled = await ConversationService.isAutoResponseEnabled(conversation, client);
      
      console.log(`🤖 IA habilitada: ${aiEnabled}, Auto-respuesta: ${autoResponseEnabled}`);

      if (aiEnabled && autoResponseEnabled && msg.trim()) {
        console.log("🤖 Generando respuesta automática...");
        
        const respuestaIA = await respuestaInteligente(msg);
        console.log("💡 Respuesta generada:", respuestaIA);

        // Enviar respuesta usando las credenciales del cliente
        const twilioClient = require('twilio')(client.twilioSid, client.twilioAuthToken);
        const response = await twilioClient.messages.create({
          from: client.twilioPhoneNumber,
          body: respuestaIA,
          to: from
        });

        // Guardar respuesta automática en BD
        await ConversationService.sendMessage(from, client._id, respuestaIA, 'ai-auto', {
          twilioSid: response.sid,
          isAiGenerated: true
        });

        console.log("✅ Respuesta automática enviada y guardada. SID:", response.sid);
      }
    }
    
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);
  }

  console.log("🏁 ===== FIN WEBHOOK =====\n");
  res.status(200).end();
});

// ========== RUTAS API ==========

// Rutas de administración general
app.use('/api/admin', adminRoutes);

// Rutas de setup y administración
app.use('/api/setup', setupRoutes);

// Rutas de clientes (multi-cliente)
// app.use('/api/clients', clientsRoutes); // TEMP: Comentado para debug

// Rutas de dashboard por cliente
app.use('/api/clients', dashboardRoutes);

// Rutas de conversaciones (mantener compatibilidad)
app.use('/api/conversations', conversationsRoutes);

// Rutas de estadísticas (mantener compatibilidad)
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
      from: twilioPhoneNumber,
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
      from: twilioPhoneNumber,
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

// Endpoint de diagnóstico CORS
app.get('/api/cors-test', (req, res) => {
  const origin = req.get('Origin');
  const userAgent = req.get('User-Agent');
  const referer = req.get('Referer');
  
  res.json({
    success: true,
    message: 'CORS is working! 🎉',
    requestInfo: {
      origin: origin || 'No origin header',
      userAgent: userAgent || 'No user agent',
      referer: referer || 'No referer',
      method: req.method,
      headers: req.headers,
      timestamp: new Date().toISOString()
    },
    corsConfig: {
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:8080',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'https://twilio-9ubt.onrender.com'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    }
  });
});

// Endpoint para verificar configuración de WhatsApp
app.get('/api/whatsapp-config', (req, res) => {
  const phoneNumber = twilioPhoneNumber;
  const isSandbox = phoneNumber.includes('+14155238886');
  
  res.json({
    success: true,
    config: {
      phoneNumber: phoneNumber,
      isSandboxNumber: isSandbox,
      isProduction: !isSandbox,
      autoResponseEnabled: autoResponseEnabled,
      message: isSandbox ? 
        '⚠️ Usando número de sandbox - Solo puede enviar a números verificados' :
        '✅ Usando número de producción - Puede enviar a cualquier número'
    },
    recommendations: isSandbox ? [
      'Configura tu número real de WhatsApp Business',
      'Actualiza TWILIO_PHONE_NUMBER en las variables de entorno',
      'Verifica que tengas una cuenta de Twilio con WhatsApp Business aprobado'
    ] : [
      'Configuración correcta para producción',
      'Puedes enviar mensajes a cualquier número de WhatsApp'
    ]
  });
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
    
    // Inicializar cliente MarketTech por defecto
    console.log('🏢 Inicializando sistema multi-cliente...');
    await Client.createDefaultMarketTech();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log("🚀 Servidor WhatsApp Business Backend corriendo en puerto", PORT);
      console.log("🌍 Entorno:", process.env.NODE_ENV || 'development');
      console.log("💾 Base de datos: MongoDB conectada");
      console.log("🏢 Sistema multi-cliente inicializado");
      console.log("\n=== RUTAS API MULTI-CLIENTE ===");
      console.log("POST /webhook - Webhook de Twilio (multi-cliente)");
      console.log("GET  /api/clients - Listar clientes");
      console.log("GET  /api/clients/:id - Obtener cliente específico");
      console.log("POST /api/clients - Crear nuevo cliente");
      console.log("GET  /api/clients/:id/conversations - Conversaciones del cliente");
      console.log("GET  /api/clients/:id/dashboard - Dashboard del cliente");
      console.log("GET  /api/clients/:id/stats - Estadísticas del cliente");
      console.log("POST /api/clients/:id/toggle-ai - Activar/desactivar IA del cliente");
      console.log("POST /api/clients/:id/toggle-auto-response - Control auto-respuesta");
      console.log("POST /api/clients/:id/conversations/:phone/toggle-ai - IA por conversación");
      console.log("\n=== RUTAS API GENERALES ===");
      console.log("GET  /api/conversations - Listar conversaciones (legacy)");
      console.log("GET  /api/stats - Estadísticas generales (legacy)");
      console.log("POST /api/send-message - Enviar mensaje manual");
      console.log("POST /api/send-ai-message - Enviar con IA");
      console.log("GET  /api/health - Estado del servidor");
      console.log("POST /api/ask-ai - Consultar IA directamente");
      console.log("\n✅ Servidor multi-cliente listo");
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
