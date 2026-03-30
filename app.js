// ================================
// CONFIGURACIÓN GLOBAL
// ================================

const CONFIG = {
    apiKey: "", // Agregar tu API Key de Google Gemini aquí
    defaultCenter: [-9.189967, -75.015152], // Perú
    defaultZoom: 5,
    colorPalette: [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", 
        "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52B788"
    ]
};

// ================================
// VARIABLES GLOBALES
// ================================

let map, markersLayer, currentTileLayer;
let loadedKMLFiles = [];
let currentColorIndex = 0;
let activeTab = 'ai';

// ================================
// INICIALIZACIÓN DEL MAPA
// ================================

document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeUI();
    setupEventListeners();
    switchTab('ai'); // Tab por defecto
});

function initializeMap() {
    // Inicializar mapa con Leaflet
    map = L.map('map', { zoomControl: false }).setView(CONFIG.defaultCenter, CONFIG.defaultZoom);
    L.control.zoom({ position: 'topright' }).addTo(map);
    
    // Capa para marcadores de IA
    markersLayer = L.layerGroup().addTo(map);
    
    // Inicializar con Esri Satellite (más confiable) - con retraso para asegurar DOM
    setTimeout(() => {
        changeLayer('esri', 'sat');
        // Asegurar que el radio button correcto esté seleccionado
        const esriRadio = document.querySelector('input[value="esriSat"]');
        if (esriRadio) esriRadio.checked = true;
    }, 500);
    
    // Event listener para zoom
    map.on('zoomend', () => {
        document.getElementById('zoom-level').innerText = map.getZoom();
    });
}

function initializeUI() {
    // Configurar estado inicial del panel
    document.getElementById('panel-content').style.maxHeight = '80vh';
    
    // Cargar credenciales guardadas y actualizar estados de providers
    loadSavedCredentials();
}

function loadSavedCredentials() {
    const providers = ['mapbox', 'here', 'stamen', 'thunderforest'];
    
    providers.forEach(providerId => {
        const savedKey = localStorage.getItem(`${providerId}ApiKey`);
        if (savedKey && savedKey.trim().length > 10) {
            updateProviderHeader(providerId, true);
        }
    });
}

function setupEventListeners() {
    // Event listener para carga de archivos KML
    document.getElementById('kml-file-input').addEventListener('change', handleKMLUpload);
    
    // Event listener para búsqueda de lugares
    setupPlaceSearch();
}

// ================================
// GESTIÓN DE TABS
// ================================

function switchTab(tabName) {
    activeTab = tabName;
    
    // Remover clases activas de todos los tabs
    document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.classList.remove('tab-active');
    });
    
    // Ocultar todo el contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Activar tab y contenido seleccionado
    document.getElementById(`tab-${tabName}`).classList.add('tab-active');
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
}

// ================================
// TOGGLE PANEL
// ================================

function togglePanel() {
    const content = document.getElementById('panel-content');
    const icon = document.getElementById('panel-toggle-icon');
    
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.style.maxHeight = '80vh';
        icon.style.transform = 'rotate(0deg)';
    }
}

// ================================
// SISTEMA DE PROVEEDORES DE MAPAS
// ================================

const providers = {
    esri: {
        sat: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        street: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        natgeo: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
        dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    },
    open: {
        osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        opentopo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        cartoDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        cartoLight: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        cartoVoyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        wikimedia: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png',
        osmHot: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        cyclOSM: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'
    },
    google: {
        roadmap: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        satellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        terrain: 'https://mt1.google.com/vt/lyrs=t&x={x}&y={y}&z={z}'
    },
    bing: {
        aerial: 'https://ecn.t{s}.tiles.virtualearth.net/tiles/a{quad}.jpeg?g=737&mkt=en&lbl=l0&stl=h',
        road: 'https://ecn.t{s}.tiles.virtualearth.net/tiles/r{quad}.jpeg?g=737&mkt=en&lbl=l1&stl=h'
    },
    here: {
        normal: 'https://1.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/512/png8?apikey={apikey}',
        satellite: 'https://1.aerial.maps.ls.hereapi.com/maptile/2.1/maptile/newest/satellite.day/{z}/{x}/{y}/512/jpg?apikey={apikey}',
        hybrid: 'https://1.aerial.maps.ls.hereapi.com/maptile/2.1/maptile/newest/hybrid.day/{z}/{x}/{y}/512/png8?apikey={apikey}'
    },
    stamen: {
        watercolor: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key={apikey}',
        terrain: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png?api_key={apikey}',
        toner: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png?api_key={apikey}'
    },
    nasa: {
        // URLs simplificadas que pueden funcionar mejor
        viirs: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/VIIRS_SNPP_DayNightBand_ENCC/default/2024-01-01/250m/{z}/{y}/{x}.jpg',
        modis: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/2024-01-01/250m/{z}/{y}/{x}.jpg'
    },
    thunderforest: {
        landscape: 'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey={apikey}',
        outdoors: 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}',
        cycle: 'https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}'
    },
    mapbox: {
        base: 'https://api.mapbox.com/styles/v1/mapbox/{style}/tiles/{z}/{x}/{y}?access_token={token}'
    }
};

const attributions = {
    esri: 'Tiles &copy; Esri',
    open: '&copy; OpenStreetMap contributors',
    google: '&copy; Google',
    bing: '&copy; Microsoft',
    here: '&copy; Here Technologies',
    stamen: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL',
    nasa: '&copy; NASA GIBS',
    thunderforest: '&copy; Thunderforest, &copy; OpenStreetMap contributors',
    mapbox: '&copy; Mapbox'
};

function changeLayer(providerGroup, styleKey) {
    if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
    }
    
    // Limpiar todas las notificaciones de error existentes
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());

    let url = '';
    let attr = attributions[providerGroup];
    let tileLayerOptions = {
        attribution: attr,
        maxZoom: 19,
        minZoom: 1,
        tileSize: 256,
        zoomOffset: 0,
        crossOrigin: true,
        // Opciones para mejorar carga de tiles
        keepBuffer: 2,
        maxNativeZoom: 18,
        detectRetina: true,
        updateWhenIdle: false,
        updateWhenZooming: false
    };

    if (providerGroup === 'mapbox') {
        const token = getCredentialValue('mapbox');
        if (!token) {
            showToast('error', 'Token requerido', 'Se requiere un Token válido de Mapbox.');
            return;
        }
        url = providers.mapbox.base.replace('{style}', styleKey).replace('{token}', token);
    }
    else if (providerGroup === 'bing') {
        // Bing Maps usa sistema de quadkey especial
        currentTileLayer = L.tileLayer(providers[providerGroup][styleKey], {
            attribution: attr,
            maxZoom: 19,
            subdomains: ['0', '1', '2', '3'],
            tileSize: 256
        });
        
        // Función especial para convertir coordenadas a quadkey de Bing
        currentTileLayer.getTileUrl = function(coords) {
            const quadkey = tileToQuadKey(coords.x, coords.y, coords.z);
            return this._url.replace('{quad}', quadkey).replace('{s}', this._getSubdomain(coords));
        };
        
        currentTileLayer.addTo(map);
        return;
    }
    else if (providerGroup === 'here') {
        const apikey = getCredentialValue('here');
        if (!apikey) {
            showToast('error', 'API Key requerida', 'Se requiere una API Key válida de Here Maps.');
            return;
        }
        url = providers.here[styleKey].replace('{apikey}', apikey);
        tileLayerOptions.tileSize = 512;
        tileLayerOptions.zoomOffset = -1;
    }
    else if (providerGroup === 'thunderforest') {
        const apikey = getCredentialValue('thunderforest');
        if (!apikey) {
            showToast('error', 'API Key requerida', 'Se requiere una API Key válida de Thunderforest.');
            return;
        }
        url = providers.thunderforest[styleKey].replace('{apikey}', apikey);
    }
    else if (providerGroup === 'nasa') {
        // NASA GIBS con URLs optimizadas
        url = providers.nasa[styleKey];
        tileLayerOptions.maxZoom = 8;
        tileLayerOptions.maxNativeZoom = 8;
        tileLayerOptions.tileSize = 256;
        tileLayerOptions.zoomOffset = 0;
    }
    else if (providerGroup === 'stamen') {
        const apikey = getCredentialValue('stamen');
        if (!apikey) {
            showToast('error', 'API Key requerida', 'Stamen Maps ahora requiere una API Key de Stadia Maps (gratuita).');
            return;
        }
        url = providers.stamen[styleKey].replace('{apikey}', apikey);
        if (styleKey === 'watercolor') tileLayerOptions.maxZoom = 16;
        if (styleKey === 'terrain') tileLayerOptions.maxZoom = 18;
    }
    else {
        url = providers[providerGroup][styleKey];
        if (providerGroup === 'open' && styleKey === 'opentopo') tileLayerOptions.maxZoom = 17;
    }

    // Crear capa de tiles con opciones optimizadas
    currentTileLayer = L.tileLayer(url, tileLayerOptions);
    
    // Event listeners mejorados para mejor manejo de errores
    let errorNotified = false;
    let loadedTiles = 0;
    let totalTiles = 0;
    
    currentTileLayer.on('loading', function() {
        totalTiles = 0;
        loadedTiles = 0;
    });
    
    currentTileLayer.on('tileload', function() {
        loadedTiles++;
    });
    
    currentTileLayer.on('tileerror', function(error) {
        if (!errorNotified) {
            console.warn(`Error cargando tiles de ${providerGroup}:`, error);
            
            // Si es NASA que está fallando, cambiar automáticamente a Esri
            if (providerGroup === 'nasa') {
                showToast('info', 'Optimizando mapa', 'Algunos tiles de NASA no cargan, cambiando a Esri Satélite...');
                errorNotified = true;
                
                setTimeout(() => {
                    changeLayer('esri', 'sat');
                    // Marcar el radio button correcto
                    const esriRadio = document.querySelector('input[value="esriSat"]');
                    if (esriRadio) esriRadio.checked = true;
                }, 2000);
            } else {
                showToast('warning', 'Tiles incompletos', `Algunos tiles de ${providerGroup} pueden no cargar. El mapa puede verse cortado.`);
                errorNotified = true;
            }
            
            // Resetear flag después de un tiempo
            setTimeout(() => errorNotified = false, 15000);
        }
    });
    
    currentTileLayer.addTo(map);
}

// Función auxiliar para convertir coordenadas a quadkey de Bing
function tileToQuadKey(x, y, z) {
    let quadKey = '';
    for (let i = z; i > 0; i--) {
        let digit = 0;
        const mask = 1 << (i - 1);
        if ((x & mask) !== 0) digit++;
        if ((y & mask) !== 0) digit += 2;
        quadKey += digit.toString();
    }
    return quadKey;
}

