// src/models/Conversation.js
const database = require('../config/database');
const { ObjectId } = require('mongodb');

class Conversation {
  static async create(phoneNumber, clientId, contactName = null) {
    const conversations = database.getConversationsCollection();
    
    const conversation = {
      phoneNumber,
      clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId,
      contactName,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      unreadCount: 0,
      isActive: true,
      aiSettings: {
        enabled: null, // null = usar configuración del cliente, true/false = override por conversación
        autoResponse: null
      }
    };

    const result = await conversations.insertOne(conversation);
    return { ...conversation, _id: result.insertedId };
  }

  static async findByPhoneAndClient(phoneNumber, clientId) {
    const conversations = database.getConversationsCollection();
    return await conversations.findOne({ 
      phoneNumber,
      clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId
    });
  }

  static async findOrCreate(phoneNumber, clientId, contactName = null) {
    let conversation = await this.findByPhoneAndClient(phoneNumber, clientId);
    
    if (!conversation) {
      conversation = await this.create(phoneNumber, clientId, contactName);
    }
    
    return conversation;
  }

  static async getAllByClient(clientId, limit = 50, offset = 0) {
    const conversations = database.getConversationsCollection();
    return await conversations
      .find({ 
        clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId,
        isActive: true 
      })
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .skip(offset)
      .toArray();
  }

  static async updateLastMessage(phoneNumber, clientId, messageData) {
    const conversations = database.getConversationsCollection();
    
    return await conversations.updateOne(
      { 
        phoneNumber,
        clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId
      },
      {
        $set: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
          lastMessage: {
            text: messageData.text,
            type: messageData.type,
            timestamp: messageData.timestamp
          }
        },
        $inc: { unreadCount: messageData.type === 'received' ? 1 : 0 }
      }
    );
  }

  static async markAsRead(phoneNumber, clientId) {
    const conversations = database.getConversationsCollection();
    
    return await conversations.updateOne(
      { 
        phoneNumber,
        clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId
      },
      {
        $set: { unreadCount: 0, updatedAt: new Date() }
      }
    );
  }

  static async getStatsByClient(clientId) {
    const conversations = database.getConversationsCollection();
    
    const totalConversations = await conversations.countDocuments({ 
      clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId,
      isActive: true 
    });
    const unreadConversations = await conversations.countDocuments({ 
      clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId,
      isActive: true, 
      unreadCount: { $gt: 0 } 
    });
    
    return {
      total: totalConversations,
      unread: unreadConversations,
      read: totalConversations - unreadConversations
    };
  }

  // Métodos para control de IA por conversación
  static async toggleAI(phoneNumber, clientId, enabled) {
    const conversations = database.getConversationsCollection();
    
    return await conversations.updateOne(
      { 
        phoneNumber,
        clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId
      },
      {
        $set: {
          'aiSettings.enabled': enabled,
          updatedAt: new Date()
        }
      }
    );
  }

  static async toggleAutoResponse(phoneNumber, clientId, enabled) {
    const conversations = database.getConversationsCollection();
    
    return await conversations.updateOne(
      { 
        phoneNumber,
        clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId
      },
      {
        $set: {
          'aiSettings.autoResponse': enabled,
          updatedAt: new Date()
        }
      }
    );
  }
}

module.exports = Conversation;
