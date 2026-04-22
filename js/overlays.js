// ================================
// js/overlays.js — GeoPerú WMS + INGEMMET ArcGIS + Cuadrantes IGN
// ================================

// Cusco: punto de referencia óptimo para ver las Cartas Topográficas IGN
const CUSCO = { lat: -13.531950, lng: -71.967463, zoom: 11 };

// Genera URL WMS de imagen completa para el viewport actual (GeoPerú)
function buildGeoPeruImageUrl(layer) {
    const bounds = map.getBounds();
    const size   = map.getSize();
    const sw = L.CRS.EPSG3857.project(bounds.getSouthWest());
    const ne = L.CRS.EPSG3857.project(bounds.getNorthEast());
    const bbox = `${sw.x},${sw.y},${ne.x},${ne.y}`;
    return `${GEOPERU_WMS}?service=WMS&request=GetMap&version=1.1.1` +
        `&layers=${encodeURIComponent(layer)}&styles=` +
        `&format=image%2Fpng&transparent=true` +
        `&srs=EPSG%3A3857` +
        `&width=${size.x}&height=${size.y}` +
        `&bbox=${bbox}`;
}

// Genera URL ArcGIS MapServer Export para el viewport actual (INGEMMET)
function buildIngemmetImageUrl(layersParam) {
    const bounds = map.getBounds();
    const size   = map.getSize();
    const sw = L.CRS.EPSG3857.project(bounds.getSouthWest());
    const ne = L.CRS.EPSG3857.project(bounds.getNorthEast());
    const bbox = `${sw.x},${sw.y},${ne.x},${ne.y}`;
    const sr = encodeURIComponent(JSON.stringify({ wkid: 102100 }));
    return `${INGEMMET_CARTA_URL}` +
        `?bbox=${encodeURIComponent(bbox)}` +
        `&bboxSR=${sr}` +
        `&imageSR=${sr}` +
        `&size=${size.x}%2C${size.y}` +
        `&dpi=96` +
        `&format=png32` +
        `&transparent=true` +
        `&layers=${encodeURIComponent(layersParam)}` +
        `&f=image`;
}

// Genera URL genérica para cualquier MapServer Export de ArcGIS INGEMMET
function buildGenericArcgisImageUrl(serviceName) {
    const bounds = map.getBounds();
    const size   = map.getSize();
    const sw = L.CRS.EPSG3857.project(bounds.getSouthWest());
    const ne = L.CRS.EPSG3857.project(bounds.getNorthEast());
    const bbox = `${sw.x},${sw.y},${ne.x},${ne.y}`;
    const sr = encodeURIComponent(JSON.stringify({ wkid: 102100 }));
    return `https://geocatmin.ingemmet.gob.pe/arcgis/rest/services/${serviceName}/MapServer/export` +
        `?bbox=${encodeURIComponent(bbox)}` +
        `&bboxSR=${sr}` +
        `&imageSR=${sr}` +
        `&size=${size.x}%2C${size.y}` +
        `&dpi=96` +
        `&format=png32` +
        `&transparent=true` +
        `&layers=show:0` +
        `&f=image`;
}

// Genera URL genérica para cualquier capa WMS del Ministerio de Cultura
function buildCulturaWmsUrl(layerName) {
    const bounds = map.getBounds();
    const size   = map.getSize();
    const sw = L.CRS.EPSG3857.project(bounds.getSouthWest());
    const ne = L.CRS.EPSG3857.project(bounds.getNorthEast());
    const bbox = `${sw.x},${sw.y},${ne.x},${ne.y}`;
    return `https://geoservicios.cultura.gob.pe/geoserver/cultura/wms?service=WMS&request=GetMap&version=1.1.1` +
        `&layers=${encodeURIComponent(layerName)}&styles=` +
        `&format=image%2Fpng&transparent=true` +
        `&srs=EPSG%3A3857` +
        `&width=${size.x}&height=${size.y}` +
        `&bbox=${bbox}`;
}

// ================================
// OVERLAY GENÉRICO: Capas Oficiales WMS/REST
// ================================
function toggleOfficialLayer(layerType, layerId, isChecked) {
    const overlayKey = `official_${layerType}_${layerId}`;

    if (isChecked) {
        let debounceTimer = null;
        let layerOverlay = null;

        function refreshLayer() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const bounds = map.getBounds();
                const url = layerType === 'arcgis' 
                            ? buildGenericArcgisImageUrl(layerId) 
                            : buildCulturaWmsUrl(layerId);

                if (layerOverlay) map.removeLayer(layerOverlay);

                layerOverlay = L.imageOverlay(url, bounds, {
                    opacity: 0.8,
                    zIndex: 105,
                    interactive: false
                }).addTo(map);

            }, 250);
        }

        refreshLayer();
        map.on('moveend zoomend', refreshLayer);

        activeOverlays[overlayKey] = {
            _handler: refreshLayer,
            remove() {
                clearTimeout(debounceTimer);
                if (layerOverlay) map.removeLayer(layerOverlay);
                map.off('moveend zoomend', this._handler);
                layerOverlay = null;
            }
        };
    } else {
        if (activeOverlays[overlayKey]) {
            activeOverlays[overlayKey].remove();
            delete activeOverlays[overlayKey];
        }
    }
}

