const { ObjectId } = require('mongodb');
const database = require('../config/database');

class KnowledgeBase {
  constructor() {
    this.db = null;
    this.collection = null;
  }

  async initialize() {
    if (!this.db) {
      this.db = database.getDb();
      this.collection = this.db.collection('knowledge_entries');
    }
  }

  // Crear nueva entrada de conocimiento
  async create(entryData) {
    await this.initialize();
    
    const newEntry = {
      ...entryData,
      clientId: entryData.clientId.toString(), // Asegurar que clientId sea string
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      version: 1
    };

    // Validar que el cliente existe
    const clientsCollection = this.db.collection('clients');
    const client = await clientsCollection.findOne({ _id: new ObjectId(entryData.clientId) });
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    const result = await this.collection.insertOne(newEntry);
    return { ...newEntry, _id: result.insertedId };
  }

  // Obtener todas las entradas de un cliente
  async getByClient(clientId, options = {}) {
    await this.initialize();
    
    const {
      limit = 20,
      offset = 0,
      category = null,
      search = null,
      isActive = true,
      sortBy = 'updatedAt',
      sortOrder = -1
    } = options;

    const query = {
      clientId: clientId.toString(), // Asegurar que se busque como string
      isActive: isActive
    };

    // Filtro por categoría
    if (category) {
      query.category = category;
    }

    // Búsqueda por texto
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const total = await this.collection.countDocuments(query);
    
    const entries = await this.collection
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(offset)
      .limit(limit)
      .toArray();

    return {
      entries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  // Obtener entrada específica
  async getById(entryId) {
    await this.initialize();
    
    const entry = await this.collection.findOne({ 
      _id: new ObjectId(entryId),
      isActive: true 
    });
    
    if (!entry) {
      throw new Error('Entrada de conocimiento no encontrada');
    }

    return entry;
  }

  // Actualizar entrada
  async update(entryId, updateData) {
    await this.initialize();
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    };

    // Remover campos que no se deben actualizar directamente
    delete updateFields._id;
    delete updateFields.clientId;
    delete updateFields.createdAt;
    delete updateFields.version;

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(entryId), isActive: true },
      { 
        $set: updateFields,
        $inc: { version: 1 }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('Entrada de conocimiento no encontrada');
    }

    return result;
  }

  // Eliminar entrada (soft delete)
  async delete(entryId) {
    await this.initialize();
    
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(entryId), isActive: true },
      { 
        $set: { 
          isActive: false, 
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('Entrada de conocimiento no encontrada');
    }

    return result;
  }

  // Eliminar entrada permanentemente
  async deletePermanent(entryId) {
    await this.initialize();
    
    const result = await this.collection.deleteOne({ 
      _id: new ObjectId(entryId) 
    });

    if (result.deletedCount === 0) {
      throw new Error('Entrada de conocimiento no encontrada');
    }

    return { deleted: true, entryId };
  }

  // Reactivar entrada eliminada
  async reactivate(entryId) {
    await this.initialize();
    
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(entryId), isActive: false },
      { 
        $set: { 
          isActive: true, 
          updatedAt: new Date()
        },
        $unset: { deletedAt: 1 }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('Entrada de conocimiento no encontrada o ya está activa');
    }