function toggleProvider(id) {
    // Verificar tokens/API keys requeridos y mostrar input dinámico si es necesario
    if (id === 'mapbox') {
        const token = getCredentialValue('mapbox');
        if (!token) {
            showToast('info', 'Credencial requerida', 'Ingresa tu Token de Mapbox para usar estos mapas HD');
            createCredentialInput('mapbox', providerConfigs.mapbox);
            return; 
        }
    } else if (id === 'here') {
        const apikey = getCredentialValue('here');
        if (!apikey) {
            showToast('info', 'API Key requerida', 'Ingresa tu API Key de Here Maps para continuar');
            createCredentialInput('here', providerConfigs.here);
            return;
        }
    } else if (id === 'thunderforest') {
        const apikey = getCredentialValue('thunderforest');
        if (!apikey) {
            showToast('info', 'API Key requerida', 'Ingresa tu API Key de Thunderforest para mapas outdoor');
            createCredentialInput('thunderforest', providerConfigs.thunderforest);
            return;
        }
    } else if (id === 'stamen') {
        const apikey = getCredentialValue('stamen');
        if (!apikey) {
            showToast('info', 'API Key requerida', 'Ingresa tu API Key de Stadia Maps para mapas artísticos');
            createCredentialInput('stamen', providerConfigs.stamen);
            return;
        }
    }

    // Cerrar otros acordeones
    document.querySelectorAll('.provider-options').forEach(el => {
        if (el.id !== `opts-${id}`) el.classList.remove('open');
    });
    document.querySelectorAll('.provider-header').forEach(el => {
        el.classList.remove('active');
        el.querySelector('.arrow').style.transform = 'rotate(0deg)';
    });

    // Toggle acordeón actual
    const opts = document.getElementById(`opts-${id}`);
    const header = opts.previousElementSibling;
    
    if (opts.classList.contains('open')) {
        opts.classList.remove('open');
    } else {
        opts.classList.add('open');
        header.classList.add('active');
        header.querySelector('.arrow').style.transform = 'rotate(180deg)';
    }
}

function setupMapboxTokenListener() {
    document.getElementById('mapboxToken').addEventListener('input', (e) => {
        const val = e.target.value;
        const header = document.getElementById('header-mapbox');
        const subtitle = document.getElementById('mapbox-subtitle');
        const lock = document.getElementById('mapbox-lock-icon');
        const status = document.getElementById('token-status');

        if (val.length > 10) {
            header.classList.remove('opacity-60', 'grayscale');
            subtitle.innerText = "6 Estilos Desbloqueados";
            subtitle.classList.remove('text-blue-600');
            subtitle.classList.add('text-green-600');
            lock.classList.replace('fa-lock', 'fa-unlock');
            status.innerHTML = '<i class="fa-solid fa-check text-green-500"></i>';
        } else {
            header.classList.add('opacity-60', 'grayscale');
            subtitle.innerText = "Requiere Token";
            subtitle.classList.remove('text-green-600');
            subtitle.classList.add('text-blue-600');
            lock.classList.replace('fa-unlock', 'fa-lock');
            status.innerHTML = '<i class="fa-solid fa-lock"></i>';
            document.getElementById('opts-mapbox').classList.remove('open');
        }
    });
}

function setupHereApiKeyListener() {
    document.getElementById('hereApiKey').addEventListener('input', (e) => {
        const val = e.target.value;
        const header = document.getElementById('header-here');
        const subtitle = document.getElementById('here-subtitle');
        const lock = document.getElementById('here-lock-icon');
        const status = document.getElementById('here-status');

        if (val.length > 10) {
            header.classList.remove('opacity-60', 'grayscale');
            subtitle.innerText = "3 Estilos Desbloqueados";
            subtitle.classList.remove('text-purple-600');
            subtitle.classList.add('text-green-600');
            lock.classList.replace('fa-lock', 'fa-unlock');
            status.innerHTML = '<i class="fa-solid fa-check text-green-500"></i>';
        } else {
            header.classList.add('opacity-60', 'grayscale');
            subtitle.innerText = "Requiere API Key";
            subtitle.classList.remove('text-green-600');
            subtitle.classList.add('text-purple-600');
            lock.classList.replace('fa-unlock', 'fa-lock');
            status.innerHTML = '<i class="fa-solid fa-lock"></i>';
            document.getElementById('opts-here').classList.remove('open');
        }
    });
}

function setupThunderforestApiKeyListener() {
    document.getElementById('thunderforestApiKey').addEventListener('input', (e) => {
        const val = e.target.value;
        const header = document.getElementById('header-thunderforest');
        const subtitle = document.getElementById('thunderforest-subtitle');
        const lock = document.getElementById('thunderforest-lock-icon');
        const status = document.getElementById('thunderforest-status');

        if (val.length > 10) {
            header.classList.remove('opacity-60', 'grayscale');
            subtitle.innerText = "3 Estilos Desbloqueados";
            subtitle.classList.remove('text-teal-600');
            subtitle.classList.add('text-green-600');
            lock.classList.replace('fa-lock', 'fa-unlock');
            status.innerHTML = '<i class="fa-solid fa-check text-green-500"></i>';
        } else {
            header.classList.add('opacity-60', 'grayscale');
            subtitle.innerText = "Requiere API Key";
            subtitle.classList.remove('text-green-600');
            subtitle.classList.add('text-teal-600');
            lock.classList.replace('fa-unlock', 'fa-lock');
            status.innerHTML = '<i class="fa-solid fa-lock"></i>';
            document.getElementById('opts-thunderforest').classList.remove('open');
        }
    });
}

function setupStadiaApiKeyListener() {
    document.getElementById('stadiaApiKey').addEventListener('input', (e) => {
        const val = e.target.value;
        const header = document.getElementById('header-stamen');
        const subtitle = document.getElementById('stamen-subtitle');
        const lock = document.getElementById('stamen-lock-icon');
        const status = document.getElementById('stadia-status');

        if (val.length > 10) {
            header.classList.remove('opacity-60', 'grayscale');
            subtitle.innerText = "3 Estilos Artísticos";
            subtitle.classList.remove('text-pink-600');
            subtitle.classList.add('text-green-600');
            lock.classList.replace('fa-lock', 'fa-unlock');
            status.innerHTML = '<i class="fa-solid fa-check text-green-500"></i>';
        } else {
            header.classList.add('opacity-60', 'grayscale');
            subtitle.innerText = "Requiere API Key";
            subtitle.classList.remove('text-green-600');
            subtitle.classList.add('text-pink-600');
            lock.classList.replace('fa-unlock', 'fa-lock');
            status.innerHTML = '<i class="fa-solid fa-lock"></i>';
            document.getElementById('opts-stamen').classList.remove('open');
        }
    });
}

// Inputs ocultos para credenciales (se crearán dinámicamente)
let credentialInputs = {};

// Función para crear input dinámico de credenciales
function createCredentialInput(providerId, config) {
    const inputId = `${providerId}Credential`;
    const containerId = `${providerId}InputContainer`;
    
    // Si ya existe el input, solo enfocarlo
    if (document.getElementById(inputId)) {
        document.getElementById(inputId).focus();
        return;
    }
    
    const inputContainer = document.createElement('div');
    inputContainer.id = containerId;
    inputContainer.className = 'credential-input-container p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 animate-fadeIn';
    
    inputContainer.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
            <i class="fa-solid fa-key text-${config.color}-600 text-sm"></i>
            <span class="text-xs font-semibold text-${config.color}-700">${config.title}</span>
            <button onclick="removeCredentialInput('${containerId}')" class="ml-auto text-gray-400 hover:text-red-500 text-xs">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>
        <div class="relative">
            <input type="password" 
                   id="${inputId}" 
                   placeholder="${config.placeholder}..." 
                   class="w-full p-2 pl-9 pr-12 border border-${config.color}-300 rounded-lg text-xs focus:ring-2 focus:ring-${config.color}-500 focus:outline-none transition-all bg-white"
                   autocomplete="off">
            <i class="fa-solid fa-key absolute left-3 top-2.5 text-${config.color}-400 text-xs"></i>
            <div class="absolute right-3 top-2.5 flex gap-1">
                <button onclick="togglePasswordVisibility('${inputId}')" class="text-gray-400 hover:text-gray-600 text-xs">
                    <i class="fa-solid fa-eye" id="${inputId}Eye"></i>
                </button>
                <div id="${inputId}Status" class="text-gray-300 text-xs">
                    <i class="fa-solid fa-lock"></i>
                </div>
            </div>
        </div>
        <div class="mt-2 flex gap-2">
            <button onclick="saveCredential('${inputId}', '${providerId}')" class="flex-1 bg-${config.color}-500 hover:bg-${config.color}-600 text-white py-1 px-3 rounded text-xs font-medium transition-colors">
                <i class="fa-solid fa-save mr-1"></i> Guardar y Usar
            </button>
            <button onclick="showApiKeyGuide('${providerId}')" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-medium transition-colors">
                <i class="fa-solid fa-question-circle mr-1"></i> ¿Cómo obtener?
            </button>
        </div>
    `;
    
    // Insertar después del header del proveedor
    const providerDiv = document.querySelector(`#opts-${providerId}`).parentElement;
    const header = providerDiv.querySelector('.provider-header');
    header.insertAdjacentElement('afterend', inputContainer);
    
    // Enfocar el input después de un breve retraso
    setTimeout(() => {
        const input = document.getElementById(inputId);
        input.focus();
        
        // Configurar listener para validación en tiempo real
        input.addEventListener('input', () => validateCredential(inputId, providerId));
    }, 300);
}

// Configuraciones para cada proveedor
const providerConfigs = {
    mapbox: {
        title: 'Token de Mapbox',
        placeholder: 'pk.eyJ1Ijoixxxxxxx',
        color: 'blue',
        helpUrl: 'https://docs.mapbox.com/help/getting-started/access-tokens/'
    },
    here: {
        title: 'API Key de Here Maps',
        placeholder: 'xxxxx-xxxxx-xxxxx-xxxxx',  
        color: 'purple',
        helpUrl: 'https://developer.here.com/tutorials/getting-here-credentials/'
    },
    stamen: {
        title: 'API Key de Stadia Maps',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx',
        color: 'pink', 
        helpUrl: 'https://docs.stadiamaps.com/authentication/'
    },
    thunderforest: {
        title: 'API Key de Thunderforest',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        color: 'teal',
        helpUrl: 'https://www.thunderforest.com/docs/apikeys/'
    }
};
// Funciones auxiliares para el sistema de credenciales dinámico