// ================================
// OVERLAY: GeoPerú (WMS — departamentos)
// ================================
function toggleOverlay(providerGroup, styleKey, isChecked) {
    const overlayId = `${providerGroup}_${styleKey}`;

    if (isChecked) {
        let imgOverlay = null;

        function refreshOverlay() {
            const bounds = map.getBounds();
            const url = buildGeoPeruImageUrl('peru_departamento_');
            if (imgOverlay) map.removeLayer(imgOverlay);
            imgOverlay = L.imageOverlay(url, bounds, {
                opacity: 1, zIndex: 100, interactive: false
            }).addTo(map);
            // Pintar las líneas de negro: el WMS devuelve trazos blancos/claros
            // sobre fondo transparente; invertir los hace negros sin afectar el alpha.
            const el = imgOverlay.getElement();
            if (el) el.style.filter = 'invert(1)';
        }

        refreshOverlay();
        map.on('moveend zoomend', refreshOverlay);

        activeOverlays[overlayId] = {
            _handler: refreshOverlay,
            remove() {
                if (imgOverlay) map.removeLayer(imgOverlay);
                map.off('moveend zoomend', this._handler);
                imgOverlay = null;
            }
        };
    } else {
        if (activeOverlays[overlayId]) {
            activeOverlays[overlayId].remove();
            delete activeOverlays[overlayId];
        }
    }
}

// ================================
// ESTADO DE INGEMMET (controles de apariencia)
// ================================
const ingemmetState = {
    opacity:   0.9,
    blendMode: 'normal',
    minZoom:   8,
    maxZoom:   18,
    overlay:   null,
    handler:   null,
    firstActivation: true   // para el auto-zoom a Cusco
};

// ================================
// OVERLAY: INGEMMET Cartas IGN (ArcGIS MapServer)
// ================================
function toggleIngemmetOverlay(layerId, isChecked) {
    const overlayKey = `ingemmet_${layerId}`;

    if (isChecked) {
        // ── AUTO-ZOOM A CUSCO la primera vez (o cada vez, porque es la zona de referencia) ──
        map.flyTo([CUSCO.lat, CUSCO.lng], CUSCO.zoom, {
            animate: true,
            duration: 1.8,
            easeLinearity: 0.3
        });

        const layerParams = { cartasIGN: 'show:0' };
        const param = layerParams[layerId] || 'show:0';

        let debounceTimer = null;

        function refreshIngemmet() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const currentZoom = map.getZoom();

                // ── Respetar rango de zoom visible ──
                if (currentZoom < ingemmetState.minZoom || currentZoom > ingemmetState.maxZoom) {
                    if (ingemmetState.overlay) ingemmetState.overlay.setOpacity(0);
                    return;
                }

                const bounds = map.getBounds();
                const url = buildIngemmetImageUrl(param);

                if (ingemmetState.overlay) map.removeLayer(ingemmetState.overlay);

                ingemmetState.overlay = L.imageOverlay(url, bounds, {
                    opacity:     ingemmetState.opacity,
                    zIndex:      110,
                    interactive: false
                }).addTo(map);

                // ── Aplicar blend mode al elemento ──
                const el = ingemmetState.overlay.getElement();
                if (el) el.style.mixBlendMode = ingemmetState.blendMode;

            }, 250); // debounce 250ms
        }

        ingemmetState.handler = refreshIngemmet;

        // Esperar que el flyTo termine antes del primer request
        map.once('moveend', () => {
            refreshIngemmet();
            map.on('moveend zoomend', refreshIngemmet);
        });

        activeOverlays[overlayKey] = {
            remove() {
                clearTimeout(debounceTimer);
                if (ingemmetState.overlay) {
                    map.removeLayer(ingemmetState.overlay);
                    ingemmetState.overlay = null;
                }
                map.off('moveend zoomend', ingemmetState.handler);
                ingemmetState.handler = null;
            }
        };

    } else {
        if (activeOverlays[overlayKey]) {
            activeOverlays[overlayKey].remove();
            delete activeOverlays[overlayKey];
        }
    }
}

// ================================
// OVERLAY: CUADRANTES IGN 1:100,000
// Hojas de 30'×30' (0.5° × 0.5°) sobre la extensión del Perú
// ================================
let cuadrantesLayer = null;

