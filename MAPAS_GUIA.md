# 🗺️ GeoVisor Pro - Guía Completa de Mapas

## 📋 **Mapas Disponibles**

### 🆓 **COMPLETAMENTE GRATUITOS**

#### 1. **Esri ArcGIS** (⭐ Top Quality)
- ✅ **Satélite** - World Imagery de alta resolución
- ✅ **Topográfico** - World Topo Map con relieve
- ✅ **Calles** - Streets Map vectorial
- ✅ **National Geographic** - Estilo cartográfico
- ✅ **Gris Oscuro** - Dark Gray Base para overlays
- 🔗 **URL**: `https://server.arcgisonline.com/ArcGIS/rest/services/`
- ℹ️ **Info**: Los mejores mapas gratuitos disponibles

#### 2. **Google Maps** (🌍 Mundial)
- ✅ **Roadmap** - Calles estándar de Google
- ✅ **Satélite** - Imágenes satelitales de Google
- ✅ **Híbrido** - Satélite + calles superpuestas  
- ✅ **Terreno** - Mapa con relieve y topografía
- 🔗 **URL**: `https://mt1.google.com/vt/lyrs=`
- ⚠️ **Limitación**: Sin nombres oficiales de calles en algunos países

#### 3. **Bing Maps** (🏢 Microsoft)
- ✅ **Road** - Calles de Microsoft 
- ✅ **Aerial** - Vista aérea de alta calidad
- 🔗 **URL**: `https://ecn.t{s}.tiles.virtualearth.net/tiles/`
- 🔧 **Tech**: Usa sistema de QuadKey especial

#### 4. **OpenStreetMap & CartoDB** (🌐 Open Source)
- ✅ **OpenStreetMap** - Mapa estándar comunitario
- ✅ **OpenTopoMap** - Topográfico con curvas de nivel
- ✅ **CartoDB Dark** - Estilo oscuro elegante
- ✅ **CartoDB Light** - Estilo claro minimalista
- 🔗 **URL**: `https://{s}.tile.openstreetmap.org/`
- 👥 **Comunidad**: Mapas colaborativos globales

#### 5. **Stamen Design** (🎨 Artísticos)
- ✅ **Watercolor** - Estilo acuarela única
- ✅ **Terrain** - Relieve artístico
- ✅ **Toner** - Blanco y negro minimalista
- 🔗 **URL**: `https://stamen-tiles-{s}.a.ssl.fastly.net/`
- 🎨 **Especial**: Mapas con estilo artístico único

#### 6. **NASA GIBS** (🛰️ Científicos)
- ✅ **VIIRS Day/Night** - Imágenes día/noche
- ✅ **MODIS True Color** - Color verdadero
- 🔗 **URL**: `https://map1.vis.earthdata.nasa.gov/wmts-geo/`
- 🔬 **Científico**: Datos satelitales de la NASA

---

### 🔑 **REQUIEREN API KEY GRATUITA**

