// ================================
// js/ai.js — Integración con Google Gemini AI
// ================================

async function generateMapWithAI() {
    const promptText = document.getElementById('aiPrompt').value.trim();
    const btn = document.getElementById('btn-generate-ai');
    const icon = btn.querySelector('i');

    if (!promptText) return showToast('warning', 'Campo vacío', 'Escribe algo para mapear.');
    if (!CONFIG.apiKey) return showToast('error', 'API Key faltante', 'Configura tu API Key de Google Gemini en js/config.js');

    const originalIcon = icon.className;
    icon.className = 'fa-solid fa-circle-notch fa-spin';
    btn.disabled = true;

    try {
        const systemPrompt = `Genera CSV (Nombre, Latitud, Longitud) para: "${promptText}". Prioriza Perú. Sin texto extra.`;
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${CONFIG.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] }
                })
            }
        );

        const data = await response.json();
        const csv = data.candidates[0].content.parts[0].text
            .replace(/```csv/g, '').replace(/```/g, '').trim();
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
        showToast('error', 'API Key faltante', 'Configura tu API Key de Google Gemini en js/config.js');
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
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${CONFIG.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Explica qué es "${name}" en ${lat},${lon}. 3 párrafos breves. Historia y Turismo. Español.` }] }]
                })
            }
        );
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
