// ================================
// js/kml.js — Carga, parseo y visualización de KML/KMZ + Export PDF
// ================================

async function handleKMLUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    showUploadProgress(true);
    updateProgress(0, files.length, 'Iniciando carga...');

    for (let i = 0; i < files.length; i++) {
        updateProgress(i + 1, files.length, `Procesando: ${files[i].name}`);
        try {
            await processKMLFile(files[i]);
        } catch (error) {
            showToast('error', 'Error de archivo', `No se pudo cargar: ${files[i].name}`);
        }
    }

    showUploadProgress(false);
    updateKMLFilesInfo();
    if (loadedKMLFiles.length > 0) {
        showToast('success', 'Archivos cargados', `${files.length} archivo(s) procesados exitosamente`);
    }
    event.target.value = '';
}

async function processKMLFile(file) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    let kmlContent = '';

    if (ext === 'kmz') {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        const kmlFile = Object.keys(zipContent.files).find(n => n.toLowerCase().endsWith('.kml'));
        if (!kmlFile) throw new Error('No se encontró archivo KML dentro del KMZ');
        kmlContent = await zipContent.files[kmlFile].async('string');
    } else if (ext === 'kml') {
        kmlContent = await readFileAsText(file);
    } else {
        throw new Error('Formato no soportado. Use .kml o .kmz');
    }

    kmlContent = cleanKMLContent(kmlContent);
    const kmlInfo = analyzeKML(kmlContent);

    const kmlFile = {
        id: `kml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        color: getNextColor(),
        kmlData: kmlContent,
        kmlInfo,
        visible: true,
        layerGroup: null
    };

    loadedKMLFiles.push(kmlFile);
    addKMLToMap(kmlFile);
    addKMLFileToUI(kmlFile);
}

function addKMLToMap(kmlFile) {
    const layerGroup = L.layerGroup();
    kmlFile.layerGroup = layerGroup;

    try {
        const parser = new DOMParser();
        const kml = parser.parseFromString(kmlFile.kmlData, 'text/xml');
        const placemarks = kml.getElementsByTagName('Placemark');

        Array.from(placemarks).forEach(placemark => {
            const name = placemark.getElementsByTagName('name')[0]?.textContent || 'Sin nombre';
            const description = placemark.getElementsByTagName('description')[0]?.textContent || '';

            // Puntos
            Array.from(placemark.getElementsByTagName('Point')).forEach(point => {
                const coords = point.getElementsByTagName('coordinates')[0]?.textContent;
                if (coords) {
                    const [lng, lat, alt = 0] = coords.trim().split(',').map(Number);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const marker = L.circleMarker([lat, lng], {
                            radius: 8, fillColor: kmlFile.color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8
                        });
                        marker.bindPopup(`<div class="p-2"><div class="font-bold text-blue-900 mb-2">${name}</div><div class="text-xs text-gray-600"><div><strong>Coords:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>${alt > 0 ? `<div><strong>Alt:</strong> ${alt.toFixed(2)} m</div>` : ''}</div><button onclick="zoomToCoordinate(${lat},${lng})" class="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded">🎯 Centrar</button></div>`);
                        layerGroup.addLayer(marker);
                    }
                }
            });

            // Líneas
            Array.from(placemark.getElementsByTagName('LineString')).forEach(ls => {
                const coords = ls.getElementsByTagName('coordinates')[0]?.textContent;
                if (coords) {
                    const pts = coords.trim().split(/\s+/).map(c => { const [lng, lat] = c.split(',').map(Number); return [lat, lng]; }).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
                    if (pts.length > 1) {
                        let dist = 0;
                        for (let i = 0; i < pts.length - 1; i++) dist += calculateDistance(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1]);
                        const poly = L.polyline(pts, { color: kmlFile.color, weight: 3, opacity: 0.8 });
                        poly.bindPopup(`<div class="p-2"><div class="font-bold text-purple-900">${name}</div><div class="text-xs text-gray-600 mt-1"><div><strong>Longitud:</strong> ${formatDistance(dist)}</div><div><strong>Puntos:</strong> ${pts.length}</div></div></div>`);
                        layerGroup.addLayer(poly);
                    }
                }
            });

            // Polígonos
            Array.from(placemark.getElementsByTagName('Polygon')).forEach(polygon => {
                const outerBoundary = polygon.getElementsByTagName('outerBoundaryIs')[0] || polygon;
                const coords = outerBoundary.getElementsByTagName('coordinates')[0]?.textContent;
                if (coords) {
                    const pts = coords.trim().split(/\s+/).map(c => { const [lng, lat] = c.split(',').map(Number); return [lat, lng]; }).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
                    if (pts.length > 2) {
                        const area = calculatePolygonArea(pts);
                        const poly = L.polygon(pts, { color: kmlFile.color, weight: 2, opacity: 0.8, fillColor: kmlFile.color, fillOpacity: 0.3 });
                        poly.bindPopup(`<div class="p-2"><div class="font-bold text-orange-900">${name}</div><div class="text-xs text-gray-600 mt-1"><div><strong>Área:</strong> ${formatArea(area)}</div><div><strong>Vértices:</strong> ${pts.length}</div></div></div>`);
                        layerGroup.addLayer(poly);
                    }
                }
            });
        });

        layerGroup.addTo(map);
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
                <div class="w-4 h-4 rounded-full border-2 border-white shadow-sm" style="background-color:${kmlFile.color}"></div>
                <div>
                    <div class="font-semibold text-sm text-gray-800">${kmlFile.fileName}</div>
                    <div class="text-xs text-gray-500">${kmlFile.fileSize} • ${kmlFile.kmlInfo.totalElements} elementos</div>
                </div>
            </div>
            <div class="flex gap-1">
                <button onclick="toggleKMLVisibility('${kmlFile.id}')" class="p-2 hover:bg-gray-100 rounded" title="Toggle visibilidad">
                    <i class="fa-solid fa-eye w-4 h-4 text-gray-600"></i>
                </button>
                <button onclick="removeKMLFile('${kmlFile.id}')" class="p-2 hover:bg-red-100 rounded" title="Eliminar">
                    <i class="fa-solid fa-trash w-4 h-4 text-red-600"></i>
                </button>
            </div>
        </div>
        <div class="grid grid-cols-4 gap-2">
            <div class="bg-blue-50 border border-blue-200 rounded p-2 text-center"><div class="font-bold text-blue-600">${kmlFile.kmlInfo.totalElements}</div><div class="text-xs text-blue-700">Total</div></div>
            <div class="bg-green-50 border border-green-200 rounded p-2 text-center"><div class="font-bold text-green-600">${kmlFile.kmlInfo.points}</div><div class="text-xs text-green-700">Puntos</div></div>
            <div class="bg-purple-50 border border-purple-200 rounded p-2 text-center"><div class="font-bold text-purple-600">${kmlFile.kmlInfo.lines}</div><div class="text-xs text-purple-700">Líneas</div></div>
            <div class="bg-orange-50 border border-orange-200 rounded p-2 text-center"><div class="font-bold text-orange-600">${kmlFile.kmlInfo.polygons}</div><div class="text-xs text-orange-700">Polígonos</div></div>
        </div>
    `;
    container.appendChild(fileDiv);
}

