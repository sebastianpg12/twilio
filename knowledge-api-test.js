// knowledge-api-test.js - Prueba completa del sistema de base de conocimiento
require('dotenv').config();

const axios = require('axios');

// Configuración para pruebas
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_KEY = 'admin123';

class KnowledgeAPITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 ${name}...`);
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      console.log(`✅ ${name} - PASSED\n`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ ${name} - FAILED: ${error.message}\n`);
    }
  }

  async runAllTests() {
    console.log('🚀 Iniciando pruebas completas del sistema de base de conocimiento\n');
    console.log(`📡 Base URL: ${BASE_URL}\n`);

    // 1. Obtener cliente para pruebas
    let testClient = null;
    await this.test('Obtener cliente para pruebas', async () => {
      const response = await axios.get(`${BASE_URL}/api/admin/clients?limit=1`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      
      if (!response.data.success || !response.data.data.length) {
        throw new Error('No hay clientes disponibles para pruebas');
      }
      
      testClient = response.data.data[0];
      console.log(`   Cliente: ${testClient.name} (${testClient._id})`);
    });

    if (!testClient) {
      console.log('❌ No se puede continuar sin cliente de prueba');
      return this.showResults();
    }

    let createdEntries = [];

    // 2. Crear entradas de conocimiento
    await this.test('Crear entrada de conocimiento - Horarios', async () => {
      const entryData = {
        title: "Horarios de Atención",
        content: "Lunes a viernes: 9:00 AM - 6:00 PM. Sábados: 9:00 AM - 2:00 PM. Domingos: Cerrado.",
        category: "horarios",
        keywords: ["horario", "atencion", "lunes", "viernes", "sabado"],
        tags: ["servicio-cliente"],
        priority: 9
      };

      const response = await axios.post(
        `${BASE_URL}/api/knowledge/client/${testClient._id}`,
        entryData
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error creando entrada');
      }

      createdEntries.push(response.data.data);
      console.log(`   Entrada creada: ${response.data.data._id}`);
    });

    await this.test('Crear entrada de conocimiento - Precios', async () => {
      const entryData = {
        title: "Lista de Precios 2025",
        content: "Consultoría básica: $75/hora. Consultoría premium: $120/hora. Desarrollo web: $100/hora. Todos los precios en USD.",
        category: "precios",
        keywords: ["precio", "consultoría", "desarrollo", "hora", "usd"],
        tags: ["precios", "servicios"],
        priority: 10
      };

      const response = await axios.post(
        `${BASE_URL}/api/knowledge/client/${testClient._id}`,
        entryData
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error creando entrada');
      }

      createdEntries.push(response.data.data);
      console.log(`   Entrada creada: ${response.data.data._id}`);
    });

    await this.test('Crear entrada de conocimiento - Contacto', async () => {
      const entryData = {
        title: "Información de Contacto",
        content: `Email: ${testClient.email}. WhatsApp: ${testClient.twilioPhoneNumber}. Oficina: Calle 123 #45-67, Bogotá, Colombia.`,
        category: "contacto",
        keywords: ["contacto", "email", "whatsapp", "oficina", "bogota"],
        tags: ["contacto", "ubicacion"],
        priority: 8
      };

      const response = await axios.post(
        `${BASE_URL}/api/knowledge/client/${testClient._id}`,
        entryData
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error creando entrada');
      }

      createdEntries.push(response.data.data);
      console.log(`   Entrada creada: ${response.data.data._id}`);
    });

    // 3. Obtener todas las entradas
    await this.test('Obtener todas las entradas del cliente', async () => {
      const response = await axios.get(`${BASE_URL}/api/knowledge/client/${testClient._id}`);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error obteniendo entradas');
      }

      const entries = response.data.data;
      if (entries.length < 3) {
        throw new Error(`Se esperaban al menos 3 entradas, se obtuvieron ${entries.length}`);
      }

      console.log(`   Entradas obtenidas: ${entries.length}`);
      console.log(`   Categorías: ${[...new Set(entries.map(e => e.category))].join(', ')}`);
    });

    // 4. Obtener entrada específica
    if (createdEntries.length > 0) {
      await this.test('Obtener entrada específica', async () => {
        const entryId = createdEntries[0]._id;
        const response = await axios.get(`${BASE_URL}/api/knowledge/entry/${entryId}`);

        if (!response.data.success) {
          throw new Error(response.data.error || 'Error obteniendo entrada específica');
        }

        const entry = response.data.data;
        if (entry._id !== entryId) {
          throw new Error('ID de entrada no coincide');
        }

        console.log(`   Entrada: "${entry.title}" (${entry.category})`);
      });
    }

    // 5. Actualizar entrada
    if (createdEntries.length > 0) {
      await this.test('Actualizar entrada de conocimiento', async () => {
        const entryId = createdEntries[0]._id;
        const updateData = {
          content: createdEntries[0].content + " [ACTUALIZADO]",
          priority: 7,
          tags: [...(createdEntries[0].tags || []), "actualizado"]
        };

        const response = await axios.put(
          `${BASE_URL}/api/knowledge/entry/${entryId}`,
          updateData
        );

        if (!response.data.success) {
          throw new Error(response.data.error || 'Error actualizando entrada');
        }

        const updatedEntry = response.data.data;
        if (updatedEntry.version <= createdEntries[0].version) {
          throw new Error('La versión no se incrementó');
        }

        console.log(`   Versión actualizada: ${updatedEntry.version}`);
      });
    }

    // 6. Búsqueda en base de conocimiento
    await this.test('Búsqueda de conocimiento - "precios"', async () => {
      const response = await axios.get(
        `${BASE_URL}/api/knowledge/client/${testClient._id}/search?q=precios&limit=5`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error en búsqueda');
      }

      const results = response.data.data.results;
      console.log(`   Resultados encontrados: ${results.length}`);
      
      if (results.length > 0) {
        console.log(`   Mejor coincidencia: "${results[0].title}" (score: ${results[0].relevanceScore})`);
      }
    });

    await this.test('Búsqueda de conocimiento - "horarios"', async () => {
      const response = await axios.get(
        `${BASE_URL}/api/knowledge/client/${testClient._id}/search?q=horarios&limit=5`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error en búsqueda');
      }

      const results = response.data.data.results;
      console.log(`   Resultados encontrados: ${results.length}`);
    });

    // 7. Obtener estadísticas
    await this.test('Obtener estadísticas del cliente', async () => {
      const response = await axios.get(`${BASE_URL}/api/knowledge/client/${testClient._id}/stats`);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error obteniendo estadísticas');
      }

      const stats = response.data.data;
      console.log(`   Total: ${stats.total}, Activas: ${stats.active}, Categorías: ${stats.categories.length}`);
    });

    // 8. Conocimiento para BOT
    await this.test('Obtener conocimiento para BOT', async () => {
      const response = await axios.get(`${BASE_URL}/api/knowledge/client/${testClient._id}/bot-knowledge`);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error obteniendo conocimiento para BOT');
      }

      const botKnowledge = response.data.data;
      console.log(`   Entradas para BOT: ${botKnowledge.length}`);
      
      if (botKnowledge.length > 0) {
        console.log(`   Primera entrada: "${botKnowledge[0].title}" (prioridad: ${botKnowledge[0].priority})`);
      }
    });

    // 9. Filtrado por categoría
    await this.test('Filtrar entradas por categoría "precios"', async () => {
      const response = await axios.get(
        `${BASE_URL}/api/knowledge/client/${testClient._id}?category=precios&limit=10`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error filtrando por categoría');
      }

      const entries = response.data.data;
      const allArePrecios = entries.every(entry => entry.category === 'precios');
      
      if (!allArePrecios) {
        throw new Error('No todas las entradas son de categoría "precios"');
      }

      console.log(`   Entradas de precios: ${entries.length}`);
    });

    // 10. Acciones en lote
    if (createdEntries.length >= 2) {
      await this.test('Acciones en lote - Cambiar prioridad', async () => {
        const entryIds = createdEntries.slice(0, 2).map(e => e._id);
        
        const response = await axios.post(
          `${BASE_URL}/api/knowledge/client/${testClient._id}/bulk-actions`,
          {
            action: "update-priority",
            entryIds: entryIds,
            settings: { priority: 6 }
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.error || 'Error en acción en lote');
        }

        console.log(`   ${response.data.message}`);
      });
    }

    // 11. Exportar conocimiento
    await this.test('Exportar conocimiento del cliente', async () => {
      const response = await axios.get(
        `${BASE_URL}/api/knowledge/client/${testClient._id}/export?format=json`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error exportando conocimiento');
      }

      const exportData = response.data.data;
      console.log(`   Entradas exportadas: ${exportData.totalEntries}`);
      console.log(`   Fecha de exportación: ${exportData.exportDate}`);
    });

    // 12. APIs de administrador
    await this.test('API Admin - Ver todas las entradas del sistema', async () => {
      const response = await axios.get(`${BASE_URL}/api/knowledge/admin/all?limit=10`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error obteniendo entradas del sistema');
      }

      const entries = response.data.data;
      console.log(`   Entradas del sistema: ${entries.length}`);
    });

    await this.test('API Admin - Estadísticas del sistema', async () => {
      const response = await axios.get(`${BASE_URL}/api/knowledge/admin/stats`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error obteniendo estadísticas del sistema');
      }

      const stats = response.data.data;
      console.log(`   Total entradas sistema: ${stats.overview.totalEntries}`);
      console.log(`   Clientes con conocimiento: ${stats.overview.clientsWithKnowledge}`);
    });

    // 13. Soft delete y reactivación
    if (createdEntries.length > 0) {
      await this.test('Soft delete de entrada', async () => {
        const entryId = createdEntries[createdEntries.length - 1]._id;
        
        const response = await axios.delete(`${BASE_URL}/api/knowledge/entry/${entryId}`);

        if (!response.data.success) {
          throw new Error(response.data.error || 'Error eliminando entrada');
        }

        console.log(`   Entrada eliminada: ${response.data.data.title}`);
      });

      await this.test('Reactivar entrada eliminada', async () => {
        const entryId = createdEntries[createdEntries.length - 1]._id;
        
        const response = await axios.post(`${BASE_URL}/api/knowledge/entry/${entryId}/reactivate`);

        if (!response.data.success) {
          throw new Error(response.data.error || 'Error reactivando entrada');
        }

        console.log(`   Entrada reactivada: ${response.data.data.title}`);
      });
    }

    // 14. Limpiar datos de prueba
    await this.test('Limpiar datos de prueba', async () => {
      const entryIds = createdEntries.map(e => e._id);
      
      const response = await axios.post(
        `${BASE_URL}/api/knowledge/client/${testClient._id}/bulk-actions`,
        {
          action: "delete-permanent",
          entryIds: entryIds,
          settings: {}
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error limpiando datos de prueba');
      }

      console.log(`   ${response.data.message}`);
    });

    this.showResults();
  }

  showResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTADOS DE LAS PRUEBAS');
    console.log('='.repeat(50));
    console.log(`✅ Pruebas exitosas: ${this.results.passed}`);
    console.log(`❌ Pruebas fallidas: ${this.results.failed}`);
    console.log(`📈 Tasa de éxito: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Pruebas fallidas:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }

    console.log('\n🎉 Sistema de Base de Conocimiento:', 
      this.results.failed === 0 ? 'COMPLETAMENTE FUNCIONAL' : 'REQUIERE ATENCIÓN');
    console.log('='.repeat(50));
  }
}

// Ejecutar pruebas
if (require.main === module) {
  const tester = new KnowledgeAPITester();
  tester.runAllTests().catch(error => {
    console.error('❌ Error ejecutando pruebas:', error.message);
    process.exit(1);
  });
}

module.exports = KnowledgeAPITester;