function getCredentialValue(providerId) {
    // Intentar obtener del input dinámico primero
    const dynamicInput = document.getElementById(`${providerId}Credential`);
    if (dynamicInput) {
        return dynamicInput.value.trim();
    }
    
    // Fallback a localStorage si existe
    const stored = localStorage.getItem(`${providerId}ApiKey`);
    return stored ? stored.trim() : '';
}

function removeCredentialInput(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(-10px)';
        setTimeout(() => container.remove(), 200);
    }
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const eye = document.getElementById(`${inputId}Eye`);
    
    if (input.type === 'password') {
        input.type = 'text';
        eye.className = 'fa-solid fa-eye-slash';
    } else {
        input.type = 'password';
        eye.className = 'fa-solid fa-eye';
    }
}

function validateCredential(inputId, providerId) {
    const input = document.getElementById(inputId);
    const status = document.getElementById(`${inputId}Status`);
    const value = input.value.trim();
    
    if (value.length > 15) {
        status.innerHTML = '<i class="fa-solid fa-check text-green-500"></i>';
        input.style.borderColor = '#10B981';
        
        // Actualizar estado del header
        updateProviderHeader(providerId, true);
    } else if (value.length > 5) {
        status.innerHTML = '<i class="fa-solid fa-clock text-yellow-500"></i>';
        input.style.borderColor = '#F59E0B';
        updateProviderHeader(providerId, false);
    } else {
        status.innerHTML = '<i class="fa-solid fa-lock text-gray-400"></i>';
        input.style.borderColor = '#D1D5DB';
        updateProviderHeader(providerId, false);
    }
}

function saveCredential(inputId, providerId) {
    const input = document.getElementById(inputId);
    const value = input.value.trim();
    
    if (value.length < 10) {
        showToast('warning', 'Credencial incompleta', 'La credencial parece muy corta. Verifica que esté completa.');
        input.focus();
        return;
    }
    
    // Guardar en localStorage para sesiones futuras
    localStorage.setItem(`${providerId}ApiKey`, value);
    
    // Actualizar estado visual
    updateProviderHeader(providerId, true);
    
    // Mostrar mensaje de éxito  
    showToast('success', 'Credencial guardada', `¡Perfecto! Ya puedes usar los mapas de ${providerConfigs[providerId].title.split(' ')[0]}`);
    
    // Intentar abrir el acordeón automáticamente
    setTimeout(() => {
        const opts = document.getElementById(`opts-${providerId}`);
        const header = opts.previousElementSibling;
        
        if (!opts.classList.contains('open')) {
            opts.classList.add('open');
            header.classList.add('active');
            header.querySelector('.arrow').style.transform = 'rotate(180deg)';
        }
        
        // Remover el input después de guardarlo
        setTimeout(() => {
            const container = document.getElementById(`${providerId}InputContainer`);
            if (container) {
                container.style.opacity = '0.5';
                container.style.transform = 'scale(0.95)';
                setTimeout(() => container.remove(), 500);
            }
        }, 1000);
    }, 800);
}

function updateProviderHeader(providerId, isValid) {
    const header = document.getElementById(`header-${providerId}`);
    const subtitle = document.querySelector(`#header-${providerId} + * #${providerId}-subtitle, #${providerId}-subtitle`);
    const lockIcon = document.getElementById(`${providerId}-lock-icon`) || header.querySelector('.arrow');
    
    if (header && isValid) {
        header.classList.remove('opacity-60', 'grayscale');
        if (subtitle) {
            subtitle.innerHTML = '✓ Configurado';
            subtitle.className = subtitle.className.replace(/text-\w+-600/, 'text-green-600');
        }
        if (lockIcon) {
            lockIcon.className = lockIcon.className.replace('fa-lock', 'fa-unlock');
        }
    }
}

function openCredentialInput(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        // Scroll hacia la parte superior del panel donde están los inputs
        const panel = document.getElementById('control-panel');
        const configSection = document.querySelector('.bg-gray-50.p-3.border-b.border-gray-200');
        
        if (configSection && panel) {
            // Asegurar que el panel esté expandido
            const content = document.getElementById('panel-content');
            if (!content.style.maxHeight) {
                content.style.maxHeight = '80vh';
            }
            
            // Scroll suave hacia la sección de configuración
            configSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
            
            // Después de un breve retraso, enfocar y destacar el input
            setTimeout(() => {
                // Enfocar el input
                input.focus();
                
                // Agregar animación de resaltado
                input.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.3)';
                input.style.borderColor = '#3B82F6';
                input.style.transform = 'scale(1.02)';
                input.style.transition = 'all 0.3s ease';
                
                // Remover el resaltado después de un tiempo
                setTimeout(() => {
                    input.style.boxShadow = '';
                    input.style.borderColor = '';
                    input.style.transform = '';
                }, 3000);
                
            }, 600);
        }
    }
}

// Función para forzar recarga de tiles cuando el mapa se ve cortado
function reloadTiles() {
    if (currentTileLayer) {
        currentTileLayer.redraw();
        showToast('info', 'Recargando', 'Forzando recarga de tiles del mapa...');
    }
}

// Función para cambiar calidad de tiles
function toggleTileQuality() {
    if (currentTileLayer && currentTileLayer.options.detectRetina) {
        currentTileLayer.options.detectRetina = false;
        currentTileLayer.options.tileSize = 512;
        currentTileLayer.options.zoomOffset = -1;
        currentTileLayer.redraw();
        showToast('info', 'Calidad HD', 'Activada calidad alta para tiles (puede ser más lento)');
    } else if (currentTileLayer) {
        currentTileLayer.options.detectRetina = true;
        currentTileLayer.options.tileSize = 256;
        currentTileLayer.options.zoomOffset = 0;
        currentTileLayer.redraw();
        showToast('info', 'Calidad normal', 'Calidad estándar para carga rápida');
    }
}

async function generateMapWithAI() {
    const promptText = document.getElementById('aiPrompt').value.trim();
    const btn = document.getElementById('btn-generate-ai');
    const icon = btn.querySelector('i');
    
    if (!promptText) return showToast('warning', 'Campo vacío', 'Escribe algo para mapear.');
    if (!CONFIG.apiKey) return showToast('error', 'API Key faltante', 'Configura tu API Key de Google Gemini en el código.');

    const originalIcon = icon.className;
    icon.className = "fa-solid fa-circle-notch fa-spin";
    btn.disabled = true;

    try {
        const systemPrompt = `Genera CSV (Nombre, Latitud, Longitud) para: "${promptText}". Prioriza Perú. Sin texto extra.`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${CONFIG.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });
        
        const data = await response.json();
        const csv = data.candidates[0].content.parts[0].text.replace(/```csv/g, '').replace(/```/g, '').trim();
        document.getElementById('coordinateInput').value = csv;
        processData(true);
        showToast('success', 'IA Completado', 'Datos generados y graficados exitosamente');
    } catch (e) {
        showToast('error', 'Error de IA', e.message);
    } finally {
        icon.className = originalIcon;
        btn.disabled = false;
    }
}

async function analyzeLocationAI(name, lat, lon) {
    if (!CONFIG.apiKey) {
        showToast('error', 'API Key faltante', 'Configura tu API Key de Google Gemini');
        return;
    }

    const modal = document.getElementById('ai-modal');
    const modalContent = document.getElementById('ai-modal-content');
    const body = document.getElementById('ai-modal-body');
    
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    });

    body.innerHTML = `<div class="text-center py-10"><div class="loader mx-auto mb-4"></div><p class="text-indigo-600 animate-pulse">Consultando a Gemini...</p></div>`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${CONFIG.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Explica qué es "${name}" en ${lat},${lon}. 3 párrafos breves. Historia y Turismo. Español.` }] }]
            })
        });
        const data = await response.json();
        body.innerHTML = marked.parse(data.candidates[0].content.parts[0].text);
    } catch (e) {
        body.innerHTML = `<p class="text-red-500">Error: ${e.message}</p>`;
    }
}

function closeModal() {
    const modal = document.getElementById('ai-modal');
    const content = document.getElementById('ai-modal-content');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// ================================
// PROCESAMIENTO DE DATOS MANUALES
// ================================

function processData(auto = false) {
    const txt = document.getElementById('coordinateInput').value;
    markersLayer.clearLayers();
    let bounds = [];
    
    txt.split('\n').forEach(line => {
        const p = line.split(',');
        if(p.length >= 3) {
            const lat = parseFloat(p[p.length-2]);
            const lon = parseFloat(p[p.length-1]);
            const name = p.slice(0, p.length-2).join(' ');
            
            if(!isNaN(lat)) {
                const m = L.marker([lat, lon]).addTo(markersLayer);
                m.bindPopup(`<div class="font-bold text-indigo-900 mb-1">${name}</div><button onclick="analyzeLocationAI('${name.replace(/'/g,"")}',${lat},${lon})" class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded w-full hover:bg-indigo-200 transition">✨ Info IA</button>`);
                bounds.push([lat, lon]);
            }
        }
    });
    
    document.getElementById('point-counter').innerText = markersLayer.getLayers().length;
    if(bounds.length) map.fitBounds(bounds, {padding: [50,50]});
    if(auto && window.innerWidth < 768) togglePanel();
}

function clearMap() {
    markersLayer.clearLayers();
    document.getElementById('coordinateInput').value = '';
    document.getElementById('point-counter').innerText = '0';
    showToast('info', 'Mapa limpio', 'Se eliminaron todos los marcadores');
}

// ================================
// BÚSQUEDA DE LUGARES
// ================================

let searchMarker = null;

function setupPlaceSearch() {
    const searchInput = document.getElementById('place-search');
    const resultsContainer = document.getElementById('search-results');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 3) {
            resultsContainer.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(() => {
            searchPlaces(query);
        }, 500);
    });

    // Cerrar resultados al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.classList.add('hidden');
        }
    });
}

