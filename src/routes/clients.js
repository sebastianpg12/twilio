// src/routes/clients.js
const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const ConversationService = require('../services/conversationService');

// ========== GESTIÓN DE CLIENTES ==========

// Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const clients = await Client.getAll(parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener un cliente específico
router.get('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
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

// Crear un nuevo cliente
router.post('/', async (req, res) => {
  try {
    const clientData = req.body;
    const client = await Client.create(clientData);
    
    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: client
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Actualizar configuración de un cliente
router.put('/:clientId/settings', async (req, res) => {
  try {
    const { clientId } = req.params;
    const settings = req.body;
    
    const client = await Client.updateSettings(clientId, settings);
    
    res.json({
      success: true,
      message: 'Configuración actualizada',
      data: client
    });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Activar/desactivar respuesta automática
router.post('/:clientId/auto-response/toggle', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { enabled } = req.body;
    
    const client = await Client.toggleAutoResponse(clientId, enabled);
    
    res.json({
      success: true,
      message: `Respuesta automática ${enabled ? 'activada' : 'desactivada'}`,
      data: {
        autoResponseEnabled: client.settings.autoResponseEnabled
      }
    });
  } catch (error) {
    console.error('Error cambiando respuesta automática:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener conversaciones de un cliente
router.get('/:clientId/conversations', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    const conversations = await ConversationService.getAllConversations(
      clientId, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener historial de una conversación específica
router.get('/:clientId/conversations/:phoneNumber/history', async (req, res) => {
  try {
    const { clientId, phoneNumber } = req.params;
    
    const history = await ConversationService.getConversationHistory(phoneNumber, clientId);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
