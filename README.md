# 🗺️ GeoVisor Pro

> **Visualizador de mapas inteligente con IA integrada**  
> Análisis de archivos KML/KMZ usando Google Gemini AI + mapas interactivos con Leaflet

![GitHub](https://img.shields.io/badge/License-MIT-blue.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green.svg)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-red.svg)

## ✨ Características

🤖 **IA Integrada**  
- Análisis automático de archivos KML/KMZ  
- Extracción inteligente de información geoespacial  
- Respuestas en lenguaje natural  

🗺️ **Múltiples Proveedores**  
- Esri ArcGIS (Satélite, Topográfico, Calles)  
- Google Maps (Roadmap, Satélite, Híbrido, Terreno)  
- OpenStreetMap, CartoDB, Bing Maps  
- NASA GIBS, Stamen Design  

⚡ **Funcionalidades**  
- Carga y visualización de archivos KML/KMZ  
- Análisis de datos con IA  
- Interfaz moderna y responsiva  
- Múltiples capas de mapa  

## 🚀 Inicio Rápido

1. **Clonar repositorio**
   ```bash
   git clone <tu-repo-url>
   cd mapas-ejemplos-maps
   ```

2. **Configurar API Key**
   ```javascript
   // En app.js, línea 7
   const CONFIG = {
       apiKey: "TU_GOOGLE_GEMINI_API_KEY", // ← Agregar aquí
       // ...
   };
   ```

3. **Abrir en navegador**
   ```bash
   # Servir con servidor local
   python -m http.server 8000
   # o
   npx serve .
   ```

4. **Acceder**: `http://localhost:8000`

## 🎯 Uso

### Análisis con IA
1. Sube un archivo KML/KMZ
2. Haz preguntas en lenguaje natural
3. Obtén análisis inteligente de tus datos

### Visualización de Mapas
- **Cambio de capa**: Usa el panel de capas
- **Zoom**: Rueda del mouse o controles
- **Navegación**: Clic y arrastrar

## 📁 Estructura del Proyecto

```
📦 GeoVisor Pro
├── 📄 index.html          # Aplicación principal
├── 📄 mapejemplo.html     # Ejemplo básico
├── 📄 mapanasa.html       # Ejemplo NASA
├── 🎨 styles.css          # Estilos personalizados
├── ⚙️ app.js              # Lógica principal
├── 🧪 test-mapas.js       # Pruebas de mapas
└── 📚 MAPAS_GUIA.md       # Guía de mapas
```

## 🛠️ Tecnologías

| Tecnología | Uso | Versión |
|------------|-----|---------|
| **Leaflet** | Mapas interactivos | 1.9.4 |
| **Tailwind CSS** | Estilos | CDN |
| **Google Gemini** | Análisis IA | API |
| **Font Awesome** | Iconografía | 6.4.0 |

## 🌍 Proveedores Soportados

<table>
<tr>
<td>🛰️ <strong>Esri ArcGIS</strong><br>Mapas de alta calidad</td>
<td>🌍 <strong>Google Maps</strong><br>Cobertura mundial</td>
</tr>
<tr>
<td>🆓 <strong>OpenStreetMap</strong><br>Datos comunitarios</td>
<td>🎨 <strong>Stamen & CartoDB</strong><br>Estilos artísticos</td>
</tr>
</table>

## 📝 Configuración Avanzada

### Variables de Configuración
```javascript
const CONFIG = {
    apiKey: "",                    // Google Gemini API Key
    defaultCenter: [-9.189967, -75.015152], // Centro inicial
    defaultZoom: 5,               // Zoom inicial
    colorPalette: [...],          // Paleta de colores
};
```

## 🤝 Contribuir

1. **Fork** el repositorio
2. **Crea** una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Abre** un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🔗 Enlaces

- [Demo en vivo](#) <!-- Agregar URL cuando esté disponible -->
- [Documentación de Leaflet](https://leafletjs.com/)
- [API Google Gemini](https://ai.google.dev/)

---

<div align="center">
  <strong>🌟 Si te gusta este proyecto, dale una estrella</strong><br>
  <sub>Hecho con ❤️ para la comunidad geoespacial</sub>
</div>