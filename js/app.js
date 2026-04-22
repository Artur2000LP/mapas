// ================================
// js/app.js — Punto de entrada: inicialización y conexión de módulos
// ================================

document.addEventListener('DOMContentLoaded', function () {
    // 1. Inicializar mapa Leaflet
    initializeMap();

    // 2. Restaurar estado del panel
    document.getElementById('panel-content').style.maxHeight = '80vh';

    // 3. Cargar credenciales guardadas y actualizar headers de providers
    loadSavedCredentials();

    // 4. Configurar búsqueda de lugares
    setupPlaceSearch();

    // 5. Event listener para carga de archivos KML/KMZ
    const kmlInput = document.getElementById('kml-file-input');
    if (kmlInput) kmlInput.addEventListener('change', handleKMLUpload);

    // 6. Generar capas oficiales en la UI
    renderOfficialLayers();

    // 7. Tab inicial
    switchTab('ai');

    // 7. Animación shake para CSS (providers bloqueados)
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        .shake-anim { animation: shake 0.3s ease-in-out; }
    `;
    document.head.appendChild(style);
});
