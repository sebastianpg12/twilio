// models/Message.js
const { ObjectId } = require('mongodb');
const database = require('../database');

class MessageModel {
  constructor() {
    this.collectionName = 'messages';
  }

  async getCollection() {
    const db = database.getDB();
    return db.collection(this.collectionName);
  }

  // Guardar mensaje recibido
  async saveIncomingMessage(phone, message, mediaUrl = null) {
    const collection = await this.getCollection();
    
    const messageDoc = {
      phone: phone,
      message: message,
      mediaUrl: mediaUrl,
      type: 'incoming', // incoming = recibido, outgoing = enviado
      timestamp: new Date(),
      isRead: false,
      twilioSid: null,
      status: 'received'
    };

    const result = await collection.insertOne(messageDoc);
    return { ...messageDoc, _id: result.insertedId };
  }

  // Guardar mensaje enviado
  async saveOutgoingMessage(phone, message, twilioSid, type = 'manual') {
    const collection = await this.getCollection();
    
    const messageDoc = {
      phone: phone,
      message: message,
      mediaUrl: null,
      type: 'outgoing',
      subType: type, // manual, auto, ai-assisted
      timestamp: new Date(),
      isRead: true,
      twilioSid: twilioSid,
      status: 'sent'
    };

    const result = await collection.insertOne(messageDoc);
    return { ...messageDoc, _id: result.insertedId };
  }

  // Obtener mensajes de una conversación
  async getMessagesByPhone(phone, limit = 100, page = 0) {
    const collection = await this.getCollection();
    
    return await collection
      .find({ phone: phone })
      .sort({ timestamp: 1 }) // Orden cronológico
      .skip(page * limit)
      .limit(limit)
      .toArray();
  }

  // Obtener últimos mensajes de todas las conversaciones
  async getLatestMessages(limit = 50) {
    const collection = await this.getCollection();
    
    // Agregación para obtener el último mensaje de cada conversación
    return await collection.aggregate([
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$phone',
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$lastMessage' }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $limit: limit
      }
    ]).toArray();
  }

  // Marcar mensajes como leídos
  async markMessagesAsRead(phone) {
    const collection = await this.getCollection();
    
    await collection.updateMany(
      { phone: phone, type: 'incoming', isRead: false },
      { $set: { isRead: true } }
    );
  }

  // Obtener estadísticas de mensajes
  async getMessageStats(phone = null) {
    const collection = await this.getCollection();
    
    const matchStage = phone ? { phone: phone } : {};
    
    return await collection.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          incomingMessages: {
            $sum: { $cond: [{ $eq: ['$type', 'incoming'] }, 1, 0] }
          },
          outgoingMessages: {
            $sum: { $cond: [{ $eq: ['$type', 'outgoing'] }, 1, 0] }
          },
          unreadMessages: {
            $sum: { $cond: [{ $and: [
              { $eq: ['$type', 'incoming'] },
              { $eq: ['$isRead', false] }
            ]}, 1, 0] }
          }
        }
      }
    ]).toArray();
  }

  // Buscar mensajes por texto
  async searchMessages(searchTerm, phone = null) {
    const collection = await this.getCollection();
    
    const query = {
      message: { $regex: searchTerm, $options: 'i' }
    };
    
    if (phone) {
      query.phone = phone;
    }
    
    return await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
  }
}

module.exports = new MessageModel();
