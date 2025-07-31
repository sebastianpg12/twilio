// test-ia.js
require('dotenv').config();

// Script de prueba simple
async function testIA() {
  console.log('🤖 Probando integración con OpenAI...');
  console.log('API Key configurada:', process.env.OPENAI_API_KEY ? '✅ Sí' : '❌ No');
  
  try {
    const { preguntarIA } = require('./ia');
    
    console.log('\n📝 Haciendo pregunta de prueba...');
    const respuesta = await preguntarIA('Di "Hola mundo" en español');
    
    console.log('\n✅ Respuesta recibida:');
    console.log(respuesta);
    
    console.log('\n🎉 ¡Integración exitosa!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Tip: Verifica que tu API key de OpenAI sea correcta');
    } else if (error.message.includes('Connection error')) {
      console.log('\n💡 Tip: Problema de conexión. Verifica tu internet o proxy');
    }
  }
}

testIA();