#### 7. **Mapbox** (💎 Premium Quality)
- 🔑 **Satélite** - Imágenes de alta resolución
- 🔑 **Satélite + Calles** - Vista híbrida
- 🔑 **Streets** - Calles vectoriales
- 🔑 **Dark Mode** - Modo oscuro
- 🔑 **Light Mode** - Modo claro 
- 🔑 **Outdoors** - Para senderismo
- 📝 **Cómo obtener API Key**:
  1. Ir a [mapbox.com](https://www.mapbox.com/)
  2. Crear cuenta gratuita
  3. Ir a Account → Access tokens
  4. Copiar "Default public token"
- 💰 **Límites**: 50,000 vistas/mes gratis

#### 8. **Here Maps** (🎯 Nokia)
- 🔑 **Normal Day** - Mapa estándar
- 🔑 **Satellite Day** - Vista satelital
- 🔑 **Hybrid Day** - Híbrido con etiquetas
- 📝 **Cómo obtener API Key**:
  1. Ir a [developer.here.com](https://developer.here.com/)
  2. Crear cuenta gratuita
  3. Crear proyecto
  4. Generar API Key
- 💰 **Límites**: 250,000 requests/mes gratis

#### 9. **Thunderforest** (⛰️ Outdoor Maps)
- 🔑 **Landscape** - Paisaje natural
- 🔑 **Outdoors** - Para actividades al aire libre
- 🔑 **Cycle Map** - Rutas de ciclismo
- 📝 **Cómo obtener API Key**:
  1. Ir a [thunderforest.com](https://www.thunderforest.com/)
  2. Crear cuenta gratuita
  3. Ir a API Keys
  4. Crear nueva key
- 💰 **Límites**: 7,500 requests/mes gratis

---

## 🔧 **Configuración Técnica**

### 🛠️ **Cómo Configurar API Keys**

1. **Abrir el GeoVisor**
2. **Ir a tab "Capas Base"**  
3. **Pegar tus API Keys en los campos correspondientes**:
   - 🔵 Campo azul = Mapbox Token
   - 🟣 Campo morado = Here API Key  
   - 🟢 Campo verde = Thunderforest API Key

### ⚡ **Características Técnicas**

| Proveedor | Max Zoom | Formatos | Especial |
|-----------|----------|----------|----------|
| Esri | 19 | PNG/JPG | Tiles de 256px |  
| Google | 19 | JPG | Sin auth oficial |
| Bing | 19 | JPG | Sistema QuadKey |
| OSM | 19 | PNG | Colaborativo |
| Mapbox | 22 | Vector | HD Retina |
| Here | 20 | PNG | 512px tiles |
| Stamen | 16-18 | JPG/PNG | Artístico |
| NASA | 9 | JPG | Científico |
| Thunderforest | 18 | PNG | Outdoor |

---

## 🚀 **Recomendaciones de Uso**

### 📊 **Para Análisis General**: 
- ⭐ **Esri World Imagery** (Satellite)
- ⭐ **Google Híbrido** 
- ⭐ **Mapbox Streets** (si tienes token)

### 🏞️ **Para Outdoor/Naturaleza**:
- ⭐ **OpenTopoMap** (relieve)
- ⭐ **Thunderforest Landscape** (con token)
- ⭐ **Esri Topográfico**

### 🎨 **Para Presentaciones**:
- ⭐ **Stamen Watercolor** 
- ⭐ **CartoDB Light/Dark**
- ⭐ **Mapbox Light/Dark** (con token)

### 🔬 **Para Análisis Científico**:
- ⭐ **NASA VIIRS/MODIS**
- ⭐ **Esri World Imagery**

---

## ❓ **Troubleshooting Común**

### 🔴 **Error: "Token requerido"**
- **Causa**: Falta API key del proveedor
- **Solución**: Obtener API key gratuita y pegarla en el campo

### 🔴 **Error: "Failed to load tiles"** 
- **Causa**: API key inválida o límites excedidos
- **Solución**: Verificar API key o crear nueva

### 🔴 **Mapa se ve borroso**
- **Causa**: Zoom muy alto para el proveedor
- **Solución**: Usar Mapbox o Here para zooms altos

### 🔴 **Tiles no cargan**
- **Causa**: Problemas de conectividad
- **Solución**: Cambiar a OpenStreetMap o Esri

---

## 📞 **Soporte y Enlaces**

- 📧 **Google Maps**: Sin soporte oficial API
- 📧 **Mapbox**: [docs.mapbox.com](https://docs.mapbox.com/)
- 📧 **Here**: [developer.here.com](https://developer.here.com/)  
- 📧 **Thunderforest**: [www.thunderforest.com/docs](https://www.thunderforest.com/docs)
- 📧 **OpenStreetMap**: [wiki.openstreetmap.org](https://wiki.openstreetmap.org/)
- 📧 **Esri**: [developers.arcgis.com](https://developers.arcgis.com/)

---

## 🆕 **Changelog de Mapas**

**✅ Mapas Agregados (Nueva Versión)**:
- Google Maps (4 estilos)
- Bing Maps (2 estilos)  
- Here Maps (3 estilos)
- Stamen Design (3 estilos artísticos)
- NASA GIBS (2 estilos científicos)
- Thunderforest (3 estilos outdoor)

**📊 Total**: **10 Proveedores, 27 Estilos de Mapas**

---

### 🏆 **Los Mejores Mapas Gratuitos Sin API Key**:
1. 🥇 **Esri World Imagery** (Satélite)
2. 🥈 **Google Híbrido** (Satélite + Calles)  
3. 🥉 **OpenStreetMap** (Calles colaborativas)
4. 🏅 **Stamen Watercolor** (Artístico)
5. 🏅 **NASA VIIRS** (Científico)

¡Ahora tienes acceso a los mejores mapas gratuitos del mundo! 🌍✨