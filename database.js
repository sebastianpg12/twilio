// database.js
const { MongoClient } = require('mongodb');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI no está configurada en las variables de entorno');
      }

      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db('whatsapp_business');
      
      console.log('✅ Conectado a MongoDB exitosamente');
      
      // Crear índices para optimizar búsquedas
      await this.createIndexes();
      
      return this.db;
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      // Índice para conversaciones por teléfono
      await this.db.collection('conversations').createIndex({ phone: 1 });
      
      // Índice para mensajes por conversación y timestamp
      await this.db.collection('messages').createIndex({ 
        conversationId: 1, 
        timestamp: -1 
      });
      
      // Índice para buscar conversaciones por última actividad
      await this.db.collection('conversations').createIndex({ 
        lastMessageTime: -1 
      });
      
      console.log('✅ Índices de MongoDB creados');
    } catch (error) {
      console.error('❌ Error creando índices:', error);
    }
  }

  getDB() {
    if (!this.db) {
      throw new Error('Base de datos no inicializada. Llama a connect() primero.');
    }
    return this.db;
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('🔒 Conexión a MongoDB cerrada');
    }
  }
}

module.exports = new Database();
