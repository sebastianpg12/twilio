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
        isAiGenerated: metadata.isAiGenerated || false,
        aiPrompt: metadata.aiPrompt
      };
      
      const message = await Message.create(messageData);
      
      // Actualizar conversación con último mensaje
      await Conversation.updateLastMessage(phoneNumber, clientId, {
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
}

module.exports = ConversationService;