async function searchPlaces(query) {
    const resultsContainer = document.getElementById('search-results');
    
    try {
        resultsContainer.innerHTML = '<div class="p-3 text-xs text-gray-600 text-center">Buscando...</div>';
        resultsContainer.classList.remove('hidden');

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=pe`,
            {
                headers: {
                    'Accept-Language': 'es',
                    'User-Agent': 'GeoVisorPro/1.0'
                }
            }
        );

        const results = await response.json();
        displaySearchResults(results);

    } catch (error) {
        console.error('Error buscando lugares:', error);
        resultsContainer.innerHTML = '<div class="p-3 text-xs text-red-600 text-center">Error en la búsqueda</div>';
    }
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="p-3 text-xs text-gray-600 text-center">No se encontraron resultados</div>';
        return;
    }

    const resultsHTML = results.map(result => `
        <button onclick="goToPlace(${result.lat}, ${result.lon}, '${result.display_name.replace(/'/g, "\\'")}')" 
                class="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors">
            <div class="text-sm font-medium text-gray-900 truncate">${getPlaceName(result)}</div>
            <div class="text-xs text-gray-600 truncate">${result.display_name}</div>
        </button>
    `).join('');

    resultsContainer.innerHTML = resultsHTML;
}

function getPlaceName(result) {
    // Extraer el nombre principal del lugar
    const parts = result.display_name.split(',');
    return parts[0].trim();
}

function goToPlace(lat, lon, name) {
    // Limpiar marcador anterior
    if (searchMarker) {
        map.removeLayer(searchMarker);
    }

    // Crear nuevo marcador
    searchMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            className: 'custom-search-marker',
            html: `
                <div style="
                    background: linear-gradient(135deg, #3B82F6, #1D4ED8);
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                ">
                    <i class="fa-solid fa-location-dot"></i>
                </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        })
    }).addTo(map);

    // Popup informativo
    searchMarker.bindPopup(`
        <div class="p-2">
            <div class="font-bold text-blue-900 mb-1">📍 ${name}</div>
            <div class="text-xs text-gray-600 mb-2">Resultado de búsqueda</div>
            <div class="text-xs text-gray-500">${lat.toFixed(6)}, ${lon.toFixed(6)}</div>
            <button onclick="clearSearchMarker()" class="mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors">
                Limpiar marcador
            </button>
        </div>
    `).openPopup();

    // Hacer zoom al lugar
    map.setView([lat, lon], 16, {
        animate: true,
        duration: 0.8
    });

    // Ocultar resultados
    document.getElementById('search-results').classList.add('hidden');
    
    showToast('success', 'Lugar encontrado', `Navegando a: ${name}`);
}

function clearSearchMarker() {
    if (searchMarker) {
        map.removeLayer(searchMarker);
        searchMarker = null;
    }
}

// ================================
// FUNCIONALIDADES KML/KMZ
// ================================

async function handleKMLUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    showUploadProgress(true);
    updateProgress(0, files.length, 'Iniciando carga...');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        updateProgress(i + 1, files.length, `Procesando: ${file.name}`);
        
        try {
            await processKMLFile(file);
        } catch (error) {
            console.error(`Error procesando ${file.name}:`, error);
            showToast('error', 'Error de archivo', `No se pudo cargar: ${file.name}`);
        }
    }

    showUploadProgress(false);
    updateKMLFilesInfo();
    
    if (loadedKMLFiles.length > 0) {
        showToast('success', 'Archivos cargados', `${files.length} archivo(s) procesados exitosamente`);
    }

    // Reset input
    event.target.value = '';
}

async function processKMLFile(file) {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileSize = formatFileSize(file.size);
    
    let kmlContent = '';

    if (fileExtension === 'kmz') {
        // Procesar KMZ (archivo ZIP con KML)
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        
        // Buscar archivo KML dentro del ZIP
        const kmlFile = Object.keys(zipContent.files).find(name => 
            name.toLowerCase().endsWith('.kml')
        );
        
        if (!kmlFile) {
            throw new Error('No se encontró archivo KML dentro del KMZ');
        }
        
        kmlContent = await zipContent.files[kmlFile].async('string');
    } else if (fileExtension === 'kml') {
        // Procesar KML directamente
        kmlContent = await readFileAsText(file);
    } else {
        throw new Error('Formato de archivo no soportado. Use .kml o .kmz');
    }

    // Limpiar y validar contenido KML
    kmlContent = cleanKMLContent(kmlContent);
    
    // Analizar contenido KML
    const kmlInfo = analyzeKML(kmlContent);
    
    // Crear objeto de archivo KML
    const kmlFile = {
        id: `kml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        fileSize: fileSize,
        color: getNextColor(),
        kmlData: kmlContent,
        kmlInfo: kmlInfo,
        visible: true,
        showPoints: true,
        showLines: true,
        showPolygons: true,
        timestamp: Date.now(),
        layerGroup: null // Se creará cuando se agregue al mapa
    };

    // Agregar a la lista de archivos cargados
    loadedKMLFiles.push(kmlFile);
    
    // Agregar al mapa
    addKMLToMap(kmlFile);
    
    // Agregar a la UI
    addKMLFileToUI(kmlFile);
}

function addKMLToMap(kmlFile) {
    // Crear grupo de capas para este archivo
    const layerGroup = L.layerGroup();
    kmlFile.layerGroup = layerGroup;
    
    // Parsear KML y agregar elementos al mapa
    try {
        const parser = new DOMParser();
        const kml = parser.parseFromString(kmlFile.kmlData, 'text/xml');
        const placemarks = kml.getElementsByTagName('Placemark');
        
        Array.from(placemarks).forEach(placemark => {
            const name = placemark.getElementsByTagName('name')[0]?.textContent || 'Sin nombre';
            const description = placemark.getElementsByTagName('description')[0]?.textContent || '';
            
            // Procesar puntos
            const points = placemark.getElementsByTagName('Point');
            Array.from(points).forEach(point => {
                const coords = point.getElementsByTagName('coordinates')[0]?.textContent;
                if (coords) {
                    const [lng, lat, alt = 0] = coords.trim().split(',').map(Number);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const marker = L.circleMarker([lat, lng], {
                            radius: 8,
                            fillColor: kmlFile.color,
                            color: '#fff',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.8
                        });
                        
                        const popupContent = `
                            <div class="p-2 max-w-sm">
                                <div class="font-bold text-blue-900 mb-2">${name}</div>
                                <div class="text-sm text-gray-700 mb-2">${description}</div>
                                <div class="text-xs text-gray-600 space-y-1">
                                    <div><strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
                                    ${alt > 0 ? `<div><strong>Altitud:</strong> ${alt.toFixed(2)} m</div>` : ''}
                                    <div><strong>Archivo:</strong> ${kmlFile.fileName}</div>
                                </div>
                                <button onclick="zoomToCoordinate(${lat}, ${lng})" class="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">
                                    🎯 Centrar aquí
                                </button>
                            </div>
                        `;
                        
                        marker.bindPopup(popupContent);
                        layerGroup.addLayer(marker);
                    }
                }
            });
            
            // Procesar líneas
            const lineStrings = placemark.getElementsByTagName('LineString');
            Array.from(lineStrings).forEach(lineString => {
                const coords = lineString.getElementsByTagName('coordinates')[0]?.textContent;
                if (coords) {
                    const points = coords.trim().split(/\s+/).map(coord => {
                        const [lng, lat] = coord.split(',').map(Number);
                        return [lat, lng];
                    }).filter(point => !isNaN(point[0]) && !isNaN(point[1]));
                    
                    if (points.length > 1) {
                        // Calcular distancia total
                        let totalDistance = 0;
                        for (let i = 0; i < points.length - 1; i++) {
                            totalDistance += calculateDistance(
                                points[i][0], points[i][1],
                                points[i + 1][0], points[i + 1][1]
                            );
                        }
                        
                        const polyline = L.polyline(points, {
                            color: kmlFile.color,
                            weight: 3,
                            opacity: 0.8
                        });
                        
                        const distanceFormatted = formatDistance(totalDistance);
                        const popupContent = `
                            <div class="p-2 max-w-sm">
                                <div class="font-bold text-purple-900 mb-2">${name}</div>
                                <div class="text-sm text-gray-700 mb-2">${description}</div>
                                <div class="text-xs text-gray-600 space-y-1">
                                    <div><strong>Tipo:</strong> Línea/Ruta</div>
                                    <div><strong>Longitud:</strong> ${distanceFormatted}</div>
                                    <div><strong>Puntos:</strong> ${points.length}</div>
                                    <div><strong>Archivo:</strong> ${kmlFile.fileName}</div>
                                </div>
                                <button onclick="zoomToExtent(${JSON.stringify(points).replace(/"/g, "'")}" class="mt-2 px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors">
                                    🎯 Ver completo
                                </button>
                            </div>
                        `;
                        
                        polyline.bindPopup(popupContent);
                        layerGroup.addLayer(polyline);
                    }
                }
            });
            
            // Procesar polígonos
            const polygons = placemark.getElementsByTagName('Polygon');
            Array.from(polygons).forEach(polygon => {
                const outerBoundary = polygon.getElementsByTagName('outerBoundaryIs')[0] || polygon;
                const coords = outerBoundary.getElementsByTagName('coordinates')[0]?.textContent;
                
                if (coords) {
                    const points = coords.trim().split(/\s+/).map(coord => {
                        const [lng, lat] = coord.split(',').map(Number);
                        return [lat, lng];
                    }).filter(point => !isNaN(point[0]) && !isNaN(point[1]));
                    
                    if (points.length > 2) {
                        // Calcular área
                        const area = calculatePolygonArea(points);
                        const areaFormatted = formatArea(area);
                        
                        // Calcular perímetro
                        let perimeter = 0;
                        for (let i = 0; i < points.length - 1; i++) {
                            perimeter += calculateDistance(
                                points[i][0], points[i][1],
                                points[i + 1][0], points[i + 1][1]
                            );
                        }
                        const perimeterFormatted = formatDistance(perimeter);
                        
                        const poly = L.polygon(points, {
                            color: kmlFile.color,
                            weight: 2,
                            opacity: 0.8,
                            fillColor: kmlFile.color,
                            fillOpacity: 0.3
                        });
                        
                        const popupContent = `
                            <div class="p-2 max-w-sm">
                                <div class="font-bold text-orange-900 mb-2">${name}</div>
                                <div class="text-sm text-gray-700 mb-2">${description}</div>
                                <div class="text-xs text-gray-600 space-y-1">
                                    <div><strong>Tipo:</strong> Polígono</div>
                                    <div><strong>Área:</strong> ${areaFormatted}</div>
                                    <div><strong>Perímetro:</strong> ${perimeterFormatted}</div>
                                    <div><strong>Vértices:</strong> ${points.length}</div>
                                    <div><strong>Archivo:</strong> ${kmlFile.fileName}</div>
                                </div>
                                <button onclick="zoomToExtent(${JSON.stringify(points).replace(/"/g, "'")}" class="mt-2 px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors">
                                    🎯 Ver completo
                                </button>
                            </div>
                        `;
                        
                        poly.bindPopup(popupContent);
                        layerGroup.addLayer(poly);
                    }
                }
            });
        });
        
        // Agregar capa al mapa
        layerGroup.addTo(map);
        
        // Hacer zoom a los elementos si es el primer archivo
        if (loadedKMLFiles.length === 1 && layerGroup.getLayers().length > 0) {
            map.fitBounds(layerGroup.getBounds(), { padding: [50, 50] });
        }
        
    } catch (error) {
        console.error('Error procesando KML para el mapa:', error);
    }
}

function addKMLFileToUI(kmlFile) {
    const container = document.getElementById('kml-files-container');
    
    const fileDiv = document.createElement('div');
    fileDiv.className = 'kml-file-item p-4 border-b border-gray-100';
    fileDiv.id = `kml-file-${kmlFile.id}`;
    
    fileDiv.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
                <div class="w-4 h-4 rounded-full border-2 border-white shadow-sm" style="background-color: ${kmlFile.color}"></div>
                <div>
                    <div class="font-semibold text-sm text-gray-800">${kmlFile.fileName}</div>
                    <div class="text-xs text-gray-500">${kmlFile.fileSize} • ${kmlFile.kmlInfo.totalElements} elementos</div>
                </div>
            </div>
            <div class="flex gap-1">
                <button onclick="toggleKMLVisibility('${kmlFile.id}')" class="p-2 hover:bg-gray-100 rounded transition-colors" title="Toggle visibilidad">
                    <i class="fa-solid fa-eye w-4 h-4 text-gray-600"></i>
                </button>
                <button onclick="removeKMLFile('${kmlFile.id}')" class="p-2 hover:bg-red-100 rounded transition-colors" title="Eliminar">
                    <i class="fa-solid fa-trash w-4 h-4 text-red-600"></i>
                </button>
            </div>
        </div>
        
        <!-- Resumen de elementos -->
        <div class="grid grid-cols-4 gap-2 mb-3">
            <div class="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                <div class="font-bold text-blue-600">${kmlFile.kmlInfo.totalElements}</div>
                <div class="text-xs text-blue-700">Total</div>
            </div>
            <div class="bg-green-50 border border-green-200 rounded p-2 text-center">
                <div class="font-bold text-green-600">${kmlFile.kmlInfo.points}</div>
                <div class="text-xs text-green-700">Puntos</div>
            </div>
            <div class="bg-purple-50 border border-purple-200 rounded p-2 text-center">
                <div class="font-bold text-purple-600">${kmlFile.kmlInfo.lines}</div>
                <div class="text-xs text-purple-700">Líneas</div>
            </div>
            <div class="bg-orange-50 border border-orange-200 rounded p-2 text-center">
                <div class="font-bold text-orange-600">${kmlFile.kmlInfo.polygons}</div>
                <div class="text-xs text-orange-700">Polígonos</div>
            </div>
        </div>
        
        <!-- Totales calculados -->
        ${kmlFile.kmlInfo.totalArea > 0 || kmlFile.kmlInfo.totalDistance > 0 ? `
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div class="text-xs font-semibold text-gray-700 mb-2">📊 Medidas Totales:</div>
                ${kmlFile.kmlInfo.totalArea > 0 ? `
                    <div class="flex justify-between items-center text-xs mb-1">
                        <span class="text-gray-600">🟢 Total Polígonos:</span>
                        <span class="font-bold text-orange-700">${formatArea(kmlFile.kmlInfo.totalArea)}</span>
                    </div>
                ` : ''}
                ${kmlFile.kmlInfo.totalDistance > 0 ? `
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-600">📏 Total Líneas:</span>
                        <span class="font-bold text-purple-700">${formatDistance(kmlFile.kmlInfo.totalDistance)}</span>
                    </div>
                ` : ''}
            </div>
        ` : ''}
        
        <!-- Lista de elementos -->
        ${kmlFile.kmlInfo.measurements.length > 0 ? `
            <div class="space-y-2">
                <div class="text-xs font-semibold text-gray-700">📍 Elementos:</div>
                ${kmlFile.kmlInfo.measurements.slice(0, 5).map((item, index) => `
                    <button onclick="zoomToElement(${JSON.stringify(item.bounds).replace(/"/g, "'")})" 
                            class="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-2 text-left transition-all">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2 min-w-0">
                                ${item.type === 'point' ? '<span class="kml-point text-lg">📍</span>' : ''}
                                ${item.type === 'line' ? '<span class="kml-line text-lg">📏</span>' : ''}
                                ${item.type === 'polygon' ? '<span class="kml-polygon text-lg">🟢</span>' : ''}
                                <span class="text-xs font-medium text-gray-800 truncate">${item.name}</span>
                            </div>
                            <span class="text-xs font-bold text-gray-600 flex-shrink-0">${item.measurement || item.coordinates}</span>
                        </div>
                    </button>
                `).join('')}
                ${kmlFile.kmlInfo.measurements.length > 5 ? `
                    <div class="text-xs text-gray-500 text-center py-2">
                        Y ${kmlFile.kmlInfo.measurements.length - 5} elementos más...
                    </div>
                ` : ''}
            </div>
        ` : ''}
    `;
    
    container.appendChild(fileDiv);
}

