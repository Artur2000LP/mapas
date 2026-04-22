// ================================
// js/map.js — Inicialización del mapa y cambio de capas base
// ================================

let lastProviderGroup = 'esri';
let lastStyleKey = 'sat';
let isBaseMapRemoved = false;

function toggleBaseMap() {
    if (isBaseMapRemoved) {
        // Restaurar el último mapa seleccionado
        changeLayer(lastProviderGroup, lastStyleKey);
        
        // Intentar marcar el radio button correspondiente
        // Construimos el value probable: esriSat, googleRoadmap, etc.
        let radioValue = lastProviderGroup;
        if (lastStyleKey === 'satellite' && lastProviderGroup === 'google') radioValue += 'Sat';
        else if (lastStyleKey === 'satellite-v9') radioValue += 'Sat';
        else radioValue += lastStyleKey.charAt(0).toUpperCase() + lastStyleKey.slice(1);
        
        // Un fallback manual común
        const manualMap = {
            'esri_sat': 'esriSat', 'esri_topo': 'esriTopo', 'esri_street': 'esriStreet', 'esri_natgeo': 'esriNatGeo', 'esri_dark': 'esriDark',
            'google_roadmap': 'googleRoadmap', 'google_satellite': 'googleSat', 'google_hybrid': 'googleHybrid', 'google_terrain': 'googleTerrain',
            'bing_road': 'bingRoad', 'bing_aerial': 'bingAerial',
            'open_osm': 'osm', 'open_opentopo': 'opentopo', 'open_cartoDark': 'cartoDark', 'open_cartoLight': 'cartoLight', 'open_cartoVoyager': 'cartoVoyager', 'open_wikimedia': 'wikimedia', 'open_osmHot': 'osmHot', 'open_cyclOSM': 'cyclOSM'
        };
        const exactValue = manualMap[`${lastProviderGroup}_${lastStyleKey}`] || radioValue;
        
        const radio = document.querySelector(`input[name="basemap"][value="${exactValue}"]`);
        if (radio) radio.checked = true;
    } else {
        // Quitar fondo
        changeLayer('none', '');
        document.querySelectorAll('input[name="basemap"]').forEach(r => r.checked = false);
    }
}

function initializeMap() {
    map = L.map('map', { zoomControl: false }).setView(CONFIG.defaultCenter, CONFIG.defaultZoom);
    L.control.zoom({ position: 'topright' }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);

    setTimeout(() => {
        changeLayer('esri', 'sat');
        const esriRadio = document.querySelector('input[value="esriSat"]');
        if (esriRadio) esriRadio.checked = true;
    }, 500);

    map.on('zoomend', () => {
        const zoomEl = document.getElementById('zoom-level');
        if (zoomEl) zoomEl.innerText = map.getZoom();
    });
}

