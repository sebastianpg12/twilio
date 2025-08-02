// api-debug.js - Depuración solo con API
require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function apiDebug() {
  try {
    console.log('🔧 Iniciando depuración de API...');
    
    // 1. Obtener cliente
    const clientsResponse = await axios.get(`${BASE_URL}/api/admin/clients`, {
      headers: { 'x-admin-key': 'admin123' }
    });
    
    const client = clientsResponse.data.data[0];
    console.log(`✅ Cliente: ${client.name} (${client._id})`);
    
    // 2. Limpiar datos previos - listar entradas existentes
    console.log('\n📋 Listando entradas existentes...');
    const existingResponse = await axios.get(`${BASE_URL}/api/knowledge/client/${client._id}`);
    console.log(`Entradas existentes: ${existingResponse.data.data.length}`);
    
    if (existingResponse.data.data.length > 0) {
      console.log('Entradas encontradas:');
      existingResponse.data.data.forEach(entry => {
        console.log(`- ${entry.title} (${entry._id})`);
      });
    }
    
    // 3. Crear primera entrada
    console.log('\n📝 Creando primera entrada...');
    const entry1Data = {
      title: "Primera Entrada API",
      content: "Contenido de la primera entrada",
      category: "general",
      keywords: ["primera", "api"],
      tags: ["test"],
      priority: 8
    };
    
    const create1Response = await axios.post(
      `${BASE_URL}/api/knowledge/client/${client._id}`,
      entry1Data
    );
    
    if (create1Response.data.success) {
      console.log(`✅ Primera entrada creada: ${create1Response.data.data._id}`);
    } else {
      console.log(`❌ Error creando primera entrada: ${create1Response.data.error}`);
    }
    
    // 4. Listar entradas después de crear la primera
    console.log('\n📋 Listando después de crear primera entrada...');
    const after1Response = await axios.get(`${BASE_URL}/api/knowledge/client/${client._id}`);
    console.log(`Entradas después de crear primera: ${after1Response.data.data.length}`);
    console.log('Respuesta:', JSON.stringify(after1Response.data, null, 2));
    
    // 5. Crear segunda entrada
    console.log('\n📝 Creando segunda entrada...');
    const entry2Data = {
      title: "Segunda Entrada API",
      content: "Contenido de la segunda entrada",
      category: "precios",
      keywords: ["segunda", "precio"],
      tags: ["test"],
      priority: 7
    };
    
    const create2Response = await axios.post(
      `${BASE_URL}/api/knowledge/client/${client._id}`,
      entry2Data
    );
    
    if (create2Response.data.success) {
      console.log(`✅ Segunda entrada creada: ${create2Response.data.data._id}`);
    } else {
      console.log(`❌ Error creando segunda entrada: ${create2Response.data.error}`);
    }
    
    // 6. Listar entradas después de crear la segunda
    console.log('\n📋 Listando después de crear segunda entrada...');
    const after2Response = await axios.get(`${BASE_URL}/api/knowledge/client/${client._id}`);
    console.log(`Entradas después de crear segunda: ${after2Response.data.data.length}`);
    console.log('Datos encontrados:', after2Response.data.data.map(e => e.title));
    
    // 7. Obtener estadísticas
    console.log('\n📊 Obteniendo estadísticas...');
    const statsResponse = await axios.get(`${BASE_URL}/api/knowledge/client/${client._id}/stats`);
    console.log('Estadísticas:', statsResponse.data);
    
    // 8. Buscar entradas
    console.log('\n🔍 Buscando entradas...');
    const searchResponse = await axios.get(`${BASE_URL}/api/knowledge/client/${client._id}/search?q=entrada`);
    console.log(`Resultados de búsqueda: ${searchResponse.data.data.results.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`Estado HTTP: ${error.response.status}`);
    }
  }
}

apiDebug();
