// src/services/conversationService.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

class ConversationService {
  /**
   * Procesa un mensaje entrante y actualiza la conversación
   */
  static async processIncomingMessage(phoneNumber, messageText, mediaUrl = null) {
    try {
      // Encontrar o crear conversación
      const conversation = await Conversation.findOrCreate(phoneNumber);
      
      // Crear mensaje
      const messageData = {
        phoneNumber,
        text: messageText,
        type: 'received',
        mediaUrl
      };
      
      const message = await Message.create(messageData);
      
      // Actualizar conversación con último mensaje
      await Conversation.updateLastMessage(phoneNumber, {
        text: messageText,
        type: 'received',
        timestamp: new Date()
      });
      
      return { conversation, message };
    } catch (error) {
      console.error('Error procesando mensaje entrante:', error);
      throw error;
    }
  }

  /**
   * Envía un mensaje y lo guarda en la BD
   */
  static async sendMessage(phoneNumber, messageText, type = 'sent', metadata = {}) {
    try {
      // Encontrar o crear conversación
      const conversation = await Conversation.findOrCreate(phoneNumber);
      
      // Crear mensaje
      const messageData = {
        phoneNumber,
        text: messageText,
        type,
        twilioSid: metadata.twilioSid,
        isAiGenerated: metadata.isAiGenerated || false,
        aiPrompt: metadata.aiPrompt
      };
      
      const message = await Message.create(messageData);
      
      // Actualizar conversación con último mensaje
      await Conversation.updateLastMessage(phoneNumber, {
        text: messageText,
        type,
        timestamp: new Date()
      });
      
      return { conversation, message };
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las conversaciones ordenadas por fecha
   */
  static async getAllConversations(limit = 50, offset = 0) {
    return await Conversation.getAll(limit, offset);
  }

  /**
   * Obtiene el historial completo de una conversación
   */
  static async getConversationHistory(phoneNumber) {
    const conversation = await Conversation.findByPhone(phoneNumber);
    if (!conversation) {
      throw new Error('Conversación no encontrada');
    }

    const messages = await Message.getConversationHistory(phoneNumber);
    
    return {
      conversation,
      messages
    };
  }

  /**
   * Marca una conversación como leída
   */
  static async markAsRead(phoneNumber) {
    return await Conversation.markAsRead(phoneNumber);
  }

  /**
   * Obtiene estadísticas generales
   */
  static async getStats() {
    const conversationStats = await Conversation.getStats();
    const messageStats = await Message.getStats();
    
    return {
      conversations: conversationStats,
      messages: messageStats,
      timestamp: new Date()
    };
  }

  /**
   * Busca conversaciones por número de teléfono o nombre
   */
  static async searchConversations(query) {
    // Implementar búsqueda en conversaciones
    // Por ahora búsqueda simple por texto en mensajes
    const messages = await Message.searchMessages(query);
    
    // Agrupar por número de teléfono
    const phoneNumbers = [...new Set(messages.map(m => m.phoneNumber))];
    
    const conversations = [];
    for (const phone of phoneNumbers) {
      const conversation = await Conversation.findByPhone(phone);
      if (conversation) {
        conversations.push(conversation);
      }
    }
    
    return conversations;
  }
}

module.exports = ConversationService;
