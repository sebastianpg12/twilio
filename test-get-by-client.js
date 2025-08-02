// test-get-by-client.js - Prueba directa del método getByClient
require('dotenv').config();
const KnowledgeBase = require('./src/models/KnowledgeBase');

async function testGetByClient() {
  try {
    console.log('🔧 Probando método getByClient directamente...');
    
    const knowledgeBase = new KnowledgeBase();
    const clientId = '688db5235f6a82bece18db2a';
    
    console.log(`Buscando entradas para cliente: ${clientId}`);
    
    const result = await knowledgeBase.getByClient(clientId);
    
    console.log('Resultado:', JSON.stringify(result, null, 2));
    console.log(`Total de entradas encontradas: ${result.entries.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGetByClient();
