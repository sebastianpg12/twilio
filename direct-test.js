// direct-test.js - Prueba directa de los métodos
require('dotenv').config();
const KnowledgeBase = require('./src/models/KnowledgeBase');

async function directTest() {
  try {
    console.log('🧪 PRUEBA DIRECTA DE MÉTODOS');
    
    const kb = new KnowledgeBase();
    const clientId = '688db5235f6a82bece18db2a';
    
    console.log('\n1. Probando método create...');  
    const entryData = {
      clientId: clientId,
      title: "Prueba Directa",
      content: "Contenido de prueba directa",
      category: "general",
      keywords: ["prueba", "directa"],
      tags: ["test"],
      priority: 5
    };
    
    const createdEntry = await kb.create(entryData);
    console.log('✅ Entrada creada:', createdEntry._id);
    console.log('ClientId guardado:', createdEntry.clientId, typeof createdEntry.clientId);
    
    console.log('\n2. Probando método getByClient...');
    const entries = await kb.getByClient(clientId);
    console.log('Entradas encontradas:', entries.entries.length);
    console.log('Total en paginación:', entries.pagination.total);
    
    if (entries.entries.length > 0) {
      console.log('Primera entrada encontrada:', entries.entries[0].title);
    }
    
    console.log('\n3. Probando con diferentes formatos de clientId...');
    
    // Probar con diferentes formatos
    const testFormats = [
      { format: 'string', value: clientId.toString() },
      { format: 'original', value: clientId }
    ];
    
    for (const format of testFormats) {
      try {
        const result = await kb.getByClient(format.value);
        console.log(`Formato ${format.format}: ${result.entries.length} entradas`);
      } catch (error) {
        console.log(`Formato ${format.format}: ERROR - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

directTest();
