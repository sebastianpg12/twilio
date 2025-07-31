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
    
    res.json({
      success: true,
      conversations,
      count: conversations.length
    });
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/conversations/:phone - Obtener historial de una conversación
router.get('/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const phoneNumber = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
    
    const data = await ConversationService.getConversationHistory(phoneNumber);
    
    res.json({
      success: true,
      ...data
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
