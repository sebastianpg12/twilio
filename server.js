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
const usersRoutes = require('./src/routes/users');
const knowledgeRoutes = require('./src/routes/knowledge');

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
const twilioClient = twilio(accountSid, authToken);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';

console.log('📞 Número de WhatsApp configurado:', twilioPhoneNumber);

// ===============================================
// ENDPOINT PARA VERIFICAR ESTADO DE MENSAJES TWILIO
// ===============================================

// Verificar estado de un mensaje específico
app.get('/api/message-status/:twilioSid', async (req, res) => {
  try {
    const { twilioSid } = req.params;
    
    const message = await twilioClient.messages(twilioSid).fetch();
    
    res.json({
      success: true,
      message: {
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        from: message.from,
        to: message.to,
        body: message.body,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        dateSent: message.dateSent
      }
    });
  } catch (error) {
    console.error('Error obteniendo estado del mensaje:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para verificar números autorizados en WhatsApp Sandbox
app.get('/api/whatsapp/sandbox-info', async (req, res) => {
  try {
    // Para el sandbox de Twilio, todos los números deben estar pre-autorizados
    // enviando primero el código "join <sandbox-keyword>" al número sandbox
    
    res.json({
      success: true,
      sandbox: {
        number: '+14155238886',
        format: 'whatsapp:+14155238886',
        instructions: [
          '1. Envía "join <keyword>" al número +1 415 523 8886 desde WhatsApp',
          '2. El keyword específico se obtiene del dashboard de Twilio',
          '3. Una vez autorizado, podrás recibir mensajes del sandbox',
          '4. Los números no autorizados NO recibirán mensajes'
        ],
        note: 'Este es un número sandbox de Twilio. Para producción necesitas un número verificado.'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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

    const { conversation, message, client: marketTechClient } = result;

    // CONTROL DE IA: Solo responde la IA si está activa por conversación
    const convKey = marketTechClient ? `${marketTechClient._id}:${fromNumber}` : null;
    const iaEnabled = convKey && iaConversationStatus[convKey] !== undefined ? iaConversationStatus[convKey] : true;

    if (iaEnabled) {
      console.log('🤖 Generando respuesta IA...');
      try {
        const aiResponse = await respuestaInteligente(
          incomingMessage, 
          fromNumber,
          marketTechClient
        );
        if (aiResponse && aiResponse.trim()) {
          // Enviar respuesta usando cliente de Twilio
          const messageResponse = await twilioClient.messages.create({
            from: twilioPhoneNumber,
            to: fromNumber,
            body: aiResponse
          });
          // Guardar respuesta en BD
          await ConversationService.saveOutgoingMessage(
            fromNumber,
            marketTechClient._id,
            aiResponse,
            'ai-auto'
          );
          console.log(`✅ Respuesta IA enviada a ${fromNumber}`);
        }
      } catch (aiError) {
        console.error('❌ Error generando respuesta IA:', aiError);
      }
    } else {
      console.log('🔕 IA desactivada: solo responde el asesor humano.');
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

// Rutas de usuarios
app.use('/api/users', usersRoutes);

// Rutas de base de conocimiento
app.use('/api/knowledge', knowledgeRoutes);

// Rutas de setup y administración
app.use('/api/setup', setupRoutes);

// Rutas de clientes (multi-cliente)
app.use('/api/clients', clientsRoutes);

// Rutas de dashboard por cliente
app.use('/api/clients', dashboardRoutes);

// Rutas de conversaciones
app.use('/api/conversations', conversationsRoutes);

// ====== CONTROL SOLO POR CONVERSACIÓN DE IA ======
const iaConversationStatus = {}

// Solo endpoint para activar/desactivar IA por conversación
app.post('/api/ia/:clientId/:phone/toggle', (req, res) => {
  const { clientId, phone } = req.params;
  const key = `${clientId}:${phone}`;
  iaConversationStatus[key] = req.body.enabled !== undefined ? req.body.enabled : !iaConversationStatus[key];
  res.json({ success: true, clientId, phone, iaEnabled: iaConversationStatus[key] });
});

// Endpoint para consultar si la IA está activa en una conversación
app.get('/api/ia/:clientId/:phone/status', (req, res) => {
  const { clientId, phone } = req.params;
  const key = `${clientId}:${phone}`;
  const iaEnabled = iaConversationStatus[key] !== undefined ? iaConversationStatus[key] : true;
  res.json({ success: true, clientId, phone, iaEnabled });
});

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

// Envío manual de mensajes - MEJORADO para guardar en BD
app.post('/api/send-message', async (req, res) => {
  try {
    const { to, message } = req.body;

    // Validación de datos
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Los campos "to" y "message" son requeridos'
      });
    }

    // Normalizar número de teléfono
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    console.log(`📤 Enviando mensaje manual a ${formattedTo}: "${message}"`);

    // IMPORTANTE: Para WhatsApp Sandbox, usar el número sandbox correcto
    const whatsappSandboxNumber = 'whatsapp:+14155238886'; // Número sandbox de Twilio
    
    // Buscar cliente MarketTech por su número de Twilio
    let marketTechClient = await Client.findByTwilioNumber('+14155238886');
    
    if (!marketTechClient) {
      console.log('🏢 Cliente MarketTech no encontrado, creando...');
      marketTechClient = await Client.createDefaultMarketTech();
    }

    console.log(`🔄 Enviando via Twilio WhatsApp desde ${whatsappSandboxNumber} hacia ${formattedTo}`);
    console.log(`📝 Contenido: "${message}"`);

    // IMPORTANTE: Verificar que el número destino esté en formato WhatsApp correcto
    if (!formattedTo.startsWith('whatsapp:')) {
      throw new Error('Número destino debe usar formato whatsapp:+número');
    }

    // Enviar mensaje vía Twilio WhatsApp API
    const messageResponse = await twilioClient.messages.create({
      from: whatsappSandboxNumber,  // whatsapp:+14155238886 (sandbox)
      to: formattedTo,             // whatsapp:+573012508805
      body: message,
      // Opcional: agregar metadata para tracking
      statusCallback: process.env.TWILIO_WEBHOOK_URL || undefined
    });

    console.log(`✅ Mensaje enviado via Twilio: SID=${messageResponse.sid}, Status=${messageResponse.status}`);

    // Guardar mensaje en la base de datos usando ConversationService
    try {
      const savedResult = await ConversationService.sendMessage(
        formattedTo,
        marketTechClient._id,
        message,
        'manual', // Tipo de mensaje: manual
        {
          twilioSid: messageResponse.sid,
          source: 'admin_panel',
          timestamp: new Date()
        }
      );
      
      console.log(`💾 Mensaje manual guardado en BD: ${savedResult.message._id} para cliente ${marketTechClient.name}`);
      
      // Respuesta exitosa con datos completos
      res.json({
        success: true,
        message: 'Mensaje enviado y guardado exitosamente',
        data: {
          twilioSid: messageResponse.sid,
          clientId: marketTechClient._id,
          clientName: marketTechClient.name,
          savedToDatabase: true,
          messageId: savedResult.message._id,
          conversationId: savedResult.conversation._id
        }
      });
      
    } catch (dbError) {
      console.error('❌ Error guardando mensaje en BD:', dbError);
      // El mensaje se envió pero no se guardó - responder con advertencia
      res.json({
        success: true,
        message: 'Mensaje enviado exitosamente (advertencia: no se guardó en BD)',
        twilioSid: messageResponse.sid,
        warning: 'No se pudo guardar en la base de datos: ' + dbError.message,
        savedToDatabase: false
      });
    }

  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    res.status(500).json({
      success: false,
      error: 'Error enviando mensaje: ' + error.message
    });
  }
});

// Envío de mensajes con cliente específico (endpoint mejorado)
app.post('/api/messages/send', async (req, res) => {
  try {
    const { to, message, clientId, twilioNumber = '+14155238886' } = req.body;

    // Validación de datos
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Los campos "to" y "message" son requeridos'
      });
    }

    // Buscar cliente
    let client;
    if (clientId) {
      client = await Client.findById(clientId);
    } else {
      client = await Client.findByTwilioNumber(twilioNumber);
    }
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado para el número de Twilio especificado'
      });
    }

    // Normalizar número de teléfono
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const formattedFrom = client.twilioPhoneNumber.startsWith('whatsapp:') 
      ? client.twilioPhoneNumber 
      : `whatsapp:${client.twilioPhoneNumber}`;
    
    console.log(`📤 Enviando mensaje desde ${client.name} (${formattedFrom}) a ${formattedTo}`);

    // Enviar mensaje vía Twilio
    const messageResponse = await twilioClient.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: message
    });

    console.log(`✅ Mensaje enviado via Twilio: ${messageResponse.sid}`);

    // Guardar mensaje en la base de datos
    const savedResult = await ConversationService.sendMessage(
      formattedTo,
      client._id,
      message,
      'manual',
      {
        twilioSid: messageResponse.sid,
        source: 'api_manual',
        timestamp: new Date()
      }
    );

    console.log(`💾 Mensaje guardado en BD para cliente ${client.name}: ${savedResult.message._id}`);

    res.json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      data: {
        twilioSid: messageResponse.sid,
        clientId: client._id,
        clientName: client.name,
        messageId: savedResult.message._id,
        conversationId: savedResult.conversation._id,
        savedToDatabase: true
      }
    });
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
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

// Envío manual de SMS (sin verificación WhatsApp)  
app.post('/api/send-sms', async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'Campos requeridos: to, message' });
    }

    const formattedTo = to.startsWith('+') ? to : `+${to.replace(/\D/g, '')}`;
    const twilioSmsNumber = '+15017122661'; // Número SMS de Twilio
    
    const messageResponse = await twilioClient.messages.create({
      from: twilioSmsNumber,
      to: formattedTo,
      body: message
    });

    res.json({
      success: true,
      message: 'SMS enviado exitosamente',
      twilioSid: messageResponse.sid,
      type: 'SMS',
      from: twilioSmsNumber,
      to: formattedTo
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
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
