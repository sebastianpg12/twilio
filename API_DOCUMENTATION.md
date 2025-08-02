# 📋 API Documentation - Sistema Multi-Cliente WhatsApp Business

**Fecha:** Agosto 2, 2025  
**Versión:** 1.0  
**Base URL:** `https://twilio-9ubt.onrender.com`

## 🏗️ Arquitectura Multi-Cliente

Este sistema permite que múltiples clientes tengan sus propios dashboards completamente separados, con sus propias conversaciones, configuraciones de IA, y estadísticas independientes.

### 🔑 Autenticación

**Admin Panel:** Requiere header `x-admin-key: admin123`  
**Client Dashboard:** Automático por número de teléfono Twilio

---

## 📚 Índice de APIs

1. [Sistema y Configuración](#sistema-y-configuración)
2. [Gestión de Clientes (Admin)](#gestión-de-clientes-admin)
3. [Dashboard del Cliente](#dashboard-del-cliente)
4. [Conversaciones](#conversaciones)
5. [Mensajería](#mensaje7. **ClientForm** - Formulario de creación/edición de clientes
8. **BulkActions** - Acciones en lote
9. **RealTimeNotifications** - Notificaciones en tiempo real
10. **KnowledgeManager** - Gestión de base de conocimiento
11. **KnowledgeEntryForm** - Formulario de entradas
12. **CategoryFilter** - Filtros por categoría
13. **KnowledgeSearch** - Búsqueda en conocimiento)
6. [Control de IA](#control-de-ia)
7. [Base de Conocimiento](#base-de-conocimiento)
8. [Webhooks](#webhooks)

---

## 🔧 Sistema y Configuración

### Health Check
**Endpoint:** `GET /health`  
**Descripción:** Verificar estado del sistema
```javascript
// Ejemplo de uso
fetch('/health')
  .then(response => response.json())
  .then(data => console.log(data));

// Respuesta esperada
{
  "success": true,
  "status": "OK",
  "database": "connected",
  "timestamp": "2025-08-02T06:15:00.000Z"
}
```

### Estado de Configuración
**Endpoint:** `GET /api/setup/status`  
**Descripción:** Ver estado de inicialización del sistema
```javascript
// Ejemplo de uso
const setupStatus = await fetch('/api/setup/status').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": {
    "isInitialized": true,
    "totalClients": 2,
    "hasMarketTech": true,
    "lastInitialization": "2025-08-02T06:15:00.000Z"
  }
}
```

### Inicializar Sistema
**Endpoint:** `POST /api/setup/initialize`  
**Descripción:** Inicializar sistema con cliente por defecto
```javascript
// Ejemplo de uso
const initialize = await fetch('/api/setup/initialize', {
  method: 'POST'
}).then(r => r.json());
```

---

## 👥 Gestión de Clientes (Admin)

> **Nota:** Todas estas rutas requieren `x-admin-key: admin123` en los headers

### Listar Todos los Clientes
**Endpoint:** `GET /api/admin/clients`  
**Query Params:** `limit`, `offset`, `search`
```javascript
// Ejemplo de uso
const clients = await fetch('/api/admin/clients?limit=10&offset=0&search=Market', {
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": [
    {
      "_id": "688da23c21e39b848cb30560",
      "name": "MarketTech",
      "business": "Marketing y Tecnología",
      "phoneNumber": "+14155238886",
      "email": "info@markettech.com",
      "twilioPhoneNumber": "+14155238886",
      "isActive": true,
      "stats": {
        "conversations": 5,
        "messages": 23,
        "unreadConversations": 2
      },
      "createdAt": "2025-08-02T06:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

### Obtener Cliente Específico
**Endpoint:** `GET /api/admin/clients/:id`
```javascript
// Ejemplo de uso
const client = await fetch(`/api/admin/clients/${clientId}`, {
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());

// Respuesta incluye estadísticas detalladas
{
  "success": true,
  "data": {
    "_id": "688da23c21e39b848cb30560",
    "name": "MarketTech",
    // ... otros campos del cliente
    "detailedStats": {
      "conversations": {
        "total": 5,
        "active": 3,
        "unread": 2
      },
      "messages": {
        "total": 23,
        "received": 15,
        "sent": 8
      }
    }
  }
}
```

### Crear Nuevo Cliente
**Endpoint:** `POST /api/admin/clients`
```javascript
// Ejemplo de uso
const newClient = await fetch('/api/admin/clients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': 'admin123'
  },
  body: JSON.stringify({
    name: "Nueva Empresa",
    business: "E-commerce",
    phoneNumber: "+573001234567",
    email: "contacto@nuevaempresa.com",
    twilioPhoneNumber: "+14155559999",
    welcomeMessage: "¡Hola! Somos Nueva Empresa. ¿Cómo podemos ayudarte?",
    aiEnabled: true,
    autoResponse: true,
    plan: "premium"
  })
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Cliente \"Nueva Empresa\" creado exitosamente",
  "data": {
    "_id": "688dad72c9628c84329a3ada",
    "name": "Nueva Empresa",
    // ... resto de los datos del cliente
  }
}
```

### Actualizar Cliente
**Endpoint:** `PUT /api/admin/clients/:id`
```javascript
// Ejemplo de uso
const updatedClient = await fetch(`/api/admin/clients/${clientId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': 'admin123'
  },
  body: JSON.stringify({
    business: "E-commerce Avanzado",
    email: "nuevo@empresa.com",
    plan: "enterprise"
  })
}).then(r => r.json());
```

### Eliminar Cliente
**Endpoint:** `DELETE /api/admin/clients/:id`  
**Query Params:** `permanent=true` (para eliminación permanente)
```javascript
// Desactivar cliente (soft delete)
const deactivate = await fetch(`/api/admin/clients/${clientId}`, {
  method: 'DELETE',
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());

// Eliminar permanentemente
const permanentDelete = await fetch(`/api/admin/clients/${clientId}?permanent=true`, {
  method: 'DELETE',
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());
```

### Reactivar Cliente
**Endpoint:** `POST /api/admin/clients/:id/activate`
```javascript
// Ejemplo de uso
const reactivate = await fetch(`/api/admin/clients/${clientId}/activate`, {
  method: 'POST',
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());
```

### Acciones en Lote
**Endpoint:** `POST /api/admin/clients/bulk-actions`
```javascript
// Ejemplo de uso - Desactivar IA para múltiples clientes
const bulkAction = await fetch('/api/admin/clients/bulk-actions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': 'admin123'
  },
  body: JSON.stringify({
    action: "toggle-ai",
    clientIds: [clientId1, clientId2, clientId3],
    settings: { enabled: false }
  })
}).then(r => r.json());

// Acciones disponibles:
// - "activate": Activar clientes
// - "deactivate": Desactivar clientes  
// - "toggle-ai": Activar/desactivar IA
// - "toggle-auto-response": Activar/desactivar auto-respuesta
```

### Ver Conversaciones de Cliente
**Endpoint:** `GET /api/admin/clients/:id/conversations`
```javascript
// Ejemplo de uso
const clientConversations = await fetch(`/api/admin/clients/${clientId}/conversations?limit=20&offset=0`, {
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());
```

### Panel de Administración General
**Endpoint:** `GET /api/admin/overview`
```javascript
// Ejemplo de uso
const adminOverview = await fetch('/api/admin/overview', {
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": {
    "systemStats": {
      "totalClients": 2,
      "activeClients": 2,
      "totalConversations": 1,
      "totalMessages": 3,
      "unreadConversations": 0
    },
    "clients": [
      {
        "_id": "688da23c21e39b848cb30560",
        "name": "MarketTech",
        "isActive": true,
        "stats": {
          "conversations": 1,
          "messages": 3,
          "unreadConversations": 0
        }
      }
    ],
    "lastUpdated": "2025-08-02T06:16:26.839Z"
  }
}
```

---

## 📊 Dashboard del Cliente

### Estadísticas Generales por Cliente
**Endpoint:** `GET /api/dashboard/stats/:twilioNumber`
```javascript
// Ejemplo de uso - Obtener stats de MarketTech
const stats = await fetch('/api/dashboard/stats/+14155238886').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": {
    "conversations": {
      "total": 1,
      "active": 1,
      "unread": 0
    },
    "messages": {
      "total": 3,
      "received": 2,
      "sent": 1,
      "today": 3
    },
    "aiStats": {
      "enabled": true,
      "responsesGenerated": 1,
      "averageResponseTime": "2.5s"
    }
  }
}
```

### Estadísticas de Tiempo Real
**Endpoint:** `GET /api/dashboard/realtime-stats/:twilioNumber`
```javascript
// Ejemplo de uso - Para dashboards en tiempo real
const realtimeStats = await fetch('/api/dashboard/realtime-stats/+14155238886').then(r => r.json());

// Similar a /stats pero optimizado para actualizaciones frecuentes
```

---

## 💬 Conversaciones

### Listar Conversaciones por Cliente
**Endpoint:** `GET /api/conversations/:twilioNumber`
```javascript
// Ejemplo de uso
const conversations = await fetch('/api/conversations/+14155238886?limit=20&offset=0').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": [
    {
      "_id": "688da23e21e39b848cb30561",
      "clientId": "688da23c21e39b848cb30560",
      "userPhoneNumber": "+573001234567",
      "lastMessage": "Gracias por la información",
      "lastMessageAt": "2025-08-02T06:15:30.000Z",
      "unreadCount": 0,
      "aiEnabled": true,
      "tags": ["cliente-nuevo", "interesado"],
      "status": "active"
    }
  ]
}
```

### Obtener Conversación Específica
**Endpoint:** `GET /api/conversations/:twilioNumber/:userPhoneNumber`
```javascript
// Ejemplo de uso
const conversation = await fetch('/api/conversations/+14155238886/+573001234567').then(r => r.json());

// Respuesta incluye mensajes completos
{
  "success": true,
  "data": {
    "_id": "688da23e21e39b848cb30561",
    "clientId": "688da23c21e39b848cb30560",
    "userPhoneNumber": "+573001234567",
    "messages": [
      {
        "_id": "msg1",
        "content": "Hola, necesito información sobre sus servicios",
        "sender": "user",
        "timestamp": "2025-08-02T06:15:00.000Z",
        "status": "delivered"
      },
      {
        "_id": "msg2", 
        "content": "¡Hola! Claro, estaré encantado de ayudarte. ¿Qué tipo de información necesitas?",
        "sender": "ai",
        "timestamp": "2025-08-02T06:15:05.000Z",
        "status": "sent"
      }
    ],
    "aiEnabled": true,
    "unreadCount": 0
  }
}
```

### Marcar Conversación como Leída
**Endpoint:** `POST /api/conversations/:twilioNumber/:userPhoneNumber/mark-read`
```javascript
// Ejemplo de uso
const markRead = await fetch('/api/conversations/+14155238886/+573001234567/mark-read', {
  method: 'POST'
}).then(r => r.json());
```

---

## 📨 Mensajería

### Enviar Mensaje
**Endpoint:** `POST /api/messages/send`
```javascript
// Ejemplo de uso
const sendMessage = await fetch('/api/messages/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: "+573001234567",
    message: "Hola, gracias por contactarnos. ¿En qué podemos ayudarte?",
    twilioNumber: "+14155238886"
  })
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": {
    "twilioSid": "SM1234567890abcdef",
    "status": "queued",
    "to": "+573001234567",
    "from": "whatsapp:+14155238886"
  }
}
```

### Historial de Mensajes
**Endpoint:** `GET /api/messages/:twilioNumber/:userPhoneNumber/history`
```javascript
// Ejemplo de uso
const messageHistory = await fetch('/api/messages/+14155238886/+573001234567/history?limit=50&offset=0').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": [
    {
      "_id": "688da23f21e39b848cb30562",
      "conversationId": "688da23e21e39b848cb30561",
      "content": "Hola, necesito información",
      "sender": "user",
      "timestamp": "2025-08-02T06:15:00.000Z",
      "status": "delivered",
      "twilioSid": "SM1234567890abcdef"
    }
  ]
}
```

---

## 🤖 Control de IA

### Toggle IA por Cliente
**Endpoint:** `POST /api/ia-control/client/:twilioNumber/toggle`
```javascript
// Ejemplo de uso - Desactivar IA para todo el cliente
const toggleClientAI = await fetch('/api/ia-control/client/+14155238886/toggle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enabled: false })
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "IA desactivada para el cliente MarketTech",
  "data": {
    "clientId": "688da23c21e39b848cb30560",
    "aiEnabled": false
  }
}
```

### Toggle IA por Conversación
**Endpoint:** `POST /api/ia-control/conversation/:twilioNumber/:userPhoneNumber/toggle`
```javascript
// Ejemplo de uso - Desactivar IA solo para una conversación específica
const toggleConversationAI = await fetch('/api/ia-control/conversation/+14155238886/+573001234567/toggle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enabled: false })
}).then(r => r.json());
```

### Estado de IA
**Endpoint:** `GET /api/ia-control/status/:twilioNumber/:userPhoneNumber`
```javascript
// Ejemplo de uso
const aiStatus = await fetch('/api/ia-control/status/+14155238886/+573001234567').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": {
    "clientAIEnabled": true,
    "conversationAIEnabled": false,
    "effectiveAIStatus": false,  // false porque conversación tiene prioridad
    "reason": "IA desactivada específicamente para esta conversación"
  }
}
```

---

## � Base de Conocimiento

> **Cada cliente tiene su propia base de conocimiento independiente**

### Crear Entrada de Conocimiento
**Endpoint:** `POST /api/knowledge/client/:clientId`
```javascript
// Ejemplo de uso
const newEntry = await fetch('/api/knowledge/client/688da23c21e39b848cb30560', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Horarios de Atención",
    content: "Lunes a viernes 9:00 AM - 6:00 PM, sábados 9:00 AM - 2:00 PM",
    category: "horarios",
    keywords: ["horario", "atencion", "disponible"],
    tags: ["servicio-cliente"],
    priority: 9
  })
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Entrada de conocimiento \"Horarios de Atención\" creada exitosamente",
  "data": {
    "_id": "688da240c9628c84329a3adb",
    "clientId": "688da23c21e39b848cb30560",
    "title": "Horarios de Atención",
    "category": "horarios",
    "priority": 9,
    "isActive": true,
    "createdAt": "2025-08-02T07:30:00.000Z"
  }
}
```

**Categorías disponibles:** `general`, `productos`, `servicios`, `precios`, `faq`, `politicas`, `contacto`, `horarios`, `promociones`, `otros`

### Listar Entradas del Cliente
**Endpoint:** `GET /api/knowledge/client/:clientId`  
**Query Params:** `limit`, `offset`, `category`, `search`
```javascript
// Ejemplo de uso
const entries = await fetch('/api/knowledge/client/688da23c21e39b848cb30560?category=precios&limit=10').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": [
    {
      "_id": "688da240c9628c84329a3adb",
      "title": "Lista de Precios",
      "content": "Consultoría básica: $50/hora...",
      "category": "precios",
      "priority": 10,
      "createdAt": "2025-08-02T07:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

### Actualizar Entrada
**Endpoint:** `PUT /api/knowledge/entry/:entryId`
```javascript
// Ejemplo de uso
const updatedEntry = await fetch('/api/knowledge/entry/688da240c9628c84329a3adb', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: "Horarios actualizados: Lunes a viernes 8:00 AM - 7:00 PM",
    priority: 10
  })
}).then(r => r.json());
```

### Eliminar Entrada
**Endpoint:** `DELETE /api/knowledge/entry/:entryId`
```javascript
// Desactivar entrada (soft delete)
const deleteEntry = await fetch('/api/knowledge/entry/688da240c9628c84329a3adb', {
  method: 'DELETE'
}).then(r => r.json());

// Eliminar permanentemente
const permanentDelete = await fetch('/api/knowledge/entry/688da240c9628c84329a3adb?permanent=true', {
  method: 'DELETE'
}).then(r => r.json());
```

### Buscar en Base de Conocimiento
**Endpoint:** `GET /api/knowledge/client/:clientId/search`
```javascript
// Ejemplo de uso
const searchResults = await fetch('/api/knowledge/client/688da23c21e39b848cb30560/search?q=precios').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": {
    "query": "precios",
    "results": [
      {
        "id": "688da240c9628c84329a3adb",
        "title": "Lista de Precios",
        "content": "Consultoría básica: $50/hora...",
        "relevanceScore": 5.5
      }
    ],
    "total": 1
  }
}
```

### Estadísticas de Conocimiento
**Endpoint:** `GET /api/knowledge/client/:clientId/stats`
```javascript
// Ejemplo de uso
const stats = await fetch('/api/knowledge/client/688da23c21e39b848cb30560/stats').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": {
    "total": 15,
    "active": 12,
    "inactive": 3,
    "categories": ["precios", "servicios", "horarios", "faq", "contacto"]
  }
}
```

### Acciones en Lote
**Endpoint:** `POST /api/knowledge/client/:clientId/bulk-actions`
```javascript
// Ejemplo de uso - Cambiar prioridad de múltiples entradas
const bulkAction = await fetch('/api/knowledge/client/688da23c21e39b848cb30560/bulk-actions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: "update-priority",
    entryIds: ["688da240c9628c84329a3adb", "688da241c9628c84329a3adc"],
    settings: { priority: 8 }
  })
}).then(r => r.json());

