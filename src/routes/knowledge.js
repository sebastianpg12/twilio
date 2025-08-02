const express = require('express');
const router = express.Router();
const KnowledgeBase = require('../models/KnowledgeBase');
const Client = require('../models/Client');

// Crear instancia única del modelo KnowledgeBase
const knowledgeBase = new KnowledgeBase();

// Middleware para validar cliente
const validateClient = async (req, res, next) => {
  try {
    const clientId = req.params.clientId || req.body.clientId;
    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'ID de cliente requerido'
      });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    req.client = client;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al validar cliente',
      details: error.message
    });
  }
};

// Middleware para validar entrada de conocimiento
const validateKnowledgeEntry = (req, res, next) => {
  const { title, content, category } = req.body;
  
  if (!title || !content || !category) {
    return res.status(400).json({
      success: false,
      error: 'Título, contenido y categoría son requeridos',
      details: {
        title: !title ? 'Título requerido' : null,
        content: !content ? 'Contenido requerido' : null,
        category: !category ? 'Categoría requerida' : null
      }
    });
  }

  // Validar categorías permitidas
  const allowedCategories = [
    'general',
    'productos',
    'servicios', 
    'precios',
    'faq',
    'politicas',
    'contacto',
    'horarios',
    'promociones',
    'otros'
  ];

  if (!allowedCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Categoría no válida. Categorías permitidas: ${allowedCategories.join(', ')}`
    });
  }

  next();
};

// 📚 RUTAS PARA GESTIÓN DE CONOCIMIENTO

// Obtener todas las entradas de conocimiento de un cliente
router.get('/client/:clientId', validateClient, async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      category: req.query.category,
      search: req.query.search,
      isActive: req.query.isActive !== 'false',
      sortBy: req.query.sortBy || 'updatedAt',
      sortOrder: req.query.sortOrder === 'asc' ? 1 : -1
    };

    const result = await knowledgeBase.getByClient(req.params.clientId, options);

    res.json({
      success: true,
      data: result.entries,
      pagination: result.pagination,
      client: {
        id: req.client._id,
        name: req.client.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener entradas de conocimiento',
      details: error.message
    });
  }
});

// Obtener entrada específica
router.get('/entry/:entryId', async (req, res) => {
  try {
    const entry = await knowledgeBase.getById(req.params.entryId);

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    if (error.message === 'Entrada de conocimiento no encontrada') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al obtener entrada de conocimiento',
      details: error.message
    });
  }
});

// Crear nueva entrada de conocimiento
router.post('/client/:clientId', validateClient, validateKnowledgeEntry, async (req, res) => {
  try {
    const entryData = {
      clientId: req.params.clientId,
      title: req.body.title.trim(),
      content: req.body.content.trim(),
      category: req.body.category,
      keywords: req.body.keywords || [],
      tags: req.body.tags || [],
      priority: parseInt(req.body.priority) || 1,
      isPublic: req.body.isPublic || false,
      metadata: req.body.metadata || {}
    };

    // Validar prioridad
    if (entryData.priority < 1 || entryData.priority > 10) {
      return res.status(400).json({
        success: false,
        error: 'La prioridad debe estar entre 1 y 10'
      });
    }

    const newEntry = await knowledgeBase.create(entryData);

    res.status(201).json({
      success: true,
      message: `Entrada de conocimiento "${newEntry.title}" creada exitosamente`,
      data: newEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al crear entrada de conocimiento',
      details: error.message
    });
  }
});

// Actualizar entrada de conocimiento
router.put('/entry/:entryId', async (req, res) => {
  try {
    const updateData = {};
    
    // Campos permitidos para actualización
    const allowedFields = [
      'title', 'content', 'category', 'keywords', 
      'tags', 'priority', 'isPublic', 'metadata'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Validar si hay datos para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay datos para actualizar'
      });
    }

    // Validar categoría si se está actualizando
    if (updateData.category) {
      const allowedCategories = [
        'general', 'productos', 'servicios', 'precios',
        'faq', 'politicas', 'contacto', 'horarios', 
        'promociones', 'otros'
      ];

      if (!allowedCategories.includes(updateData.category)) {
        return res.status(400).json({
          success: false,
          error: `Categoría no válida. Categorías permitidas: ${allowedCategories.join(', ')}`
        });
      }
    }

    // Validar prioridad si se está actualizando
    if (updateData.priority && (updateData.priority < 1 || updateData.priority > 10)) {
      return res.status(400).json({
        success: false,
        error: 'La prioridad debe estar entre 1 y 10'
      });
    }

    const updatedEntry = await knowledgeBase.update(req.params.entryId, updateData);

    res.json({
      success: true,
      message: `Entrada de conocimiento "${updatedEntry.title}" actualizada exitosamente`,
      data: updatedEntry
    });
  } catch (error) {
    if (error.message === 'Entrada de conocimiento no encontrada') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al actualizar entrada de conocimiento',
      details: error.message
    });
  }
});

// Eliminar entrada de conocimiento (soft delete)
router.delete('/entry/:entryId', async (req, res) => {
  try {
    const permanent = req.query.permanent === 'true';

    if (permanent) {
      const result = await knowledgeBase.deletePermanent(req.params.entryId);
      return res.json({
        success: true,
        message: 'Entrada de conocimiento eliminada permanentemente',
        data: result
      });
    }

    const deletedEntry = await knowledgeBase.delete(req.params.entryId);

    res.json({
      success: true,
      message: `Entrada de conocimiento "${deletedEntry.title}" desactivada exitosamente`,
      data: deletedEntry
    });
  } catch (error) {
    if (error.message === 'Entrada de conocimiento no encontrada') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al eliminar entrada de conocimiento',
      details: error.message
    });
  }
});

// Reactivar entrada de conocimiento
router.post('/entry/:entryId/reactivate', async (req, res) => {
  try {
    const reactivatedEntry = await knowledgeBase.reactivate(req.params.entryId);

    res.json({
      success: true,
      message: `Entrada de conocimiento "${reactivatedEntry.title}" reactivada exitosamente`,
      data: reactivatedEntry
    });
  } catch (error) {
    if (error.message.includes('no encontrada') || error.message.includes('ya está activa')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al reactivar entrada de conocimiento',
      details: error.message
    });
  }
});

// Obtener estadísticas de conocimiento de un cliente
router.get('/client/:clientId/stats', validateClient, async (req, res) => {
  try {
    const stats = await knowledgeBase.getClientKnowledgeStats(req.params.clientId);

    res.json({
      success: true,
      data: {
        ...stats,
        client: {
          id: req.client._id,
          name: req.client.name
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de conocimiento',
      details: error.message
    });
  }
});

// Búsqueda en base de conocimiento
router.get('/client/:clientId/search', validateClient, async (req, res) => {
  try {
    const query = req.query.q;
    const limit = parseInt(req.query.limit) || 5;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro de búsqueda "q" requerido'
      });
    }

    const results = await knowledgeBase.searchKnowledge(req.params.clientId, query, limit);

    res.json({
      success: true,
      data: {
        query,
        results,
        total: results.length,
        client: {
          id: req.client._id,
          name: req.client.name
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al buscar en base de conocimiento',
      details: error.message
    });
  }
});

// Obtener conocimiento para el bot (uso interno)
router.get('/client/:clientId/bot-knowledge', async (req, res) => {
  try {
    const knowledge = await knowledgeBase.getActiveKnowledgeForBot(req.params.clientId);

    res.json({
      success: true,
      data: knowledge,
      total: knowledge.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener conocimiento para bot',
      details: error.message
    });
  }
});

// Acciones en lote
router.post('/client/:clientId/bulk-actions', validateClient, async (req, res) => {
  try {
    const { action, entryIds, settings = {} } = req.body;

    if (!action || !entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Acción y array de IDs de entradas son requeridos'
      });
    }

    const allowedActions = [
      'activate', 'deactivate', 'update-category', 
      'update-priority', 'delete-permanent'
    ];

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: `Acción no válida. Acciones permitidas: ${allowedActions.join(', ')}`
      });
    }

    const result = await knowledgeBase.bulkActions(action, entryIds, req.params.clientId, settings);

    res.json({
      success: true,
      message: result.message,
      data: {
        action,
        affected: result.affected,
        settings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al ejecutar acción en lote',
      details: error.message
    });
  }
});

// Exportar conocimiento de un cliente
router.get('/client/:clientId/export', validateClient, async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const knowledge = await knowledgeBase.exportClientKnowledge(req.params.clientId, format);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="knowledge_${req.client.name}_${new Date().toISOString().split('T')[0]}.json"`);
    }

    res.json({
      success: true,
      data: knowledge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al exportar conocimiento',
      details: error.message
    });
  }
});

