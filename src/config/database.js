// src/config/database.js
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
      
      console.log('✅ Conectado a MongoDB Atlas');
      return this.db;
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Desconectado de MongoDB');
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Base de datos no inicializada. Llama a connect() primero.');
    }
    return this.db;
  }

  // Métodos de utilidad para las colecciones
  getConversationsCollection() {
    return this.getDb().collection('conversations');
  }

  getMessagesCollection() {
    return this.getDb().collection('messages');
  }

  getClientsCollection() {
    return this.getDb().collection('clients');
  }

  getUsersCollection() {
    return this.getDb().collection('users');
  }

  isConnected() {
    return this.client && this.db;
  }
}

module.exports = new Database();