function toggleKMLVisibility(fileId) {
    const kmlFile = loadedKMLFiles.find(f => f.id === fileId);
    if (!kmlFile) return;
    
    kmlFile.visible = !kmlFile.visible;
    
    if (kmlFile.visible) {
        kmlFile.layerGroup.addTo(map);
    } else {
        map.removeLayer(kmlFile.layerGroup);
    }
    
    // Actualizar ícono
    const button = document.querySelector(`#kml-file-${fileId} button[onclick*="toggleKMLVisibility"]`);
    const icon = button.querySelector('i');
    
    if (kmlFile.visible) {
        icon.className = 'fa-solid fa-eye w-4 h-4 text-gray-600';
        button.title = 'Ocultar';
    } else {
        icon.className = 'fa-solid fa-eye-slash w-4 h-4 text-gray-400';
        button.title = 'Mostrar';
    }
}

function removeKMLFile(fileId) {
    const index = loadedKMLFiles.findIndex(f => f.id === fileId);
    if (index === -1) return;
    
    const kmlFile = loadedKMLFiles[index];
    
    // Remover del mapa
    if (kmlFile.layerGroup) {
        map.removeLayer(kmlFile.layerGroup);
    }
    
    // Remover de la lista
    loadedKMLFiles.splice(index, 1);
    
    // Remover de la UI
    const element = document.getElementById(`kml-file-${fileId}`);
    if (element) element.remove();
    
    updateKMLFilesInfo();
    showToast('info', 'Archivo eliminado', `${kmlFile.fileName} ha sido removido del mapa`);
}

function clearAllKMLFiles() {
    if (loadedKMLFiles.length === 0) return;
    
    // Remover todas las capas del mapa
    loadedKMLFiles.forEach(kmlFile => {
        if (kmlFile.layerGroup) {
            map.removeLayer(kmlFile.layerGroup);
        }
    });
    
    // Limpiar array
    const count = loadedKMLFiles.length;
    loadedKMLFiles = [];
    
    // Limpiar UI
    document.getElementById('kml-files-container').innerHTML = '';
    updateKMLFilesInfo();
    
    showToast('info', 'Archivos eliminados', `Se removieron ${count} archivo(s) del mapa`);
}

// ================================
// UTILIDADES KML
// ================================

function cleanKMLContent(content) {
    let cleaned = content
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
    
    // Agregar namespace xsi si falta
    const hasXsiSchemaLocation = cleaned.includes('xsi:schemaLocation');
    const hasXsiNamespace = cleaned.includes('xmlns:xsi=');
    
    if (hasXsiSchemaLocation && !hasXsiNamespace) {
        cleaned = cleaned.replace(
            /<kml([^>]*)>/,
            '<kml$1 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        );
    }
    
    return cleaned.replace(/^(?!\<\?xml)/, '<?xml version="1.0" encoding="UTF-8"?>\n');
}

function analyzeKML(kmlContent) {
    try {
        const parser = new DOMParser();
        const kml = parser.parseFromString(kmlContent, 'text/xml');
        
        const parserError = kml.querySelector('parsererror');
        if (parserError) {
            throw new Error('XML mal formado');
        }

        const kmlElement = kml.getElementsByTagName('kml')[0];
        if (!kmlElement) {
            throw new Error('No se encontró elemento raíz <kml>');
        }

        const placemarks = kml.getElementsByTagName('Placemark');
        
        const info = {
            totalElements: placemarks.length,
            points: 0,
            lines: 0,
            polygons: 0,
            measurements: [],
            totalArea: 0,
            totalDistance: 0
        };

        Array.from(placemarks).forEach(placemark => {
            const name = placemark.getElementsByTagName('name')[0]?.textContent || 'Sin nombre';
            const description = placemark.getElementsByTagName('description')[0]?.textContent || '';
            
            const hasPoint = placemark.getElementsByTagName('Point').length > 0;
            const hasLineString = placemark.getElementsByTagName('LineString').length > 0;
            const hasPolygon = placemark.getElementsByTagName('Polygon').length > 0;
            
            if (hasPoint) {
                info.points++;
                const coords = placemark.getElementsByTagName('coordinates')[0]?.textContent;
                if (coords) {
                    const [lng, lat] = coords.trim().split(',').map(Number);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        info.measurements.push({
                            name,
                            type: 'point',
                            coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                            description,
                            bounds: [{lat, lng}]
                        });
                    }
                }
            }
            
            if (hasLineString) {
                info.lines++;
                const coords = placemark.getElementsByTagName('coordinates')[0]?.textContent;
                if (coords) {
                    const points = coords.trim().split(/\s+/).map(coord => {
                        const [lng, lat] = coord.split(',').map(Number);
                        return {lat, lng};
                    }).filter(point => !isNaN(point.lat) && !isNaN(point.lng));
                    
                    if (points.length > 1) {
                        let distance = 0;
                        for (let i = 0; i < points.length - 1; i++) {
                            distance += calculateDistance(
                                points[i].lat, points[i].lng,
                                points[i + 1].lat, points[i + 1].lng
                            );
                        }
                        info.totalDistance += distance;
                        
                        info.measurements.push({
                            name,
                            type: 'line',
                            measurement: formatDistance(distance),
                            description,
                            bounds: points
                        });
                    }
                }
            }
            
            if (hasPolygon) {
                info.polygons++;
                const coords = placemark.getElementsByTagName('coordinates')[0]?.textContent;
                if (coords) {
                    const points = coords.trim().split(/\s+/).map(coord => {
                        const [lng, lat] = coord.split(',').map(Number);
                        return {lat, lng};
                    }).filter(point => !isNaN(point.lat) && !isNaN(point.lng));
                    
                    if (points.length > 2) {
                        const area = calculatePolygonArea(points.map(p => [p.lat, p.lng]));
                        info.totalArea += area;
                        
                        info.measurements.push({
                            name,
                            type: 'polygon',
                            measurement: formatArea(area),
                            description,
                            bounds: points
                        });
                    }
                }
            }
        });

        return info;
    } catch (error) {
        console.error('Error analizando KML:', error);
        throw error;
    }
}

