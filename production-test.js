// production-test.js - Prueba completa del sistema de conocimiento corregida
require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const ADMIN_KEY = 'admin123';

class KnowledgeTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.testClient = null;
    this.createdEntries = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📝';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async test(name, testFunction) {
    try {
      this.log(`Ejecutando: ${name}`);
      await testFunction();
      this.results.passed++;
      this.log(`${name}: PASÓ`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
      this.log(`${name}: FALLÓ - ${error.message}`, 'error');
    }
  }

  async setup() {
    this.log('🔧 Configurando pruebas...');
    
    try {
      // Obtener cliente existente
      const clientsResponse = await axios.get(`${BASE_URL}/api/admin/clients`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      
      if (!clientsResponse.data.success || clientsResponse.data.data.length === 0) {
        throw new Error('No hay clientes disponibles para pruebas');
      }

      this.testClient = clientsResponse.data.data[0];
      this.log(`Cliente de prueba: ${this.testClient.name} (ID: ${this.testClient._id})`, 'success');
      
      return true;
    } catch (error) {
      this.log(`Error en configuración: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    const setupOk = await this.setup();
    if (!setupOk) {
      this.log('❌ No se pudo configurar las pruebas', 'error');
      return;
    }

    // Ejecutar todas las pruebas
    await this.test('Crear entrada de conocimiento', () => this.testCreateEntry());
    await this.test('Listar entradas del cliente', () => this.testListEntries());
    await this.test('Obtener entrada específica', () => this.testGetSpecificEntry());
    await this.test('Buscar en conocimiento', () => this.testSearchKnowledge());
    await this.test('Obtener estadísticas', () => this.testGetStats());
    await this.test('Obtener conocimiento para BOT', () => this.testGetBotKnowledge());
    await this.test('Actualizar entrada', () => this.testUpdateEntry());
    await this.test('Soft delete de entrada', () => this.testSoftDelete());
    await this.test('Reactivar entrada', () => this.testReactivateEntry());
    await this.test('Acciones en lote', () => this.testBulkActions());
    await this.test('Exportar conocimiento', () => this.testExportKnowledge());
    await this.test('Eliminar permanentemente', () => this.testPermanentDelete());

    // Mostrar resultados
    this.showResults();
  }

  async testCreateEntry() {
    const entryData = {
      title: "Prueba - Horarios de Atención",
      content: "Horarios de prueba: Lunes a viernes de 9:00 AM a 6:00 PM.",
      category: "horarios",
      keywords: ["horario", "prueba", "atencion"],
      tags: ["test", "horarios"],
      priority: 8
    };

    const response = await axios.post(
      `${BASE_URL}/api/knowledge/client/${this.testClient._id}`,
      entryData
    );

    if (!response.data.success) {
      throw new Error(`Error creando entrada: ${response.data.error}`);
    }

    this.createdEntries.push(response.data.data);

    // Crear más entradas para las pruebas
    const additionalEntries = [
      {
        title: "Prueba - Precios de Servicios",
        content: "Precios de prueba: Servicio básico $50, Premium $100.",
        category: "precios",
        keywords: ["precio", "servicio", "basico", "premium"],
        tags: ["test", "precios"],
        priority: 9
      },
      {
        title: "Prueba - Información de Contacto",
        content: "Contacto de prueba: email@test.com, teléfono: 123-456-7890.",
        category: "contacto",
        keywords: ["contacto", "email", "telefono"],
        tags: ["test", "contacto"],
        priority: 7
      }
    ];

    for (const entry of additionalEntries) {
      const additionalResponse = await axios.post(
        `${BASE_URL}/api/knowledge/client/${this.testClient._id}`,
        entry
      );
      if (additionalResponse.data.success) {
        this.createdEntries.push(additionalResponse.data.data);
      }
    }
  }

  async testListEntries() {
    const response = await axios.get(
      `${BASE_URL}/api/knowledge/client/${this.testClient._id}?limit=10`
    );

    if (!response.data.success) {
      throw new Error(`Error listando entradas: ${response.data.error}`);
    }

    if (response.data.data.length < 3) {
      throw new Error(`Se esperaban al menos 3 entradas, se obtuvieron ${response.data.data.length}`);
    }
  }

  async testGetSpecificEntry() {
    if (this.createdEntries.length === 0) {
      throw new Error('No hay entradas creadas para probar');
    }

    const entryId = this.createdEntries[0]._id;
    const response = await axios.get(`${BASE_URL}/api/knowledge/entry/${entryId}`);

    if (!response.data.success) {
      throw new Error(`Error obteniendo entrada específica: ${response.data.error}`);
    }

    if (response.data.data._id !== entryId) {
      throw new Error('La entrada obtenida no coincide con la solicitada');
    }
  }

  async testSearchKnowledge() {
    const response = await axios.get(
      `${BASE_URL}/api/knowledge/client/${this.testClient._id}/search?q=prueba&limit=5`
    );

    if (!response.data.success) {
      throw new Error(`Error buscando conocimiento: ${response.data.error}`);
    }

    if (response.data.data.results.length === 0) {
      throw new Error('No se encontraron resultados en la búsqueda');
    }
  }

  async testGetStats() {
    const response = await axios.get(
      `${BASE_URL}/api/knowledge/client/${this.testClient._id}/stats`
    );

    if (!response.data.success) {
      throw new Error(`Error obteniendo estadísticas: ${response.data.error}`);
    }

    if (response.data.data.total < 3) {
      throw new Error(`Se esperaban al menos 3 entradas en estadísticas, se obtuvieron ${response.data.data.total}`);
    }
  }

  async testGetBotKnowledge() {
    const response = await axios.get(
      `${BASE_URL}/api/knowledge/client/${this.testClient._id}/bot-knowledge`
    );

    if (!response.data.success) {
      throw new Error(`Error obteniendo conocimiento para BOT: ${response.data.error}`);
    }

    if (response.data.data.length === 0) {
      throw new Error('No se obtuvo conocimiento para el BOT');
    }
  }

  async testUpdateEntry() {
    if (this.createdEntries.length === 0) {
      throw new Error('No hay entradas creadas para actualizar');
    }

    const entryId = this.createdEntries[0]._id;
    const updateData = {
      content: "Contenido actualizado en prueba",
      priority: 10
    };

    const response = await axios.put(
      `${BASE_URL}/api/knowledge/entry/${entryId}`,
      updateData
    );

    if (!response.data.success) {
      throw new Error(`Error actualizando entrada: ${response.data.error}`);
    }

    if (response.data.data.version !== 2) {
      throw new Error('La versión no se incrementó correctamente');
    }
  }

  async testSoftDelete() {
    if (this.createdEntries.length < 2) {
      throw new Error('No hay suficientes entradas para probar soft delete');
    }

    const entryId = this.createdEntries[1]._id;
    const response = await axios.delete(`${BASE_URL}/api/knowledge/entry/${entryId}`);

    if (!response.data.success) {
      throw new Error(`Error en soft delete: ${response.data.error}`);
    }

    if (response.data.data.isActive !== false) {
      throw new Error('La entrada no se desactivó correctamente');
    }
  }

  async testReactivateEntry() {
    if (this.createdEntries.length < 2) {
      throw new Error('No hay entradas eliminadas para reactivar');
    }

    const entryId = this.createdEntries[1]._id;
    const response = await axios.post(`${BASE_URL}/api/knowledge/entry/${entryId}/reactivate`);

    if (!response.data.success) {
      throw new Error(`Error reactivando entrada: ${response.data.error}`);
    }

    if (response.data.data.isActive !== true) {
      throw new Error('La entrada no se reactivó correctamente');
    }
  }

  async testBulkActions() {
    if (this.createdEntries.length < 2) {
      throw new Error('No hay suficientes entradas para acciones en lote');
    }

    const entryIds = this.createdEntries.slice(0, 2).map(e => e._id);
    const response = await axios.post(
      `${BASE_URL}/api/knowledge/client/${this.testClient._id}/bulk-actions`,
      {
        action: 'update-priority',
        entryIds: entryIds,
        settings: { priority: 6 }
      }
    );

    if (!response.data.success) {
      throw new Error(`Error en acciones en lote: ${response.data.error}`);
    }

    if (response.data.data.affected < 2) {
      throw new Error('No se afectaron las entradas esperadas');
    }
  }

  async testExportKnowledge() {
    const response = await axios.get(
      `${BASE_URL}/api/knowledge/client/${this.testClient._id}/export?format=json`
    );

    if (!response.data.success) {
      throw new Error(`Error exportando conocimiento: ${response.data.error}`);
    }

    if (response.data.data.totalEntries === 0) {
      throw new Error('No se exportaron entradas');
    }
  }

  async testPermanentDelete() {
    if (this.createdEntries.length < 3) {
      throw new Error('No hay suficientes entradas para eliminar permanentemente');
    }

    const entryId = this.createdEntries[2]._id;
    const response = await axios.delete(
      `${BASE_URL}/api/knowledge/entry/${entryId}?permanent=true`
    );

    if (!response.data.success) {
      throw new Error(`Error eliminando permanentemente: ${response.data.error}`);
    }
  }

  showResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DE PRUEBAS');
    console.log('='.repeat(60));
    
    const total = this.results.passed + this.results.failed;
    const successRate = ((this.results.passed / total) * 100).toFixed(1);
    
    console.log(`✅ Pruebas exitosas: ${this.results.passed}`);
    console.log(`❌ Pruebas fallidas: ${this.results.failed}`);
    console.log(`📈 Tasa de éxito: ${successRate}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Pruebas fallidas:');
      this.results.errors.forEach(error => {
        console.log(`   • ${error.test}: ${error.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.results.failed === 0) {
      console.log('🎉 Sistema de Base de Conocimiento: ¡COMPLETAMENTE FUNCIONAL!');
    } else if (successRate >= 80) {
      console.log('⚠️ Sistema de Base de Conocimiento: FUNCIONAL CON ADVERTENCIAS');
    } else {
      console.log('🔴 Sistema de Base de Conocimiento: REQUIERE ATENCIÓN');
    }
  }
}

// Ejecutar pruebas
async function runTests() {
  const testSuite = new KnowledgeTestSuite();
  await testSuite.runAllTests();
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { KnowledgeTestSuite };
