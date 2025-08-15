// src/services/conversationService.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Client = require('../models/Client');

class ConversationService {
  /**
   * Procesa un mensaje entrante y actualiza la conversación
   */
  static async processIncomingMessage(twilioPhoneNumber, phoneNumber, messageText, mediaUrl = null) {
    try {
      // Encontrar cliente por número de Twilio
      let client = await Client.findByTwilioNumber(twilioPhoneNumber);
      
      // Si no existe cliente, crear MarketTech por defecto
      if (!client) {
        console.log(`⚠️ No se encontró cliente para el número de Twilio: ${twilioPhoneNumber}`);
        console.log('🏢 Creando cliente MarketTech por defecto...');
        client = await Client.createDefaultMarketTech();
      }
      
      // Encontrar o crear conversación
      const conversation = await Conversation.findOrCreate(phoneNumber, client._id);
      
      // Crear mensaje
      const messageData = {
        phoneNumber,
        clientId: client._id,
        text: messageText,
        type: 'received',
        mediaUrl
      };
      
      const message = await Message.create(messageData);
      
      // Actualizar conversación con último mensaje
      await Conversation.updateLastMessage(phoneNumber, client._id, {
        text: messageText,
        type: 'received',
        timestamp: new Date()
      });
      
      return { conversation, message, client };
    } catch (error) {
      console.error('Error procesando mensaje entrante:', error);
      throw error;
    }
  }

  /**
   * Envía un mensaje y lo guarda en la BD
   */
  static async sendMessage(phoneNumber, clientId, messageText, type = 'sent', metadata = {}) {
    try {
      // Encontrar o crear conversación
      const conversation = await Conversation.findOrCreate(phoneNumber, clientId);
      
      // Crear mensaje
      const messageData = {
        phoneNumber,
        clientId,
        text: messageText,
        type,
        twilioSid: metadata.twilioSid,
        isAiGenerated: metadata.isAiGenerated || type.startsWith('ai'),
        aiPrompt: metadata.aiPrompt,
        source: metadata.source || 'system',
        metadata: metadata.metadata || {}
      };
      
      const message = await Message.create(messageData);
      
      // Actualizar conversación con último mensaje
      await Conversation.updateLastMessage(phoneNumber, clientId, {
        text: messageText,
        type,
        timestamp: metadata.timestamp || new Date()
      });
      
      return { conversation, message };
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las conversaciones de un cliente ordenadas por fecha
   */
  static async getAllConversationsByClient(clientId, limit = 50, offset = 0) {
    return await Conversation.getAllByClient(clientId, limit, offset);
  }

  /**
   * Obtiene el historial completo de una conversación
   */
  static async getConversationHistory(phoneNumber, clientId) {
    const conversation = await Conversation.findByPhoneAndClient(phoneNumber, clientId);
    if (!conversation) {
      throw new Error('Conversación no encontrada');
    }

    const messages = await Message.getConversationHistory(phoneNumber, clientId);
    
    return {
      conversation,
      messages
    };
  }

  /**
   * Marca una conversación como leída
   */
  static async markAsRead(phoneNumber, clientId) {
    return await Conversation.markAsRead(phoneNumber, clientId);
  }

  /**
   * Obtiene estadísticas de un cliente específico
   */
  static async getStatsByClient(clientId) {
    const conversationStats = await Conversation.getStatsByClient(clientId);
    const messageStats = await Message.getStatsByClient(clientId);
    
    return {
      conversations: conversationStats,
      messages: messageStats,
      timestamp: new Date()
    };
  }

  /**
   * Busca conversaciones por número de teléfono o nombre dentro de un cliente
   */
  static async searchConversationsByClient(clientId, query) {
    // Implementar búsqueda en conversaciones por cliente
    const messages = await Message.searchMessagesByClient(clientId, query);
    
    // Agrupar por número de teléfono
    const phoneNumbers = [...new Set(messages.map(m => m.phoneNumber))];
    
    const conversations = [];
    for (const phone of phoneNumbers) {
      const conversation = await Conversation.findByPhoneAndClient(phone, clientId);
      if (conversation) {
        conversations.push(conversation);
      }
    }
    
    return conversations;
  }

  /**
   * Control de IA por conversación
   */
  static async toggleConversationAI(phoneNumber, clientId, enabled) {
    return await Conversation.toggleAI(phoneNumber, clientId, enabled);
  }

  static async toggleConversationAutoResponse(phoneNumber, clientId, enabled) {
    return await Conversation.toggleAutoResponse(phoneNumber, clientId, enabled);
  }

  /**
   * Verificar si la IA está habilitada para una conversación específica
   */
  static async isAIEnabled(conversation, client) {
    // Si la conversación tiene configuración específica, usarla
    if (conversation.aiSettings.enabled !== null) {
      return conversation.aiSettings.enabled;
    }
    
    // Si no, usar la configuración del cliente
    return client.settings.aiEnabled;
  }

  static async isAutoResponseEnabled(conversation, client) {
    // Si la conversación tiene configuración específica, usarla
    if (conversation.aiSettings.autoResponse !== null) {
      return conversation.aiSettings.autoResponse;
    }
    
    // Si no, usar la configuración del cliente
    return client.settings.autoResponse;
  }

  /**
   * Obtener todas las conversaciones (legacy - sin cliente específico)
   */
  static async getAllConversations(limit = 50, offset = 0) {
    return await Conversation.getAll(limit, offset);
  }

  /**
   * Obtener todas las conversaciones de un cliente específico
   */
  static async getAllConversationsByClient(clientId, limit = 50, offset = 0) {
    return await Conversation.getByClient(clientId, limit, offset);
  }

  /**
   * Obtener historial de conversación (con soporte multi-cliente)
   */
  static async getConversationHistory(phoneNumber, clientId = null) {
    if (clientId) {
      return await Conversation.getHistoryByClient(phoneNumber, clientId);
    } else {
      // Legacy: buscar en MarketTech por defecto
      const marketTech = await Client.findByTwilioNumber('+14155238886');
      if (marketTech) {
        return await Conversation.getHistoryByClient(phoneNumber, marketTech._id);
      }
      throw new Error('No se encontró cliente para obtener historial');
    }
  }

  /**
   * Marcar conversación como leída (con soporte multi-cliente)
   */
  static async markAsRead(phoneNumber, clientId = null) {
    if (clientId) {
      return await Conversation.markAsRead(phoneNumber, clientId);
    } else {
      // Legacy: usar MarketTech por defecto
      const marketTech = await Client.findByTwilioNumber('+14155238886');
      if (marketTech) {
        return await Conversation.markAsRead(phoneNumber, marketTech._id);
      }
      throw new Error('No se encontró cliente para marcar como leído');
    }
  }

  /**
   * Buscar conversaciones (legacy)
   */
  static async searchConversations(query) {
    return await Conversation.search(query);
  }

  /**
   * Obtener estadísticas globales (legacy)
   */
  static async getStats() {
    const conversations = await Conversation.getAll(1000, 0);
    const messages = await Message.getAll(1000, 0);
    
    return {
      conversations: {
        total: conversations.length,
        unread: conversations.filter(c => c.unreadCount > 0).length,
        read: conversations.filter(c => c.unreadCount === 0).length
      },
      messages: {
        total: messages.length,
        sent: messages.filter(m => m.type === 'sent').length,
        received: messages.filter(m => m.type === 'received').length,
        aiGenerated: messages.filter(m => m.type === 'ai-auto').length
      },
      timestamp: new Date()
    };
  }

  /**
   * Obtener estadísticas por cliente específico
   */
  static async getStatsByClient(clientId) {
    const conversations = await Conversation.getByClient(clientId, 1000, 0);
    const messages = await Message.getByClient(clientId, 1000, 0);
    
    return {
      conversations: {
        total: conversations.length,
        unread: conversations.filter(c => c.unreadCount > 0).length,
        read: conversations.filter(c => c.unreadCount === 0).length
      },
      messages: {
        total: messages.length,
        sent: messages.filter(m => m.type === 'sent').length,
        received: messages.filter(m => m.type === 'received').length,
        aiGenerated: messages.filter(m => m.type === 'ai-auto').length
      },
      activeConversations: conversations.filter(c => c.isActive).length,
      todayConversations: conversations.filter(c => {
        const today = new Date();
        const messageDate = new Date(c.lastMessageAt);
        return messageDate.toDateString() === today.toDateString();
      }).length,
      timestamp: new Date()
    };
  }

  /**
   * Guardar mensaje saliente (respuesta del sistema)
   */
  static async saveOutgoingMessage(phoneNumber, clientId, messageText, type = 'sent', metadata = {}) {
    try {
      // Crear mensaje saliente
      const messageData = {
        phoneNumber,
        clientId,
        text: messageText,
        type, // 'sent', 'manual', 'ai-auto', 'ai-assisted'
        twilioSid: metadata.twilioSid,
        isAiGenerated: metadata.isAiGenerated || type.startsWith('ai'),
        source: metadata.source || 'system',
        metadata: metadata.metadata || {}
      };
      
      const message = await Message.create(messageData);
      
      // Actualizar conversación con último mensaje
      await Conversation.updateLastMessage(phoneNumber, clientId, {
        text: messageText,
        type,
        timestamp: metadata.timestamp || new Date()
      });
      
      return message;
    } catch (error) {
      console.error('Error guardando mensaje saliente:', error);
      throw error;
    }
  }
}

module.exports = ConversationService;
