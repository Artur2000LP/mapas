Refactoring: GeoVisor Pro — Estructura Modular
Dividir app.js (109 KB, ~2600 líneas) y index.html (45 KB, ~570 líneas) en módulos independientes y mantenibles.

Propuesta de Estructura
mapas/
├── index.html              → Solo estructura HTML limpia (~150 líneas)
├── styles.css              → Ya existe — se amplía
├── js/
│   ├── config.js           → Providers, URLs, constantes globales
│   ├── map.js              → Inicialización del mapa + cambio de capa base
│   ├── overlays.js         → GeoPerú WMS + INGEMMET ArcGIS (imagen única)
│   ├── kml.js              → Carga, parseo y visualización de KML/KMZ
│   ├── ai.js               → Integración con Gemini AI
│   ├── search.js           → Búsqueda de lugares (Nominatim)
│   ├── credentials.js      → Gestión de tokens (Mapbox, Here, Thunderforest)
│   ├── ui.js               → Panel, tabs, acordeones, toasts
│   └── app.js              → Punto de entrada — inicialización y conexión de módulos
└── README.md
Módulos: Contenido Detallado
js/config.js
providers — URLs de todos los mapas base
attributions — Atribuciones de cada proveedor
providerConfigs — Configs de API keys (Mapbox, Here, Thunderforest, Stadia)
GEOPERU_WMS — URL base GeoPerú
INGEMMET_CARTA_URL — URL base INGEMMET
PERU_DEPTS — Centroides hardcodeados (fallback)
js/map.js
initMap() — Crea instancia Leaflet, controles de zoom
changeLayer(provider, style) — Cambia mapa base
reloadTiles(), toggleTileQuality() — Calidad de tiles
processData(), clearMap() — Gestión de marcadores manuales
js/overlays.js
buildGeoPeruImageUrl(layer) — Constructor de URL WMS
buildIngemmetImageUrl(layersParam) — Constructor de URL ArcGIS
toggleOverlay(provider, styleKey, isChecked) — GeoPerú imagen dinámica
toggleIngemmetOverlay(layerId, isChecked) — INGEMMET imagen dinámica
js/kml.js
handleKMLUpload(event) — Carga de archivos
addKMLToMap(kmlFile) — Parseo y renderizado
addKMLFileToUI(kmlFile) — UI de la lista de archivos
toggleKMLVisibility(), removeKMLFile(), clearAllKMLFiles()
cleanKMLContent(), analyzeKML() — Limpieza y análisis
js/ai.js
generateMapWithAI() — Genera CSV de puntos con Gemini
analyzeLocationAI(name, lat, lon) — Analiza una ubicación
closeModal() — Modal IA
js/search.js
setupPlaceSearch() — Configurar búsqueda de Nominatim
displaySearchResults(), goToPlace(), clearSearchMarker()
js/credentials.js
createCredentialInput(), getCredentialValue()
saveCredential(), validateCredential()
updateProviderHeader(), showApiKeyGuide()
js/ui.js
switchTab(), togglePanel()
toggleProvider() — Acordeones del panel
showToast() — Notificaciones
Funciones de utilidad: hexToRgb(), formatFileSize(), etc.
js/app.js (punto de entrada)
DOMContentLoaded → llama a initMap(), setupPlaceSearch(), setupMapboxTokenListener(), etc.
Variables globales compartidas: map, currentTileLayer, activeOverlays, kmlFiles
index.html — Después del Refactoring
Solo contendrá:

<head> con CDN imports
Estructura HTML del panel lateral (sin estilos inline)
<script> tags cargando los módulos JS en orden correcto
Orden de Carga de Scripts
html
<script src="js/config.js"></script>
<script src="js/ui.js"></script>
<script src="js/credentials.js"></script>
<script src="js/map.js"></script>
<script src="js/overlays.js"></script>
<script src="js/search.js"></script>
<script src="js/kml.js"></script>
<script src="js/ai.js"></script>
<script src="js/app.js"></script>
Plan de Ejecución
Crear carpeta js/
Crear js/config.js — extraer todas las constantes
Crear js/ui.js — panel, tabs, toasts
Crear js/credentials.js — tokens y API keys
Crear js/map.js — mapa base + marcadores
Crear js/overlays.js — GeoPerú + INGEMMET
Crear js/search.js — búsqueda de lugares
Crear js/kml.js — carga y visualización KML
Crear js/ai.js — integración Gemini
Crear js/app.js — punto de entrada
Limpiar index.html — eliminar app.js viejo, cargar módulos
IMPORTANT

El orden de los scripts importa: config.js debe ir primero (variables globales), app.js al final (inicialización).

WARNING

Variables como map, currentTileLayer, kmlFiles son compartidas entre módulos. Se declararán como let en config.js o app.js y serán accesibles globalmente (sin ES modules para mantener compatibilidad con el sistema actual de carga de scripts).

Verificación
Cargar index.html y probar: cambio de mapa base, carga KML, capas GeoPerú/INGEMMET, búsqueda de lugares, IA