function toggleKMLVisibility(fileId) {
    const kmlFile = loadedKMLFiles.find(f => f.id === fileId);
    if (!kmlFile) return;
    kmlFile.visible = !kmlFile.visible;
    kmlFile.visible ? kmlFile.layerGroup.addTo(map) : map.removeLayer(kmlFile.layerGroup);
    const icon = document.querySelector(`#kml-file-${fileId} button[onclick*="toggleKMLVisibility"] i`);
    if (icon) icon.className = kmlFile.visible ? 'fa-solid fa-eye w-4 h-4 text-gray-600' : 'fa-solid fa-eye-slash w-4 h-4 text-gray-400';
}

function removeKMLFile(fileId) {
    const index = loadedKMLFiles.findIndex(f => f.id === fileId);
    if (index === -1) return;
    const kmlFile = loadedKMLFiles[index];
    if (kmlFile.layerGroup) map.removeLayer(kmlFile.layerGroup);
    loadedKMLFiles.splice(index, 1);
    const el = document.getElementById(`kml-file-${fileId}`);
    if (el) el.remove();
    updateKMLFilesInfo();
    showToast('info', 'Archivo eliminado', `${kmlFile.fileName} ha sido removido del mapa`);
}

function clearAllKMLFiles() {
    if (loadedKMLFiles.length === 0) return;
    loadedKMLFiles.forEach(f => { if (f.layerGroup) map.removeLayer(f.layerGroup); });
    const count = loadedKMLFiles.length;
    loadedKMLFiles = [];
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
        .replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

    if (cleaned.includes('xsi:schemaLocation') && !cleaned.includes('xmlns:xsi=')) {
        cleaned = cleaned.replace(/<kml([^>]*)>/, '<kml$1 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">');
    }
    return cleaned.replace(/^(?!<\?xml)/, '<?xml version="1.0" encoding="UTF-8"?>\n');
}

