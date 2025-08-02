// src/models/Client.js
const database = require('../config/database');
const { ObjectId } = require('mongodb');

class Client {
  static async create(clientData) {
    const clients = database.getClientsCollection();
    
    const client = {
      name: clientData.name,
      business: clientData.business || null,
      phoneNumber: clientData.phoneNumber,
      email: clientData.email || null,
      twilioSid: clientData.twilioSid || process.env.TWILIO_SID,
      twilioAuthToken: clientData.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: clientData.twilioPhoneNumber,
      openaiApiKey: clientData.openaiApiKey || process.env.OPENAI_API_KEY,
      settings: {
        aiEnabled: clientData.aiEnabled !== undefined ? clientData.aiEnabled : true,
        autoResponse: clientData.autoResponse !== undefined ? clientData.autoResponse : true,
        welcomeMessage: clientData.welcomeMessage || `¡Hola! Somos ${clientData.name}. Gracias por contactarnos. ¿En qué podemos ayudarte?`,
        businessHours: {
          enabled: false,
          start: "09:00",
          end: "18:00",
          timezone: "America/Bogota"
        }
      },
      subscription: {
        plan: clientData.plan || "basic",
        status: "active",
        startDate: new Date(),
        endDate: null
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    const result = await clients.insertOne(client);
    const newClient = { ...client, _id: result.insertedId };
    
    // Crear usuario por defecto para el cliente
    try {
      const User = require('./User');
      const defaultUserEmail = `admin@${clientData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      
      const defaultUser = await User.create({
        email: defaultUserEmail,
        name: `Administrador ${clientData.name}`,
        clientId: newClient._id,
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin'],
        firstName: 'Administrador',
        lastName: clientData.name,
        phoneNumber: clientData.phoneNumber,
        department: 'Administración',
        position: 'Administrador Principal',
        authProvider: 'email'
      });
      
      console.log(`👤 Usuario por defecto creado para ${clientData.name}: ${defaultUserEmail}`);
      newClient.defaultUser = defaultUser;
    } catch (userError) {
      console.warn(`⚠️  No se pudo crear usuario por defecto para ${clientData.name}:`, userError.message);
    }
    
    return newClient;
  }

  static async findById(clientId) {
    const clients = database.getClientsCollection();
    return await clients.findOne({ 
      _id: typeof clientId === 'string' ? new ObjectId(clientId) : clientId 
    });
  }

  static async findByTwilioNumber(twilioPhoneNumber) {
    const clients = database.getClientsCollection();
    return await clients.findOne({ twilioPhoneNumber });
  }

  static async getAll() {
    const clients = database.getClientsCollection();
    return await clients
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async updateSettings(clientId, settings) {
    const clients = database.getClientsCollection();
    
    return await clients.updateOne(
      { _id: typeof clientId === 'string' ? new ObjectId(clientId) : clientId },
      {
        $set: {
          settings: { ...settings },
          updatedAt: new Date()
        }
      }
    );
  }

  static async toggleAI(clientId, enabled) {
    const clients = database.getClientsCollection();
    
    return await clients.updateOne(
      { _id: typeof clientId === 'string' ? new ObjectId(clientId) : clientId },
      {
        $set: {
          'settings.aiEnabled': enabled,
          updatedAt: new Date()
        }
      }
    );
  }

  static async toggleAutoResponse(clientId, enabled) {
    const clients = database.getClientsCollection();
    
    return await clients.updateOne(
      { _id: typeof clientId === 'string' ? new ObjectId(clientId) : clientId },
      {
        $set: {
          'settings.autoResponse': enabled,
          updatedAt: new Date()
        }
      }
    );
  }

  static async getById(clientId) {
    const clients = database.getClientsCollection();
    const client = await clients.findOne({ 
      _id: typeof clientId === 'string' ? new ObjectId(clientId) : clientId 
    });
    return client;
  }

  static async update(clientId, updateData) {
    const clients = database.getClientsCollection();
    
    // Preparar datos de actualización
    const updateFields = { ...updateData };
    updateFields.updatedAt = new Date();
    
    // Si hay configuraciones anidadas, preservar la estructura
    if (updateData.settings) {
      const currentClient = await this.getById(clientId);
      updateFields.settings = {
        ...currentClient.settings,
        ...updateData.settings
      };
    }
    
    const result = await clients.updateOne(
      { _id: typeof clientId === 'string' ? new ObjectId(clientId) : clientId },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Cliente no encontrado');
    }
    
    return await this.getById(clientId);
  }

  static async delete(clientId) {
    const clients = database.getClientsCollection();
    
    const result = await clients.deleteOne({
      _id: typeof clientId === 'string' ? new ObjectId(clientId) : clientId
    });
    
    if (result.deletedCount === 0) {
      throw new Error('Cliente no encontrado');
    }
    
    return { success: true, message: 'Cliente eliminado permanentemente' };
  }

  // Crear cliente por defecto MarketTech
  static async createDefaultMarketTech() {
    const existingClient = await this.findByTwilioNumber('+14155238886');
    
    if (!existingClient) {
      console.log('🏢 Creando cliente por defecto: MarketTech');
      
      const marketTechClient = await this.create({
        name: 'MarketTech',
        business: 'Marketing y Tecnología',
        phoneNumber: '+14155238886',
        email: 'info@markettech.com',
        twilioPhoneNumber: '+14155238886',
        welcomeMessage: "¡Hola! Somos MarketTech. Gracias por contactarnos. ¿En qué podemos ayudarte hoy?",
        plan: 'enterprise'
      });
      
      console.log('✅ Cliente MarketTech creado con ID:', marketTechClient._id);
      
      // Asegurarse de que el usuario por defecto se creó
      if (marketTechClient.defaultUser) {
        console.log('✅ Usuario por defecto creado:', marketTechClient.defaultUser.email);
      }
      
      return marketTechClient;
    }
    
    console.log('✅ Cliente MarketTech ya existe');
    
    // Verificar si ya tiene usuario por defecto
    try {
      const User = require('./User');
      const existingUser = await User.findByEmail('admin@markettech.com');
      
      if (!existingUser) {
        console.log('👤 Creando usuario por defecto para MarketTech existente');
        await User.createDefaultUserForMarketTech(existingClient._id);
      }
    } catch (error) {
      console.warn('⚠️  Error verificando usuario por defecto para MarketTech:', error.message);
    }
    
    return existingClient;
  }
}

module.exports = Client;
