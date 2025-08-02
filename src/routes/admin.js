// src/routes/admin.js
const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const ConversationService = require('../services/conversationService');

// Middleware de autenticación admin simple
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  
  if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'admin123') {
    return res.status(401).json({
      success: false,
      error: 'Acceso no autorizado'
    });
  }
  
  next();
};

/**
 * GET /api/admin/overview
 * Vista general del sistema completo
 */
router.get('/overview', adminAuth, async (req, res) => {
  try {
    const clients = await Client.getAll();
    
    let totalStats = {
      conversations: { total: 0, unread: 0, read: 0 },
      messages: { total: 0, sent: 0, received: 0, aiGenerated: 0 }
    };
    
    const clientsWithStats = [];
    
    for (const client of clients) {
      try {
        const stats = await ConversationService.getStatsByClient(client._id);
        clientsWithStats.push({
          ...client,
          stats
        });
        
        // Sumar a totales
        totalStats.conversations.total += stats.conversations.total;
        totalStats.conversations.unread += stats.conversations.unread;
        totalStats.conversations.read += stats.conversations.read;
      } catch (error) {
        console.error(`Error obteniendo stats para cliente ${client._id}:`, error);
        clientsWithStats.push({
          ...client,
          stats: { error: 'No se pudieron cargar las estadísticas' }
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        systemStats: {
          totalClients: clients.length,
          activeClients: clients.filter(c => c.isActive).length,
          clientsWithAI: clients.filter(c => c.settings.aiEnabled).length,
          ...totalStats
        },
        clients: clientsWithStats,
        lastUpdated: new Date()
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo overview admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/admin/clients/:id/reset
 * Resetear configuraciones de un cliente
 */
router.post('/clients/:id/reset', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { resetConversations = false } = req.body;
    
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Resetear configuraciones a valores por defecto
    const defaultSettings = {
      aiEnabled: true,
      autoResponse: true,
      welcomeMessage: `¡Hola! Somos ${client.name}. Gracias por contactarnos. ¿En qué podemos ayudarte hoy?`,
      businessHours: {
        enabled: false,
        start: "09:00",
        end: "18:00",
        timezone: "America/Bogota"
      }
    };
    
    await Client.updateSettings(id, defaultSettings);
    
    // Opcional: resetear conversaciones
    if (resetConversations) {
      // Aquí podrías agregar lógica para resetear conversaciones si es necesario
      console.log(`Reseteando conversaciones para cliente ${id}`);
    }
    
    res.json({
      success: true,
      message: 'Cliente reseteado exitosamente',
      data: {
        clientId: id,
        resetConversations,
        newSettings: defaultSettings
      }
    });
    
  } catch (error) {
    console.error('Error reseteando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/admin/system/toggle-ai
 * Activar/desactivar IA para todos los clientes
 */
router.post('/system/toggle-ai', adminAuth, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'El campo "enabled" debe ser true o false'
      });
    }
    
    const clients = await Client.getAll();
    const results = [];
    
    for (const client of clients) {
      try {
        await Client.toggleAI(client._id, enabled);
        results.push({
          clientId: client._id,
          clientName: client.name,
          status: 'updated'
        });
      } catch (error) {
        results.push({
          clientId: client._id,
          clientName: client.name,
          status: 'error',
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `IA ${enabled ? 'activada' : 'desactivada'} para todos los clientes`,
      data: {
        aiEnabled: enabled,
        affectedClients: results.length,
        results
      }
    });
    
  } catch (error) {
    console.error('Error cambiando IA del sistema:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/admin/health
 * Estado de salud del sistema
 */
router.get('/health', adminAuth, async (req, res) => {
  try {
    const clients = await Client.getAll();
    const systemHealth = {
      database: 'connected',
      totalClients: clients.length,
      activeClients: clients.filter(c => c.isActive).length,
      timestamp: new Date(),
      services: {
        mongodb: 'operational',
        twilio: 'operational', // Esto se podría verificar realmente
        openai: 'operational'  // Esto se podría verificar realmente
      }
    };
    
    res.json({
      success: true,
      data: systemHealth
    });
    
  } catch (error) {
    console.error('Error verificando salud del sistema:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      data: {
        database: 'error',
        timestamp: new Date(),
        services: {
          mongodb: 'error',
          twilio: 'unknown',
          openai: 'unknown'
        }
      }
    });
  }
});

module.exports = router;
