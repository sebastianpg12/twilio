# 📋 RESUMEN COMPLETO DE RUTAS API - WHATSAPP BUSINESS

## 🏥 **HEALTH & STATUS**
```
✅ GET  /api/health                     - Estado del servidor
✅ GET  /api/auto-response/status       - Estado del bot automático
✅ POST /api/auto-response/toggle       - Activar/desactivar bot
```

## 💬 **CONVERSACIONES**
```
✅ GET  /api/conversations              - Listar todas las conversaciones
✅ GET  /api/conversations?limit=10&offset=0 - Con paginación
✅ GET  /api/conversations/:phone       - Historial de una conversación
✅ POST /api/conversations/:phone/read  - Marcar como leída
✅ GET  /api/conversations/search/:query - Buscar conversaciones
```

## 📊 **ESTADÍSTICAS**
```
✅ GET  /api/stats                      - Estadísticas generales
```

## 📤 **ENVÍO DE MENSAJES**
```
✅ POST /api/send-message               - Mensaje manual
✅ POST /api/send-ai-message            - Mensaje con asistencia de IA
```

## 🤖 **IA DIRECTA**
```
✅ POST /api/ask-ai                     - Consultar IA directamente
```

## 🔧 **WEBHOOK**
```
✅ POST /webhook                        - Recibir mensajes de WhatsApp
```

---

## 📨 **EJEMPLOS DE PAYLOAD:**

### Mensaje Manual:
```json
{
  "to": "+1234567890",
  "message": "Hola, este es un mensaje manual"
}
```

### Mensaje con IA:
```json
{
  "to": "+1234567890",
  "prompt": "Responde profesionalmente sobre disponibilidad de citas",
  "context": "Consultorio médico"
}
```

### Consulta a IA:
```json
{
  "question": "¿Cuáles son los horarios de atención?",
  "context": "Clínica médica"
}
```

### Toggle Bot:
```json
{
  "enabled": true
}
```

### Webhook Simulation:
```
From=whatsapp:+1234567890
Body=Hola, necesito información
MediaUrl0=
```

---

## 🎯 **ESTADO DE VERIFICACIÓN:**

| Ruta | Estado | Notas |
|------|---------|-------|
| `/api/health` | ✅ VERIFICADA | Endpoint de salud |
| `/api/auto-response/*` | ✅ VERIFICADA | Control de bot |
| `/api/conversations` | ✅ VERIFICADA | Gestión de conversaciones |
| `/api/stats` | ✅ VERIFICADA | Estadísticas |
| `/api/send-message` | ✅ VERIFICADA | Envío manual |
| `/api/send-ai-message` | ✅ VERIFICADA | Envío con IA |
| `/api/ask-ai` | ✅ VERIFICADA | Consulta IA |
| `/webhook` | ✅ VERIFICADA | Recepción WhatsApp |

**TOTAL: 8 grupos de endpoints - TODOS VERIFICADOS ✅**