// ================================
// CÁLCULOS GEOGRÁFICOS
// ================================

// Calcular distancia entre dos puntos (fórmula Haversine)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
}

// Calcular área de polígono usando la fórmula del área geodésica
function calculatePolygonArea(points) {
    if (points.length < 3) return 0;

    const R = 6371000; // Radio de la Tierra en metros
    let area = 0;

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        const φ1 = (p1[0] * Math.PI) / 180;
        const φ2 = (p2[0] * Math.PI) / 180;
        const Δλ = ((p2[1] - p1[1]) * Math.PI) / 180;

        area += Δλ * (2 + Math.sin(φ1) + Math.sin(φ2));
    }

    area = Math.abs((area * R * R) / 2.0);
    return area; // Área en metros cuadrados
}

// Formatear distancia
function formatDistance(meters) {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(2)} m`;
}

// Formatear área
function formatArea(squareMeters) {
    const hectares = squareMeters / 10000;
    if (hectares >= 1) {
        return `${hectares.toFixed(2)} ha`;
    }
    return `${squareMeters.toFixed(2)} m²`;
}

// Funciones de zoom
function zoomToCoordinate(lat, lng) {
    map.setView([lat, lng], 18, {
        animate: true,
        duration: 0.5
    });
}

function zoomToExtent(points) {
    if (points && points.length > 0) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 16,
            animate: true,
            duration: 0.5
        });
    }
}

function zoomToElement(bounds) {
    if (!bounds || bounds.length === 0) return;
    
    if (bounds.length === 1) {
        // Para puntos individuales
        zoomToCoordinate(bounds[0].lat, bounds[0].lng);
    } else {
        // Para líneas y polígonos
        const leafletBounds = L.latLngBounds(bounds.map(p => [p.lat, p.lng]));
        map.fitBounds(leafletBounds, {
            padding: [50, 50],
            maxZoom: 16,
            animate: true,
            duration: 0.5
        });
    }
}

// ================================
// UTILIDADES GENERALES
// ================================

function getNextColor() {
    const color = CONFIG.colorPalette[currentColorIndex % CONFIG.colorPalette.length];
    currentColorIndex++;
    return color;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Error leyendo archivo'));
        reader.readAsText(file);
    });
}

function showUploadProgress(show) {
    const progressDiv = document.getElementById('kml-upload-progress');
    if (show) {
        progressDiv.classList.remove('hidden');
    } else {
        progressDiv.classList.add('hidden');
    }
}

function updateProgress(current, total, text) {
    document.getElementById('progress-text').textContent = text;
    document.getElementById('progress-count').textContent = `${current}/${total}`;
    const percentage = (current / total) * 100;
    document.getElementById('progress-fill').style.width = `${percentage}%`;
}

function updateKMLFilesInfo() {
    const infoDiv = document.getElementById('kml-files-info');
    const countSpan = document.getElementById('files-count');
    
    if (loadedKMLFiles.length > 0) {
        infoDiv.classList.remove('hidden');
        countSpan.textContent = loadedKMLFiles.length;
    } else {
        infoDiv.classList.add('hidden');
    }
}

// ================================
// EXPORTACIÓN A PDF A3
// ================================

async function exportToPDF() {
    if (loadedKMLFiles.length === 0) {
        showToast('warning', 'Sin archivos', 'Carga primero archivos KML/KMZ para exportar');
        return;
    }

    try {
        showToast('info', 'Generando PDF', 'Preparando plano A3 horizontal...');
        
        // Crear instancia jsPDF en formato A3 horizontal
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape', // Horizontal
            unit: 'mm',
            format: 'a3' // A3: 420 x 297 mm
        });

        // Dimensiones A3 horizontal: 420mm x 297mm
        const pageWidth = 420;
        const pageHeight = 297;
        
        // Configurar fuentes y colores
        pdf.setFont('helvetica');
        
        // ========== TÍTULO PRINCIPAL ==========
        pdf.setFontSize(20);
        pdf.setTextColor(30, 64, 175); // Azul
        pdf.text('PLANO GEOGRÁFICO - POLÍGONOS Y COORDENADAS', pageWidth/2, 20, { align: 'center' });
        
        // Línea decorativa
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(59, 130, 246);
        pdf.line(20, 25, pageWidth-20, 25);

        // ========== DIVISIÓN EN DOS COLUMNAS ==========
        const leftColumnWidth = (pageWidth - 60) * 0.6; // 60% para mapa
        const rightColumnWidth = (pageWidth - 60) * 0.4; // 40% para coordenadas
        const leftColumnX = 20;
        const rightColumnX = leftColumnX + leftColumnWidth + 20;
        const contentStartY = 35;

        // ========== COLUMNA IZQUIERDA: MAPA ==========
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('VISTA DEL MAPA', leftColumnX, contentStartY);
        
        // Dibujar borde para el área del mapa
        const mapAreaY = contentStartY + 5;
        const mapAreaHeight = pageHeight - mapAreaY - 20;
        
        pdf.setLineWidth(1);
        pdf.setDrawColor(128, 128, 128);
        pdf.rect(leftColumnX, mapAreaY, leftColumnWidth, mapAreaHeight);

        // Preparar el mapa para captura solo de polígonos (sin mapa base)
        const panel = document.getElementById('control-panel');
        const toasts = document.getElementById('toast-container');
        const originalPanelDisplay = panel.style.display;
        const originalToastsDisplay = toasts.style.display;
        
        panel.style.display = 'none';
        toasts.style.display = 'none';

        // Guardar la vista original del mapa para restaurarla después
        const originalCenter = map.getCenter();
        const originalZoom = map.getZoom();

        // Encontrar todos los polígonos cargados y hacer zoom automático
        const allPolygonBounds = [];
        let hasPolygons = false;
        
        map.eachLayer((layer) => {
            if (layer instanceof L.Polygon || layer instanceof L.GeoJSON) {
                try {
                    const bounds = layer.getBounds();
                    if (bounds && bounds.isValid()) {
                        allPolygonBounds.push(bounds);
                        hasPolygons = true;
                    }
                } catch (e) {
                    console.warn('Error obteniendo bounds de capa:', e);
                }
            }
        });

        // Si hay polígonos, hacer zoom automático para llenar la vista
        if (hasPolygons && allPolygonBounds.length > 0) {
            const group = new L.featureGroup();
            allPolygonBounds.forEach(bounds => {
                group.addLayer(L.rectangle(bounds));
            });
            
            // Zoom un poco más lejano para polígono ligeramente más pequeño
            map.fitBounds(group.getBounds(), { 
                padding: [35, 35], // Padding un poco mayor para polígono más pequeño
                maxZoom: 18 // Zoom ligeramente más lejano
            });
        }

        // Ocultar temporalmente todas las capas base del mapa
        const mapContainer = document.getElementById('map');
        const tileLayersToHide = [];
        
        // Encontrar y ocultar todas las capas de tiles (mapa base)
        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                tileLayersToHide.push({
                    layer: layer,
                    originalOpacity: layer.options.opacity || 1
                });
                layer.setOpacity(0); // Hacer invisible la capa base
            }
        });

        // Establecer fondo BLANCO con cuadrículas GRANDES
        const originalMapBackground = mapContainer.style.backgroundColor;
        const originalMapImage = mapContainer.style.backgroundImage;
        const originalMapSize = mapContainer.style.backgroundSize;
        
        // Fondo blanco con cuadrículas grandes
        const gridSize = 120; // Cuadrículas MUY GRANDES
        mapContainer.style.backgroundColor = '#ffffff'; // Fondo completamente blanco
        mapContainer.style.backgroundImage = `
            linear-gradient(to right, #d1d5db 1px, transparent 1px),
            linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
        `;
        mapContainer.style.backgroundSize = `${gridSize}px ${gridSize}px`;
        mapContainer.style.backgroundPosition = '0 0, 0 0';

        // Forzar re-renderizado y esperar MÁS TIEMPO para que se rendericen las cuadrículas
        map.invalidateSize();
        await new Promise(resolve => setTimeout(resolve, 3000)); // MÁS tiempo para renderizar cuadrículas

        try {
            const mapElement = document.getElementById('map');
            
            // Obtener dimensiones reales del contenedor del mapa
            const mapRect = mapElement.getBoundingClientRect();
            const mapWidth = mapRect.width;
            const mapHeight = mapRect.height;
            const mapAspectRatio = mapWidth / mapHeight;
            
            // Capturar con configuración MEJORADA para cuadrículas CSS
            const canvas = await html2canvas(mapElement, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff', // Fondo blanco puro
                scale: 2,
                width: mapWidth,
                height: mapHeight,
                logging: false,
                imageTimeout: 5000, // MÁS tiempo para cargar
                removeContainer: false,
                foreign: true,
                svgRendering: true,
                useCORS: true,
                allowTaint: true,
                ignoreElements: function(element) {
                    // No ignorar ningún elemento para capturar las cuadrículas
                    return false;
                },
                onclone: function(clonedDoc) {
                    const clonedMap = clonedDoc.getElementById('map');
                    if (clonedMap) {
                        // Fondo blanco con cuadrículas grandes
                        clonedMap.style.backgroundColor = '#ffffff';
                        clonedMap.style.backgroundImage = `
                            linear-gradient(to right, #d1d5db 1px, transparent 1px),
                            linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
                        `;
                        clonedMap.style.backgroundSize = '120px 120px';
                        clonedMap.style.backgroundPosition = '0 0, 0 0';
                        
                        // Ocultar capas de tiles
                        const tileLayers = clonedMap.querySelectorAll('.leaflet-tile-pane');
                        tileLayers.forEach(layer => {
                            layer.style.display = 'none';
                        });
                    }
                }
            });

            // Restaurar las capas base del mapa
            tileLayersToHide.forEach(layerInfo => {
                layerInfo.layer.setOpacity(layerInfo.originalOpacity);
            });
            
            // Restaurar fondo original y limpiar estilos de cuadrícula
            mapContainer.style.backgroundColor = originalMapBackground;
            mapContainer.style.backgroundImage = originalMapImage;
            mapContainer.style.backgroundSize = originalMapSize;
            mapContainer.style.backgroundPosition = '';
            map.setView(originalCenter, originalZoom); // Restaurar vista original
            panel.style.display = originalPanelDisplay;
            toasts.style.display = originalToastsDisplay;

            // Polígono GRANDE en el PDF sin cortes
            if (canvas.width > 0 && canvas.height > 0) {
                const availableWidth = leftColumnWidth - 6;
                const availableHeight = mapAreaHeight - 6;
                
                let finalWidth, finalHeight, finalX, finalY;
                
                // Hacer el polígono GRANDE usando todo el espacio disponible
                const canvasAspectRatio = canvas.width / canvas.height;
                const availableAspectRatio = availableWidth / availableHeight;
                
                if (canvasAspectRatio > availableAspectRatio) {
                    // Usar todo el ancho disponible
                    finalWidth = availableWidth;
                    finalHeight = availableWidth / canvasAspectRatio;
                } else {
                    // Usar toda la altura disponible 
                    finalHeight = availableHeight;
                    finalWidth = availableHeight * canvasAspectRatio;
                }
                
                // Centrar pero asegurando que se vea completo
                finalX = leftColumnX + (leftColumnWidth - finalWidth) / 2;
                finalY = mapAreaY + (mapAreaHeight - finalHeight) / 2;
                
                // Márgenes mínimos para que no se corte
                if (finalX < leftColumnX + 3) finalX = leftColumnX + 3;
                if (finalY < mapAreaY + 3) finalY = mapAreaY + 3;
                if (finalX + finalWidth > leftColumnX + leftColumnWidth - 3) {
                    finalWidth = leftColumnX + leftColumnWidth - 3 - finalX;
                    finalHeight = finalWidth / canvasAspectRatio;
                }
                if (finalY + finalHeight > mapAreaY + mapAreaHeight - 3) {
                    finalHeight = mapAreaY + mapAreaHeight - 3 - finalY;
                    finalWidth = finalHeight * canvasAspectRatio;
                }
                
                const mapDataURL = canvas.toDataURL('image/png', 0.98);
                pdf.addImage(mapDataURL, 'PNG', finalX, finalY, finalWidth, finalHeight);
                
                // Agregar borde sutil alrededor del área de polígonos
                pdf.setLineWidth(0.3);
                pdf.setDrawColor(200, 200, 200);
                pdf.rect(finalX - 1, finalY - 1, finalWidth + 2, finalHeight + 2);
                
                // Agregar información de escala
                pdf.setFontSize(7);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`Polígono grande y centrado (${finalWidth.toFixed(0)}x${finalHeight.toFixed(0)}mm)`, 
                         finalX, finalY + finalHeight + 8);
                
            } else {
                throw new Error('Canvas vacío');
            }

        } catch (mapError) {
            console.error('Error capturando polígonos:', mapError);
            
            // Restaurar en caso de error
            tileLayersToHide.forEach(layerInfo => {
                layerInfo.layer.setOpacity(layerInfo.originalOpacity);
            });
            mapContainer.style.backgroundColor = originalMapBackground;
            map.setView(originalCenter, originalZoom);
            panel.style.display = originalPanelDisplay;
            toasts.style.display = originalToastsDisplay;
            
            // Captura de respaldo sin zoom automático
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                const mapElement = document.getElementById('map');
                const mapRect = mapElement.getBoundingClientRect();
                
                const fallbackCanvas = await html2canvas(mapElement, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    width: mapRect.width,
                    height: mapRect.height,
                    logging: false
                });
                
                if (fallbackCanvas.width > 0 && fallbackCanvas.height > 0) {
                    const canvasAspectRatio = fallbackCanvas.width / fallbackCanvas.height;
                    const availableWidth = leftColumnWidth - 6; // Margen pequeño para polígono grande en respaldo
                    const availableHeight = mapAreaHeight - 6;
                    const availableAspectRatio = availableWidth / availableHeight;
                    
                    let backupWidth, backupHeight, backupX, backupY;
                    
                    if (canvasAspectRatio > availableAspectRatio) {
                        // Limitar por ancho
                        backupWidth = availableWidth;
                        backupHeight = availableWidth / canvasAspectRatio;
                    } else {
                        // Limitar por altura
                        backupHeight = availableHeight;
                        backupWidth = availableHeight * canvasAspectRatio;
                    }
                    
                    // Centrar perfectamente
                    backupX = leftColumnX + (leftColumnWidth - backupWidth) / 2;
                    backupY = mapAreaY + (mapAreaHeight - backupHeight) / 2;
                    
                    // Verificar límites mínimos
                    const minMargin = 3;
                    if (backupX < leftColumnX + minMargin) backupX = leftColumnX + minMargin;
                    if (backupY < mapAreaY + minMargin) backupY = mapAreaY + minMargin;
                    
                    const mapDataURL = fallbackCanvas.toDataURL('image/png', 0.9);
                    pdf.addImage(mapDataURL, 'PNG', backupX, backupY, backupWidth, backupHeight);
                } else {
                    throw new Error('Captura de respaldo falló');
                }
            } catch (fallbackError) {
                console.error('Error en captura de respaldo:', fallbackError);
                pdf.setFontSize(10);
                pdf.setTextColor(255, 0, 0);
                pdf.text('Error: No se pudieron capturar los polígonos', leftColumnX + 5, mapAreaY + 20);
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);
                pdf.text('Verifique que los archivos KML estén cargados correctamente', leftColumnX + 5, mapAreaY + 30);
            }
        }

        // ========== COLUMNA DERECHA: COORDENADAS DE POLÍGONOS ==========
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('COORDENADAS DE POLÍGONOS', rightColumnX, contentStartY);
        
        let currentY = contentStartY + 10;
        
        // Extraer y mostrar coordenadas de cada polígono
        loadedKMLFiles.forEach((file, fileIndex) => {
            // Filtrar solo polígonos
            const polygonElements = file.kmlInfo.measurements.filter(m => m.type === 'polygon');
            
            if (polygonElements.length > 0) {
                // Título del archivo
                pdf.setFontSize(11);
                pdf.setTextColor(30, 64, 175);
                
                // Verificar si hay espacio suficiente
                if (currentY > pageHeight - 40) {
                    pdf.addPage();
                    currentY = 30;
                    pdf.text('COORDENADAS DE POLÍGONOS (Continuación)', rightColumnX, 20);
                    currentY = 35;
                }
                
                pdf.text(`${fileIndex + 1}. ${file.fileName}`, rightColumnX, currentY);
                currentY += 6;

                polygonElements.forEach((polygon, polyIndex) => {
                    // Verificar espacio antes de cada polígono
                    if (currentY > pageHeight - 50) {
                        pdf.addPage();
                        currentY = 30;
                    }

                    // Nombre del polígono
                    pdf.setFontSize(10);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text(`📐 ${polygon.name}`, rightColumnX + 5, currentY);
                    pdf.setFontSize(8);
                    pdf.setTextColor(100, 100, 100);
                    pdf.text(`Área: ${polygon.measurement}`, rightColumnX + 5, currentY + 3);
                    currentY += 8;

                    // Coordenadas del polígono
                    if (polygon.bounds && polygon.bounds.length > 0) {
                        pdf.setFontSize(7);
                        pdf.setTextColor(0, 0, 0);
                        
                        // Encabezado de tabla
                        pdf.text('Punto', rightColumnX + 8, currentY);
                        pdf.text('Latitud', rightColumnX + 30, currentY);
                        pdf.text('Longitud', rightColumnX + 65, currentY);
                        currentY += 3;
                        
                        // Línea separadora
                        pdf.setLineWidth(0.2);
                        pdf.setDrawColor(200, 200, 200);
                        pdf.line(rightColumnX + 8, currentY, rightColumnX + 95, currentY);
                        currentY += 2;

                        // Listar coordenadas (máximo 20 puntos para no sobrecargar)
                        const pointsToShow = polygon.bounds.slice(0, 20);
                        pointsToShow.forEach((coord, coordIndex) => {
                            // Verificar espacio para cada coordenada
                            if (currentY > pageHeight - 15) {
                                pdf.addPage();
                                currentY = 20;
                                
                                // Repetir encabezados en nueva página
                                pdf.setFontSize(7);
                                pdf.text('Punto', rightColumnX + 8, currentY);
                                pdf.text('Latitud', rightColumnX + 30, currentY);
                                pdf.text('Longitud', rightColumnX + 65, currentY);
                                currentY += 5;
                            }

                            pdf.setFontSize(6);
                            pdf.setTextColor(0, 0, 0);
                            pdf.text(`${coordIndex + 1}`, rightColumnX + 8, currentY);
                            pdf.text(`${coord.lat.toFixed(6)}`, rightColumnX + 30, currentY);
                            pdf.text(`${coord.lng.toFixed(6)}`, rightColumnX + 65, currentY);
                            currentY += 3;
                        });

                        if (polygon.bounds.length > 20) {
                            pdf.setFontSize(6);
                            pdf.setTextColor(128, 128, 128);
                            pdf.text(`... y ${polygon.bounds.length - 20} puntos más`, rightColumnX + 8, currentY);
                            currentY += 3;
                        }
                        
                        currentY += 3; // Espacio entre polígonos
                    }
                });
                
                currentY += 5; // Espacio entre archivos
            }
        });

        // Si no hay polígonos, mostrar mensaje
        if (!loadedKMLFiles.some(file => file.kmlInfo.measurements.some(m => m.type === 'polygon'))) {
            pdf.setFontSize(10);
            pdf.setTextColor(255, 100, 100);
            pdf.text('No se encontraron polígonos en los archivos cargados.', rightColumnX, contentStartY + 20);
            pdf.text('Este plano está diseñado específicamente para mostrar', rightColumnX, contentStartY + 30);
            pdf.text('las coordenadas de polígonos.', rightColumnX, contentStartY + 40);
        }

        // ========== PIE DE PÁGINA ==========
        const footerY = pageHeight - 10;
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Generado el ${new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, 20, footerY);
        
        pdf.text('GeoVisor Pro - Plano A3 con Coordenadas de Polígonos', pageWidth - 20, footerY, { align: 'right' });

        // ========== GUARDAR PDF ==========
        const fileName = `Plano_Poligonos_Coordenadas_${new Date().toISOString().slice(0,10)}.pdf`;
        pdf.save(fileName);
        
        showToast('success', 'PDF Generado', `Plano A3 con coordenadas guardado como: ${fileName}`);

    } catch (error) {
        console.error('Error generando PDF:', error);
        showToast('error', 'Error PDF', 'No se pudo generar el plano PDF');
    }
}

// Función auxiliar para convertir hex a RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

// ================================
// SISTEMA DE NOTIFICACIONES TOAST
// ================================

function showToast(type, title, message, duration = 4000) {
    const container = document.getElementById('toast-container');
    
    // Limitar número de toasts visibles
    const existingToasts = container.querySelectorAll('.toast-notification');
    if (existingToasts.length >= 2) {
        existingToasts[0].remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type} text-white p-4 rounded-lg shadow-lg max-w-sm`;
    
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle', 
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="flex items-start gap-3">
            <i class="fa-solid ${iconMap[type]} text-lg flex-shrink-0 mt-0.5"></i>
            <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm">${title}</div>
                ${message ? `<div class="text-xs opacity-90 mt-1">${message}</div>` : ''}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white/80 hover:text-white text-lg leading-none">×</button>
        </div>
    `;
    
    container.appendChild(toast);

    // Auto-remove después del tiempo especificado
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
}

// ================================
// GUÍAS DE OBTENCIÓN DE API KEYS
// ================================

function showApiKeyGuide(providerId) {
    const guides = {
        mapbox: {
            title: 'Mapbox API Key',
            icon: 'fa-brands fa-mapbox',
            steps: [
                {
                    title: '1. Crear Cuenta en Mapbox',
                    content: 'Ve a <a href="https://account.mapbox.com/auth/signup/" target="_blank" class="text-blue-600 hover:text-blue-800 font-medium">mapbox.com/signup</a> y crea tu cuenta gratuita.',
                    icon: 'fa-user-plus'
                },
                {
                    title: '2. Confirmar Email',
                    content: 'Revisa tu correo y confirma tu cuenta haciendo clic en el enlace de verificación.',
                    icon: 'fa-envelope-circle-check'
                },
                {
                    title: '3. Acceder al Dashboard',
                    content: 'Una vez confirmado, inicia sesión y ve a tu Dashboard en <a href="https://account.mapbox.com/" target="_blank" class="text-blue-600 hover:text-blue-800 font-medium">account.mapbox.com</a>',
                    icon: 'fa-gauge-high'
                },
                {
                    title: '4. Obtener Token',
                    content: 'En la sección "Access Tokens", encontrarás tu <strong>Default Public Token</strong>. Este es tu API Key - cópialo.',
                    icon: 'fa-key',
                    highlight: true
                },
                {
                    title: '5. Usar en la Aplicación',
                    content: 'Pega tu token en el campo "Mapbox API Key" de esta aplicación y ¡listo! Ya puedes usar todos los mapas de Mapbox.',
                    icon: 'fa-paste'
                }
            ],
            note: 'Mapbox ofrece 50,000 vistas gratuitas al mes. Tu API Key es completamente gratuita para uso personal.',
            color: 'blue'
        },
        here: {
            title: 'HERE Maps API Key',
            icon: 'fa-solid fa-location-dot',  
            steps: [
                {
                    title: '1. Crear Cuenta HERE',
                    content: 'Ve a <a href="https://developer.here.com/sign-up" target="_blank" class="text-green-600 hover:text-green-800 font-medium">developer.here.com/sign-up</a> y regístrate como desarrollador.',
                    icon: 'fa-user-plus'
                },
                {
                    title: '2. Verificar Account',
                    content: 'Confirma tu email y completa el proceso de verificación de desarrollador.',
                    icon: 'fa-shield-check'
                },
                {
                    title: '3. Crear Proyecto',
                    content: 'En el Developer Portal, ve a "Projects & Apps" y crea un nuevo proyecto.',
                    icon: 'fa-plus-circle'
                },
                {
                    title: '4. Generar API Key',
                    content: 'Dentro de tu proyecto, ve a la sección "API Keys" y genera una nueva API Key para "Maps API".',
                    icon: 'fa-key',
                    highlight: true
                },
                {
                    title: '5. Configurar Permisos',
                    content: 'Asegúrate de que la API Key tenga permisos para "Map Tile API" y "Map Image API".',
                    icon: 'fa-cog'
                },
                {
                    title: '6. Usar API Key',
                    content: 'Copia tu API Key y pégala en el campo "HERE API Key" de esta aplicación.',
                    icon: 'fa-paste'
                }
            ],
            note: 'HERE ofrece 250,000 transacciones gratuitas al mes para nuevas cuentas. Ideal para aplicaciones de mapas.',
            color: 'green'
        },
        stamen: {
            title: 'Stamen Maps (Stadia Maps)',
            icon: 'fa-solid fa-palette',
            steps: [
                {
                    title: '1. Ir a Stadia Maps',
                    content: 'Stamen Maps ahora es parte de Stadia Maps. Ve a <a href="https://client.stadiamaps.com/signup/" target="_blank" class="text-purple-600 hover:text-purple-800 font-medium">stadiamaps.com/signup</a>',
                    icon: 'fa-external-link'
                },
                {
                    title: '2. Crear Cuenta Gratuita',
                    content: 'Regístrate con tu email. No necesitas tarjeta de crédito para la cuenta gratuita.',
                    icon: 'fa-user-plus'
                },
                {
                    title: '3. Verificar Email',
                    content: 'Confirma tu email haciendo clic en el enlace de verificación.',
                    icon: 'fa-envelope-open'
                },
                {
                    title: '4. Crear Propiedad',
                    content: 'En el dashboard, crea una nueva "Property" para tu aplicación web.',
                    icon: 'fa-plus'
                },
                {
                    title: '5. Obtener API Key',
                    content: 'Una vez creada la propiedad, encontrarás tu API Key en la sección de configuración.',
                    icon: 'fa-key',
                    highlight: true
                },
                {
                    title: '6. Usar en Mapas',
                    content: 'Copia la API Key y úsala en el campo "Stamen API Key" para acceder a los hermosos estilos de Stamen.',
                    icon: 'fa-map'
                }
            ],
            note: 'Stadia Maps ofrece 20,000 vistas de mapa gratuitas al mes. Los mapas Stamen tienen diseños únicos y artísticos.',
            color: 'purple'
        },
        thunderforest: {
            title: 'Thunderforest API Key',
            icon: 'fa-solid fa-bolt',
            steps: [
                {
                    title: '1. Registrarse en Thunderforest',
                    content: 'Ve a <a href="https://www.thunderforest.com/pricing/" target="_blank" class="text-orange-600 hover:text-orange-800 font-medium">thunderforest.com</a> y haz clic en "Sign up for free".',
                    icon: 'fa-user-plus'
                },
                {
                    title: '2. Crear Account',
                    content: 'Completa el formulario de registro con tu información. El plan gratuito no requiere tarjeta.',
                    icon: 'fa-id-card'
                },
                {
                    title: '3. Verificar Email',
                    content: 'Revisa tu correo y haz clic en el enlace de confirmación para activar tu cuenta.',
                    icon: 'fa-at'
                },
                {
                    title: '4. API Dashboard',
                    content: 'Inicia sesión y ve a tu API dashboard en <a href="https://www.thunderforest.com/account/api/" target="_blank" class="text-orange-600 hover:text-orange-800 font-medium">thunderforest.com/account/api/</a>',
                    icon: 'fa-tachometer-alt'
                },
                {
                    title: '5. Copiar API Key',
                    content: 'En el dashboard encontrarás tu API Key. Cópiala - esta será tu clave de acceso.',
                    icon: 'fa-key',
                    highlight: true
                },
                {
                    title: '6. Activar Mapas',
                    content: 'Usa tu API Key en el campo "Thunderforest API Key" para acceder a mapas especializados como OpenCycleMap y más.',
                    icon: 'fa-bicycle'
                }
            ],
            note: 'Thunderforest ofrece 150,000 tiles gratuitas al mes. Especializado en mapas temáticos como ciclismo, senderismo y transporte.',
            color: 'orange'
        }
    };

    const guide = guides[providerId];
    if (!guide) return;

    const modal = document.getElementById('api-guide-modal');
    const content = document.getElementById('api-guide-content');  
    const title = document.getElementById('api-guide-title');
    const body = document.getElementById('api-guide-body');

    // Actualizar título
    title.innerHTML = `<i class="${guide.icon}"></i> ${guide.title}`;

    // Generar contenido de pasos
    let stepsHTML = `
        <div class="mb-6">
            <div class="bg-${guide.color}-50 border-l-4 border-${guide.color}-400 p-4 mb-4 rounded-r-lg">
                <div class="flex">
                    <div class="ml-3">
                        <p class="text-sm text-${guide.color}-800">
                            <strong>Guía paso a paso:</strong> Obtén tu API Key ${guide.title} completamente gratis siguiendo estos pasos.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="space-y-4">
    `;

    guide.steps.forEach(step => {
        const highlightClass = step.highlight ? `border-l-4 border-${guide.color}-400 bg-${guide.color}-50 pl-4` : '';
        stepsHTML += `
            <div class="flex items-start space-x-3 ${highlightClass} ${step.highlight ? 'py-3 rounded-r-lg' : ''}">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 rounded-full bg-${guide.color}-100 flex items-center justify-center">
                        <i class="${step.icon} text-${guide.color}-600"></i>
                    </div>
                </div>
                <div class="flex-grow">
                    <h4 class="font-semibold text-gray-900 mb-1">${step.title}</h4>
                    <p class="text-gray-700 text-sm leading-relaxed">${step.content}</p>
                </div>
            </div>
        `;
    });

    stepsHTML += `
        </div>
        
        <div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-start">
                <i class="fa-solid fa-lightbulb text-green-600 mt-0.5 mr-3"></i>
                <div>
                    <h4 class="font-semibold text-green-800 mb-1">Información Importante</h4>
                    <p class="text-green-700 text-sm">${guide.note}</p>
                </div>
            </div>
        </div>

        <div class="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p class="text-xs text-gray-600">
                <i class="fa-solid fa-lock mr-1"></i>
                Tu API Key se almacena localmente en tu navegador. No la compartimos con nadie.
            </p>
        </div>
    `;

    body.innerHTML = stepsHTML;

    // Mostrar modal con animación
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.add('bg-black/60');
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    });
}

function closeApiGuide() {
    const modal = document.getElementById('api-guide-modal');
    const content = document.getElementById('api-guide-content');
    
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('bg-black/60');
    }, 300);
}