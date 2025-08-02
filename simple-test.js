// simple-test.js - Prueba simple de creación y listado
require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function simpleTest() {
  try {
    console.log('🔧 Ejecutando prueba simple...');
    
    // 1. Obtener cliente
    const clientsResponse = await axios.get(`${BASE_URL}/api/admin/clients`, {
      headers: { 'x-admin-key': 'admin123' }
    });
    
    if (!clientsResponse.data.success || clientsResponse.data.data.length === 0) {
      console.error('❌ No hay clientes disponibles');
      return;
    }
    
    const client = clientsResponse.data.data[0];
    console.log(`✅ Cliente: ${client.name} (${client._id})`);
    
    // 2. Crear entrada
    const entryData = {
      title: "Test Entry",
      content: "Test content for debugging",
      category: "general",
      keywords: ["test"],
      tags: ["debug"],
      priority: 5
    };
    
    console.log('📝 Creando entrada...');
    const createResponse = await axios.post(
      `${BASE_URL}/api/knowledge/client/${client._id}`,
      entryData
    );
    
    console.log('Respuesta de creación:', createResponse.data);
    
    if (!createResponse.data.success) {
      console.error('❌ Error creando entrada:', createResponse.data.error);
      return;
    }
    
    const createdEntry = createResponse.data.data;
    console.log(`✅ Entrada creada: ${createdEntry._id}`);
    
    // 3. Listar entradas
    console.log('📋 Listando entradas...');
    const listResponse = await axios.get(`${BASE_URL}/api/knowledge/client/${client._id}`);
    
    console.log('Respuesta de listado:', JSON.stringify(listResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

simpleTest();
