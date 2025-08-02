// debug-db.js - Script para depurar la base de datos
require('dotenv').config();
const database = require('./src/config/database');
const { ObjectId } = require('mongodb');

async function debugDatabase() {
  try {
    console.log('🔧 Conectando a la base de datos...');
    
    await database.connect();
    const db = database.getDb();
    
    // Verificar que la colección existe
    const collections = await db.listCollections().toArray();
    console.log('📋 Colecciones disponibles:', collections.map(c => c.name));
    
    const knowledgeCollection = db.collection('knowledge_entries');
    
    // Contar documentos
    const totalCount = await knowledgeCollection.countDocuments({});
    console.log(`📊 Total de entradas en knowledge_entries: ${totalCount}`);
    
    // Mostrar todas las entradas
    const allEntries = await knowledgeCollection.find({}).toArray();
    console.log(`📄 Todas las entradas:`, JSON.stringify(allEntries, null, 2));
    
    // Verificar clientes
    const clientsCollection = db.collection('clients');
    const clientsCount = await clientsCollection.countDocuments({});
    console.log(`👥 Total de clientes: ${clientsCount}`);
    
    const allClients = await clientsCollection.find({}).toArray();
    console.log(`👤 Todos los clientes:`, allClients.map(c => ({
      id: c._id,
      name: c.name
    })));
    
    // Si hay clientes, buscar entradas específicas del primer cliente
    if (allClients.length > 0) {
      const firstClient = allClients[0];
      console.log(`🔍 Buscando entradas del cliente: ${firstClient.name} (${firstClient._id})`);
      
      const clientEntries = await knowledgeCollection.find({
        clientId: firstClient._id
      }).toArray();
      
      console.log(`📝 Entradas del cliente ${firstClient.name}:`, clientEntries.length);
      
      // También buscar con ObjectId
      const clientEntriesObjectId = await knowledgeCollection.find({
        clientId: new ObjectId(firstClient._id)
      }).toArray();
      
      console.log(`📝 Entradas del cliente (con ObjectId):`, clientEntriesObjectId.length);
      
      // Mostrar una entrada de ejemplo si existe
      if (clientEntriesObjectId.length > 0) {
        console.log(`📄 Ejemplo de entrada:`, JSON.stringify(clientEntriesObjectId[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await database.close();
    console.log('✅ Conexión cerrada');
  }
}

debugDatabase();
