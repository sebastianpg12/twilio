// ia.js
require('dotenv').config();
const OpenAI = require('openai');
const KnowledgeBase = require('../models/KnowledgeBase');
const Message = require('../models/Message');

// Instanciar KnowledgeBase
const knowledgeBase = new KnowledgeBase();

// Configurar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Agregar configuración para manejar certificados SSL si es necesario
  ...(process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' && {
    httpAgent: new (require('https')).Agent({
      rejectUnauthorized: false
    })
  })
});

/**
 * Función para hacer una pregunta a la IA de OpenAI
 * @param {string} pregunta - La pregunta que se le hará a la IA
 * @param {string} contexto - Contexto adicional para la IA (opcional)
 * @returns {Promise<string>} - La respuesta de la IA
 */
async function preguntarIA(pregunta, contexto = '') {
  try {
    const mensajeCompleto = contexto ? 
      `Contexto: ${contexto}\n\nPregunta: ${pregunta}` : 
      pregunta;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Puedes cambiar a "gpt-4" si tienes acceso
      messages: [
        {
          role: "system",
          content: "Eres un asistente útil y amigable. Responde de manera clara y concisa."
        },
        {
          role: "user",
          content: mensajeCompleto
        }
      ],
      max_tokens: 500, // Limitar la respuesta para no gastar muchos tokens
      temperature: 0.7, // Controla la creatividad de la respuesta
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error al consultar OpenAI:', error);
    
    // Manejar diferentes tipos de errores
    if (error.status === 401) {
      throw new Error('API key de OpenAI inválida');
    } else if (error.status === 429) {
      throw new Error('Límite de rate excedido, intenta más tarde');
    } else if (error.status === 500) {
      throw new Error('Error del servidor de OpenAI');
    } else {
      throw new Error('Error al procesar la consulta: ' + error.message);
    }
  }
}

/**
 * Función para obtener una respuesta de IA basada en un mensaje de WhatsApp
 * @param {string} mensajeUsuario - El mensaje del usuario
 * @param {string} numeroTelefono - El número de teléfono del usuario (opcional)
 * @returns {Promise<string>} - La respuesta generada por la IA
 */
async function responderMensajeWhatsApp(mensajeUsuario, numeroTelefono = '') {
  try {
    const contexto = `Eres un asistente de WhatsApp. El usuario te escribió: "${mensajeUsuario}". ${numeroTelefono ? `Su número es: ${numeroTelefono}` : ''}`;
    
    const respuesta = await preguntarIA(mensajeUsuario, contexto);
    return respuesta;
  } catch (error) {
    console.error('Error al generar respuesta para WhatsApp:', error);
    return 'Lo siento, no pude procesar tu mensaje en este momento. Intenta más tarde.';
  }
}

/**
 * Función para generar respuestas automáticas basadas en palabras clave y base de conocimiento
 * @param {string} mensaje - El mensaje recibido
 * @param {string} numeroTelefono - Número de teléfono del usuario
 * @param {Object} client - Objeto del cliente con sus configuraciones
 * @returns {Promise<string>} - Respuesta generada
 */
