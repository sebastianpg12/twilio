// app.js - Punto de entrada principal para Render y desarrollo local
console.log('🚀 [APP.JS] Iniciando aplicación...');
console.log('📂 Directorio actual:', process.cwd());
console.log('🎯 Cargando servidor principal...');

try {
  require('./server.js');
  console.log('✅ [APP.JS] Servidor iniciado exitosamente desde app.js');
} catch (error) {
  console.error('❌ [APP.JS] Error fatal al cargar servidor:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
