// src/app.js - Punto de entrada alternativo para Render
console.log('🔧 [src/app.js] Iniciando desde carpeta src...');
console.log('📂 Directorio actual:', process.cwd());
console.log('🎯 Cargando servidor desde:', '../server.js');

try {
  require('../server.js');
  console.log('✅ [src/app.js] Servidor cargado exitosamente');
} catch (error) {
  console.error('❌ [src/app.js] Error cargando servidor:', error.message);
  process.exit(1);
}
