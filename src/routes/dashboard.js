// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const ConversationService = require('../services/conversationService');

/**
 * GET /api/clients/:id/dashboard
 * Dashboard específico para un cliente
 */
router.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener información del cliente
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Obtener estadísticas del cliente
    const stats = await ConversationService.getStatsByClient(id);
    
    // Obtener conversaciones recientes
    const recentConversations = await ConversationService.getAllConversationsByClient(id, 10, 0);
    
    // Calcular métricas adicionales
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const dashboardData = {
      client: {
        id: client._id,
        name: client.name,
        phoneNumber: client.phoneNumber,
        twilioPhoneNumber: client.twilioPhoneNumber,
        settings: client.settings,
        subscription: client.subscription
      },
      stats: {
        ...stats,
        // Agregar métricas calculadas
        activeConversations: recentConversations.filter(c => 
          new Date(c.lastMessageAt) > weekStart
        ).length,
        todayConversations: recentConversations.filter(c => 
          new Date(c.lastMessageAt) > todayStart
        ).length
      },
      recentConversations: recentConversations.map(conv => ({
        _id: conv._id,
        phoneNumber: conv.phoneNumber,
        contactName: conv.contactName,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.unreadCount,
        lastMessage: conv.lastMessage,
        aiSettings: conv.aiSettings
      })),
      systemStatus: {
        aiEnabled: client.settings.aiEnabled,
        autoResponse: client.settings.autoResponse,
        businessHours: client.settings.businessHours,
        lastSync: new Date()
      }
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Error obteniendo dashboard del cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/clients/:id/dashboard/quick-stats
 * Estadísticas rápidas para widgets del dashboard
 */
router.get('/:id/dashboard/quick-stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '24h' } = req.query;
    
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Calcular período de tiempo
    let startDate;
    const now = new Date();
    
    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    const stats = await ConversationService.getStatsByClient(id);
    const conversations = await ConversationService.getAllConversationsByClient(id, 100, 0);
    
    // Filtrar conversaciones por período
    const periodConversations = conversations.filter(c => 
      new Date(c.lastMessageAt) > startDate
    );
    
    const quickStats = {
      period,
      totalConversations: stats.conversations.total,
      unreadConversations: stats.conversations.unread,
      periodActivity: {
        newConversations: periodConversations.length,
        activeConversations: periodConversations.filter(c => c.unreadCount > 0).length,
        respondedConversations: periodConversations.filter(c => c.unreadCount === 0).length
      },
      aiUsage: {
        enabled: client.settings.aiEnabled,
        autoResponseEnabled: client.settings.autoResponse,
        conversationsWithAI: periodConversations.filter(c => 
          c.aiSettings.enabled !== false
        ).length
      },
      responseTime: {
        average: '5min', // Placeholder - implementar cálculo real
        fastest: '30s',
        slowest: '2h'
      }
    };
    
    res.json({
      success: true,
      data: quickStats
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas rápidas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/clients/:id/dashboard/bulk-actions
 * Acciones en lote desde el dashboard
 */
router.post('/:id/dashboard/bulk-actions', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, conversations, settings } = req.body;
    
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    let results = [];
    
    switch (action) {
      case 'mark-all-read':
        for (const phone of conversations) {
          await ConversationService.markAsRead(phone, id);
          results.push({ phone, status: 'marked-read' });
        }
        break;
        
      case 'toggle-ai':
        for (const phone of conversations) {
          await ConversationService.toggleConversationAI(phone, id, settings.enabled);
          results.push({ phone, status: 'ai-toggled', enabled: settings.enabled });
        }
        break;
        
      case 'toggle-auto-response':
        for (const phone of conversations) {
          await ConversationService.toggleConversationAutoResponse(phone, id, settings.enabled);
          results.push({ phone, status: 'auto-response-toggled', enabled: settings.enabled });
        }
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Acción no válida'
        });
    }
    
    res.json({
      success: true,
      message: `Acción "${action}" aplicada a ${results.length} conversaciones`,
      data: results
    });
    
  } catch (error) {
    console.error('Error ejecutando acciones en lote:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
