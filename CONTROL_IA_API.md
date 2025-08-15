# Control de IA y Autorespuesta - API

Este documento explica el único endpoint recomendado para controlar el funcionamiento de la IA (inteligencia artificial/autorespuesta) en el sistema multi-cliente y cómo usarlo desde cualquier frontend o herramienta.

---

# API IA por Conversación

## 1. Listar todas las conversaciones (incluye estado de IA)
**GET** `/api/conversations`

Respuesta:
```json
{
  "success": true,
  "conversations": [
    {
      "phoneNumber": "whatsapp:+573012508805",
      "clientId": "markettech",
      // ...otros datos...
      "iaEnabled": true // o false
    }
    // ...
  ],
  "count": 1
}
```

## 2. Consultar historial de una conversación (incluye estado de IA)
**GET** `/api/conversations/:phone`

Respuesta:
```json
{
  "success": true,
  "messages": [ /* ... */ ],
  "conversation": { /* ... */ },
  "iaEnabled": true // o false
}
```

## 3. Consultar estado de IA individual por chat
**GET** `/api/ia/:clientId/:phone/status`

Respuesta:
```json
{
  "success": true,
  "clientId": "markettech",
  "phone": "whatsapp:+573012508805",
  "iaEnabled": true // o false
}
```

## 4. Activar/desactivar IA por chat
**POST** `/api/ia/:clientId/:phone/toggle`
Body:
```json
{ "enabled": true } // o false
```
Respuesta:
```json
{
  "success": true,
  "clientId": "markettech",
  "phone": "whatsapp:+573012508805",
  "iaEnabled": true // o false
}
```

---

## Comportamiento del sistema

- Si la IA está activa para la conversación, responde automáticamente la IA.
- Si la IA está desactivada para la conversación, solo responde el asesor humano (no hay autorespuesta).
- Puedes controlar la IA desde cualquier frontend, Postman, curl, etc. usando el endpoint por conversación.

---

## Ejemplo de uso (curl)

**Activar/desactivar IA para una conversación:**
```bash
curl -X POST https://twilio-9ubt.onrender.com/api/ia/CLIENT_ID/whatsapp:+573012508805/toggle \
  -H "Content-Type: application/json" \
  -d '{"enabled":false}'
```

---

## Notas
- El control es por conversación: solo afecta la conversación seleccionada.
- Si la IA está desactivada para esa conversación, no responde automáticamente.
- Los cambios son inmediatos y afectan el comportamiento de respuesta en WhatsApp y el dashboard.

---

**Para dudas técnicas, consulta este archivo o pregunta por el endpoint aquí.**
