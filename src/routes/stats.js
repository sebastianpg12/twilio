// src/routes/stats.js
const express = require('express');
const router = express.Router();
const ConversationService = require('../services/conversationService');

// GET /api/stats - Obtener estadísticas generales
router.get('/', async (req, res) => {
  try {
    const stats = await ConversationService.getStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
