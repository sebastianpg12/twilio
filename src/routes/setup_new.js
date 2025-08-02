// src/routes/setup.js
const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

/**
 * GET /api/setup/status
 * Estado de inicialización del sistema
 */
router.get('/status', async (req, res) => {
  try {
    const clients = await Client.getAll();
    const marketTechClient = await Client.findByTwilioNumber('+14155238886');
    
    res.json({
      success: true,
      data: {
        isInitialized: clients.length > 0,
        totalClients: clients.length,
        hasMarketTech: !!marketTechClient,
        marketTechId: marketTechClient ? marketTechClient._id : null,
        systemReady: clients.length > 0 && !!marketTechClient
      }
    });
  } catch (error) {
    console.error('Error verificando estado del sistema:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/setup/markettech
 * Obtener información del cliente MarketTech
 */
router.get('/markettech', async (req, res) => {
  try {
    let marketTechClient = await Client.findByTwilioNumber('+14155238886');
    
    if (!marketTechClient) {
      // Crear MarketTech si no existe
      marketTechClient = await Client.createDefaultMarketTech();
    }
    
    res.json({
      success: true,
      data: marketTechClient
    });
  } catch (error) {
    console.error('Error obteniendo MarketTech:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/setup/initialize
 * Inicializar el sistema multi-cliente
 */
router.post('/initialize', async (req, res) => {
  try {
    const { forceReset = false } = req.body;
    
    if (forceReset) {
      console.log('🔄 Reinicializando sistema...');
    }
    
    // Crear o verificar MarketTech
    const marketTechClient = await Client.createDefaultMarketTech();
    
    // Verificar otros clientes
    const allClients = await Client.getAll();
    
    res.json({
      success: true,
      message: 'Sistema inicializado correctamente',
      data: {
        marketTechClient,
        totalClients: allClients.length,
        clients: allClients.map(c => ({
          id: c._id,
          name: c.name,
          phoneNumber: c.twilioPhoneNumber,
          isActive: c.isActive
        }))
      }
    });
  } catch (error) {
    console.error('Error inicializando sistema:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
