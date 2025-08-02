# 📚 Sistema de Base de Conocimiento - Documentación para Frontend

**Fecha:** Agosto 2, 2025  
**Versión:** 1.0  
**Base URL:** `https://twilio-9ubt.onrender.com`

## 🎯 Resumen Ejecutivo para Frontend

El **Sistema de Base de Conocimiento** permite que cada cliente configure información específica para su IA BOT (precios, servicios, FAQ, horarios, etc.). Esta información se utiliza automáticamente para generar **respuestas inteligentes y contextuales** a los usuarios de WhatsApp.

### ✅ **Confirmación Técnica**
- ✅ **Cada cliente tiene su propia base de conocimiento independiente**
- ✅ **CRUD completo**: Crear, Leer, Actualizar, Eliminar entradas
- ✅ **Integración automática con IA**: Las respuestas del BOT usan esta información
- ✅ **14 endpoints listos para consumir**
- ✅ **Sistema de categorías, prioridades y búsqueda inteligente**

---

## 🧠 Overview - Base de Conocimiento

El sistema de base de conocimiento permite a cada cliente configurar información específica para su IA BOT, incluyendo precios, servicios, FAQ, horarios, políticas y más. Esta información se utiliza automáticamente para generar respuestas inteligentes y precisas a los usuarios.

### 🎯 Características Principales

- **Gestión por Cliente**: Cada cliente tiene su propia base de conocimiento independiente
- **Categorización**: Organización por categorías (precios, servicios, FAQ, etc.)
- **Búsqueda Inteligente**: Sistema de búsqueda con relevancia por contenido
- **Priorización**: Sistema de prioridades para información más importante
- **Integración con IA**: Automáticamente utilizada por el BOT para respuestas contextuales
- **Acciones en Lote**: Gestión masiva de entradas
- **Estadísticas**: Métricas detalladas por cliente

### 📋 Categorías Disponibles

- `general` - Información general de la empresa
- `productos` - Detalles de productos
- `servicios` - Información de servicios ofrecidos
- `precios` - Listas de precios y tarifas
- `faq` - Preguntas frecuentes
- `politicas` - Políticas de la empresa
- `contacto` - Información de contacto
- `horarios` - Horarios de atención
- `promociones` - Ofertas y promociones actuales
- `otros` - Información adicional

---

## � Quick Start para Frontend

### **Flujo Básico de Implementación:**

1. **Dashboard de Conocimiento**: Mostrar estadísticas del cliente
2. **Lista de Entradas**: Tabla con CRUD completo
3. **Editor de Entradas**: Formulario con categorías y prioridades
4. **Búsqueda**: Buscador en tiempo real
5. **Simulador de BOT**: Probar respuestas de IA

### **Endpoints Esenciales:**
```javascript
// CRUD Básico
GET    /api/knowledge/client/:clientId              // Listar entradas
POST   /api/knowledge/client/:clientId              // Crear entrada
PUT    /api/knowledge/entry/:entryId                // Actualizar entrada
DELETE /api/knowledge/entry/:entryId                // Eliminar entrada

// Funcionalidades Avanzadas
GET    /api/knowledge/client/:clientId/search       // Buscar conocimiento
GET    /api/knowledge/client/:clientId/stats        // Estadísticas
POST   /api/knowledge/client/:clientId/bulk-actions // Acciones masivas
```

---

## �📖 Índice de APIs

