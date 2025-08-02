// final-test.js - Prueba final completa del sistema
require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const ADMIN_KEY = 'admin123';

async function finalTest() {
  try {
    console.log('🚀 PRUEBA FINAL DEL SISTEMA DE BASE DE CONOCIMIENTO');
    console.log('='.repeat(60));
    
    // 1. Obtener cliente
    const clientsResponse = await axios.get(`${BASE_URL}/api/admin/clients`, {
      headers: { 'x-admin-key': ADMIN_KEY }
    });
    
    const client = clientsResponse.data.data[0];
    console.log(`✅ Cliente: ${client.name} (${client._id})`);
    
    let createdEntries = [];
    
    // 2. Crear múltiples entradas
    const testEntries = [
      {
        title: "Horarios de Atención",
        content: "Nuestros horarios son de lunes a viernes de 9:00 AM a 6:00 PM.",
        category: "horarios",
        keywords: ["horario", "atencion", "tiempo"],
        tags: ["horarios", "servicio"],
        priority: 9
      },
      {
        title: "Precios de Servicios",
        content: "Servicio básico: $50, Servicio premium: $100, Servicio empresarial: $200.",
        category: "precios",
        keywords: ["precio", "costo", "tarifa"],
        tags: ["precios", "servicios"],
        priority: 8
      },
      {
        title: "Información de Contacto",
        content: "Puede contactarnos en info@empresa.com o al teléfono 123-456-7890.",
        category: "contacto",
        keywords: ["contacto", "email", "telefono"],
        tags: ["contacto", "comunicacion"],
        priority: 7
      }
    ];
    
    console.log('\n📝 Creando entradas de prueba...');
    for (let i = 0; i < testEntries.length; i++) {
      try {
        const response = await axios.post(
          `${BASE_URL}/api/knowledge/client/${client._id}`,
          testEntries[i]
        );
        
        if (response.data.success) {
          createdEntries.push(response.data.data);
          console.log(`✅ Entrada ${i + 1} creada: ${response.data.data.title}`);
        } else {
          console.log(`❌ Error creando entrada ${i + 1}: ${response.data.error}`);
        }
      } catch (error) {
        console.log(`❌ Error creando entrada ${i + 1}: ${error.response?.data?.error || error.message}`);
      }
    }
    
    console.log(`\n📊 Total de entradas creadas: ${createdEntries.length}`);
    
    // 3. Probar todas las funcionalidades
    const tests = [
      {
        name: 'Listar entradas',
        test: async () => {
          const response = await axios.get(`${BASE_URL}/api/knowledge/client/${client._id}`);
          return {
            success: response.data.success,
            count: response.data.data.length,
            total: response.data.pagination?.total || 0
          };
        }
      },
      {
        name: 'Obtener estadísticas',
        test: async () => {
          const response = await axios.get(`${BASE_URL}/api/knowledge/client/${client._id}/stats`);
          return {
            success: response.data.success,
            total: response.data.data?.total || 0
          };
        }
      },
      {
        name: 'Buscar conocimiento',
        test: async () => {
          const response = await axios.get(`${BASE_URL}/api/knowledge/client/${client._id}/search?q=precio`);
          return {
            success: response.data.success,
            results: response.data.data?.results?.length || 0
          };
        }
      },
      {
        name: 'Conocimiento para BOT',
        test: async () => {
          const response = await axios.get(`${BASE_URL}/api/knowledge/client/${client._id}/bot-knowledge`);
          return {
            success: response.data.success,
            entries: response.data.data?.length || 0
          };
        }
      }
    ];
    
    console.log('\n🧪 Ejecutando pruebas...');
    console.log('='.repeat(40));
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
      try {
        const result = await test.test();
        
        if (result.success) {
          console.log(`✅ ${test.name}: PASÓ`);
          console.log(`   Datos: ${JSON.stringify(result)}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}: FALLÓ - No exitoso`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: FALLÓ - ${error.response?.data?.error || error.message}`);
      }
    }
    
    // 4. Resultados finales
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS FINALES');
    console.log('='.repeat(60));
    
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`✅ Pruebas exitosas: ${passed}/${total}`);
    console.log(`📈 Tasa de éxito: ${successRate}%`);
    
    if (passed === total) {
      console.log('🎉 Sistema de Base de Conocimiento: ¡COMPLETAMENTE FUNCIONAL!');
    } else if (successRate >= 75) {
      console.log('⚠️ Sistema de Base de Conocimiento: FUNCIONAL CON ADVERTENCIAS');
    } else {
      console.log('🔴 Sistema de Base de Conocimiento: REQUIERE ATENCIÓN');
    }
    
    console.log('\n💡 El sistema está listo para documentar al equipo frontend.');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error en prueba final:', error.response?.data || error.message);
  }
}

finalTest();
