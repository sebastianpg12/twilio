# 📱 WhatsApp Business Backend API

## 🚀 Descripción del Proyecto

Backend completo para sistema de WhatsApp Business con integración de IA (OpenAI), base de datos MongoDB y múltiples clientes. Sistema diseñado para manejar conversaciones automatizadas, gestión de usuarios, base de conocimiento y estadísticas en tiempo real.

## 🛠️ Tecnologías

- **Node.js** + **Express.js** (Framework web)
- **MongoDB** (Base de datos)
- **Twilio** (API de WhatsApp)
- **OpenAI** (Inteligencia Artificial)
- **CORS** habilitado para desarrollo

## 🌐 URLs del Sistema

- **Desarrollo**: `http://localhost:3000`
- **Producción**: `https://twilio-9ubt.onrender.com`

---

## 📋 Índice de Endpoints

1. [🔧 Sistema y Salud](#-sistema-y-salud)
2. [👥 Gestión de Clientes](#-gestión-de-clientes)
3. [💬 Conversaciones](#-conversaciones)
4. [📊 Estadísticas](#-estadísticas)
5. [👤 Usuarios](#-usuarios)
6. [📚 Base de Conocimiento](#-base-de-conocimiento)
7. [🔗 WhatsApp y Mensajería](#-whatsapp-y-mensajería)
8. [🤖 Inteligencia Artificial](#-inteligencia-artificial)
9. [🔐 Administración](#-administración)

---

## 🔧 Sistema y Salud

### ✅ Health Check
**Verificar estado del sistema**

```http
GET /api/health
```

**Respuesta:**
```json
{
  "success": true,
  "status": "OK",
  "timestamp": "2025-08-13T14:30:00.000Z",
  "environment": "development",
  "database": "connected"
}
```

**Casos de uso:**
- Monitoreo del sistema
- Verificación de conectividad
- Dashboard de estado

---

## 👥 Gestión de Clientes

### 📋 Listar Todos los Clientes

```http
GET /api/clients
```

**Query Parameters:**
```javascript
{
  limit: 10,     // Número de resultados (default: 10)
  offset: 0      // Paginación (default: 0)
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "client_id_123",
      "name": "MarketTech",
      "business": "Desarrollo de Software",
      "phoneNumber": "+57300123456",
      "email": "info@markettech.com",
      "twilioPhoneNumber": "whatsapp:+14155238886",
      "settings": {
        "aiEnabled": true,
        "autoResponseEnabled": true,
        "welcomeMessage": "¡Hola! Somos MarketTech..."
      },
      "isActive": true,
      "createdAt": "2025-08-13T14:30:00.000Z"
    }
  ]
}
```

### 🔍 Obtener Cliente Específico

```http
GET /api/clients/{clientId}
```

**Path Parameters:**
- `clientId`: ID único del cliente

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "client_id_123",
    "name": "MarketTech",
    "business": "Desarrollo de Software",
    "settings": {
      "aiEnabled": true,
      "autoResponseEnabled": true,
      "welcomeMessage": "¡Hola! Somos MarketTech...",
      "businessHours": {
        "enabled": false,
        "start": "09:00",
        "end": "18:00",
        "timezone": "America/Bogota"
      }
    }
  }
}
```

### ➕ Crear Nuevo Cliente

```http
POST /api/clients
```

**Body (JSON):**
```json
{
  "name": "NuevoCliente",
  "business": "Tipo de negocio",
  "phoneNumber": "+57300123456",
  "email": "cliente@email.com",
  "twilioPhoneNumber": "whatsapp:+14155238887",
  "welcomeMessage": "¡Hola! Somos NuevoCliente. ¿En qué podemos ayudarte?",
  "aiEnabled": true,
  "autoResponse": true
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Cliente creado exitosamente",
  "data": {
    "_id": "new_client_id",
    "name": "NuevoCliente",
    // ... datos del cliente creado
  }
}
```

### 🔧 Actualizar Configuración de Cliente

```http
PUT /api/clients/{clientId}/settings
```

**Body (JSON):**
```json
{
  "aiEnabled": true,
  "autoResponseEnabled": false,
  "welcomeMessage": "Nuevo mensaje de bienvenida",
  "businessHours": {
    "enabled": true,
    "start": "08:00",
    "end": "17:00",
    "timezone": "America/Bogota"
  }
}
```

### 🤖 Toggle IA del Cliente

```http
POST /api/clients/{clientId}/toggle-ai
```

**Body (JSON):**
```json
{
  "enabled": true  // true o false
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "IA activada para el cliente",
  "data": {
    "enabled": true
  }
}
```

### 🔄 Toggle Auto-respuesta del Cliente

```http
POST /api/clients/{clientId}/toggle-auto-response
```

**Body (JSON):**
```json
{
  "enabled": false  // true o false
}
```

### 💬 Conversaciones del Cliente

```http
GET /api/clients/{clientId}/conversations
```

**Query Parameters:**
```javascript
{
  limit: 10,     // Número de conversaciones (default: 10)
  offset: 0      // Paginación (default: 0)
}
```

### 📖 Historial de Conversación Específica

```http
GET /api/clients/{clientId}/conversations/{phoneNumber}/history
```

**Path Parameters:**
- `clientId`: ID del cliente
- `phoneNumber`: Número de teléfono (con o sin prefijo whatsapp:)

---

## 💬 Conversaciones

### 📋 Listar Todas las Conversaciones

```http
GET /api/conversations
```

**Query Parameters:**
```javascript
{
  limit: 50,     // Número de resultados (default: 50)
  offset: 0      // Paginación (default: 0)
}
```

**Respuesta:**
```json
{
  "success": true,
  "conversations": [
    {
      "phoneNumber": "whatsapp:+57300123456",
      "customerName": "Juan Pérez",
      "lastMessage": "Gracias por la información",
      "lastMessageAt": "2025-08-13T14:25:00.000Z",
      "isRead": true,
      "messagesCount": 15,
      "clientId": "client_id_123"
    }
  ],
  "count": 1
}
```

### 📖 Historial de Conversación

```http
GET /api/conversations/{phone}
```

**Path Parameters:**
- `phone`: Número de teléfono (con o sin prefijo whatsapp:)

**Respuesta:**
```json
{
  "success": true,
  "conversation": {
    "phoneNumber": "whatsapp:+57300123456",
    "customerName": "Juan Pérez",
    "isRead": true,
    "messagesCount": 5
  },
  "messages": [
    {
      "_id": "msg_id_123",
      "content": "Hola, necesito información",
      "type": "received",
      "timestamp": "2025-08-13T14:20:00.000Z",
      "source": "customer"
    },
    {
      "_id": "msg_id_124", 
      "content": "¡Hola! Con gusto te ayudo...",
      "type": "sent",
      "timestamp": "2025-08-13T14:21:00.000Z",
      "source": "ai-auto"
    }
  ]
}
```

### ✅ Marcar Conversación como Leída

```http
POST /api/conversations/{phone}/read
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Conversación marcada como leída"
}
```

### 🔍 Buscar Conversaciones

```http
GET /api/conversations/search/{query}
```

**Path Parameters:**
- `query`: Término de búsqueda

**Ejemplo:**
```http
GET /api/conversations/search/juan
```

---

## 📊 Estadísticas

### 📈 Estadísticas Generales

```http
GET /api/stats
```

**Respuesta:**
```json
{
  "success": true,
  "stats": {
    "conversations": {
      "total": 150,
      "unread": 12,
      "read": 138
    },
    "messages": {
      "total": 1250,
      "sent": 625,
      "received": 625,
      "aiGenerated": 400
    },
    "period": {
      "today": 25,
      "thisWeek": 89,
      "thisMonth": 150
    }
  }
}
```

**Casos de uso:**
- Dashboard principal
- Reportes de actividad
- Métricas de rendimiento

---

## 👤 Usuarios

> **Nota:** Endpoints de usuarios requieren header `x-admin-key: admin123` para acceso de administrador

### 📋 Listar Usuarios

```http
GET /api/users
Headers: x-admin-key: admin123
```

**Query Parameters:**
```javascript
{
  limit: 50,
  offset: 0,
  search: "juan",          // Búsqueda por nombre/email
  clientId: "client_123",  // Filtrar por cliente
  role: "user"             // Filtrar por rol
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id_123",
      "email": "juan@email.com",
      "name": "Juan Pérez",
      "clientId": "client_id_123",
      "role": "user",
      "permissions": ["read", "write"],
      "isActive": true,
      "client": {
        "_id": "client_id_123",
        "name": "MarketTech",
        "business": "Desarrollo"
      }
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 👤 Obtener Usuario Específico

```http
GET /api/users/{userId}
Headers: x-admin-key: admin123
```

### 👥 Usuarios por Cliente

```http
GET /api/users/client/{clientId}
```

### ➕ Crear Usuario

```http
POST /api/users
Headers: x-admin-key: admin123
```

**Body (JSON):**
```json
{
  "email": "nuevo@email.com",
  "name": "Nuevo Usuario",
  "clientId": "client_id_123",
  "role": "user",
  "permissions": ["read", "write"],
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "phoneNumber": "+57300123456",
  "department": "Ventas",
  "position": "Ejecutivo",
  "language": "es",
  "timezone": "America/Bogota"
}
```

### ✏️ Actualizar Usuario

```http
PUT /api/users/{userId}
Headers: x-admin-key: admin123
```

**Body (JSON):**
```json
{
  "name": "Nombre Actualizado",
  "role": "admin",
  "permissions": ["read", "write", "admin"],
  "department": "Administración"
}
```

### 🗑️ Eliminar Usuario

```http
DELETE /api/users/{userId}
Headers: x-admin-key: admin123
```

**Query Parameters:**
```javascript
{
  permanent: false  // true para eliminación permanente
}
```

### 🔄 Reactivar Usuario

```http
POST /api/users/{userId}/activate
Headers: x-admin-key: admin123
```

### 🔐 Cambiar Rol de Usuario

```http
PUT /api/users/{userId}/role
Headers: x-admin-key: admin123
```

**Body (JSON):**
```json
{
  "role": "admin"  // user, admin, moderator
}
```

### ✅ Buscar Usuario por Email

```http
GET /api/users/email/{email}
```

**Ejemplo:**
```http
GET /api/users/email/juan@email.com
```

---

## 📚 Base de Conocimiento

### 📖 Obtener Conocimiento de Cliente

```http
GET /api/knowledge/client/{clientId}
```

**Query Parameters:**
```javascript
{
  limit: 20,
  offset: 0,
  category: "productos",    // general, productos, servicios, precios, faq, etc.
  search: "precio",         // Búsqueda en título/contenido
  isActive: true,          // true/false
  sortBy: "updatedAt",     // createdAt, updatedAt, title, priority
  sortOrder: "desc"        // asc, desc
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "knowledge_id_123",
      "title": "Precios de Productos",
      "content": "Nuestros precios son los siguientes...",
      "category": "precios",
      "keywords": ["precio", "costo", "tarifa"],
      "tags": ["productos", "ventas"],
      "priority": 5,
      "isPublic": true,
      "isActive": true,
      "clientId": "client_id_123",
      "createdAt": "2025-08-13T14:30:00.000Z",
      "updatedAt": "2025-08-13T14:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### 🔍 Obtener Entrada Específica

```http
GET /api/knowledge/entry/{entryId}
```

### ➕ Crear Entrada de Conocimiento

```http
POST /api/knowledge/client/{clientId}
```

**Body (JSON):**
```json
{
  "title": "Nueva Información",
  "content": "Contenido detallado de la información...",
  "category": "productos",
  "keywords": ["producto", "información"],
  "tags": ["ventas", "productos"],
  "priority": 7,
  "isPublic": true,
  "metadata": {
    "author": "Admin",
    "department": "Ventas"
  }
}
```

**Categorías Permitidas:**
- `general`
- `productos`
- `servicios`
- `precios`
- `faq`
- `politicas`
- `contacto`
- `horarios`
- `promociones`
- `otros`

### ✏️ Actualizar Entrada

```http
PUT /api/knowledge/entry/{entryId}
```

**Body (JSON):**
```json
{
  "title": "Título Actualizado",
  "content": "Contenido actualizado...",
  "category": "servicios",
  "priority": 8
}
```

### 🗑️ Eliminar Entrada

```http
DELETE /api/knowledge/entry/{entryId}
```

**Query Parameters:**
```javascript
{
  permanent: false  // true para eliminación permanente
}
```

### 🔄 Reactivar Entrada

```http
POST /api/knowledge/entry/{entryId}/reactivate
```

### 📊 Estadísticas de Conocimiento

```http
GET /api/knowledge/client/{clientId}/stats
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalEntries": 45,
    "activeEntries": 42,
    "inactiveEntries": 3,
    "categoriesBreakdown": {
      "productos": 15,
      "servicios": 12,
      "precios": 8,
      "faq": 7,
      "general": 3
    },
    "priorityDistribution": {
      "high": 10,
      "medium": 25,
      "low": 10
    },
    "lastUpdated": "2025-08-13T14:30:00.000Z"
  }
}
```

### 🔍 Buscar en Base de Conocimiento

```http
GET /api/knowledge/client/{clientId}/search
```

**Query Parameters:**
```javascript
{
  q: "precio productos",  // Término de búsqueda (requerido)
  limit: 5               // Número de resultados (default: 5)
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "query": "precio productos",
    "results": [
      {
        "_id": "knowledge_id_123",
        "title": "Precios de Productos",
        "content": "Extracto del contenido...",
        "category": "precios",
        "relevanceScore": 0.95
      }
    ],
    "total": 3
  }
}
```

---

## 🔗 WhatsApp y Mensajería

### 📤 Enviar Mensaje Manual

```http
POST /api/send-message
```

**Body (JSON):**
```json
{
  "to": "whatsapp:+57300123456",
  "message": "Hola, este es un mensaje manual desde el sistema."
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Mensaje enviado exitosamente",
  "twilioSid": "SM1234567890abcdef"
}
```

### 📥 Webhook (Solo para Twilio)

```http
POST /webhook
```

> **Nota:** Este endpoint es usado internamente por Twilio para recibir mensajes de WhatsApp.

---

## 🤖 Inteligencia Artificial

### 💭 Consultar IA Directamente

```http
POST /api/ask-ai
```

**Body (JSON):**
```json
{
  "question": "¿Cuáles son los precios de los productos?",
  "context": "El cliente pregunta sobre precios"
}
```

**Respuesta:**
```json
{
  "success": true,
  "question": "¿Cuáles son los precios de los productos?",
  "response": "Nuestros productos tienen diferentes precios dependiendo del tipo...",
  "timestamp": "2025-08-13T14:30:00.000Z"
}
```

### 🔄 Estado Global de Auto-respuesta

```http
GET /api/auto-response/status
```

**Respuesta:**
```json
{
  "success": true,
  "enabled": true,
  "message": "Auto-respuesta activada"
}
```

### 🎛️ Toggle Auto-respuesta Global

```http
POST /api/auto-response/toggle
```

**Body (JSON):**
```json
{
  "enabled": false  // true o false
}
```

---

## 🔐 Administración

> **Nota:** Todos los endpoints de administración requieren header `x-admin-key: admin123`

### 📊 Vista General del Sistema

```http
GET /api/admin/overview
Headers: x-admin-key: admin123
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "systemStats": {
      "totalClients": 5,
      "activeClients": 4,
      "clientsWithAI": 3,
      "conversations": {
        "total": 250,
        "unread": 15,
        "read": 235
      }
    },
    "clients": [
      {
        "_id": "client_id_123",
        "name": "MarketTech",
        "isActive": true,
        "stats": {
          "conversations": {
            "total": 50,
            "unread": 3,
            "read": 47
          }
        }
      }
    ],
    "lastUpdated": "2025-08-13T14:30:00.000Z"
  }
}
```

### 🔄 Toggle IA del Sistema

```http
POST /api/admin/system/toggle-ai
Headers: x-admin-key: admin123
```

**Body (JSON):**
```json
{
  "enabled": true  // Activar/desactivar IA para todos los clientes
}
```

### ❤️ Salud del Sistema

```http
GET /api/admin/health
Headers: x-admin-key: admin123
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "database": "connected",
    "totalClients": 5,
    "activeClients": 4,
    "timestamp": "2025-08-13T14:30:00.000Z",
    "services": {
      "mongodb": "operational",
      "twilio": "operational",
      "openai": "operational"
    }
  }
}
```

### 📋 CRUD de Clientes (Admin)

#### Listar Clientes
```http
GET /api/admin/clients
Headers: x-admin-key: admin123
```

#### Crear Cliente
```http
POST /api/admin/clients
Headers: x-admin-key: admin123
```

#### Actualizar Cliente
```http
PUT /api/admin/clients/{clientId}
Headers: x-admin-key: admin123
```

#### Eliminar Cliente
```http
DELETE /api/admin/clients/{clientId}
Headers: x-admin-key: admin123
```

---

## 🔒 Autenticación y Seguridad

### Headers Requeridos

**Para endpoints de administrador:**
```http
x-admin-key: admin123
```

**Para desarrollo local:**
```http
Content-Type: application/json
```

### CORS

El servidor acepta requests desde:
- `http://localhost:3000`
- `http://localhost:5173` (Vite)
- `http://localhost:5174` (Vite alt)
- `http://localhost:8080` (Webpack)
- `https://twilio-9ubt.onrender.com` (Producción)

