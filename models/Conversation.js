// models/Conversation.js
const { ObjectId } = require('mongodb');
const database = require('../database');

class ConversationModel {
  constructor() {
    this.collectionName = 'conversations';
  }

  async getCollection() {
    const db = database.getDB();
    return db.collection(this.collectionName);
  }

  // Crear o actualizar conversación
  async upsertConversation(phone, contactName = null) {
    const collection = await this.getCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
      { phone: phone },
      {
        $set: {
          phone: phone,
          contactName: contactName || phone,
          lastMessageTime: now,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now,
          messageCount: 0,
          isActive: true
        }
      },
      { 
        upsert: true, 
        returnDocument: 'after' 
      }
    );

    return result.value;
  }

  // Obtener todas las conversaciones ordenadas por última actividad
  async getAllConversations(limit = 50) {
    const collection = await this.getCollection();
    
    return await collection
      .find({ isActive: true })
      .sort({ lastMessageTime: -1 })
      .limit(limit)
      .toArray();
  }

  // Obtener conversación por teléfono
  async getConversationByPhone(phone) {
    const collection = await this.getCollection();
    return await collection.findOne({ phone: phone });
  }

  // Actualizar contador de mensajes
  async incrementMessageCount(phone) {
    const collection = await this.getCollection();
    
    await collection.updateOne(
      { phone: phone },
      { 
        $inc: { messageCount: 1 },
        $set: { lastMessageTime: new Date() }
      }
    );
  }

  // Marcar conversación como leída
  async markAsRead(phone) {
    const collection = await this.getCollection();
    
    await collection.updateOne(
      { phone: phone },
      { $set: { unreadCount: 0 } }
    );
  }

  // Archivar conversación
  async archiveConversation(phone) {
    const collection = await this.getCollection();
    
    await collection.updateOne(
      { phone: phone },
      { $set: { isActive: false, archivedAt: new Date() } }
    );
  }
}

module.exports = new ConversationModel();
