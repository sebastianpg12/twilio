// debug-complete.js - Depuración completa paso a paso
require('dotenv').config();
const axios = require('axios');
const database = require('./src/config/database');
const { ObjectId } = require('mongodb');

const BASE_URL = 'http://localhost:3000';

async function debugComplete() {
  try {
    console.log('🔧 Conectando a la base de datos...');
    await database.connect();
    const db = database.getDb();
    const knowledgeCollection = db.collection('knowledge_entries');
    
    console.log('📊 Estado inicial de la base de datos:');
    const initialEntries = await knowledgeCollection.find({}).toArray();
    console.log(`Total de entradas iniciales: ${initialEntries.length}`);
    initialEntries.forEach(entry => {
      console.log(`- ID: ${entry._id}, ClientId: ${entry.clientId} (tipo: ${typeof entry.clientId}), Título: ${entry.title}`);
    });
    
    // Obtener cliente
    console.log('\n👤 Obteniendo cliente...');
    const clientsResponse = await axios.get(`${BASE_URL}/api/admin/clients`, {
      headers: { 'x-admin-key': 'admin123' }
    });
    
    const client = clientsResponse.data.data[0];
    console.log(`Cliente: ${client.name} (${client._id})`);
    
    // Crear entrada
    console.log('\n📝 Creando entrada...');
    const entryData = {
      title: "Debug Entry",
      content: "Debug content",
      category: "general",
      keywords: ["debug"],
      tags: ["test"],
      priority: 5
    };
    
    const createResponse = await axios.post(
      `${BASE_URL}/api/knowledge/client/${client._id}`,
      entryData
    );
    
    console.log('Respuesta de creación:', createResponse.data.success);
    const createdEntry = createResponse.data.data;
    console.log(`Entrada creada: ${createdEntry._id}`);
    console.log(`ClientId guardado: ${createdEntry.clientId} (tipo: ${typeof createdEntry.clientId})`);
    
    // Verificar en base de datos
    console.log('\n🔍 Verificando en base de datos...');
    const dbEntry = await knowledgeCollection.findOne({ _id: new ObjectId(createdEntry._id) });
    if (dbEntry) {
      console.log(`✅ Entrada encontrada en DB:`);
      console.log(`- ID: ${dbEntry._id}`);
      console.log(`- ClientId: ${dbEntry.clientId} (tipo: ${typeof dbEntry.clientId})`);
      console.log(`- IsActive: ${dbEntry.isActive}`);
      console.log(`- Título: ${dbEntry.title}`);
    } else {
      console.log('❌ Entrada NO encontrada en DB');
    }
    
    // Buscar todas las entradas de este cliente directamente en DB
    console.log('\n🔍 Buscando entradas del cliente en DB...');
    
    // Buscar como string
    const clientEntriesString = await knowledgeCollection.find({
      clientId: client._id
    }).toArray();
    console.log(`Entradas encontradas (clientId como string): ${clientEntriesString.length}`);
    
    // Buscar como ObjectId
    const clientEntriesObjectId = await knowledgeCollection.find({
      clientId: new ObjectId(client._id)
    }).toArray();
    console.log(`Entradas encontradas (clientId como ObjectId): ${clientEntriesObjectId.length}`);
    
    // Listar entrada vía API
    console.log('\n📋 Listando entradas vía API...');
    const listResponse = await axios.get(`${BASE_URL}/api/knowledge/client/${client._id}`);
    console.log(`Entradas listadas por API: ${listResponse.data.data.length}`);
    console.log('Respuesta completa:', JSON.stringify(listResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    await database.close();
  }
}

debugComplete();