function toggleCuadrantesGrid(isChecked) {
    if (isChecked) {
        if (cuadrantesLayer) return; // ya existe

        cuadrantesLayer = L.layerGroup();

        // Extensión del Perú con margen
        const LAT_MIN = -18.5, LAT_MAX =  1.0;
        const LON_MIN = -82.0, LON_MAX = -68.0;
        const CELL   = 0.5; // 30 minutos = 0.5°

        const lineStyle = {
            color:     '#1565C0',
            weight:    0.8,
            opacity:   0.55,
            dashArray: '4 3',
            interactive: false
        };

        // Líneas verticales (meridianos)
        for (let lon = LON_MIN; lon <= LON_MAX + 0.01; lon = Math.round((lon + CELL) * 100) / 100) {
            L.polyline([[LAT_MIN, lon], [LAT_MAX, lon]], lineStyle)
                .addTo(cuadrantesLayer);
        }

        // Líneas horizontales (paralelos)
        for (let lat = LAT_MIN; lat <= LAT_MAX + 0.01; lat = Math.round((lat + CELL) * 100) / 100) {
            L.polyline([[lat, LON_MIN], [lat, LON_MAX]], lineStyle)
                .addTo(cuadrantesLayer);
        }

        // Etiquetas de celdas (solo visibles desde zoom 9+)
        map.on('zoomend', updateCuadrantesLabels);
        updateCuadrantesLabels();

        cuadrantesLayer.addTo(map);
        showToast('success', 'Cuadrantes IGN', 'Cuadrícula 1:100K (30′×30′) activada');

    } else {
        if (cuadrantesLayer) {
            map.removeLayer(cuadrantesLayer);
            cuadrantesLayer = null;
        }
        map.off('zoomend', updateCuadrantesLabels);
    }
}

// Etiquetas de referencia por celda (aparecen en zoom ≥ 9)
function updateCuadrantesLabels() {
    if (!cuadrantesLayer) return;

    // Eliminar etiquetas anteriores
    cuadrantesLayer.eachLayer(l => {
        if (l._isLabel) cuadrantesLayer.removeLayer(l);
    });

    const zoom = map.getZoom();
    if (zoom < 9) return; // sin etiquetas en zoom bajo

    const bounds = map.getBounds();
    const CELL = 0.5;

    const latMin = Math.floor(bounds.getSouth() / CELL) * CELL;
    const latMax = Math.ceil(bounds.getNorth()  / CELL) * CELL;
    const lonMin = Math.floor(bounds.getWest()  / CELL) * CELL;
    const lonMax = Math.ceil(bounds.getEast()   / CELL) * CELL;

    for (let lat = latMin; lat < latMax; lat = Math.round((lat + CELL) * 100) / 100) {
        for (let lon = lonMin; lon < lonMax; lon = Math.round((lon + CELL) * 100) / 100) {
            // Nombre de la hoja IGN: ej. "17-s" (columna-fila)
            const col  = Math.round((lon + 82) / CELL) + 1;       // desde W=-82
            const row  = String.fromCharCode(97 + Math.round(Math.abs(lat) / CELL)); // a-z desde lat 0
            const label = `${col}-${row}`;

            const centerLat = lat + CELL / 2;
            const centerLon = lon + CELL / 2;

            const marker = L.marker([centerLat, centerLon], {
                icon: L.divIcon({
                    className: '',
                    html: `<div style="
                        font-size:${zoom >= 11 ? 9 : 7}px;
                        color:#1565C0;
                        font-family:monospace;
                        font-weight:700;
                        opacity:0.7;
                        white-space:nowrap;
                        text-shadow:0 0 3px #fff,0 0 3px #fff;
                        pointer-events:none;
                        user-select:none;
                    ">${label}</div>`,
                    iconSize: [40, 14],
                    iconAnchor: [20, 7]
                }),
                interactive: false,
                zIndexOffset: -1000
            });
            marker._isLabel = true;
            marker.addTo(cuadrantesLayer);
        }
    }
}

// ================================
// CONTROL 1: TRANSPARENCIA
// ================================
function setIngemmetOpacity(value) {
    const opacity = value / 100;
    ingemmetState.opacity = opacity;
    document.getElementById('ingemmet-opacity-label').textContent = `${value}%`;
    if (ingemmetState.overlay) ingemmetState.overlay.setOpacity(opacity);
}

// ================================
// CONTROL 2: BLEND MODE (Combinando)
// ================================
function setIngemmetBlend(mode) {
    ingemmetState.blendMode = mode;
    if (ingemmetState.overlay) {
        const el = ingemmetState.overlay.getElement();
        if (el) el.style.mixBlendMode = mode;
    }
}

// ================================
// CONTROL 3: RANGO VISIBLE (Zoom min/max)
// ================================
function setIngemmetZoomRange() {
    const minSlider = document.getElementById('ingemmet-minzoom');
    const maxSlider = document.getElementById('ingemmet-maxzoom');
    const minLabel  = document.getElementById('ingemmet-minzoom-label');
    const maxLabel  = document.getElementById('ingemmet-maxzoom-label');

    let minVal = parseInt(minSlider.value);
    let maxVal = parseInt(maxSlider.value);

    if (minVal > maxVal) { minVal = maxVal; minSlider.value = minVal; }

    ingemmetState.minZoom = minVal;
    ingemmetState.maxZoom = maxVal;
    minLabel.textContent = minVal;
    maxLabel.textContent = maxVal;

    if (ingemmetState.overlay) {
        const z = map.getZoom();
        const visible = (z >= minVal && z <= maxVal);
        ingemmetState.overlay.setOpacity(visible ? ingemmetState.opacity : 0);
        if (!visible) {
            showToast('info', 'Fuera de rango', `Capa visible entre zoom ${minVal}–${maxVal}. Actual: ${z}`);
        }
    }
}