---

## 📡 Códigos de Respuesta HTTP

| Código | Significado | Uso |
|--------|------------|-----|
| `200` | OK | Operación exitosa |
| `201` | Created | Recurso creado exitosamente |
| `400` | Bad Request | Datos inválidos o faltantes |
| `401` | Unauthorized | Autenticación requerida |
| `404` | Not Found | Recurso no encontrado |
| `500` | Internal Server Error | Error del servidor |

---

## 🧪 Ejemplos de Uso con JavaScript

### Fetch básico
```javascript
const response = await fetch('http://localhost:3000/api/health');
const data = await response.json();
console.log(data);
```

### POST con autenticación
```javascript
const response = await fetch('http://localhost:3000/api/admin/clients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': 'admin123'
  },
  body: JSON.stringify({
    name: 'Nuevo Cliente',
    twilioPhoneNumber: 'whatsapp:+14155238887'
  })
});
```

### Manejo de errores
```javascript
try {
  const response = await fetch('http://localhost:3000/api/clients');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  
  if (data.success) {
    console.log('Datos:', data.data);
  } else {
    console.error('Error de API:', data.error);
  }
} catch (error) {
  console.error('Error de red:', error);
}
```

---

## 🚨 Notas Importantes

1. **Números de teléfono**: Siempre usar formato `whatsapp:+country_code_number`
2. **Paginación**: Usar `limit` y `offset` para manejar grandes datasets
3. **Filtros**: Muchos endpoints soportan filtros via query parameters
4. **Timestamps**: Todos en formato ISO 8601 UTC
5. **IDs**: Usar ObjectIds de MongoDB (24 caracteres hexadecimales)

---

## 📞 Soporte

Para soporte técnico o preguntas sobre la API, contacta al equipo de desarrollo.

---

*Última actualización: 13 de Agosto, 2025*
