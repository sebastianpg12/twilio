# Twilio WhatsApp Bot con IA

Bot de WhatsApp integrado con Twilio y OpenAI para respuestas automáticas inteligentes.

## Configuración

1. Copia tu archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Completa las variables de entorno en `.env`:
   ```
   TWILIO_SID=tu_account_sid_aquí
   TWILIO_AUTH_TOKEN=tu_auth_token_aquí
   OPENAI_API_KEY=tu_openai_api_key_aquí
   ```

## Instalación

```bash
npm install
```

## Uso

### Iniciar el servidor
```bash
npm start
```

### Endpoints disponibles

#### 1. Webhook de Twilio (respuestas automáticas)
- **POST** `/webhook`
- Recibe mensajes de WhatsApp y responde automáticamente con IA

#### 2. Pregunta directa a la IA
- **POST** `/ask-ai`
- Body: `{ "question": "tu pregunta", "context": "contexto opcional" }`

#### 3. Enviar mensaje manual
- **POST** `/send-message`
- Body: `{ "to": "+1234567890", "fecha": "2024-01-01", "hora": "10:00" }`

## Funciones de IA disponibles

### `preguntarIA(pregunta, contexto)`
Hace una pregunta directa a OpenAI.

### `responderMensajeWhatsApp(mensaje, numeroTelefono)`
Genera una respuesta específica para WhatsApp.

### `respuestaInteligente(mensaje)`
Genera respuestas automáticas basadas en el contexto del mensaje.

## Ejemplo de uso

```javascript
const { preguntarIA } = require('./ia');

const respuesta = await preguntarIA("¿Cuál es la capital de Francia?");
console.log(respuesta); // "La capital de Francia es París."
```

## Seguridad

- ✅ Las API keys están en variables de entorno
- ✅ El archivo `.env` está en `.gitignore`
- ✅ Se incluye `.env.example` como plantilla