// 🎯 RUTAS PARA ADMINISTRADORES

// Ver todas las entradas de conocimiento del sistema (admin)
router.get('/admin/all', async (req, res) => {
  try {
    // Verificar header de admin
    if (req.headers['x-admin-key'] !== 'admin123') {
      return res.status(401).json({
        success: false,
        error: 'Acceso no autorizado. Header x-admin-key requerido'
      });
    }

    const options = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      search: req.query.search,
      category: req.query.category,
      isActive: req.query.isActive !== 'false'
    };

    // Obtener todas las entradas con información de cliente
    const database = require('../config/database');
    const db = database.getDb();
    const collection = db.collection('knowledge_entries');
    
    const pipeline = [
      {
        $match: {
          isActive: options.isActive,
          ...(options.category && { category: options.category }),
          ...(options.search && {
            $or: [
              { title: { $regex: options.search, $options: 'i' } },
              { content: { $regex: options.search, $options: 'i' } }
            ]
          })
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' },
      { $sort: { updatedAt: -1 } },
      { $skip: options.offset },
      { $limit: options.limit }
    ];

    const entries = await collection.aggregate(pipeline).toArray();
    const total = await collection.countDocuments({
      isActive: options.isActive,
      ...(options.category && { category: options.category })
    });

    res.json({
      success: true,
      data: entries.map(entry => ({
        ...entry,
        clientName: entry.client.name,
        clientBusiness: entry.client.business
      })),
      pagination: {
        total,
        limit: options.limit,
        offset: options.offset,
        hasMore: options.offset + options.limit < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener entradas de conocimiento del sistema',
      details: error.message
    });
  }
});

// Estadísticas generales del sistema (admin)
router.get('/admin/stats', async (req, res) => {
  try {
    // Verificar header de admin
    if (req.headers['x-admin-key'] !== 'admin123') {
      return res.status(401).json({
        success: false,
        error: 'Acceso no autorizado. Header x-admin-key requerido'
      });
    }

    const database = require('../config/database');
    const db = database.getDb();
    const collection = db.collection('knowledge_entries');
    
    const pipeline = [
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          activeEntries: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactiveEntries: { $sum: { $cond: ['$isActive', 0, 1] } },
          categoriesCount: { $addToSet: '$category' },
          clientsWithKnowledge: { $addToSet: '$clientId' },
          lastUpdated: { $max: '$updatedAt' }
        }
      }
    ];

    const stats = await collection.aggregate(pipeline).toArray();
    
    const result = stats[0] || {
      totalEntries: 0,
      activeEntries: 0,
      inactiveEntries: 0,
      categoriesCount: [],
      clientsWithKnowledge: [],
      lastUpdated: null
    };

    // Obtener estadísticas por categoría
    const categoryStats = await collection.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    res.json({
      success: true,
      data: {
        overview: {
          totalEntries: result.totalEntries,
          activeEntries: result.activeEntries,
          inactiveEntries: result.inactiveEntries,
          totalCategories: result.categoriesCount.length,
          clientsWithKnowledge: result.clientsWithKnowledge.length,
          lastUpdated: result.lastUpdated
        },
        categoryBreakdown: categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas del sistema',
      details: error.message
    });
  }
});

module.exports = router;