1. [Gestión de Entradas](#gestión-de-entradas)
2. [Búsqueda y Consulta](#búsqueda-y-consulta)
3. [Estadísticas](#estadísticas)
4. [Acciones en Lote](#acciones-en-lote)
5. [Administración](#administración)
6. [Integración con IA BOT](#integración-con-ia-bot)

---

## 📝 Gestión de Entradas

### Crear Nueva Entrada de Conocimiento
**Endpoint:** `POST /api/knowledge/client/:clientId`  
**Descripción:** Crear una nueva entrada en la base de conocimiento del cliente

```javascript
// Ejemplo de uso
const newEntry = await fetch('/api/knowledge/client/688da23c21e39b848cb30560', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Horarios de Atención",
    content: "Nuestros horarios son de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 2:00 PM.",
    category: "horarios",
    keywords: ["horario", "abierto", "cerrado", "atencion"],
    tags: ["servicio-al-cliente", "horarios"],
    priority: 9,
    isPublic: true,
    metadata: {
      author: "Admin",
      lastReviewed: "2025-08-02"
    }
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
    "content": "Nuestros horarios son de lunes a viernes de 9:00 AM a 6:00 PM...",
    "category": "horarios",
    "keywords": ["horario", "abierto", "cerrado", "atencion"],
    "tags": ["servicio-al-cliente", "horarios"],
    "priority": 9,
    "isActive": true,
    "version": 1,
    "createdAt": "2025-08-02T07:30:00.000Z",
    "updatedAt": "2025-08-02T07:30:00.000Z"
  }
}
```

**Campos Requeridos:**
- `title` (string): Título de la entrada
- `content` (string): Contenido de la información
- `category` (string): Categoría de la entrada

**Campos Opcionales:**
- `keywords` (array): Palabras clave para búsqueda
- `tags` (array): Etiquetas adicionales
- `priority` (number, 1-10): Prioridad de la entrada (default: 1)
- `isPublic` (boolean): Si es visible públicamente (default: false)
- `metadata` (object): Metadatos adicionales

### Obtener Todas las Entradas de un Cliente
**Endpoint:** `GET /api/knowledge/client/:clientId`  
**Query Params:** `limit`, `offset`, `category`, `search`, `isActive`, `sortBy`, `sortOrder`

```javascript
// Ejemplo de uso
const entries = await fetch('/api/knowledge/client/688da23c21e39b848cb30560?limit=20&offset=0&category=precios&search=consultoría').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": [
    {
      "_id": "688da240c9628c84329a3adb",
      "title": "Lista de Precios - Consultoría",
      "content": "Consultoría básica: $50/hora. Consultoría premium: $80/hora...",
      "category": "precios",
      "priority": 10,
      "createdAt": "2025-08-02T07:30:00.000Z",
      "updatedAt": "2025-08-02T07:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  },
  "client": {
    "id": "688da23c21e39b848cb30560",
    "name": "MarketTech"
  }
}
```

### Obtener Entrada Específica
**Endpoint:** `GET /api/knowledge/entry/:entryId`

```javascript
// Ejemplo de uso
const entry = await fetch('/api/knowledge/entry/688da240c9628c84329a3adb').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": {
    "_id": "688da240c9628c84329a3adb",
    "clientId": "688da23c21e39b848cb30560",
    "title": "Horarios de Atención",
    "content": "Nuestros horarios son...",
    "category": "horarios",
    "keywords": ["horario", "abierto"],
    "tags": ["servicio-al-cliente"],
    "priority": 9,
    "isActive": true,
    "version": 1,
    "createdAt": "2025-08-02T07:30:00.000Z",
    "updatedAt": "2025-08-02T07:30:00.000Z"
  }
}
```

### Actualizar Entrada de Conocimiento
**Endpoint:** `PUT /api/knowledge/entry/:entryId`

```javascript
// Ejemplo de uso
const updatedEntry = await fetch('/api/knowledge/entry/688da240c9628c84329a3adb', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: "Horarios actualizados: Lunes a viernes 8:00 AM a 7:00 PM, sábados 9:00 AM a 3:00 PM.",
    priority: 10,
    tags: ["servicio-al-cliente", "horarios", "actualizado"]
  })
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Entrada de conocimiento \"Horarios de Atención\" actualizada exitosamente",
  "data": {
    // ... entrada actualizada con version incrementada
    "version": 2,
    "updatedAt": "2025-08-02T08:15:00.000Z"
  }
}
```

### Eliminar Entrada (Soft Delete)
**Endpoint:** `DELETE /api/knowledge/entry/:entryId`  
**Query Params:** `permanent=true` (para eliminación permanente)

```javascript
// Desactivar entrada (soft delete)
const deleteEntry = await fetch('/api/knowledge/entry/688da240c9628c84329a3adb', {
  method: 'DELETE'
}).then(r => r.json());

// Eliminar permanentemente
const permanentDelete = await fetch('/api/knowledge/entry/688da240c9628c84329a3adb?permanent=true', {
  method: 'DELETE'
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Entrada de conocimiento \"Horarios de Atención\" desactivada exitosamente",
  "data": {
    // ... entrada con isActive: false y deletedAt timestamp
  }
}
```

### Reactivar Entrada Eliminada
**Endpoint:** `POST /api/knowledge/entry/:entryId/reactivate`

```javascript
// Ejemplo de uso
const reactivateEntry = await fetch('/api/knowledge/entry/688da240c9628c84329a3adb/reactivate', {
  method: 'POST'
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Entrada de conocimiento \"Horarios de Atención\" reactivada exitosamente",
  "data": {
    // ... entrada reactivada
  }
}
```

---

## 🔍 Búsqueda y Consulta

### Búsqueda en Base de Conocimiento
**Endpoint:** `GET /api/knowledge/client/:clientId/search`  
**Query Params:** `q` (requerido), `limit`

```javascript
// Ejemplo de uso
const searchResults = await fetch('/api/knowledge/client/688da23c21e39b848cb30560/search?q=precios&limit=5').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": {
    "query": "precios",
    "results": [
      {
        "id": "688da240c9628c84329a3adb",
        "category": "precios",
        "title": "Lista de Precios - Consultoría",
        "content": "Consultoría básica: $50/hora...",
        "relevanceScore": 5.5
      }
    ],
    "total": 1,
    "client": {
      "id": "688da23c21e39b848cb30560",
      "name": "MarketTech"
    }
  }
}
```

### Obtener Conocimiento para BOT (Uso Interno)
**Endpoint:** `GET /api/knowledge/client/:clientId/bot-knowledge`  
**Descripción:** Obtiene todo el conocimiento activo formateado para el BOT

```javascript
// Ejemplo de uso
const botKnowledge = await fetch('/api/knowledge/client/688da23c21e39b848cb30560/bot-knowledge').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": [
    {
      "id": "688da240c9628c84329a3adb",
      "category": "precios",
      "title": "Lista de Precios",
      "content": "Consultoría básica: $50/hora...",
      "keywords": ["precio", "consultoría"],
      "priority": 10
    }
  ],
  "total": 1
}
```

---

## 📊 Estadísticas

### Obtener Estadísticas de Conocimiento
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
    "categories": ["precios", "servicios", "horarios", "faq", "contacto"],
    "lastUpdated": "2025-08-02T08:15:00.000Z",
    "client": {
      "id": "688da23c21e39b848cb30560",
      "name": "MarketTech"
    }
  }
}
```

---

## 🔄 Acciones en Lote

### Ejecutar Acciones en Lote
**Endpoint:** `POST /api/knowledge/client/:clientId/bulk-actions`

```javascript
// Ejemplo de uso - Activar múltiples entradas
const bulkAction = await fetch('/api/knowledge/client/688da23c21e39b848cb30560/bulk-actions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: "activate",
    entryIds: ["688da240c9628c84329a3adb", "688da241c9628c84329a3adc"],
    settings: {}
  })
}).then(r => r.json());

// Ejemplo - Cambiar categoría masivamente
const changeCategoryBulk = await fetch('/api/knowledge/client/688da23c21e39b848cb30560/bulk-actions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: "update-category",
    entryIds: ["688da240c9628c84329a3adb", "688da241c9628c84329a3adc"],
    settings: { category: "faq" }
  })
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "2 entradas activadas",
  "data": {
    "action": "activate",
    "affected": 2,
    "settings": {}
  }
}
```

**Acciones Disponibles:**
- `activate` - Activar entradas
- `deactivate` - Desactivar entradas
- `update-category` - Cambiar categoría (requiere `settings.category`)
- `update-priority` - Cambiar prioridad (requiere `settings.priority`)
- `delete-permanent` - Eliminar permanentemente

---

## 📤 Exportar Conocimiento

### Exportar Base de Conocimiento de Cliente
**Endpoint:** `GET /api/knowledge/client/:clientId/export`  
**Query Params:** `format` (json)

```javascript
// Ejemplo de uso
const exportData = await fetch('/api/knowledge/client/688da23c21e39b848cb30560/export?format=json').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": {
    "exportDate": "2025-08-02T08:30:00.000Z",
    "clientId": "688da23c21e39b848cb30560",
    "totalEntries": 12,
    "entries": [
      {
        "id": "688da240c9628c84329a3adb",
        "category": "precios",
        "title": "Lista de Precios",
        "content": "...",
        "keywords": ["precio"],
        "tags": ["servicios"],
        "priority": 10,
        "createdAt": "2025-08-02T07:30:00.000Z",
        "updatedAt": "2025-08-02T08:15:00.000Z"
      }
    ]
  }
}
```

---

## 🔧 Administración (Admin Only)

> **Nota:** Todas estas rutas requieren `x-admin-key: admin123` en los headers

### Ver Todas las Entradas del Sistema
**Endpoint:** `GET /api/knowledge/admin/all`  
**Query Params:** `limit`, `offset`, `search`, `category`, `isActive`

```javascript
// Ejemplo de uso
const allEntries = await fetch('/api/knowledge/admin/all?limit=50&search=precios', {
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": [
    {
      "_id": "688da240c9628c84329a3adb",
      "title": "Lista de Precios",
      "content": "...",
      "category": "precios",
      "clientName": "MarketTech",
      "clientBusiness": "Marketing y Tecnología",
      "createdAt": "2025-08-02T07:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Estadísticas Generales del Sistema
**Endpoint:** `GET /api/knowledge/admin/stats`

```javascript
// Ejemplo de uso
const systemStats = await fetch('/api/knowledge/admin/stats', {
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": {
    "overview": {
      "totalEntries": 45,
      "activeEntries": 38,
      "inactiveEntries": 7,
      "totalCategories": 8,
      "clientsWithKnowledge": 3,
      "lastUpdated": "2025-08-02T08:15:00.000Z"
    },
    "categoryBreakdown": [
      { "_id": "servicios", "count": 12 },
      { "_id": "precios", "count": 8 },
      { "_id": "faq", "count": 6 }
    ]
  }
}
```

---

## 🤖 Integración con IA BOT

### Cómo Funciona la Integración

1. **Mensaje Recibido**: Cuando llega un mensaje por WhatsApp
2. **Análisis Contextual**: El sistema analiza el mensaje para detectar intenciones
3. **Búsqueda de Conocimiento**: Se busca información relevante en la base de conocimiento del cliente
4. **Generación de Respuesta**: La IA utiliza el conocimiento encontrado para generar una respuesta contextual
5. **Respuesta Enviada**: Se envía la respuesta personalizada al usuario

### Ejemplo de Flujo Completo

```javascript
// 1. Usuario envía: "¿Cuáles son sus precios?"
// 2. Sistema busca en knowledge con query "precios"
// 3. Encuentra entrada: "Lista de Precios - Consultoría básica: $50/hora..."
// 4. IA genera respuesta usando esa información
// 5. Respuesta enviada: "¡Hola! Nuestros precios son: Consultoría básica $50/hora, Consultoría premium $80/hora..."

// El sistema automáticamente:
const userMessage = "¿Cuáles son sus precios?";
const clientId = "688da23c21e39b848cb30560";

// Busca conocimiento relevante
const relevantKnowledge = await KnowledgeBase.searchKnowledge(clientId, userMessage, 3);

// Genera contexto para IA
const context = `Información de la empresa:\n${relevantKnowledge.map(k => `${k.title}: ${k.content}`).join('\n')}`;

// IA genera respuesta usando el contexto
const aiResponse = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system", 
      content: `Eres el asistente de MarketTech. Usa la siguiente información: ${context}`
    },
    { role: "user", content: userMessage }
  ]
});
```

### Palabras Clave Detectadas Automáticamente

El sistema detecta automáticamente las siguientes intenciones:
- **Precios**: "precio", "costo", "tarifa", "cuanto", "valor"
- **Horarios**: "horario", "abierto", "cerrado", "hora", "atencion"
- **Contacto**: "contacto", "telefono", "email", "direccion"
- **Servicios**: "servicio", "producto", "oferta", "que hacen"
- **Ubicación**: "ubicacion", "donde", "direccion", "como llegar"

---

## 🎨 Componentes Frontend Recomendados

### 📱 **Gestión de Base de Conocimiento** (`/client/:twilioNumber/knowledge`)

#### Páginas Sugeridas:

1. **Dashboard de Conocimiento** (`/client/:twilioNumber/knowledge/dashboard`)
   - Estadísticas de la base de conocimiento
   - Entradas recientes
   - Categorías más utilizadas
   - Métricas de efectividad del BOT

2. **Lista de Entradas** (`/client/:twilioNumber/knowledge/entries`)
   - Tabla paginada con todas las entradas
   - Filtros por categoría, fecha, prioridad
   - Búsqueda en tiempo real
   - Acciones en lote

3. **Editor de Entradas** (`/client/:twilioNumber/knowledge/entries/new`)
   - Formulario de creación/edición
   - Preview en tiempo real
   - Sugerencias de keywords
   - Validación de contenido

4. **Categorías** (`/client/:twilioNumber/knowledge/categories`)
   - Gestión de categorías
   - Estadísticas por categoría
   - Reorganización de entradas

5. **Pruebas de BOT** (`/client/:twilioNumber/knowledge/test`)
   - Simulador de conversaciones
   - Pruebas de respuestas del BOT
   - Análisis de efectividad

### 🎯 **Componentes Específicos**

1. **KnowledgeEntryCard** - Tarjeta de entrada de conocimiento
2. **CategoryManager** - Gestor de categorías
3. **KnowledgeSearch** - Buscador inteligente
4. **BotTester** - Simulador de BOT
5. **KnowledgeStats** - Estadísticas y métricas
6. **BulkKnowledgeActions** - Acciones masivas
7. **KnowledgeImportExport** - Importar/exportar datos

---

## 🚨 Validaciones y Reglas de Negocio

### Validaciones de Entrada
- **Título**: Mínimo 5 caracteres, máximo 200 caracteres
- **Contenido**: Mínimo 10 caracteres, máximo 5000 caracteres
- **Categoría**: Debe ser una de las categorías permitidas
- **Prioridad**: Entre 1 y 10
- **Keywords**: Máximo 20 keywords por entrada
- **Tags**: Máximo 10 tags por entrada

### Límites por Cliente
- **Entradas Totales**: 500 entradas por cliente
- **Entradas por Categoría**: 100 entradas por categoría
- **Tamaño de Contenido**: Máximo 50,000 caracteres total por cliente

### Reglas de Búsqueda
- **Relevancia**: Se calcula basada en título (peso 3), contenido (peso 2), keywords (peso 2), tags (peso 1)
- **Prioridad**: Las entradas con mayor prioridad aparecen primero
- **Frescura**: Las entradas más recientes tienen ligero boost de relevancia

---

## 🌟 Casos de Uso Comunes

### Caso 1: Empresa de Consultoría
```javascript
// Entradas típicas para una consultoría
const consultoriaEntries = [
  {
    title: "Servicios de Consultoría",
    content: "Ofrecemos consultoría en estrategia empresarial, transformación digital, optimización de procesos...",
    category: "servicios",
    keywords: ["consultoria", "estrategia", "digital", "procesos"]
  },
  {
    title: "Tarifas de Consultoría",
    content: "Consultoría senior: $120/hora, Consultoría junior: $80/hora, Proyectos fijos desde $5,000",
    category: "precios",
    keywords: ["precio", "tarifa", "costo", "hora"]
  }
];
```

### Caso 2: Restaurante
```javascript
// Entradas típicas para un restaurante
const restauranteEntries = [
  {
    title: "Menú Principal",
    content: "Platos del día: Arroz con pollo $15, Bandeja paisa $18, Pescado a la plancha $20...",
    category: "productos",
    keywords: ["menu", "platos", "comida", "almuerzo"]
  },
  {
    title: "Horarios de Atención",
    content: "Abierto todos los días de 11:00 AM a 10:00 PM. Domingos hasta 9:00 PM",
    category: "horarios",
    keywords: ["horario", "abierto", "domingos"]
  }
];
```

### Caso 3: Tienda Online
```javascript
// Entradas típicas para e-commerce
const tiendaEntries = [
  {
    title: "Política de Envíos",
    content: "Envíos gratis por compras mayores a $50. Entrega en 2-3 días hábiles en Bogotá...",
    category: "politicas",
    keywords: ["envio", "entrega", "gratis", "bogota"]
  },
  {
    title: "Métodos de Pago",
    content: "Aceptamos tarjetas de crédito, débito, PSE, Nequi, Daviplata y contraentrega",
    category: "general",
    keywords: ["pago", "tarjeta", "pse", "nequi"]
  }
];
```

---

## 📈 Métricas y Analytics

### Métricas Sugeridas para Frontend

1. **Efectividad del BOT**
   - Porcentaje de consultas respondidas con conocimiento
   - Tiempo promedio de respuesta
   - Satisfacción del usuario (si se implementa rating)

2. **Uso de Conocimiento**
   - Entradas más consultadas
   - Categorías más utilizadas
   - Búsquedas sin resultados (gaps de conocimiento)

3. **Gestión de Contenido**
   - Entradas creadas por período
   - Entradas más actualizadas
   - Categorías con menos contenido

### Endpoints de Métricas (Para Implementar)
```javascript
// Métricas de uso del BOT
GET /api/knowledge/client/:clientId/metrics/bot-usage

// Entradas más consultadas
GET /api/knowledge/client/:clientId/metrics/popular-entries

// Gaps de conocimiento (búsquedas sin resultado)
GET /api/knowledge/client/:clientId/metrics/knowledge-gaps
```

---

## 🔄 Flujo de Trabajo Recomendado

### Para Configurar un Nuevo Cliente

1. **Crear Cliente** (ya existente en el sistema)
2. **Configurar Categorías Básicas**
   - Información general de la empresa
   - Servicios/productos principales
   - Precios básicos
   - Información de contacto
   - Horarios de atención

3. **Agregar FAQ Inicial**
   - Preguntas más comunes de clientes
   - Respuestas estándar

4. **Probar con BOT**
   - Simular conversaciones típicas
   - Ajustar contenido según resultados

5. **Monitorear y Optimizar**
   - Revisar métricas de uso
   - Agregar contenido para gaps identificados
   - Actualizar información obsoleta

### Para Mantener la Base de Conocimiento

1. **Revisión Mensual**
   - Actualizar precios y promociones
   - Revisar información de contacto/horarios
   - Agregar nuevos productos/servicios

2. **Análisis de Gaps**
   - Identificar consultas no respondidas
   - Crear contenido para temas frecuentes

3. **Optimización de Contenido**
   - Mejorar entradas con baja efectividad
   - Ajustar prioridades según uso real
   - Consolidar información duplicada

---

## 💡 Tips de Optimización

### Para Mejores Respuestas del BOT

1. **Contenido Específico**: Ser específico y detallado en las respuestas
2. **Keywords Relevantes**: Incluir sinónimos y variaciones de palabras clave
3. **Estructura Clara**: Usar listas y formato claro en el contenido
4. **Prioridades Correctas**: Asignar prioridad alta a información crítica
5. **Actualización Regular**: Mantener información actualizada

### Para Mejor Rendimiento

1. **Límite de Búsqueda**: No obtener más de 5 resultados por búsqueda
2. **Cache de Conocimiento**: Implementar cache para conocimiento frecuente
3. **Indexación**: Considerar indexación de texto completo en MongoDB
4. **Paginación**: Usar paginación en listados largos

---

Este sistema de base de conocimiento proporciona una foundation sólida para que cada cliente pueda entrenar su IA BOT con información específica y relevante, mejorando significativamente la calidad de las respuestas automáticas.
