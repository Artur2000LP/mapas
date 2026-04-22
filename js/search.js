// ================================
// js/search.js — Búsqueda de lugares (Nominatim / OpenStreetMap)
// ================================

function setupPlaceSearch() {
    const searchInput = document.getElementById('place-search');
    const resultsContainer = document.getElementById('search-results');
    if (!searchInput || !resultsContainer) return;

    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);
        if (query.length < 3) { resultsContainer.classList.add('hidden'); return; }
        searchTimeout = setTimeout(() => searchPlaces(query), 500);
    });

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
            { headers: { 'Accept-Language': 'es', 'User-Agent': 'GeoVisorPro/1.0' } }
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

    resultsContainer.innerHTML = results.map(result => `
        <button onclick="goToPlace(${result.lat}, ${result.lon}, '${result.display_name.replace(/'/g, "\\'")}')"
                class="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors">
            <div class="text-sm font-medium text-gray-900 truncate">${result.display_name.split(',')[0].trim()}</div>
            <div class="text-xs text-gray-600 truncate">${result.display_name}</div>
        </button>
    `).join('');
}

function goToPlace(lat, lon, name) {
    if (searchMarker) map.removeLayer(searchMarker);

    searchMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            className: 'custom-search-marker',
            html: `<div style="background:linear-gradient(135deg,#3B82F6,#1D4ED8);width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px"><i class="fa-solid fa-location-dot"></i></div>`,
            iconSize: [24, 24], iconAnchor: [12, 12]
        })
    }).addTo(map);

    searchMarker.bindPopup(`
        <div class="p-2">
            <div class="font-bold text-blue-900 mb-1">📍 ${name}</div>
            <div class="text-xs text-gray-500">${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}</div>
            <button onclick="clearSearchMarker()" class="mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors">
                Limpiar marcador
            </button>
        </div>
    `).openPopup();

    map.setView([lat, lon], 16, { animate: true, duration: 0.8 });
    document.getElementById('search-results').classList.add('hidden');
    showToast('success', 'Lugar encontrado', `Navegando a: ${name.split(',')[0].trim()}`);
}

function clearSearchMarker() {
    if (searchMarker) {
        map.removeLayer(searchMarker);
        searchMarker = null;
    }
}