// Acciones disponibles:
// - "activate": Activar entradas
// - "deactivate": Desactivar entradas
// - "update-category": Cambiar categoría
// - "update-priority": Cambiar prioridad
// - "delete-permanent": Eliminar permanentemente
```

### Integración Automática con IA BOT

La base de conocimiento se integra automáticamente con el BOT de IA:

1. **Usuario pregunta:** "¿Cuáles son sus precios?"
2. **Sistema busca** en la base de conocimiento del cliente
3. **IA genera respuesta** usando la información específica encontrada
4. **Respuesta personalizada** se envía al usuario

```javascript
// El BOT automáticamente usa el conocimiento del cliente
// No requiere configuración adicional
// Funciona con cualquier mensaje entrante de WhatsApp
```

---

## �🔔 Webhooks

### Webhook Principal de Twilio
**Endpoint:** `POST /webhook`  
**Descripción:** Recibe mensajes de WhatsApp y procesa respuestas automáticas

```javascript
// Este endpoint es llamado automáticamente por Twilio
// No requiere implementación en el frontend, pero es útil conocerlo

// Estructura del webhook que recibe Twilio:
{
  "From": "whatsapp:+573001234567",
  "To": "whatsapp:+14155238886", 
  "Body": "Hola, necesito ayuda",
  "MessageSid": "SM1234567890abcdef"
}

