// src/models/Message.js
const database = require('../config/database');
const { ObjectId } = require('mongodb');

class Message {
  static async create(messageData) {
    const messages = database.getMessagesCollection();
    
    const message = {
      phoneNumber: messageData.phoneNumber,
      clientId: typeof messageData.clientId === 'string' ? new ObjectId(messageData.clientId) : messageData.clientId,
      text: messageData.text,
      type: messageData.type, // 'sent', 'received', 'ai-auto', 'ai-assisted'
      twilioSid: messageData.twilioSid || null,
      timestamp: new Date(),
      status: messageData.status || 'delivered', // 'sent', 'delivered', 'read', 'failed'
      metadata: {
        isAiGenerated: messageData.isAiGenerated || false,
        aiPrompt: messageData.aiPrompt || null,
        mediaUrl: messageData.mediaUrl || null
      }
    };

    const result = await messages.insertOne(message);
    return { ...message, _id: result.insertedId };
  }

  static async getByPhoneAndClient(phoneNumber, clientId, limit = 100, offset = 0) {
    const messages = database.getMessagesCollection();
    return await messages
      .find({ 
        phoneNumber,
        clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .toArray();
  }

  static async getConversationHistory(phoneNumber, clientId, limit = 100) {
    const messages = database.getMessagesCollection();
    return await messages
      .find({ 
        phoneNumber,
        clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId
      })
      .sort({ timestamp: 1 }) // Orden cronológico para la conversación
      .limit(limit)
      .toArray();
  }

  static async updateStatus(twilioSid, status) {
    const messages = database.getMessagesCollection();
    return await messages.updateOne(
      { twilioSid },
      { $set: { status, updatedAt: new Date() } }
    );
  }

  static async getStats(days = 30) {
    const messages = database.getMessagesCollection();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ];

    const result = await messages.aggregate(pipeline).toArray();
    
    const stats = {
      sent: 0,
      received: 0,
      aiAuto: 0,
      aiAssisted: 0,
      total: 0
    };

    result.forEach(item => {
      switch (item._id) {
        case 'sent':
          stats.sent = item.count;
          break;
        case 'received':
          stats.received = item.count;
          break;
        case 'ai-auto':
          stats.aiAuto = item.count;
          break;
        case 'ai-assisted':
          stats.aiAssisted = item.count;
          break;
      }
      stats.total += item.count;
    });

    return stats;
  }

  static async searchMessages(query, limit = 50) {
    const messages = database.getMessagesCollection();
    return await messages
      .find({
        text: { $regex: query, $options: 'i' }
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  static async getStatsByClient(clientId) {
    const messages = database.getMessagesCollection();
    
    const pipeline = [
      {
        $match: {
          clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ];

    const result = await messages.aggregate(pipeline).toArray();
    
    const stats = {
      sent: 0,
      received: 0,
      aiAuto: 0,
      aiAssisted: 0,
      total: 0,
      aiGenerated: 0
    };

    result.forEach(item => {
      switch (item._id) {
        case 'sent':
          stats.sent = item.count;
          break;
        case 'received':
          stats.received = item.count;
          break;
        case 'ai-auto':
          stats.aiAuto = item.count;
          stats.aiGenerated += item.count;
          break;
        case 'ai-assisted':
          stats.aiAssisted = item.count;
          stats.aiGenerated += item.count;
          break;
      }
      stats.total += item.count;
    });

    return stats;
  }

  static async searchMessagesByClient(clientId, query, limit = 50) {
    const messages = database.getMessagesCollection();
    return await messages
      .find({
        clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId,
        text: { $regex: query, $options: 'i' }
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  // Métodos adicionales para soporte multi-cliente
  static async getAll(limit = 1000, offset = 0) {
    const messages = database.getMessagesCollection();
    return await messages
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .toArray();
  }

  static async getByClient(clientId, limit = 1000, offset = 0) {
    const messages = database.getMessagesCollection();
    return await messages
      .find({ 
        clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .toArray();
  }
}

module.exports = Message;