function analyzeKML(kmlContent) {
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlContent, 'text/xml');
    if (kml.querySelector('parsererror')) throw new Error('XML mal formado');

    const placemarks = kml.getElementsByTagName('Placemark');
    const info = { totalElements: placemarks.length, points: 0, lines: 0, polygons: 0, measurements: [], totalArea: 0, totalDistance: 0 };

    Array.from(placemarks).forEach(placemark => {
        const name = placemark.getElementsByTagName('name')[0]?.textContent || 'Sin nombre';
        const hasPoint = placemark.getElementsByTagName('Point').length > 0;
        const hasLine  = placemark.getElementsByTagName('LineString').length > 0;
        const hasPoly  = placemark.getElementsByTagName('Polygon').length > 0;

        if (hasPoint) {
            info.points++;
            const c = placemark.getElementsByTagName('coordinates')[0]?.textContent;
            if (c) { const [lng, lat] = c.trim().split(',').map(Number); if (!isNaN(lat)) info.measurements.push({ name, type: 'point', coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, bounds: [{ lat, lng }] }); }
        }
        if (hasLine) {
            info.lines++;
            const c = placemark.getElementsByTagName('coordinates')[0]?.textContent;
            if (c) {
                const pts = c.trim().split(/\s+/).map(p => { const [lng, lat] = p.split(',').map(Number); return { lat, lng }; }).filter(p => !isNaN(p.lat));
                if (pts.length > 1) {
                    let dist = 0;
                    for (let i = 0; i < pts.length - 1; i++) dist += calculateDistance(pts[i].lat, pts[i].lng, pts[i+1].lat, pts[i+1].lng);
                    info.totalDistance += dist;
                    info.measurements.push({ name, type: 'line', measurement: formatDistance(dist), bounds: pts });
                }
            }
        }
        if (hasPoly) {
            info.polygons++;
            const c = placemark.getElementsByTagName('coordinates')[0]?.textContent;
            if (c) {
                const pts = c.trim().split(/\s+/).map(p => { const [lng, lat] = p.split(',').map(Number); return { lat, lng }; }).filter(p => !isNaN(p.lat));
                if (pts.length > 2) {
                    const area = calculatePolygonArea(pts.map(p => [p.lat, p.lng]));
                    info.totalArea += area;
                    info.measurements.push({ name, type: 'polygon', measurement: formatArea(area), bounds: pts });
                }
            }
        }
    });
    return info;
}

