# 👥 API Documentation - Sistema de Usuarios Multi-Cliente

**Fecha:** Agosto 2, 2025  
**Versión:** 1.0  
**Base URL:** `https://twilio-9ubt.onrender.com`

## 🏗️ Arquitectura Usuario-Cliente

El sistema de usuarios permite que cada cliente tenga múltiples usuarios con diferentes roles y permisos. Cada usuario está vinculado a un cliente específico y tiene acceso únicamente a los recursos de ese cliente.

### 🔑 Tipos de Autenticación

**Admin Panel:** Requiere header `x-admin-key: admin123` (para gestión de usuarios de todos los clientes)  
**Usuario Normal:** Sin header especial requerido (para operaciones del propio usuario o de su cliente)

### 🎭 Sistema de Roles

- **admin:** Acceso completo al cliente, puede gestionar otros usuarios
- **manager:** Acceso de gestión con algunas restricciones
- **user:** Usuario estándar con permisos de lectura y escritura
- **viewer:** Solo lectura, sin permisos de modificación

### 🔐 Sistema de Permisos

- **read:** Leer información y datos
- **write:** Crear y modificar datos
- **delete:** Eliminar recursos
- **admin:** Permisos administrativos completos

---

## 📚 Índice de APIs de Usuarios

1. [Gestión de Usuarios (Admin)](#gestión-de-usuarios-admin)
2. [Operaciones de Usuario](#operaciones-de-usuario)
3. [Autenticación y Login](#autenticación-y-login)
4. [Gestión de Roles y Permisos](#gestión-de-roles-y-permisos)
5. [Integración Cliente-Usuario](#integración-cliente-usuario)

---

## 👥 Gestión de Usuarios (Admin)

> **Nota:** Todas estas rutas requieren `x-admin-key: admin123` en los headers

### Listar Todos los Usuarios
**Endpoint:** `GET /api/users`  
**Query Params:** `limit`, `offset`, `search`, `clientId`, `role`
```javascript
// Ejemplo de uso - Listar todos los usuarios
const users = await fetch('/api/users?limit=20&offset=0', {
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());

// Ejemplo con filtros
const filteredUsers = await fetch('/api/users?search=sebastian&role=admin&clientId=688da23c21e39b848cb30560', {
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": [
    {
      "_id": "688db4d85f6a82bece18db29",
      "email": "sebastian@markettech.com",
      "name": "Sebastian Pulgarin",
      "clientId": "688da23c21e39b848cb30560",
      "role": "manager",
      "permissions": ["read", "write"],
      "isActive": true,
      "profile": {
        "firstName": "Sebastian",
        "lastName": "Pulgarin",
        "phoneNumber": "+573009876543",
        "department": "Tecnología",
        "position": "Senior Full Stack Developer"
      },
      "preferences": {
        "language": "es",
        "timezone": "America/Bogota",
        "notifications": {
          "email": true,
          "push": true,
          "sms": false
        }
      },
      "client": {
        "_id": "688da23c21e39b848cb30560",
        "name": "MarketTech",
        "business": "Marketing y Tecnología",
        "twilioPhoneNumber": "+14155238886"
      },
      "authProvider": "email",
      "lastLogin": "2025-08-02T06:30:00.000Z",
      "loginCount": 15,
      "createdAt": "2025-08-02T06:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Crear Nuevo Usuario
**Endpoint:** `POST /api/users`
```javascript
// Ejemplo de uso
const newUser = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': 'admin123'
  },
  body: JSON.stringify({
    email: "maria@techcorp.com",
    name: "María González",
    clientId: "688db5235f6a82bece18db2a", // ID del cliente TechCorp
    role: "user",
    permissions: ["read", "write"],
    firstName: "María",
    lastName: "González",
    phoneNumber: "+573001234567",
    department: "Ventas",
    position: "Ejecutiva de Ventas",
    authProvider: "email",
    language: "es",
    timezone: "America/Bogota"
  })
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Usuario \"María González\" creado exitosamente",
  "data": {
    "_id": "688db6f25f6a82bece18db2c",
    "email": "maria@techcorp.com",
    "name": "María González",
    "clientId": "688db5235f6a82bece18db2a",
    "role": "user",
    // ... resto de los datos del usuario
  }
}
```

### Obtener Usuario Específico
**Endpoint:** `GET /api/users/:id`
```javascript
// Ejemplo de uso
const user = await fetch(`/api/users/${userId}`, {
  // x-admin-key opcional para admin, sin header para operaciones propias
}).then(r => r.json());

// Respuesta incluye información completa del cliente
{
  "success": true,
  "data": {
    "_id": "688db4d85f6a82bece18db29",
    "email": "sebastian@markettech.com",
    "name": "Sebastian Pulgarin",
    // ... datos completos del usuario
    "client": {
      "_id": "688da23c21e39b848cb30560",
      "name": "MarketTech",
      "business": "Marketing y Tecnología",
      "twilioPhoneNumber": "+14155238886"
    }
  }
}
```

### Actualizar Usuario
**Endpoint:** `PUT /api/users/:id`
```javascript
// Ejemplo de uso
const updatedUser = await fetch(`/api/users/${userId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: "+573009999999",
    profile: {
      position: "Lead Developer",
      department: "Tecnología"
    },
    preferences: {
      language: "en",
      notifications: {
        email: false,
        push: true
      }
    }
  })
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Usuario \"Sebastian Pulgarin\" actualizado exitosamente",
  "data": {
    // ... datos actualizados del usuario
  }
}
```

### Eliminar Usuario
**Endpoint:** `DELETE /api/users/:id`  
**Query Params:** `permanent=true` (para eliminación permanente)
```javascript
// Desactivar usuario (soft delete)
const deactivate = await fetch(`/api/users/${userId}`, {
  method: 'DELETE',
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());

// Eliminar permanentemente
const permanentDelete = await fetch(`/api/users/${userId}?permanent=true`, {
  method: 'DELETE',
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Usuario \"María González\" desactivado exitosamente"
}
```

### Reactivar Usuario
**Endpoint:** `POST /api/users/:id/activate`
```javascript
// Ejemplo de uso
const reactivate = await fetch(`/api/users/${userId}/activate`, {
  method: 'POST',
  headers: { 'x-admin-key': 'admin123' }
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Usuario \"María González\" reactivado exitosamente",
  "data": {
    // ... datos del usuario reactivado
  }
}
```

---

## 🏢 Operaciones de Usuario

### Obtener Usuarios de un Cliente
**Endpoint:** `GET /api/users/client/:clientId`  
**Query Params:** `limit`, `offset`
```javascript
// Ejemplo de uso - Obtener usuarios de MarketTech
const clientUsers = await fetch('/api/users/client/688da23c21e39b848cb30560?limit=10&offset=0').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": [
    {
      "_id": "688db4d85f6a82bece18db29",
      "email": "sebastian@markettech.com",
      "name": "Sebastian Pulgarin",
      "role": "manager",
      "isActive": true,
      // ... otros datos del usuario
    },
    {
      "_id": "688db4d85f6a82bece18db28",
      "email": "admin@markettech.com",
      "name": "Administrador MarketTech",
      "role": "admin",
      "isActive": true,
      // ... otros datos del usuario
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## 🔐 Autenticación y Login

### Buscar Usuario por Email
**Endpoint:** `GET /api/users/email/:email`
```javascript
// Ejemplo de uso - Para proceso de login
const userLogin = await fetch('/api/users/email/sebastian@markettech.com').then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "data": {
    "_id": "688db4d85f6a82bece18db29",
    "email": "sebastian@markettech.com",
    "name": "Sebastian Pulgarin",
    "role": "manager",
    "permissions": ["read", "write"],
    "client": {
      "_id": "688da23c21e39b848cb30560",
      "name": "MarketTech",
      "twilioPhoneNumber": "+14155238886"
    },
    "authProvider": "email",
    "isActive": true
    // ... otros datos necesarios para la sesión
  }
}
```

### Registrar Login de Usuario
**Endpoint:** `POST /api/users/:id/login`
```javascript
// Ejemplo de uso - Después de login exitoso
const loginRegistered = await fetch(`/api/users/${userId}/login`, {
  method: 'POST'
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Login registrado exitosamente",
  "data": {
    "lastLogin": "2025-08-02T10:30:00.000Z",
    "loginCount": 16
  }
}
```

---

## 🎭 Gestión de Roles y Permisos

### Cambiar Rol de Usuario
**Endpoint:** `PUT /api/users/:id/role`
```javascript
// Ejemplo de uso - Solo admin puede cambiar roles
const roleChange = await fetch(`/api/users/${userId}/role`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': 'admin123'
  },
  body: JSON.stringify({
    role: "admin"
  })
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Rol actualizado a \"admin\" para usuario \"Sebastian Pulgarin\"",
  "data": {
    // ... datos del usuario con nuevo rol
  }
}

// Roles válidos: "admin", "manager", "user", "viewer"
```

### Actualizar Permisos de Usuario
**Endpoint:** `PUT /api/users/:id/permissions`
```javascript
// Ejemplo de uso
const permissionsUpdate = await fetch(`/api/users/${userId}/permissions`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': 'admin123'
  },
  body: JSON.stringify({
    permissions: ["read", "write", "delete"]
  })
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Permisos actualizados para usuario \"Sebastian Pulgarin\"",
  "data": {
    // ... datos del usuario con nuevos permisos
  }
}

// Permisos válidos: "read", "write", "delete", "admin"
```

---

## 🔄 Acciones en Lote

### Acciones Masivas en Usuarios
**Endpoint:** `POST /api/users/bulk-actions`
```javascript
// Ejemplo de uso - Cambiar rol de múltiples usuarios
const bulkAction = await fetch('/api/users/bulk-actions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': 'admin123'
  },
  body: JSON.stringify({
    action: "change-role",
    userIds: [userId1, userId2, userId3],
    settings: {
      role: "user"
    }
  })
}).then(r => r.json());

