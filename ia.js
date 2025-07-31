// ia.js
require('dotenv').config();
const OpenAI = require('openai');

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
 * Función para generar respuestas automáticas basadas en palabras clave
 * @param {string} mensaje - El mensaje recibido
 * @returns {Promise<string>} - Respuesta generada
 */
async function respuestaInteligente(mensaje) {
  try {
    // Detectar intención del mensaje
    let contexto = "Eres un asistente de atención al cliente. ";
    
    if (mensaje.toLowerCase().includes('cita') || mensaje.toLowerCase().includes('turno')) {
      contexto += "El usuario está preguntando sobre citas o turnos. ";
    } else if (mensaje.toLowerCase().includes('precio') || mensaje.toLowerCase().includes('costo')) {
      contexto += "El usuario está preguntando sobre precios. ";
    } else if (mensaje.toLowerCase().includes('horario')) {
      contexto += "El usuario está preguntando sobre horarios. ";
    }
    
    const respuesta = await preguntarIA(mensaje, contexto);
    return respuesta;
  } catch (error) {
    console.error('Error en respuesta inteligente:', error);
    return 'Gracias por tu mensaje. Te responderemos pronto.';
  }
}

module.exports = {
  preguntarIA,
  responderMensajeWhatsApp,
  respuestaInteligente
};
