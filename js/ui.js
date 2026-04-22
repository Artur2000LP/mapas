// ================================
// js/ui.js — Panel, tabs, acordeones, toasts
// ================================

function switchTab(tabName) {
    activeTab = tabName;
    document.querySelectorAll('[id^="tab-"]').forEach(tab => tab.classList.remove('tab-active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.add('tab-active');
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
}

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

function toggleProvider(id) {
    if (id === 'mapbox') {
        const token = getCredentialValue('mapbox');
        if (!token) {
            showToast('info', 'Token requerido', 'Ingresa tu Token de Mapbox para acceder a estos mapas premium');
            createCredentialInput('mapbox', providerConfigs.mapbox);
            return;
        }
    } else if (id === 'here') {
        const apikey = getCredentialValue('here');
        if (!apikey) {
            showToast('info', 'API Key requerida', 'Ingresa tu API Key de Here Maps para mapas de alta precisión');
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

// ================================
// SISTEMA DE NOTIFICACIONES TOAST
// ================================

function showToast(type, title, message, duration = 4000) {
    const container = document.getElementById('toast-container');

    const existingToasts = container.querySelectorAll('.toast-notification');
    if (existingToasts.length >= 2) existingToasts[0].remove();

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
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, duration);
}

// ================================
// UTILIDADES
// ================================

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getNextColor() {
    const color = CONFIG.colorPalette[currentColorIndex % CONFIG.colorPalette.length];
    currentColorIndex++;
    return color;
}

// ================================
// RENDERIZADO DE CAPAS OFICIALES
// ================================
function renderOfficialLayers() {
    const container = document.getElementById('official-layers-container');
    if (!container || typeof OFFICIAL_LAYERS === 'undefined') return;

    let html = '';
    
    OFFICIAL_LAYERS.forEach((group, index) => {
        const groupId = `official-group-${index}`;
        
        let layersHtml = '';
        group.layers.forEach(layer => {
            const layerIdSafe = layer.id.replace(/"/g, '&quot;');
            layersHtml += `
                <label class="flex items-center p-2 rounded-lg hover:bg-${group.color}-50 cursor-pointer transition-all group/item">
                    <input type="checkbox" class="text-${group.color}-600 focus:ring-${group.color}-500" 
                           onchange="toggleOfficialLayer('${layer.type}', '${layerIdSafe}', this.checked)">
                    <span class="ml-2 text-xs text-gray-600 group-hover/item:text-gray-900">${layer.name}</span>
                </label>
            `;
        });

        html += `
            <div class="border-b border-gray-100">
                <div class="provider-header p-4 cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors" onclick="toggleProvider('${groupId}')">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-${group.color}-100 flex items-center justify-center text-${group.color}-700">
                            <i class="fa-solid ${group.icon}"></i>
                        </div>
                        <div>
                            <span class="block text-sm font-bold text-gray-800">${group.category}</span>
                            <span class="block text-[10px] text-${group.color}-600 font-semibold">Oficial WMS/REST</span>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-down arrow text-gray-400 text-xs transition-transform"></i>
                </div>
                <div id="opts-${groupId}" class="provider-options bg-${group.color}-50/30">
                    <div class="p-3 space-y-1 pl-14">
                        <label class="flex items-center p-2 rounded-lg hover:bg-${group.color}-100 cursor-pointer transition-all border-b border-${group.color}-200/50 mb-2">
                            <input type="checkbox" class="text-${group.color}-700 focus:ring-${group.color}-500 rounded" 
                                   onchange="toggleAllLayersInGroup('${groupId}', this.checked)">
                            <span class="ml-2 text-[11px] font-bold text-gray-700 uppercase tracking-wide">Seleccionar Todas</span>
                        </label>
                        ${layersHtml}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ================================
// SELECCIONAR TODAS LAS CAPAS DE UN GRUPO
// ================================
function toggleAllLayersInGroup(groupId, isChecked) {
    const container = document.getElementById(`opts-${groupId}`);
    if (!container) return;
    
    // Seleccionar todos los checkboxes que NO sean el maestro
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:not([onchange*="toggleAllLayersInGroup"])');
    
    checkboxes.forEach(cb => {
        // Solo simular clic si el estado actual es diferente al deseado
        if (cb.checked !== isChecked) {
            cb.click();
        }
    });
}
