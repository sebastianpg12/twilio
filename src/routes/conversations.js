// src/routes/conversations.js
const express = require('express');
const router = express.Router();
const ConversationService = require('../services/conversationService');

// GET /api/conversations - Obtener todas las conversaciones
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const conversations = await ConversationService.getAllConversations(
      parseInt(limit), 
      parseInt(offset)
    );
    // Agregar iaEnabled a cada conversación
    const enhancedConversations = conversations.map(conv => {
      const clientId = conv.clientId || (conv.client?._id);
      const phone = conv.phoneNumber || conv.phone;
      let iaEnabled = true;
      if (clientId && phone) {
        const key = `${clientId}:${phone}`;
        iaEnabled = typeof iaConversationStatus !== 'undefined' && typeof iaConversationStatus[key] !== 'undefined' ? iaConversationStatus[key] : true;
      }
      return { ...conv, iaEnabled };
    });
    res.json({
      success: true,
      conversations: enhancedConversations,
      count: enhancedConversations.length
    });
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/conversations/:phone - Obtener historial de una conversación (ahora soporta clientId por query)
router.get('/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const phoneNumber = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
    const clientId = req.query.clientId || null;
    // Obtener historial y datos de la conversación
    const data = await ConversationService.getConversationHistory(phoneNumber, clientId);
    // Consultar estado de IA
    let iaEnabled = true;
    if (clientId) {
      const key = `${clientId}:${phoneNumber}`;
      iaEnabled = typeof iaConversationStatus[key] !== 'undefined' ? iaConversationStatus[key] : true;
    }
    res.json({
      success: true,
      ...data,
      iaEnabled
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/conversations/:phone/read - Marcar conversación como leída
router.post('/:phone/read', async (req, res) => {
  try {
    const { phone } = req.params;
    const phoneNumber = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
    
    await ConversationService.markAsRead(phoneNumber);
    
    res.json({
      success: true,
      message: 'Conversación marcada como leída'
    });
  } catch (error) {
    console.error('Error marcando como leída:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/conversations/search/:query - Buscar conversaciones
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const conversations = await ConversationService.searchConversations(query);
    
    res.json({
      success: true,
      conversations,
      count: conversations.length
    });
  } catch (error) {
    console.error('Error buscando conversaciones:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
