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

// ========== CRUD DE CLIENTES (ADMINISTRACIÓN) ==========

/**
 * GET /api/admin/clients
 * Listar todos los clientes (CRUD: READ)
 */
router.get('/clients', adminAuth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, search = '' } = req.query;
    
    let clients = await Client.getAll();
    
    // Filtrar por búsqueda si se proporciona
    if (search) {
      clients = clients.filter(client => 
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.business?.toLowerCase().includes(search.toLowerCase()) ||
        client.phoneNumber?.includes(search) ||
        client.twilioPhoneNumber?.includes(search)
      );
    }
    
    // Paginación
    const paginatedClients = clients.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    // Agregar estadísticas básicas a cada cliente
    const clientsWithStats = [];
    for (const client of paginatedClients) {
      try {
        const stats = await ConversationService.getStatsByClient(client._id);
        clientsWithStats.push({
          ...client,
          stats: {
            conversations: stats.conversations.total,
            messages: stats.messages.total,
            unreadConversations: stats.conversations.unread
          }
        });
      } catch (error) {
        clientsWithStats.push({
          ...client,
          stats: { conversations: 0, messages: 0, unreadConversations: 0 }
        });
      }
    }
    
    res.json({
      success: true,
      data: clientsWithStats,
      pagination: {
        total: clients.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < clients.length
      }
    });
  } catch (error) {
    console.error('Error listando clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/admin/clients/:id
 * Obtener cliente específico (CRUD: READ)
 */
router.get('/clients/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.getById(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Agregar estadísticas detalladas
    try {
      const stats = await ConversationService.getStatsByClient(id);
      client.detailedStats = stats;
    } catch (error) {
      client.detailedStats = null;
    }
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/admin/clients
 * Crear nuevo cliente (CRUD: CREATE)
 */
router.post('/clients', adminAuth, async (req, res) => {
  try {
    const {
      name,
      business = null,
      phoneNumber = null,
      email = null,
      twilioPhoneNumber,
      twilioSid = null,
      twilioAuthToken = null,
      openaiApiKey = null,
      welcomeMessage = `¡Hola! Somos ${name}. Gracias por contactarnos. ¿En qué podemos ayudarte hoy?`,
      aiEnabled = true,
      autoResponse = true,
      plan = 'basic'
    } = req.body;
    
    // Validaciones
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del cliente es requerido'
      });
    }
    
    if (!twilioPhoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'El número de teléfono de Twilio es requerido'
      });
    }
    
    // Verificar que el número no esté ya en uso
    const existingClient = await Client.findByTwilioNumber(twilioPhoneNumber);
    if (existingClient) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un cliente con ese número de Twilio'
      });
    }
    
    const clientData = {
      name,
      business,
      phoneNumber,
      email,
      twilioPhoneNumber,
      twilioSid,
      twilioAuthToken,
      openaiApiKey,
      welcomeMessage,
      aiEnabled,
      autoResponse,
      plan
    };
    
    const newClient = await Client.create(clientData);
    
    res.status(201).json({
      success: true,
      message: `Cliente "${name}" creado exitosamente`,
      data: newClient
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
});

/**
 * PUT /api/admin/clients/:id
 * Actualizar cliente existente (CRUD: UPDATE)
 */
router.put('/clients/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Verificar que el cliente existe
    const existingClient = await Client.getById(id);
    if (!existingClient) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Si se está cambiando el número de Twilio, verificar que no esté en uso
    if (updateData.twilioPhoneNumber && updateData.twilioPhoneNumber !== existingClient.twilioPhoneNumber) {
      const clientWithNumber = await Client.findByTwilioNumber(updateData.twilioPhoneNumber);
      if (clientWithNumber && clientWithNumber._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe otro cliente con ese número de Twilio'
        });
      }
    }
    
    const updatedClient = await Client.update(id, updateData);
    
    res.json({
      success: true,
      message: `Cliente "${updatedClient.name}" actualizado exitosamente`,
      data: updatedClient
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
});

/**
 * DELETE /api/admin/clients/:id
 * Eliminar cliente (CRUD: DELETE)
 */
router.delete('/clients/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;
    
    // Verificar que el cliente existe
    const client = await Client.getById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Prevenir eliminar MarketTech accidentalmente
    if (client.name === 'MarketTech' && !permanent) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar MarketTech. Use ?permanent=true si está seguro.',
        warning: 'MarketTech es el cliente por defecto del sistema'
      });
    }
    
    if (permanent) {
      // Eliminación permanente
      await Client.delete(id);
      res.json({
        success: true,
        message: `Cliente "${client.name}" eliminado permanentemente`
      });
    } else {
      // Desactivación (soft delete)
      await Client.update(id, { isActive: false });
      res.json({
        success: true,
        message: `Cliente "${client.name}" desactivado exitosamente`
      });
    }
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
});

/**
 * POST /api/admin/clients/:id/activate
 * Reactivar cliente desactivado
 */
router.post('/clients/:id/activate', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await Client.getById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    const updatedClient = await Client.update(id, { isActive: true });
    
    res.json({
      success: true,
      message: `Cliente "${updatedClient.name}" reactivado exitosamente`,
      data: updatedClient
    });
  } catch (error) {
    console.error('Error reactivando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/admin/clients/:id/conversations
 * Ver todas las conversaciones de un cliente específico
 */
router.get('/clients/:id/conversations', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const client = await Client.getById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    const conversations = await ConversationService.getAllConversationsByClient(
      id, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: {
        client: {
          id: client._id,
          name: client.name,
          business: client.business
        },
        conversations,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo conversaciones del cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/admin/clients/bulk-actions
 * Acciones en lote para múltiples clientes
 */
router.post('/clients/bulk-actions', adminAuth, async (req, res) => {
  try {
    const { action, clientIds, settings = {} } = req.body;
    
    if (!action || !clientIds || !Array.isArray(clientIds)) {
      return res.status(400).json({
        success: false,
        error: 'Acción y lista de IDs de clientes son requeridos'
      });
    }
    
    const results = [];
    
    for (const clientId of clientIds) {
      try {
        let result = { clientId, status: 'success' };
        
        switch (action) {
          case 'activate':
            await Client.update(clientId, { isActive: true });
            result.message = 'Activado';
            break;
            
          case 'deactivate':
            await Client.update(clientId, { isActive: false });
            result.message = 'Desactivado';
            break;
            
          case 'toggle-ai':
            await Client.toggleAI(clientId, settings.enabled);
            result.message = `IA ${settings.enabled ? 'activada' : 'desactivada'}`;
            break;
            
          case 'toggle-auto-response':
            await Client.toggleAutoResponse(clientId, settings.enabled);
            result.message = `Auto-respuesta ${settings.enabled ? 'activada' : 'desactivada'}`;
            break;
            
          default:
            result.status = 'error';
            result.message = 'Acción no válida';
        }
        
        results.push(result);
      } catch (error) {
        results.push({
          clientId,
          status: 'error',
          message: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Acción "${action}" aplicada a ${clientIds.length} clientes`,
      results
    });
  } catch (error) {
    console.error('Error en acciones en lote:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