function changeLayer(providerGroup, styleKey) {
    if (providerGroup !== 'none') {
        lastProviderGroup = providerGroup;
        lastStyleKey = styleKey;
        isBaseMapRemoved = false;
    }

    if (currentTileLayer) map.removeLayer(currentTileLayer);
    currentTileLayer = null;

    document.querySelectorAll('.toast-notification').forEach(t => t.remove());

    let url = '';
    let attr = attributions[providerGroup];
    let tileLayerOptions = {
        attribution: attr, maxZoom: 19, minZoom: 1,
        tileSize: 256, zoomOffset: 0, crossOrigin: true,
        keepBuffer: 2, maxNativeZoom: 18, detectRetina: true,
        updateWhenIdle: false, updateWhenZooming: false
    };

    if (providerGroup === 'none') {
        isBaseMapRemoved = true;
        return;
    }
    else if (providerGroup === 'mapbox') {
        const token = getCredentialValue('mapbox');
        if (!token) { showToast('error', 'Token requerido', 'Se requiere un Token válido de Mapbox.'); return; }
        url = providers.mapbox.base.replace('{style}', styleKey).replace('{token}', token);
    }
    else if (providerGroup === 'bing') {
        currentTileLayer = L.tileLayer(providers[providerGroup][styleKey], {
            attribution: attr, maxZoom: 19, subdomains: ['0', '1', '2', '3'], tileSize: 256
        });
        currentTileLayer.getTileUrl = function (coords) {
            const quadkey = tileToQuadKey(coords.x, coords.y, coords.z);
            return this._url.replace('{quad}', quadkey).replace('{s}', this._getSubdomain(coords));
        };
        currentTileLayer.addTo(map);
        return;
    }
    else if (providerGroup === 'here') {
        const apikey = getCredentialValue('here');
        if (!apikey) { showToast('error', 'API Key requerida', 'Se requiere una API Key válida de Here Maps.'); return; }
        url = providers.here[styleKey].replace('{apikey}', apikey);
        tileLayerOptions.tileSize = 512;
        tileLayerOptions.zoomOffset = -1;
    }
    else if (providerGroup === 'thunderforest') {
        const apikey = getCredentialValue('thunderforest');
        if (!apikey) { showToast('error', 'API Key requerida', 'Se requiere una API Key válida de Thunderforest.'); return; }
        url = providers.thunderforest[styleKey].replace('{apikey}', apikey);
    }
    else if (providerGroup === 'nasa') {
        url = providers.nasa[styleKey];
        tileLayerOptions.maxZoom = 8;
        tileLayerOptions.maxNativeZoom = 8;
    }
    else if (providerGroup === 'stamen') {
        const apikey = getCredentialValue('stamen');
        if (!apikey) { showToast('error', 'API Key requerida', 'Stamen Maps ahora requiere una API Key de Stadia Maps (gratuita).'); return; }
        url = providers.stamen[styleKey].replace('{apikey}', apikey);
        if (styleKey === 'watercolor') tileLayerOptions.maxZoom = 16;
        if (styleKey === 'terrain') tileLayerOptions.maxZoom = 18;
    }
    else {
        url = providers[providerGroup][styleKey];
        if (providerGroup === 'open' && styleKey === 'opentopo') tileLayerOptions.maxZoom = 17;
    }

    currentTileLayer = L.tileLayer(url, tileLayerOptions);

    let errorNotified = false;
    currentTileLayer.on('tileerror', function () {
        if (!errorNotified) {
            if (providerGroup === 'nasa') {
                showToast('info', 'Optimizando mapa', 'Tiles de NASA no cargan, cambiando a Esri Satélite...');
                errorNotified = true;
                setTimeout(() => { changeLayer('esri', 'sat'); const r = document.querySelector('input[value="esriSat"]'); if (r) r.checked = true; }, 2000);
            } else {
                showToast('warning', 'Tiles incompletos', `Algunos tiles de ${providerGroup} pueden no cargar.`);
                errorNotified = true;
            }
            setTimeout(() => errorNotified = false, 15000);
        }
    });

    currentTileLayer.addTo(map);
}

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

function reloadTiles() {
    if (currentTileLayer) {
        currentTileLayer.redraw();
        showToast('info', 'Recargando', 'Forzando recarga de tiles del mapa...');
    }
}

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

// ================================
// MARCADORES MANUALES
// ================================

function processData(auto = false) {
    const txt = document.getElementById('coordinateInput').value;
    markersLayer.clearLayers();
    let bounds = [];

    txt.split('\n').forEach(line => {
        const p = line.split(',');
        if (p.length >= 3) {
            const lat = parseFloat(p[p.length - 2]);
            const lon = parseFloat(p[p.length - 1]);
            const name = p.slice(0, p.length - 2).join(' ');
            if (!isNaN(lat)) {
                const m = L.marker([lat, lon]).addTo(markersLayer);
                m.bindPopup(`<div class="font-bold text-indigo-900 mb-1">${name}</div><button onclick="analyzeLocationAI('${name.replace(/'/g, "")}',${lat},${lon})" class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded w-full hover:bg-indigo-200 transition">✨ Info IA</button>`);
                bounds.push([lat, lon]);
            }
        }
    });

    document.getElementById('point-counter').innerText = markersLayer.getLayers().length;
    if (bounds.length) map.fitBounds(bounds, { padding: [50, 50] });
    if (auto && window.innerWidth < 768) togglePanel();
}

function clearMap() {
    markersLayer.clearLayers();
    document.getElementById('coordinateInput').value = '';
    document.getElementById('point-counter').innerText = '0';
    showToast('info', 'Mapa limpio', 'Se eliminaron todos los marcadores');
}

// Funciones de zoom para KML
function zoomToCoordinate(lat, lng) {
    map.setView([lat, lng], 18, { animate: true, duration: 0.5 });
}

function zoomToExtent(points) {
    if (points && points.length > 0) {
        map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 16, animate: true, duration: 0.5 });
    }
}

function zoomToElement(bounds) {
    if (!bounds || bounds.length === 0) return;
    if (bounds.length === 1) {
        zoomToCoordinate(bounds[0].lat, bounds[0].lng);
    } else {
        map.fitBounds(L.latLngBounds(bounds.map(p => [p.lat, p.lng])), { padding: [50, 50], maxZoom: 16, animate: true, duration: 0.5 });
    }
}
