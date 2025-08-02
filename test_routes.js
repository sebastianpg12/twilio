// test_routes.js - Verificar que todas las rutas se cargan correctamente

console.log('🧪 Probando carga de rutas...');

try {
  console.log('📁 Cargando conversations...');
  const conversationsRoutes = require('./src/routes/conversations');
  console.log('✅ conversations:', typeof conversationsRoutes);

  console.log('📁 Cargando stats...');
  const statsRoutes = require('./src/routes/stats');
  console.log('✅ stats:', typeof statsRoutes);

  console.log('📁 Cargando clients...');
  const clientsRoutes = require('./src/routes/clients');
  console.log('✅ clients:', typeof clientsRoutes);

  console.log('📁 Cargando dashboard...');
  const dashboardRoutes = require('./src/routes/dashboard');
  console.log('✅ dashboard:', typeof dashboardRoutes);

  console.log('📁 Cargando setup...');
  const setupRoutes = require('./src/routes/setup');
  console.log('✅ setup:', typeof setupRoutes);

  console.log('📁 Cargando admin...');
  const adminRoutes = require('./src/routes/admin');
  console.log('✅ admin:', typeof adminRoutes);

  console.log('🎉 Todas las rutas se cargaron correctamente!');

} catch (error) {
  console.error('❌ Error cargando rutas:', error.message);
  console.error('Stack:', error.stack);
}
