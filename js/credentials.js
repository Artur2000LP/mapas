// ================================
// js/credentials.js — Gestión de tokens y API Keys
// ================================

function getCredentialValue(providerId) {
    const dynamicInput = document.getElementById(`${providerId}Credential`);
    if (dynamicInput) return dynamicInput.value.trim();
    const stored = localStorage.getItem(`${providerId}ApiKey`);
    return stored ? stored.trim() : '';
}

function createCredentialInput(providerId, config) {
    const inputId = `${providerId}Credential`;
    const containerId = `${providerId}InputContainer`;

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

    const providerDiv = document.querySelector(`#opts-${providerId}`).parentElement;
    const header = providerDiv.querySelector('.provider-header');
    header.insertAdjacentElement('afterend', inputContainer);

    setTimeout(() => {
        const input = document.getElementById(inputId);
        input.focus();
        input.addEventListener('input', () => validateCredential(inputId, providerId));
    }, 300);
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

    localStorage.setItem(`${providerId}ApiKey`, value);
    updateProviderHeader(providerId, true);
    showToast('success', 'Credencial guardada', `¡Perfecto! Ya puedes usar los mapas de ${providerConfigs[providerId].title.split(' ')[0]}`);

    setTimeout(() => {
        const opts = document.getElementById(`opts-${providerId}`);
        const header = opts.previousElementSibling;
        if (!opts.classList.contains('open')) {
            opts.classList.add('open');
            header.classList.add('active');
            header.querySelector('.arrow').style.transform = 'rotate(180deg)';
        }
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
    const lockIcon = document.getElementById(`${providerId}-lock-icon`) || (header && header.querySelector('.arrow'));

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

function loadSavedCredentials() {
    ['mapbox', 'here', 'stamen', 'thunderforest'].forEach(providerId => {
        const savedKey = localStorage.getItem(`${providerId}ApiKey`);
        if (savedKey && savedKey.trim().length > 10) {
            updateProviderHeader(providerId, true);
        }
    });
}

// ================================
// GUÍAS DE OBTENCIÓN DE API KEYS
// ================================

function showApiKeyGuide(providerId) {
    const guides = {
        mapbox: {
            title: 'Mapbox API Key', icon: 'fa-brands fa-mapbox', color: 'blue',
            note: 'Mapbox ofrece 50,000 vistas gratuitas al mes.',
            steps: [
                { title: '1. Crear Cuenta en Mapbox', content: 'Ve a <a href="https://account.mapbox.com/auth/signup/" target="_blank" class="text-blue-600 font-medium">mapbox.com/signup</a> y crea tu cuenta gratuita.', icon: 'fa-user-plus' },
                { title: '2. Confirmar Email', content: 'Revisa tu correo y confirma tu cuenta.', icon: 'fa-envelope-circle-check' },
                { title: '3. Acceder al Dashboard', content: 'Inicia sesión en <a href="https://account.mapbox.com/" target="_blank" class="text-blue-600 font-medium">account.mapbox.com</a>', icon: 'fa-gauge-high' },
                { title: '4. Obtener Token', content: 'En "Access Tokens" copia tu <strong>Default Public Token</strong>.', icon: 'fa-key', highlight: true },
                { title: '5. Usar en la App', content: 'Pega tu token en el campo de Mapbox y ¡listo!', icon: 'fa-paste' }
            ]
        },
        here: {
            title: 'HERE Maps API Key', icon: 'fa-solid fa-location-dot', color: 'green',
            note: 'HERE ofrece 250,000 transacciones gratuitas al mes.',
            steps: [
                { title: '1. Crear Cuenta HERE', content: 'Ve a <a href="https://developer.here.com/sign-up" target="_blank" class="text-green-600 font-medium">developer.here.com/sign-up</a>', icon: 'fa-user-plus' },
                { title: '2. Crear Proyecto', content: 'En el Developer Portal, crea un nuevo proyecto.', icon: 'fa-plus-circle' },
                { title: '3. Generar API Key', content: 'En "API Keys" genera una nueva clave para "Maps API".', icon: 'fa-key', highlight: true },
                { title: '4. Usar API Key', content: 'Copia tu API Key y pégala en el campo de HERE.', icon: 'fa-paste' }
            ]
        },
        stamen: {
            title: 'Stamen Maps (Stadia Maps)', icon: 'fa-solid fa-palette', color: 'purple',
            note: 'Stadia Maps ofrece 20,000 vistas de mapa gratuitas al mes.',
            steps: [
                { title: '1. Ir a Stadia Maps', content: 'Ve a <a href="https://client.stadiamaps.com/signup/" target="_blank" class="text-purple-600 font-medium">stadiamaps.com/signup</a>', icon: 'fa-external-link' },
                { title: '2. Crear Cuenta Gratuita', content: 'Regístrate con tu email. Sin tarjeta de crédito.', icon: 'fa-user-plus' },
                { title: '3. Obtener API Key', content: 'Crea una Property y copia tu API Key.', icon: 'fa-key', highlight: true },
                { title: '4. Usar en Mapas', content: 'Pega la API Key en el campo de Stamen.', icon: 'fa-map' }
            ]
        },
        thunderforest: {
            title: 'Thunderforest API Key', icon: 'fa-solid fa-bolt', color: 'orange',
            note: 'Thunderforest ofrece 150,000 tiles gratuitas al mes.',
            steps: [
                { title: '1. Registrarse', content: 'Ve a <a href="https://www.thunderforest.com/pricing/" target="_blank" class="text-orange-600 font-medium">thunderforest.com</a> y haz clic en "Sign up for free".', icon: 'fa-user-plus' },
                { title: '2. API Dashboard', content: 'Inicia sesión y ve a <a href="https://www.thunderforest.com/account/api/" target="_blank" class="text-orange-600 font-medium">thunderforest.com/account/api/</a>', icon: 'fa-tachometer-alt' },
                { title: '3. Copiar API Key', content: 'Copia tu API Key del dashboard.', icon: 'fa-key', highlight: true },
                { title: '4. Activar Mapas', content: 'Pégala en el campo de Thunderforest.', icon: 'fa-bicycle' }
            ]
        }
    };

    const guide = guides[providerId];
    if (!guide) return;

    const modal = document.getElementById('api-guide-modal');
    const content = document.getElementById('api-guide-content');
    document.getElementById('api-guide-title').innerHTML = `<i class="${guide.icon}"></i> ${guide.title}`;

    let stepsHTML = `<div class="mb-4"><div class="bg-${guide.color}-50 border-l-4 border-${guide.color}-400 p-3 rounded-r-lg"><p class="text-sm text-${guide.color}-800"><strong>Guía paso a paso:</strong> Obtén tu API Key gratuitamente.</p></div></div><div class="space-y-4">`;

    guide.steps.forEach(step => {
        const hl = step.highlight ? `border-l-4 border-${guide.color}-400 bg-${guide.color}-50 pl-4 py-3 rounded-r-lg` : '';
        stepsHTML += `<div class="flex items-start space-x-3 ${hl}"><div class="flex-shrink-0"><div class="w-8 h-8 rounded-full bg-${guide.color}-100 flex items-center justify-center"><i class="${step.icon} text-${guide.color}-600"></i></div></div><div><h4 class="font-semibold text-gray-900 mb-1">${step.title}</h4><p class="text-gray-700 text-sm">${step.content}</p></div></div>`;
    });

    stepsHTML += `</div><div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"><div class="flex items-start"><i class="fa-solid fa-lightbulb text-green-600 mt-0.5 mr-3"></i><div><h4 class="font-semibold text-green-800 mb-1">Información Importante</h4><p class="text-green-700 text-sm">${guide.note}</p></div></div></div>`;

    document.getElementById('api-guide-body').innerHTML = stepsHTML;

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
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('bg-black/60'); }, 300);
}
