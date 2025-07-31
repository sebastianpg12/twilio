// src/models/Conversation.js
const database = require('../config/database');

class Conversation {
  static async create(phoneNumber, contactName = null) {
    const conversations = database.getConversationsCollection();
    
    const conversation = {
      phoneNumber,
      contactName,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      unreadCount: 0,
      isActive: true
    };

    const result = await conversations.insertOne(conversation);
    return { ...conversation, _id: result.insertedId };
  }

  static async findByPhone(phoneNumber) {
    const conversations = database.getConversationsCollection();
    return await conversations.findOne({ phoneNumber });
  }

  static async findOrCreate(phoneNumber, contactName = null) {
    let conversation = await this.findByPhone(phoneNumber);
    
    if (!conversation) {
      conversation = await this.create(phoneNumber, contactName);
    }
    
    return conversation;
  }

  static async getAll(limit = 50, offset = 0) {
    const conversations = database.getConversationsCollection();
    return await conversations
      .find({ isActive: true })
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .skip(offset)
      .toArray();
  }

  static async updateLastMessage(phoneNumber, messageData) {
    const conversations = database.getConversationsCollection();
    
    return await conversations.updateOne(
      { phoneNumber },
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

  static async markAsRead(phoneNumber) {
    const conversations = database.getConversationsCollection();
    
    return await conversations.updateOne(
      { phoneNumber },
      {
        $set: { unreadCount: 0, updatedAt: new Date() }
      }
    );
  }

  static async getStats() {
    const conversations = database.getConversationsCollection();
    
    const totalConversations = await conversations.countDocuments({ isActive: true });
    const unreadConversations = await conversations.countDocuments({ 
      isActive: true, 
      unreadCount: { $gt: 0 } 
    });
    
    return {
      total: totalConversations,
      unread: unreadConversations,
      read: totalConversations - unreadConversations
    };
  }
}

module.exports = Conversation;
