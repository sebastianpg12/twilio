// scripts/populate-marketech-knowledge.js
const database = require('../src/config/database');
const KnowledgeBase = require('../src/models/KnowledgeBase');
const Client = require('../src/models/Client');

const knowledgeBase = new KnowledgeBase();

// Datos de conocimiento para MarketTech
const marketechKnowledge = [
  {
    category: 'Servicios',
    title: 'Marketing Digital',
    content: 'MarketTech ofrece servicios completos de marketing digital incluyendo: gestión de redes sociales, campañas publicitarias en Google Ads y Facebook Ads, SEO, email marketing y análisis de métricas. Nuestro enfoque está en generar resultados medibles y ROI positivo para nuestros clientes.',
    keywords: ['marketing', 'digital', 'redes sociales', 'publicidad', 'seo', 'google ads', 'facebook'],
    tags: ['servicios', 'marketing', 'digital'],
    priority: 5
  },
  {
    category: 'Servicios',
    title: 'Desarrollo Web',
    content: 'Desarrollamos sitios web modernos, responsivos y optimizados. Incluye: páginas web corporativas, tiendas online (e-commerce), aplicaciones web, landing pages, mantenimiento y hosting. Utilizamos tecnologías modernas como React, Node.js y WordPress.',
    keywords: ['desarrollo', 'web', 'sitios', 'ecommerce', 'aplicaciones', 'wordpress', 'react'],
    tags: ['servicios', 'desarrollo', 'web'],
    priority: 5
  },
  {
    category: 'Servicios',
    title: 'Automatización y Chatbots',
    content: 'Implementamos soluciones de automatización empresarial y chatbots inteligentes para WhatsApp, Facebook Messenger y sitios web. Incluye integración con sistemas CRM, automatización de ventas y atención al cliente 24/7.',
    keywords: ['automatización', 'chatbots', 'whatsapp', 'messenger', 'crm', 'ventas'],
    tags: ['servicios', 'automatización', 'ia'],
    priority: 4
  },
  {
    category: 'Precios',
    title: 'Planes de Marketing Digital',
    content: 'Ofrecemos 3 planes: BÁSICO ($300/mes) - gestión de 2 redes sociales + contenido. PROFESIONAL ($600/mes) - gestión completa + publicidad + informes. PREMIUM ($1200/mes) - estrategia integral + consultoría + resultados garantizados.',
    keywords: ['precios', 'planes', 'costos', 'básico', 'profesional', 'premium', 'mensual'],
    tags: ['precios', 'planes', 'marketing'],
    priority: 5
  },
  {
    category: 'Precios',
    title: 'Desarrollo Web - Precios',
    content: 'Sitio web corporativo: desde $800. Tienda online: desde $1500. Landing page: desde $300. Aplicación web: desde $2500. Mantenimiento mensual: $80. Hosting incluido el primer año.',
    keywords: ['precios', 'desarrollo', 'web', 'corporativo', 'tienda', 'landing', 'mantenimiento'],
    tags: ['precios', 'desarrollo', 'web'],
    priority: 4
  },
  {
    category: 'Contacto',
    title: 'Información de Contacto',
    content: 'MarketTech - Agencia de Marketing Digital y Desarrollo Web. Teléfono: +57 301 250 8805. Email: contacto@marketech.co. Oficinas en Medellín, Colombia. Horarios: Lunes a Viernes 8:00 AM - 6:00 PM. Atención por WhatsApp 24/7.',
    keywords: ['contacto', 'teléfono', 'email', 'oficinas', 'medellín', 'horarios', 'whatsapp'],
    tags: ['contacto', 'información', 'ubicación'],
    priority: 5
  },
  {
    category: 'Empresa',
    title: 'Sobre MarketTech',
    content: 'MarketTech es una agencia especializada en marketing digital y desarrollo tecnológico con más de 3 años de experiencia. Hemos ayudado a más de 150 empresas a digitalizar sus procesos y aumentar sus ventas. Nuestro equipo está conformado por especialistas en marketing, desarrollo y diseño.',
    keywords: ['empresa', 'agencia', 'experiencia', 'equipo', 'digitalización', 'ventas'],
    tags: ['empresa', 'sobre', 'experiencia'],
    priority: 3
  },
  {
    category: 'Proceso',
    title: 'Cómo Trabajamos',
    content: 'Nuestro proceso: 1) CONSULTA INICIAL gratuita para entender tus necesidades. 2) PROPUESTA personalizada con estrategia y cronograma. 3) IMPLEMENTACIÓN con reportes semanales. 4) OPTIMIZACIÓN continua basada en resultados. 5) SOPORTE permanente.',
    keywords: ['proceso', 'consulta', 'propuesta', 'implementación', 'optimización', 'soporte'],
    tags: ['proceso', 'metodología', 'trabajo'],
    priority: 3
  },
  {
    category: 'FAQ',
    title: 'Tiempo de Entrega',
    content: 'Tiempos promedio: Sitio web corporativo: 2-3 semanas. Tienda online: 4-6 semanas. Campaña de marketing: inicio en 48 horas. Chatbot: 1-2 semanas. Ofrecemos entregas urgentes con recargo del 30%.',
    keywords: ['tiempo', 'entrega', 'semanas', 'urgente', 'sitio', 'campaña', 'chatbot'],
    tags: ['faq', 'tiempo', 'entrega'],
    priority: 4
  },
  {
    category: 'FAQ',
    title: 'Formas de Pago',
    content: 'Aceptamos: transferencias bancarias, pagos por PSE, tarjetas de crédito/débito, PayPal. Para proyectos grandes: 50% al inicio, 50% al finalizar. Para servicios mensuales: pago anticipado cada mes. Emitimos factura electrónica.',
    keywords: ['pago', 'transferencia', 'pse', 'tarjeta', 'paypal', 'factura', 'mensual'],
    tags: ['faq', 'pago', 'facturación'],
    priority: 4
  }
];

async function populateMarketechKnowledge() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await database.connect();
    
    console.log('🔍 Buscando cliente MarketTech...');
    const marketechClient = await Client.findOne({ name: 'MarketTech' });
    
    if (!marketechClient) {
      console.error('❌ Cliente MarketTech no encontrado. Ejecuta primero el script de setup.');
      process.exit(1);
    }
    
    console.log(`✅ Cliente MarketTech encontrado: ${marketechClient._id}`);
    
    console.log('📚 Creando entradas de conocimiento...');
    
    for (const knowledge of marketechKnowledge) {
      try {
        const entry = await knowledgeBase.create({
          ...knowledge,
          clientId: marketechClient._id
        });
        
        console.log(`✅ Creada: ${entry.title}`);
      } catch (error) {
        console.error(`❌ Error creando "${knowledge.title}":`, error.message);
      }
    }
    
    console.log('📊 Obteniendo estadísticas finales...');
    const stats = await knowledgeBase.getClientKnowledgeStats(marketechClient._id.toString());
    
    console.log('🎉 ¡Base de conocimientos poblada exitosamente!');
    console.log(`📈 Estadísticas:
    - Total de entradas: ${stats.total}
    - Entradas activas: ${stats.active}
    - Categorías: ${stats.categories.join(', ')}
    - Última actualización: ${stats.lastUpdated}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error poblando base de conocimientos:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  populateMarketechKnowledge();
}

module.exports = { populateMarketechKnowledge, marketechKnowledge };
