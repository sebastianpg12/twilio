// src/models/User.js
const database = require('../config/database');
const { ObjectId } = require('mongodb');

class User {
  static async create(userData) {
    const users = database.getUsersCollection();
    
    const user = {
      email: userData.email,
      name: userData.name,
      clientId: typeof userData.clientId === 'string' ? new ObjectId(userData.clientId) : userData.clientId,
      role: userData.role || 'user', // 'user', 'admin', 'manager'
      permissions: userData.permissions || ['read', 'write'], // ['read', 'write', 'delete', 'admin']
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      profile: {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || null,
        avatar: userData.avatar || null,
        department: userData.department || null,
        position: userData.position || null
      },
      preferences: {
        language: userData.language || 'es',
        timezone: userData.timezone || 'America/Bogota',
        notifications: {
          email: userData.emailNotifications !== undefined ? userData.emailNotifications : true,
          push: userData.pushNotifications !== undefined ? userData.pushNotifications : true,
          sms: userData.smsNotifications !== undefined ? userData.smsNotifications : false
        }
      },
      authProvider: userData.authProvider || 'email', // 'email', 'google', 'microsoft', 'github'
      authProviderId: userData.authProviderId || null,
      lastLogin: null,
      loginCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userData.createdBy || null // ID del usuario que lo creó
    };

    const result = await users.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  static async findById(userId) {
    const users = database.getUsersCollection();
    return await users.findOne({ 
      _id: typeof userId === 'string' ? new ObjectId(userId) : userId 
    });
  }

  static async findByEmail(email) {
    const users = database.getUsersCollection();
    return await users.findOne({ email: email.toLowerCase() });
  }

  static async findByClientId(clientId) {
    const users = database.getUsersCollection();
    return await users
      .find({ 
        clientId: typeof clientId === 'string' ? new ObjectId(clientId) : clientId,
        isActive: true 
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async getAll(filters = {}) {
    const users = database.getUsersCollection();
    const query = { isActive: true };
    
    if (filters.clientId) {
      query.clientId = typeof filters.clientId === 'string' ? new ObjectId(filters.clientId) : filters.clientId;
    }
    
    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { 'profile.firstName': { $regex: filters.search, $options: 'i' } },
        { 'profile.lastName': { $regex: filters.search, $options: 'i' } }
      ];
    }

    return await users
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async update(userId, updateData) {
    const users = database.getUsersCollection();
    
    // Preparar datos de actualización
    const updateFields = { ...updateData };
    updateFields.updatedAt = new Date();
    
    // Si hay configuraciones anidadas, preservar la estructura
    if (updateData.profile) {
      const currentUser = await this.findById(userId);
      updateFields.profile = {
        ...currentUser.profile,
        ...updateData.profile
      };
    }
    
    if (updateData.preferences) {
      const currentUser = await this.findById(userId);
      updateFields.preferences = {
        ...currentUser.preferences,
        ...updateData.preferences,
        notifications: {
          ...currentUser.preferences.notifications,
          ...(updateData.preferences.notifications || {})
        }
      };
    }
    
    const result = await users.updateOne(
      { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    return await this.findById(userId);
  }

  static async delete(userId) {
    const users = database.getUsersCollection();
    
    const result = await users.deleteOne({
      _id: typeof userId === 'string' ? new ObjectId(userId) : userId
    });
    
    if (result.deletedCount === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    return { success: true, message: 'Usuario eliminado permanentemente' };
  }

  static async deactivate(userId) {
    const users = database.getUsersCollection();
    
    const result = await users.updateOne(
      { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    return await this.findById(userId);
  }

  static async activate(userId) {
    const users = database.getUsersCollection();
    
    const result = await users.updateOne(
      { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
      { 
        $set: { 
          isActive: true,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    return await this.findById(userId);
  }

  static async updateLastLogin(userId) {
    const users = database.getUsersCollection();
    
    await users.updateOne(
      { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
      { 
        $set: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        },
        $inc: { loginCount: 1 }
      }
    );
    
    return await this.findById(userId);
  }

  static async findByAuthProvider(authProvider, authProviderId) {
    const users = database.getUsersCollection();
    return await users.findOne({ 
      authProvider,
      authProviderId,
      isActive: true 
    });
  }

  static async updatePermissions(userId, permissions) {
    const users = database.getUsersCollection();
    
    const result = await users.updateOne(
      { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
      { 
        $set: { 
          permissions,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    return await this.findById(userId);
  }

  static async changeRole(userId, newRole) {
    const users = database.getUsersCollection();
    
    const validRoles = ['user', 'admin', 'manager', 'viewer'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Rol no válido');
    }
    
    const result = await users.updateOne(
      { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
      { 
        $set: { 
          role: newRole,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    return await this.findById(userId);
  }

  // Obtener usuarios con información del cliente
  static async getUsersWithClientInfo(filters = {}) {
    const users = database.getUsersCollection();
    const clients = database.getClientsCollection();
    
    const pipeline = [
      {
        $match: {
          isActive: true,
          ...(filters.clientId && { 
            clientId: typeof filters.clientId === 'string' ? new ObjectId(filters.clientId) : filters.clientId 
          }),
          ...(filters.role && { role: filters.role }),
          ...(filters.search && {
            $or: [
              { name: { $regex: filters.search, $options: 'i' } },
              { email: { $regex: filters.search, $options: 'i' } },
              { 'profile.firstName': { $regex: filters.search, $options: 'i' } },
              { 'profile.lastName': { $regex: filters.search, $options: 'i' } }
            ]
          })
        }
      },
      {
        $lookup: {
          from: clients.collectionName,
          localField: 'clientId',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $unwind: '$client'
      },
      {
        $sort: { createdAt: -1 }
      }
    ];

    return await users.aggregate(pipeline).toArray();
  }

  // Crear usuario por defecto para MarketTech
  static async createDefaultUserForMarketTech(clientId) {
    const existingUser = await this.findByEmail('admin@markettech.com');
    
    if (!existingUser) {
      console.log('👤 Creando usuario por defecto para MarketTech');
      
      const defaultUser = await this.create({
        email: 'admin@markettech.com',
        name: 'Administrador MarketTech',
        clientId: clientId,
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin'],
        firstName: 'Administrador',
        lastName: 'MarketTech',
        phoneNumber: '+14155238886',
        department: 'Administración',
        position: 'Administrador Principal',
        authProvider: 'email'
      });
      
      console.log('✅ Usuario por defecto creado para MarketTech:', defaultUser._id);
      return defaultUser;
    }
    
    console.log('✅ Usuario por defecto ya existe para MarketTech');
    return existingUser;
  }
}

module.exports = User;