// El sistema automáticamente:
// 1. Identifica el cliente por el número "To"
// 2. Guarda el mensaje en la base de datos  
// 3. Si la IA está habilitada, genera y envía respuesta automática
```

---

## 🎨 Estructura Recomendada del Frontend

### 📱 **Panel de Administración** (`/admin`)
**Autenticación:** Requerida (`x-admin-key`)

#### Páginas Sugeridas:

1. **Dashboard Principal** (`/admin/dashboard`)
   - Overview general del sistema
   - Estadísticas consolidadas
   - Clientes más activos
   - Métricas en tiempo real

2. **Gestión de Clientes** (`/admin/clients`)
   - Lista paginada de todos los clientes
   - Búsqueda y filtros
   - Acciones en lote
   - **Subpáginas:**
     - `/admin/clients/new` - Crear cliente
     - `/admin/clients/:id/edit` - Editar cliente
     - `/admin/clients/:id/view` - Ver detalles del cliente
     - `/admin/clients/:id/conversations` - Ver conversaciones del cliente

3. **Configuración del Sistema** (`/admin/settings`)
   - Configuraciones globales
   - Gestión de webhooks
   - Logs del sistema

### 🏢 **Dashboard del Cliente** (`/client/:twilioNumber`)
**Identificación:** Automática por número Twilio

#### Páginas Sugeridas:

1. **Dashboard Principal** (`/client/:twilioNumber/dashboard`)
   - Estadísticas del cliente específico
   - Conversaciones recientes
   - Métricas de IA
   - Estado del sistema

2. **Conversaciones** (`/client/:twilioNumber/conversations`)
   - Lista de todas las conversaciones
   - Vista de chat en tiempo real
   - **Subpáginas:**
     - `/client/:twilioNumber/conversations/:userPhone` - Chat específico

3. **Configuración** (`/client/:twilioNumber/settings`)
   - Configuraciones específicas del cliente
   - Control de IA
   - Mensaje de bienvenida
   - Horarios de atención

4. **Mensajería** (`/client/:twilioNumber/messages`)
   - Envío manual de mensajes
   - Templates de mensajes
   - Historial de mensajes enviados

5. **Base de Conocimiento** (`/client/:twilioNumber/knowledge`)
   - Gestión de entradas de conocimiento
   - Categorización y búsqueda
   - Configuración del BOT de IA
   - **Subpáginas:**
     - `/client/:twilioNumber/knowledge/entries` - Lista de entradas
     - `/client/:twilioNumber/knowledge/new` - Crear entrada
     - `/client/:twilioNumber/knowledge/categories` - Gestión por categorías

---

## 📋 **Componentes Frontend Recomendados**

### 🎯 **Componentes Principales**

1. **ClientSelector** - Selector de cliente (solo admin)
2. **ConversationList** - Lista de conversaciones
3. **ChatWindow** - Ventana de chat en tiempo real  
4. **StatsCard** - Tarjetas de estadísticas
5. **AIToggle** - Control de IA on/off
6. **ClientForm** - Formulario de creación/edición de clientes
7. **BulkActions** - Acciones en lote
8. **RealTimeNotifications** - Notificaciones en tiempo real

### 🔄 **Funcionalidades Clave a Implementar**

1. **WebSocket/Server-Sent Events** para actualizaciones en tiempo real
2. **Paginación infinita** para listas largas
3. **Búsqueda en tiempo real** con debounce
4. **Notificaciones push** para nuevos mensajes
5. **Tema claro/oscuro** para mejor UX
6. **Responsive design** para móviles

---

## 🚨 **Manejo de Errores**

### Códigos de Estado HTTP:
- `200` - Éxito
- `201` - Creado exitosamente  
- `400` - Error de validación/datos incorrectos
- `401` - No autorizado (falta x-admin-key)
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

### Estructura de Errores:
```javascript
{
  "success": false,
  "error": "Descripción del error",
  "details": "Información adicional opcional"
}
```

---

## 🔄 **Ejemplos de Flujos Completos**

### Flujo de Administrador:
1. Login con `x-admin-key`
2. Ver dashboard general (`/api/admin/overview`)
3. Crear nuevo cliente (`POST /api/admin/clients`)
4. Configurar cliente (`PUT /api/admin/clients/:id`)
5. Ver conversaciones del cliente (`GET /api/admin/clients/:id/conversations`)

### Flujo de Cliente:
1. Acceso automático por número Twilio
2. Ver dashboard (`/api/dashboard/stats/:twilioNumber`)
3. Ver conversaciones (`/api/conversations/:twilioNumber`)
4. Chatear con usuarios (`/api/conversations/:twilioNumber/:userPhone`)
5. Enviar mensajes (`POST /api/messages/send`)
6. Controlar IA (`POST /api/ia-control/client/:twilioNumber/toggle`)

---

## 🌟 **Notas Importantes**

1. **Separación de Clientes:** Cada cliente ve únicamente sus propias conversaciones
2. **IA Granular:** Se puede controlar IA a nivel cliente o conversación individual
3. **Base de Conocimiento Independiente:** Cada cliente tiene su propia base de conocimiento que alimenta su BOT de IA
4. **Tiempo Real:** Sistema diseñado para actualizaciones en tiempo real
5. **Escalabilidad:** Arquitectura preparada para múltiples clientes
6. **Seguridad:** Admin panel protegido, clientes identificados por número Twilio
7. **BOT Inteligente:** Respuestas automáticas contextuales basadas en el conocimiento específico de cada cliente

---

## 📞 **Soporte**

Para dudas sobre implementación o APIs específicas, revisar:
- Logs del servidor en la consola
- Respuestas de error detalladas de cada endpoint
- Collection de Postman incluida en el proyecto

**¡El sistema está completamente funcional y listo para el frontend!** 🚀
