// test-send-message.js - Script para probar el endpoint de envío de mensajes
const { default: fetch } = require('node-fetch');

async function testSendMessage() {
  try {
    console.log('🧪 Probando endpoint /api/send-message...');
    
    const response = await fetch('https://twilio-9ubt.onrender.com/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: '+573012508805',
        message: 'Mensaje de prueba para verificar guardado en BD'
      })
    });

    const data = await response.text();
    console.log('📊 Status:', response.status);
    console.log('📋 Response:', data);

    if (response.ok) {
      const jsonData = JSON.parse(data);
      console.log('✅ Test exitoso!');
      console.log('📦 Datos:', JSON.stringify(jsonData, null, 2));
    } else {
      console.log('❌ Test falló');
      console.log('🔍 Error details:', data);
    }
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

async function testConversationHistory() {
  try {
    console.log('\n🔍 Verificando historial de conversación...');
    
    const response = await fetch('https://twilio-9ubt.onrender.com/api/conversations/whatsapp:+573012508805');
    const data = await response.json();
    
    if (data.success) {
      console.log('📋 Mensajes en historial:', data.messages.length);
      console.log('🕒 Últimos 3 mensajes:');
      data.messages.slice(-3).forEach((msg, index) => {
        console.log(`  ${index + 1}. [${msg.type}] ${msg.content || msg.text} (${new Date(msg.timestamp).toLocaleString()})`);
      });
    }
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error.message);
  }
}

// Ejecutar tests
async function runTests() {
  await testSendMessage();
  await testConversationHistory();
}

runTests();