async function respuestaInteligente(mensaje, numeroTelefono = '', client = null) {
  try {
    let contextoBase = "";
    let knowledgeContext = "";

    // Si tenemos un cliente, obtener su base de conocimiento
    if (client && client._id) {
      try {
        // Buscar información relevante en la base de conocimiento
        const relevantKnowledge = await knowledgeBase.searchKnowledge(
          client._id.toString(), 
          mensaje, 
          3 // Obtener máximo 3 resultados relevantes
        );

        if (relevantKnowledge && relevantKnowledge.length > 0) {
          knowledgeContext = "\n\nINFORMACIÓN DE LA EMPRESA:\n";
          relevantKnowledge.forEach((entry, index) => {
            knowledgeContext += `${index + 1}. ${entry.title}: ${entry.content}\n`;
          });
          
          contextoBase += `Eres el asistente virtual de ${client.name} (${client.business}). `;
          contextoBase += "Usa ÚNICAMENTE la información proporcionada de la empresa para responder. ";
          contextoBase += "Si no tienes información específica, indica amablemente que pueden contactar a la empresa para más detalles. ";
        } else {
          contextoBase += `Eres el asistente virtual de ${client.name} (${client.business}). `;
          contextoBase += "Responde de manera amable y sugiere que el usuario contacte a la empresa para información específica. ";
        }

        // Agregar información básica del cliente si está disponible
        if (client.welcomeMessage) {
          contextoBase += `Mensaje de bienvenida de la empresa: "${client.welcomeMessage}". `;
        }

        if (client.email) {
          contextoBase += `Email de contacto: ${client.email}. `;
        }

        if (client.phoneNumber && client.phoneNumber !== client.twilioPhoneNumber) {
          contextoBase += `Teléfono de contacto: ${client.phoneNumber}. `;
        }

      } catch (knowledgeError) {
        console.error('❌ Error obteniendo conocimiento:', knowledgeError);
        contextoBase += `Eres el asistente virtual de ${client.name}. `;
      }
    } else {
      contextoBase = "Eres un asistente de atención al cliente amable y profesional. ";
    }

    // Detectar intención del mensaje para mejorar el contexto
    const mensajeMinuscula = mensaje.toLowerCase();
    
    if (mensajeMinuscula.includes('precio') || mensajeMinuscula.includes('costo') || mensajeMinuscula.includes('tarifa')) {
      contextoBase += "El usuario está preguntando sobre precios o costos. ";
    } else if (mensajeMinuscula.includes('horario') || mensajeMinuscula.includes('hora') || mensajeMinuscula.includes('abierto')) {
      contextoBase += "El usuario está preguntando sobre horarios de atención. ";
    } else if (mensajeMinuscula.includes('producto') || mensajeMinuscula.includes('servicio')) {
      contextoBase += "El usuario está preguntando sobre productos o servicios. ";
    } else if (mensajeMinuscula.includes('contacto') || mensajeMinuscula.includes('teléfono') || mensajeMinuscula.includes('email')) {
      contextoBase += "El usuario está pidiendo información de contacto. ";
    } else if (mensajeMinuscula.includes('ubicación') || mensajeMinuscula.includes('dirección') || mensajeMinuscula.includes('donde')) {
      contextoBase += "El usuario está preguntando sobre la ubicación. ";
    }

    // 🆕 AGREGAR HISTORIAL DEL CHAT PARA CONTEXTO
    let historialContext = "";
    if (client && client._id && numeroTelefono) {
      try {
        const phoneNumber = numeroTelefono.startsWith('whatsapp:') ? numeroTelefono : `whatsapp:${numeroTelefono}`;
        const recentHistory = await Message.getConversationHistory(phoneNumber, client._id, 8);
        
        if (recentHistory && recentHistory.length > 0) {
          historialContext = "\n\nHISTORIAL RECIENTE:\n";
          recentHistory.slice(-8).forEach((msg, index) => {
            const sender = msg.type === 'received' ? 'Usuario' : 'Asistente';
            const tiempo = new Date(msg.timestamp).toLocaleTimeString('es-CO', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            historialContext += `[${tiempo}] ${sender}: ${msg.text}\n`;
          });
          historialContext += `[Ahora] Usuario: ${mensaje}\n\nCONTEXTO: Mantén continuidad con la conversación anterior y responde de manera natural y contextualizada.\n`;
        }
      } catch (historyError) {
        console.error('❌ Error obteniendo historial del chat:', historyError);
      }
    }

    // Construir el contexto completo con historial
    const contextoCompleto = contextoBase + knowledgeContext + historialContext;

    const respuesta = await preguntarIA(mensaje, contextoCompleto);
    
    return respuesta;
  } catch (error) {
    console.error('❌ Error en respuesta inteligente:', error);
    
    // Respuesta de fallback personalizada por cliente
    if (client && client.name) {
      return `¡Hola! Soy el asistente virtual de ${client.name}. Gracias por tu mensaje, te responderemos pronto. 😊`;
    }
    
    return 'Gracias por tu mensaje. Te responderemos pronto. 😊';
  }
}

/**
 * Función para obtener el contexto completo de conocimiento de un cliente
 * @param {string} clientId - ID del cliente
 * @returns {Promise<string>} - Contexto formateado para la IA
 */
async function getClientKnowledgeContext(clientId) {
  try {
    const knowledge = await KnowledgeBase.getActiveKnowledgeForBot(clientId);
    
    if (!knowledge || knowledge.length === 0) {
      return "";
    }

    let context = "\n\nBASE DE CONOCIMIENTO DE LA EMPRESA:\n";
    
    // Agrupar por categorías para mejor organización
    const groupedKnowledge = knowledge.reduce((acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = [];
      }
      acc[entry.category].push(entry);
      return acc;
    }, {});

    // Formatear por categorías
    Object.keys(groupedKnowledge).forEach(category => {
      context += `\n📋 ${category.toUpperCase()}:\n`;
      groupedKnowledge[category].forEach(entry => {
        context += `• ${entry.title}: ${entry.content}\n`;
      });
    });

    return context;
  } catch (error) {
    console.error('❌ Error obteniendo contexto de conocimiento:', error);
    return "";
  }
}

/**
 * Función para validar si un mensaje necesita conocimiento específico
 * @param {string} mensaje - Mensaje del usuario
 * @returns {boolean} - True si necesita conocimiento específico
 */
function needsSpecificKnowledge(mensaje) {
  const keywordsNeedingKnowledge = [
    'precio', 'costo', 'tarifa', 'cuanto', 'valor',
    'producto', 'servicio', 'oferta', 'promocion',
    'horario', 'abierto', 'cerrado', 'atencion',
    'contacto', 'telefono', 'email', 'direccion',
    'ubicacion', 'donde', 'como llegar',
    'informacion', 'detalles', 'caracteristicas'
  ];

  const mensajeMinuscula = mensaje.toLowerCase();
  return keywordsNeedingKnowledge.some(keyword => 
    mensajeMinuscula.includes(keyword)
  );
}

module.exports = {
  preguntarIA,
  responderMensajeWhatsApp,
  respuestaInteligente,
  getClientKnowledgeContext,
  needsSpecificKnowledge
};
