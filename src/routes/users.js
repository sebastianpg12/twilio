// src/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Client = require('../models/Client');

// Middleware de autenticación para admin
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'admin123') {
    return res.status(401).json({
      success: false,
      error: 'No autorizado. Se requiere x-admin-key válida.'
    });
  }
  next();
};

// Middleware de autenticación para usuario (simplificado por ahora)
const userAuth = (req, res, next) => {
  // Por ahora permitimos acceso libre, más adelante se puede implementar JWT
  // const token = req.headers['authorization'];
  // if (!token) {
  //   return res.status(401).json({
  //     success: false,
  //     error: 'Token de autenticación requerido'
  //   });
  // }
  next();
};

// ========== CRUD DE USUARIOS ==========

/**
 * GET /api/users
 * Listar todos los usuarios (Admin) o usuarios del cliente específico
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, search = '', clientId = '', role = '' } = req.query;
    
    const filters = {};
    if (search) filters.search = search;
    if (clientId) filters.clientId = clientId;
    if (role) filters.role = role;
    
    let users = await User.getUsersWithClientInfo(filters);
    
    // Paginación
    const paginatedUsers = users.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        total: users.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < users.length
      }
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/users/client/:clientId
 * Obtener usuarios de un cliente específico
 */
router.get('/client/:clientId', userAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const users = await User.findByClientId(clientId);
    
    // Paginación
    const paginatedUsers = users.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        total: users.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < users.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios del cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/users/:id
 * Obtener usuario específico
 */
router.get('/:id', userAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Obtener información del cliente
    const client = await Client.getById(user.clientId);
    
    res.json({
      success: true,
      data: {
        ...user,
        client: client ? {
          _id: client._id,
          name: client.name,
          business: client.business,
          twilioPhoneNumber: client.twilioPhoneNumber
        } : null
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/users
 * Crear nuevo usuario
 */
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      email,
      name,
      clientId,
      role = 'user',
      permissions = ['read', 'write'],
      firstName = '',
      lastName = '',
      phoneNumber = null,
      department = null,
      position = null,
      authProvider = 'email',
      authProviderId = null,
      language = 'es',
      timezone = 'America/Bogota'
    } = req.body;
    
    // Validaciones
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'El email es requerido'
      });
    }
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'El nombre es requerido'
      });
    }
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'El ID del cliente es requerido'
      });
    }
    
    // Verificar que el cliente existe
    const client = await Client.getById(clientId);
    if (!client) {
      return res.status(400).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Verificar que el email no esté ya en uso
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un usuario con ese email'
      });
    }
    
    const userData = {
      email: email.toLowerCase(),
      name,
      clientId,
      role,
      permissions,
      firstName,
      lastName,
      phoneNumber,
      department,
      position,
      authProvider,
      authProviderId,
      language,
      timezone,
      createdBy: req.user?.id || null // Si tenemos información del usuario que lo crea
    };
    
    const newUser = await User.create(userData);
    
    res.status(201).json({
      success: true,
      message: `Usuario "${name}" creado exitosamente`,
      data: newUser
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
});

/**
 * PUT /api/users/:id
 * Actualizar usuario existente
 */
router.put('/:id', userAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Verificar que el usuario existe
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Si se está cambiando el email, verificar que no esté en uso
    if (updateData.email && updateData.email.toLowerCase() !== existingUser.email) {
      const userWithEmail = await User.findByEmail(updateData.email);
      if (userWithEmail && userWithEmail._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe otro usuario con ese email'
        });
      }
      updateData.email = updateData.email.toLowerCase();
    }
    
    // Si se está cambiando el cliente, verificar que existe
    if (updateData.clientId) {
      const client = await Client.getById(updateData.clientId);
      if (!client) {
        return res.status(400).json({
          success: false,
          error: 'Cliente no encontrado'
        });
      }
    }
    
    const updatedUser = await User.update(id, updateData);
    
    res.json({
      success: true,
      message: `Usuario "${updatedUser.name}" actualizado exitosamente`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
});