// Cálculos geográficos
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180, Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculatePolygonArea(points) {
    if (points.length < 3) return 0;
    const R = 6371000;
    let area = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const φ1 = (points[i][0] * Math.PI) / 180, φ2 = (points[i+1][0] * Math.PI) / 180;
        const Δλ = ((points[i+1][1] - points[i][1]) * Math.PI) / 180;
        area += Δλ * (2 + Math.sin(φ1) + Math.sin(φ2));
    }
    return Math.abs((area * R * R) / 2.0);
}

function formatDistance(m) { return m >= 1000 ? `${(m/1000).toFixed(2)} km` : `${m.toFixed(2)} m`; }
function formatArea(m2) { const ha = m2/10000; return ha >= 1 ? `${ha.toFixed(2)} ha` : `${m2.toFixed(2)} m²`; }

// UI helpers
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Error leyendo archivo'));
        reader.readAsText(file);
    });
}

function showUploadProgress(show) {
    document.getElementById('kml-upload-progress').classList.toggle('hidden', !show);
}

function updateProgress(current, total, text) {
    document.getElementById('progress-text').textContent = text;
    document.getElementById('progress-count').textContent = `${current}/${total}`;
    document.getElementById('progress-fill').style.width = `${(current/total)*100}%`;
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

// Export PDF (simplified - delegates to jsPDF + html2canvas)
async function exportToPDF() {
    if (loadedKMLFiles.length === 0) { showToast('warning', 'Sin archivos', 'Carga primero archivos KML/KMZ'); return; }
    try {
        showToast('info', 'Generando PDF', 'Preparando plano A3...');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
        const pageWidth = 420, pageHeight = 297;

        pdf.setFont('helvetica');
        pdf.setFontSize(20); pdf.setTextColor(30, 64, 175);
        pdf.text('PLANO GEOGRÁFICO - POLÍGONOS Y COORDENADAS', pageWidth/2, 20, { align: 'center' });
        pdf.setLineWidth(0.5); pdf.setDrawColor(59, 130, 246);
        pdf.line(20, 25, pageWidth-20, 25);

        const panel = document.getElementById('control-panel');
        const originalDisplay = panel.style.display;
        panel.style.display = 'none';
        await new Promise(r => setTimeout(r, 800));

        const canvas = await html2canvas(document.getElementById('map'), {
            useCORS: true, allowTaint: true, backgroundColor: '#ffffff', scale: 2, logging: false
        });

        panel.style.display = originalDisplay;

        const mapW = pageWidth * 0.6 - 30, mapH = pageHeight - 50;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 20, 35, mapW, mapH);

        const rightX = 20 + mapW + 10;
        pdf.setFontSize(11); pdf.setTextColor(0,0,0);
        pdf.text('COORDENADAS', rightX, 35);
        let y = 45;
        loadedKMLFiles.forEach(file => {
            file.kmlInfo.measurements.filter(m => m.type === 'polygon').forEach(poly => {
                if (y > pageHeight - 20) return;
                pdf.setFontSize(9); pdf.setTextColor(30,64,175);
                pdf.text(poly.name.substring(0,30), rightX, y); y += 5;
                pdf.setFontSize(7); pdf.setTextColor(0,0,0);
                poly.bounds.slice(0,15).forEach((c, i) => {
                    if (y > pageHeight - 10) return;
                    pdf.text(`${i+1}. ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`, rightX+2, y); y += 3.5;
                });
                y += 3;
            });
        });

        pdf.setFontSize(7); pdf.setTextColor(128,128,128);
        pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES')} — GeoVisor Pro`, pageWidth/2, pageHeight-5, { align: 'center' });

        pdf.save(`Plano_${new Date().toISOString().slice(0,10)}.pdf`);
        showToast('success', 'PDF Generado', 'Plano A3 descargado exitosamente');
    } catch (e) {
        console.error(e);
        showToast('error', 'Error PDF', e.message);
    }
}
