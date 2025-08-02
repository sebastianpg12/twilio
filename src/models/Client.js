// src/models/Client.js
const database = require('../config/database');
const { ObjectId } = require('mongodb');

class Client {
  static async create(clientData) {
    const clients = database.getClientsCollection();
    
    const client = {
      name: clientData.name,
      phoneNumber: clientData.phoneNumber,
      twilioSid: clientData.twilioSid || process.env.TWILIO_SID,
      twilioAuthToken: clientData.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: clientData.twilioPhoneNumber,
      openaiApiKey: clientData.openaiApiKey || process.env.OPENAI_API_KEY,
      settings: {
        aiEnabled: true, // IA activada por defecto
        autoResponse: true,
        welcomeMessage: clientData.welcomeMessage || "¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?",
        businessHours: {
          enabled: false,
          start: "09:00",
          end: "18:00",
          timezone: "America/Bogota"
        }
      },
      subscription: {
        plan: "basic",
        status: "active",
        startDate: new Date(),
        endDate: null
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    const result = await clients.insertOne(client);
    return { ...client, _id: result.insertedId };
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

  // Crear cliente por defecto MarketTech
  static async createDefaultMarketTech() {
    const existingClient = await this.findByTwilioNumber('+14155238886');
    
    if (!existingClient) {
      console.log('🏢 Creando cliente por defecto: MarketTech');
      
      const marketTechClient = await this.create({
        name: 'MarketTech',
        phoneNumber: '+14155238886',
        twilioPhoneNumber: '+14155238886',
        welcomeMessage: "¡Hola! Somos MarketTech. Gracias por contactarnos. ¿En qué podemos ayudarte hoy?"
      });
      
      console.log('✅ Cliente MarketTech creado con ID:', marketTechClient._id);
      return marketTechClient;
    }
    
    console.log('✅ Cliente MarketTech ya existe');
    return existingClient;
  }
}

module.exports = Client;
