// check-setup.js - Verificar configuración del proyecto
require('dotenv').config();

console.log('🔍 === VERIFICACIÓN DE CONFIGURACIÓN ===\n');

// 1. Verificar variables de entorno
console.log('📋 Variables de entorno:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'No configurado'}`);
console.log(`   PORT: ${process.env.PORT || 'No configurado'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'Configurado' : 'No configurado'}`);
console.log(`   TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Configurado' : 'No configurado'}`);
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Configurado' : 'No configurado'}`);
console.log(`   API_KEYS: ${process.env.API_KEYS ? 'Configurado' : 'No configurado'}`);

// 2. Verificar archivos principales
console.log('\n📁 Archivos principales:');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'app.js',
  'config/index.js',
  'src/shared/utils/index.js',
  'src/core/entities/index.js',
  'src/core/repositories/index.js',
  'src/api/v1/controllers/index.js',
  'src/api/v1/routes/index.js',
  'src/infrastructure/database/connection.js'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// 3. Verificar dependencias
console.log('\n📦 Dependencias:');
try {
  const packageJson = require('./package.json');
  const requiredDeps = ['express', 'cors', 'mongodb', 'dotenv'];
  
  requiredDeps.forEach(dep => {
    const exists = packageJson.dependencies && packageJson.dependencies[dep];
    console.log(`   ${exists ? '✅' : '❌'} ${dep}: ${exists || 'No instalado'}`);
  });
} catch (error) {
  console.log('   ❌ Error leyendo package.json:', error.message);
}

// 4. Probar importaciones principales
console.log('\n🔧 Importaciones:');
try {
  const config = require('./config');
  console.log('   ✅ Config importado exitosamente');
  
  const utils = require('./src/shared/utils');
  console.log('   ✅ Shared utils importado exitosamente');
  
  const entities = require('./src/core/entities');
  console.log('   ✅ Entities importado exitosamente');
  
  const controllers = require('./src/api/v1/controllers');
  console.log('   ✅ Controllers importado exitosamente');
  
} catch (error) {
  console.log(`   ❌ Error en importaciones: ${error.message}`);
}

// 5. Verificar configuración de base de datos
console.log('\n🗄️ Configuración de base de datos:');
try {
  const config = require('./config');
  console.log(`   Base de datos: ${config.database ? config.database.name : 'No configurado'}`);
  console.log(`   URI configurada: ${config.database ? Boolean(config.database.uri) : false}`);
} catch (error) {
  console.log(`   ❌ Error verificando config de BD: ${error.message}`);
}

console.log('\n🎯 === SIGUIENTE PASO ===');
console.log('Si todo está ✅, ejecuta: node start-server.js');
console.log('Luego en otra terminal: node test-endpoints.js');