    return result;
  }

  // Obtener todas las entradas activas de un cliente (para el bot)
  async getActiveKnowledgeForBot(clientId) {
    await this.initialize();
    
    const entries = await this.collection
      .find({
        clientId: clientId.toString(),
        isActive: true
      })
      .sort({ priority: -1, updatedAt: -1 })
      .toArray();

    // Formatear para el bot
    return entries.map(entry => ({
      id: entry._id,
      category: entry.category,
      title: entry.title,
      content: entry.content,
      keywords: entry.keywords || [],
      priority: entry.priority || 1
    }));
  }

  // Buscar en el conocimiento (para el bot)
  async searchKnowledge(clientId, query, limit = 5) {
    await this.initialize();
    
    const searchQuery = {
      clientId: clientId.toString(),
      isActive: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { keywords: { $in: [new RegExp(query, 'i')] } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    };

    const results = await this.collection
      .find(searchQuery)
      .sort({ priority: -1, updatedAt: -1 })
      .limit(limit)
      .toArray();

    return results.map(entry => ({
      id: entry._id,
      category: entry.category,
      title: entry.title,
      content: entry.content,
      relevanceScore: this.calculateRelevance(query, entry)
    }));
  }

  // Calcular relevancia de una entrada para una consulta
  calculateRelevance(query, entry) {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Puntuación por título
    if (entry.title.toLowerCase().includes(queryLower)) {
      score += 3;
    }
    
    // Puntuación por contenido
    if (entry.content.toLowerCase().includes(queryLower)) {
      score += 2;
    }
    
    // Puntuación por keywords
    if (entry.keywords && entry.keywords.some(keyword => 
      keyword.toLowerCase().includes(queryLower))) {
      score += 2;
    }
    
    // Puntuación por tags
    if (entry.tags && entry.tags.some(tag => 
      tag.toLowerCase().includes(queryLower))) {
      score += 1;
    }
    
    // Puntuación por prioridad
    score += (entry.priority || 1) * 0.5;
    
    return score;
  }

  // Obtener estadísticas de conocimiento de un cliente
  async getClientKnowledgeStats(clientId) {
    await this.initialize();
    
    const pipeline = [
      { $match: { clientId: clientId.toString() } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
          categories: { $addToSet: '$category' },
          lastUpdated: { $max: '$updatedAt' }
        }
      }
    ];

    const stats = await this.collection.aggregate(pipeline).toArray();
    
    if (stats.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        categories: [],
        lastUpdated: null
      };
    }

    return stats[0];
  }

  // Acciones en lote
  async bulkActions(action, entryIds, clientId, settings = {}) {
    await this.initialize();
    
    const objectIds = entryIds.map(id => new ObjectId(id));
    const query = {
      _id: { $in: objectIds },
      clientId: clientId.toString()
    };

    let updateOperation = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateOperation = {
          $set: { 
            isActive: true, 
            updatedAt: new Date() 
          },
          $unset: { deletedAt: 1 }
        };
        message = `${entryIds.length} entradas activadas`;
        break;

      case 'deactivate':
        updateOperation = {
          $set: { 
            isActive: false, 
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        };
        message = `${entryIds.length} entradas desactivadas`;
        break;

      case 'update-category':
        if (!settings.category) {
          throw new Error('Categoría requerida para esta acción');
        }
        updateOperation = {
          $set: { 
            category: settings.category,
            updatedAt: new Date()
          }
        };
        message = `${entryIds.length} entradas actualizadas a categoría "${settings.category}"`;
        break;

      case 'update-priority':
        if (settings.priority === undefined) {
          throw new Error('Prioridad requerida para esta acción');
        }
        updateOperation = {
          $set: { 
            priority: settings.priority,
            updatedAt: new Date()
          }
        };
        message = `${entryIds.length} entradas actualizadas con prioridad ${settings.priority}`;
        break;

      case 'delete-permanent':
        const deleteResult = await this.collection.deleteMany(query);
        return {
          success: true,
          message: `${deleteResult.deletedCount} entradas eliminadas permanentemente`,
          affected: deleteResult.deletedCount
        };

      default:
        throw new Error(`Acción no válida: ${action}`);
    }

    const result = await this.collection.updateMany(query, updateOperation);

    return {
      success: true,
      message,
      affected: result.modifiedCount
    };
  }

  // Exportar conocimiento de un cliente
  async exportClientKnowledge(clientId, format = 'json') {
    await this.initialize();
    
    const entries = await this.collection
      .find({ 
        clientId: clientId.toString(),
        isActive: true 
      })
      .sort({ category: 1, title: 1 })
      .toArray();

    if (format === 'json') {
      return {
        exportDate: new Date(),
        clientId,
        totalEntries: entries.length,
        entries: entries.map(entry => ({
          id: entry._id,
          category: entry.category,
          title: entry.title,
          content: entry.content,
          keywords: entry.keywords || [],
          tags: entry.tags || [],
          priority: entry.priority || 1,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        }))
      };
    }

    return entries;
  }
}

module.exports = KnowledgeBase;