/**
 * DELETE /api/users/:id
 * Eliminar usuario (soft delete por defecto)
 */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;
    
    // Verificar que el usuario existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Prevenir eliminar usuarios admin accidentalmente
    if (user.role === 'admin' && !permanent) {
      return res.status(400).json({
        success: false,
        error: 'No se puede desactivar usuarios admin. Use ?permanent=true si está seguro.',
        warning: 'Los usuarios admin tienen permisos especiales'
      });
    }
    
    if (permanent) {
      // Eliminación permanente
      await User.delete(id);
      res.json({
        success: true,
        message: `Usuario "${user.name}" eliminado permanentemente`
      });
    } else {
      // Desactivación (soft delete)
      await User.deactivate(id);
      res.json({
        success: true,
        message: `Usuario "${user.name}" desactivado exitosamente`
      });
    }
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
});

/**
 * POST /api/users/:id/activate
 * Reactivar usuario desactivado
 */
router.post('/:id/activate', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    const updatedUser = await User.activate(id);
    
    res.json({
      success: true,
      message: `Usuario "${updatedUser.name}" reactivado exitosamente`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error reactivando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/users/:id/role
 * Cambiar rol del usuario
 */
router.put('/:id/role', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'El rol es requerido'
      });
    }
    
    const updatedUser = await User.changeRole(id, role);
    
    res.json({
      success: true,
      message: `Rol actualizado a "${role}" para usuario "${updatedUser.name}"`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error cambiando rol:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
});

/**
 * PUT /api/users/:id/permissions
 * Actualizar permisos del usuario
 */
router.put('/:id/permissions', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        error: 'Los permisos deben ser un array'
      });
    }
    
    const validPermissions = ['read', 'write', 'delete', 'admin'];
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Permisos no válidos: ${invalidPermissions.join(', ')}`
      });
    }
    
    const updatedUser = await User.updatePermissions(id, permissions);
    
    res.json({
      success: true,
      message: `Permisos actualizados para usuario "${updatedUser.name}"`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error actualizando permisos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
});

/**
 * GET /api/users/email/:email
 * Buscar usuario por email (para autenticación)
 */
router.get('/email/:email', userAuth, async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Obtener información del cliente
    const client = await Client.getById(user.clientId);
    
    res.json({
      success: true,
      data: {
        ...user,
        client: client ? {
          _id: client._id,
          name: client.name,
          business: client.business,
          twilioPhoneNumber: client.twilioPhoneNumber
        } : null
      }
    });
  } catch (error) {
    console.error('Error buscando usuario por email:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/users/:id/login
 * Actualizar último login (para estadísticas)
 */
router.post('/:id/login', userAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.updateLastLogin(id);
    
    res.json({
      success: true,
      message: 'Login registrado exitosamente',
      data: {
        lastLogin: updatedUser.lastLogin,
        loginCount: updatedUser.loginCount
      }
    });
  } catch (error) {
    console.error('Error registrando login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/users/bulk-actions
 * Acciones en lote para múltiples usuarios
 */
router.post('/bulk-actions', adminAuth, async (req, res) => {
  try {
    const { action, userIds, settings = {} } = req.body;
    
    if (!action || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        error: 'Acción y lista de IDs de usuarios son requeridos'
      });
    }
    
    const results = [];
    
    for (const userId of userIds) {
      try {
        let result = { userId, status: 'success' };
        
        switch (action) {
          case 'activate':
            await User.activate(userId);
            result.message = 'Activado';
            break;
            
          case 'deactivate':
            await User.deactivate(userId);
            result.message = 'Desactivado';
            break;
            
          case 'change-role':
            await User.changeRole(userId, settings.role);
            result.message = `Rol cambiado a ${settings.role}`;
            break;
            
          case 'update-permissions':
            await User.updatePermissions(userId, settings.permissions);
            result.message = 'Permisos actualizados';
            break;
            
          default:
            result.status = 'error';
            result.message = 'Acción no válida';
        }
        
        results.push(result);
      } catch (error) {
        results.push({
          userId,
          status: 'error',
          message: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Acción "${action}" aplicada a ${userIds.length} usuarios`,
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
