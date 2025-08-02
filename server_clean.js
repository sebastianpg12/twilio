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

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman) en desarrollo
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin no permitido:', origin);
      callback(new Error('No permitido por CORS'), false);
    }
  },
  credentials: true
}));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configuración de Twilio
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';

console.log('📞 Número de WhatsApp configurado:', twilioPhoneNumber);

// Variables globales
let autoResponseEnabled = true;

// ========== FUNCIONES AUXILIARES ==========

async function ensureMarketTechExists() {
  try {
    let marketTech = await Client.findByTwilioNumber('+14155238886');
    if (!marketTech) {
      console.log('🏢 Creando cliente MarketTech por defecto...');
      marketTech = await Client.createDefaultMarketTech();
      console.log('✅ Cliente MarketTech creado:', marketTech.name);
    }
    return marketTech;
  } catch (error) {
    console.error('❌ Error asegurando MarketTech:', error);
    throw error;
  }
}

// ========== WEBHOOK PRINCIPAL ==========

app.post('/webhook', async (req, res) => {
  try {
    const incomingMessage = req.body.Body || '';
    const fromNumber = req.body.From || '';
    const toNumber = req.body.To || '';

    console.log(`📩 Mensaje recibido de ${fromNumber} para ${toNumber}: "${incomingMessage}"`);

    // Procesar mensaje y obtener cliente
    const result = await ConversationService.processIncomingMessage(
      toNumber, 
      fromNumber, 
      incomingMessage
    );

    const { conversation, message, client } = result;

    // Verificar si debe responder automáticamente
    const shouldAutoRespond = await ConversationService.isAutoResponseEnabled(conversation, client);
    
    if (shouldAutoRespond && autoResponseEnabled) {
      console.log('🤖 Generando respuesta automática...');
      
      try {
        const aiResponse = await respuestaInteligente(
          incomingMessage, 
          fromNumber,
          client
        );

        if (aiResponse && aiResponse.trim()) {
          // Enviar respuesta
          await client.sendMessage(fromNumber, aiResponse);
          
          // Guardar respuesta en BD
          await ConversationService.saveOutgoingMessage(
            fromNumber,
            client._id,
            aiResponse,
            'ai-auto'
          );

          console.log(`✅ Respuesta automática enviada a ${fromNumber}`);
        }
      } catch (aiError) {
        console.error('❌ Error generando respuesta IA:', aiError);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.status(500).send('Error procesando mensaje');
  }
});

// ========== RUTAS API ==========

// Rutas de administración general
app.use('/api/admin', adminRoutes);

// Rutas de setup y administración
app.use('/api/setup', setupRoutes);

// Rutas de clientes (multi-cliente)
app.use('/api/clients', clientsRoutes);

// Rutas de dashboard por cliente
app.use('/api/clients', dashboardRoutes);

// Rutas de conversaciones (mantener compatibilidad)
app.use('/api/conversations', conversationsRoutes);

// Rutas de estadísticas (mantener compatibilidad)
app.use('/api/stats', statsRoutes);

// ========== RUTAS ADICIONALES ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: database.isConnected() ? 'connected' : 'disconnected'
  });
});

// Envío manual de mensajes
app.post('/api/send-message', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Los campos "to" y "message" son requeridos'
      });
    }

    const messageResponse = await client.messages.create({
      from: twilioPhoneNumber,
      to: to,
      body: message
    });

    res.json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      twilioSid: messageResponse.sid
    });
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({
      success: false,
      error: 'Error enviando mensaje: ' + error.message
    });
  }
});

// Consultar IA directamente
app.post('/api/ask-ai', async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'La pregunta es requerida'
      });
    }

    const response = await preguntarIA(question, context);

    res.json({
      success: true,
      question,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error consultando IA:', error);
    res.status(500).json({
      success: false,
      error: 'Error consultando IA: ' + error.message
    });
  }
});

// Control global de auto-respuesta (legacy)
app.get('/api/auto-response/status', (req, res) => {
  res.json({
    success: true,
    enabled: autoResponseEnabled,
    message: autoResponseEnabled ? 'Auto-respuesta activada' : 'Auto-respuesta desactivada'
  });
});

app.post('/api/auto-response/toggle', (req, res) => {
  const { enabled } = req.body;
  autoResponseEnabled = enabled !== undefined ? enabled : !autoResponseEnabled;
  
  console.log(`🔄 Auto-respuesta ${autoResponseEnabled ? 'activada' : 'desactivada'} globalmente`);
  
  res.json({
    success: true,
    enabled: autoResponseEnabled,
    message: `Auto-respuesta ${autoResponseEnabled ? 'activada' : 'desactivada'} exitosamente`
  });
});

// ========== INICIO DEL SERVIDOR ==========

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await database.connect();
    console.log('✅ Conectado a MongoDB exitosamente');

    // Asegurar que MarketTech existe
    await ensureMarketTechExists();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌐 URL local: http://localhost:${PORT}`);
      console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
      console.log('✅ Sistema multi-cliente inicializado');
    });
  } catch (error) {
    console.error('❌ [APP.JS] Error fatal al cargar servidor:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

startServer();
