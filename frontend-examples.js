// Ejemplo de uso desde Frontend (React/Vue/HTML)
// URL base de tu API
const API_BASE_URL = 'https://twilio-9ubt.onrender.com';
// Para desarrollo local: const API_BASE_URL = 'http://localhost:3000';

// Ejemplo 1: Verificar estado del servidor
async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    console.log('Server status:', data);
    return data;
  } catch (error) {
    console.error('Error checking health:', error);
  }
}

// Ejemplo 2: Obtener conversaciones
async function getConversations() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations`);
    const data = await response.json();
    console.log('Conversations:', data);
    return data.conversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
  }
}

// Ejemplo 3: Enviar mensaje manual
async function sendManualMessage(phoneNumber, message) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: message
      })
    });
    
    const data = await response.json();
    console.log('Message sent:', data);
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Ejemplo 4: Enviar mensaje con IA
async function sendAIMessage(phoneNumber, prompt, context = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-ai-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        prompt: prompt,
        context: context
      })
    });
    
    const data = await response.json();
    console.log('AI Message sent:', data);
    return data;
  } catch (error) {
    console.error('Error sending AI message:', error);
  }
}

// Ejemplo 5: Consultar IA directamente
async function askAI(question, context = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ask-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question,
        context: context
      })
    });
    
    const data = await response.json();
    console.log('AI Response:', data);
    return data.answer;
  } catch (error) {
    console.error('Error asking AI:', error);
  }
}

// Ejemplo 6: Activar/Desactivar bot
async function toggleBot(enabled) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auto-response/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enabled: enabled
      })
    });
    
    const data = await response.json();
    console.log('Bot toggled:', data);
    return data;
  } catch (error) {
    console.error('Error toggling bot:', error);
  }
}

// Ejemplo 7: Obtener estadísticas
async function getStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    const data = await response.json();
    console.log('Stats:', data);
    return data.stats;
  } catch (error) {
    console.error('Error getting stats:', error);
  }
}

// Ejemplo de uso:
/*
// En tu componente de React/Vue o archivo JS:

// Verificar servidor
checkHealth();

// Obtener conversaciones
getConversations().then(conversations => {
  // Usar las conversaciones en tu UI
});

// Enviar mensaje
sendManualMessage('+1234567890', 'Hola desde el frontend!');

// Usar IA
askAI('¿Cuáles son los horarios de atención?', 'Clínica médica');
*/