// Respuesta esperada
{
  "success": true,
  "message": "Acción \"change-role\" aplicada a 3 usuarios",
  "results": [
    {
      "userId": "688db4d85f6a82bece18db29",
      "status": "success",
      "message": "Rol cambiado a user"
    },
    {
      "userId": "688db4d85f6a82bece18db30",
      "status": "success", 
      "message": "Rol cambiado a user"
    },
    {
      "userId": "688db4d85f6a82bece18db31",
      "status": "error",
      "message": "Usuario no encontrado"
    }
  ]
}

// Acciones disponibles:
// - "activate": Activar usuarios
// - "deactivate": Desactivar usuarios
// - "change-role": Cambiar rol (requiere settings.role)
// - "update-permissions": Actualizar permisos (requiere settings.permissions)
```

---

## 🏗️ Integración Cliente-Usuario

### Creación Automática de Usuarios

Cuando se crea un nuevo cliente através de la API `/api/admin/clients`, automáticamente se crea un usuario administrador por defecto:

```javascript
// Al crear cliente "TechCorp Solutions", se crea automáticamente:
{
  "email": "admin@techcorpsolutions.com",
  "name": "Administrador TechCorp Solutions", 
  "role": "admin",
  "permissions": ["read", "write", "delete", "admin"],
  "clientId": "[ID_DEL_CLIENTE_CREADO]"
}
```

### Estructura de Usuario Completa

```javascript
{
  "_id": "ObjectId",
  "email": "usuario@cliente.com",      // Único en todo el sistema
  "name": "Nombre Completo",
  "clientId": "ObjectId",              // Referencia al cliente
  "role": "admin|manager|user|viewer",
  "permissions": ["read", "write", "delete", "admin"],
  "isActive": true,
  
  "profile": {
    "firstName": "Nombre",
    "lastName": "Apellido", 
    "phoneNumber": "+573001234567",
    "avatar": "url_imagen",           // Opcional
    "department": "Tecnología",       // Opcional
    "position": "Desarrollador"       // Opcional
  },
  
  "preferences": {
    "language": "es|en",
    "timezone": "America/Bogota",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    }
  },
  
  "authProvider": "email|google|microsoft|github",
  "authProviderId": "id_del_proveedor",  // Opcional
  "lastLogin": "2025-08-02T10:30:00.000Z",
  "loginCount": 15,
  "createdAt": "2025-08-02T06:15:00.000Z",
  "updatedAt": "2025-08-02T10:30:00.000Z",
  "createdBy": "ObjectId"                // ID del usuario que lo creó
}
```

---

## 🎨 Estructura Frontend Recomendada

### 👥 **Panel de Gestión de Usuarios** (`/admin/users`)
**Autenticación:** Requerida (`x-admin-key`)

#### Páginas Sugeridas:

1. **Lista de Usuarios** (`/admin/users`)
   - Tabla con todos los usuarios del sistema
   - Filtros por cliente, rol, estado
   - Búsqueda por nombre/email
   - Acciones rápidas (activar/desactivar)

2. **Crear Usuario** (`/admin/users/new`)
   - Formulario completo de creación
   - Selector de cliente
   - Configuración de rol y permisos
   - Información de perfil

3. **Editar Usuario** (`/admin/users/:id/edit`)
   - Formulario de edición
   - Cambio de rol (solo admin)
   - Actualización de permisos
   - Gestión de perfil

4. **Perfil de Usuario** (`/admin/users/:id`)
   - Vista detallada del usuario
   - Historial de login
   - Estadísticas de actividad
   - Información del cliente asociado

### 🏢 **Panel de Usuario del Cliente** (`/client/:twilioNumber/users`)
**Identificación:** Por cliente específico

#### Páginas Sugeridas:

1. **Usuarios del Cliente** (`/client/:twilioNumber/users`)
   - Lista de usuarios del cliente específico
   - Solo usuarios con rol admin pueden ver todos
   - Usuarios normales ven solo su perfil

2. **Mi Perfil** (`/client/:twilioNumber/profile`)
   - Edición de perfil personal
   - Configuración de preferencias
   - Cambio de configuraciones de notificación

---

## 📋 Componentes Frontend Recomendados

### 🎯 **Componentes Principales**

1. **UserTable** - Tabla de usuarios con filtros
2. **UserForm** - Formulario de creación/edición
3. **RoleSelector** - Selector de roles con descripción
4. **PermissionManager** - Gestión granular de permisos
5. **UserProfile** - Card de perfil de usuario
6. **ClientUsersList** - Lista de usuarios por cliente
7. **BulkUserActions** - Acciones en lote para usuarios
8. **UserStats** - Estadísticas de login y actividad

### 🔄 **Funcionalidades Clave**

1. **Gestión de roles** visual e intuitiva
2. **Filtrado avanzado** por múltiples criterios  
3. **Validación en tiempo real** de emails únicos
4. **Integración con proveedores** de autenticación
5. **Dashboard de actividad** de usuarios
6. **Notificaciones** de cambios de rol/permisos

---

## 🚨 Manejo de Errores

### Errores Comunes:

```javascript
// Email duplicado
{
  "success": false,
  "error": "Ya existe un usuario con ese email"
}

