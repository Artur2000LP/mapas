// 🧪 PRUEBA DE MAPAS - Pega este código en la consola del navegador (F12)

console.log('🧪 Iniciando prueba de mapas...');

// Función para probar cada proveedor
function probarMapas() {
    const mapas = [
        // Mapas 100% confiables
        ['open', 'osm', '🟢 OpenStreetMap'],
        ['esri', 'sat', '🟢 Esri Satélite'],
        ['esri', 'street', '🟢 Esri Calles'],
        ['open', 'cartoDark', '🟢 CartoDB Dark'],
        ['open', 'cartoLight', '🟢 CartoDB Light'],
        ['open', 'wikimedia', '🟢 Wikimedia'],
        
        // Google Maps (pueden tener limitaciones)
        ['google', 'roadmap', '🟡 Google Roadmap'],
        ['google', 'satellite', '🟡 Google Satélite'],
        ['google', 'hybrid', '🟡 Google Híbrido'],
        
        // Mapas artísticos
        ['stamen', 'watercolor', '🎨 Stamen Watercolor'],
        ['stamen', 'toner', '🎨 Stamen Toner']
    ];
    
    let index = 0;
    
    function probarSiguiente() {
        if (index >= mapas.length) {
            console.log('✅ Prueba completada!');
            return;
        }
        
        const [provider, style, nombre] = mapas[index];
        console.log(`Probando: ${nombre}`);
        
        try {
            changeLayer(provider, style);
            console.log(`✅ ${nombre} - OK`);
        } catch (error) {
            console.log(`❌ ${nombre} - Error:`, error);
        }
        
        index++;
        setTimeout(probarSiguiente, 2000); // Esperar 2 segundos entre cada mapa
    }
    
    probarSiguiente();
}

// Ejecutar la prueba
probarMapas();

console.log('🎯 Para probar manualmente un mapa específico:');
console.log('changeLayer("google", "satellite") - Google Satélite');
console.log('changeLayer("esri", "sat") - Esri Satélite (más confiable)');
console.log('changeLayer("open", "osm") - OpenStreetMap (más confiable)');