// Cliente no encontrado
{
  "success": false,
  "error": "Cliente no encontrado"
}

// Rol no válido
{
  "success": false,
  "error": "Rol no válido"
}

// Permisos no válidos
{
  "success": false,
  "error": "Permisos no válidos: admin-invalid"
}

// Usuario no encontrado
{
  "success": false,
  "error": "Usuario no encontrado"
}
```

---

## 🔄 Flujos de Usuario Completos

### Flujo de Creación de Usuario:
1. Admin accede a `/admin/users/new`
2. Selecciona cliente de la lista
3. Completa información del usuario
4. Selecciona rol y permisos
5. Sistema valida email único
6. Usuario creado y vinculado al cliente

### Flujo de Login de Usuario:
1. Usuario ingresa email en frontend
2. Sistema busca usuario (`GET /api/users/email/:email`)
3. Verifica autenticación con proveedor externo
4. Registra login (`POST /api/users/:id/login`)
5. Usuario accede a dashboard de su cliente

### Flujo de Gestión de Roles:
1. Admin ve lista de usuarios
2. Selecciona usuario para cambiar rol
3. Confirma cambio de permisos
4. Sistema actualiza rol (`PUT /api/users/:id/role`)
5. Usuario recibe notificación de cambio

---

## 🌟 Notas Importantes

1. **Separación por Cliente:** Cada usuario pertenece a un cliente específico
2. **Roles Jerárquicos:** admin > manager > user > viewer
3. **Creación Automática:** Se crea usuario admin al crear cliente
4. **Email Único:** Un email solo puede estar asociado a un usuario
5. **Soft Delete:** Los usuarios se desactivan, no se eliminan por defecto
6. **Auditoría:** Se registra quién crea cada usuario y cuándo
7. **Flexibilidad:** Sistema preparado para múltiples proveedores de auth

---

## 🎯 Casos de Uso Principales

### Para Administradores del Sistema:
- Gestionar usuarios de todos los clientes
- Crear usuarios para nuevos clientes
- Cambiar roles y permisos globalmente
- Ver estadísticas de uso por usuario

### Para Administradores de Cliente:
- Ver usuarios de su cliente específico
- Crear nuevos usuarios para su empresa
- Gestionar roles dentro de su organización
- Configurar preferencias de equipo

### Para Usuarios Normales:
- Acceder a su dashboard específico
- Editar su perfil personal
- Ver conversaciones de su cliente
- Usar funcionalidades según sus permisos

**¡El sistema de usuarios está completamente implementado y listo para el frontend!** 👥✨
