// ================================
// js/config.js — Constantes y configuración global
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
// Variables globales compartidas
// ================================
let map, markersLayer, currentTileLayer;
let loadedKMLFiles = [];
let currentColorIndex = 0;
let activeTab = 'ai';
let activeOverlays = {};
let searchMarker = null;
let credentialInputs = {};

// ================================
// URLs de proveedores de mapas base
// ================================
const providers = {
    esri: {
        sat:    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        topo:   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        street: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        natgeo: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
        dark:   'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    },
    open: {
        osm:          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        opentopo:     'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        cartoDark:    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        cartoLight:   'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        cartoVoyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        wikimedia:    'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png',
        osmHot:       'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        cyclOSM:      'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'
    },
    google: {
        roadmap:   'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        satellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        hybrid:    'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        terrain:   'https://mt1.google.com/vt/lyrs=t&x={x}&y={y}&z={z}'
    },
    bing: {
        aerial: 'https://ecn.t{s}.tiles.virtualearth.net/tiles/a{quad}.jpeg?g=737&mkt=en&lbl=l0&stl=h',
        road:   'https://ecn.t{s}.tiles.virtualearth.net/tiles/r{quad}.jpeg?g=737&mkt=en&lbl=l1&stl=h'
    },
    here: {
        normal:    'https://1.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/512/png8?apikey={apikey}',
        satellite: 'https://1.aerial.maps.ls.hereapi.com/maptile/2.1/maptile/newest/satellite.day/{z}/{x}/{y}/512/jpg?apikey={apikey}',
        hybrid:    'https://1.aerial.maps.ls.hereapi.com/maptile/2.1/maptile/newest/hybrid.day/{z}/{x}/{y}/512/png8?apikey={apikey}'
    },
    stamen: {
        watercolor: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key={apikey}',
        terrain:    'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png?api_key={apikey}',
        toner:      'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png?api_key={apikey}'
    },
    nasa: {
        viirs: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/VIIRS_SNPP_DayNightBand_ENCC/default/2024-01-01/250m/{z}/{y}/{x}.jpg',
        modis: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/2024-01-01/250m/{z}/{y}/{x}.jpg'
    },
    thunderforest: {
        landscape: 'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey={apikey}',
        outdoors:  'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}',
        cycle:     'https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}'
    },
    mapbox: {
        base: 'https://api.mapbox.com/styles/v1/mapbox/{style}/tiles/{z}/{x}/{y}?access_token={token}'
    },
    geoperu: {
        departamentos: 'https://espacialg.geoperu.gob.pe/geoserver/geoperu/wms'
    }
};

const attributions = {
    esri:         'Tiles &copy; Esri',
    open:         '&copy; OpenStreetMap contributors',
    google:       '&copy; Google',
    bing:         '&copy; Microsoft',
    here:         '&copy; Here Technologies',
    stamen:       'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL',
    nasa:         '&copy; NASA GIBS',
    thunderforest:'&copy; Thunderforest, &copy; OpenStreetMap contributors',
    mapbox:       '&copy; Mapbox',
    geoperu:      '&copy; GeoPerú, Infraestructura de Datos Espaciales del Perú'
};

// Configuraciones de proveedores con API Key
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

// URLs base para overlays nacionales del Perú
const GEOPERU_WMS       = 'https://espacialg.geoperu.gob.pe/geoserver/geoperu/wms';
const INGEMMET_CARTA_URL = 'https://geocatmin.ingemmet.gob.pe/arcgis/rest/services/SERV_CARTA_IGN/MapServer/export';

// Centroides de los 25 departamentos del Perú (fallback si WFS no responde)
const PERU_DEPTS = [
    { nombre: 'AMAZONAS',      lat: -4.8,    lon: -77.8  },
    { nombre: 'ÁNCASH',        lat: -9.5,    lon: -77.5  },
    { nombre: 'APURÍMAC',      lat: -14.0,   lon: -73.1  },
    { nombre: 'AREQUIPA',      lat: -15.8,   lon: -71.9  },
    { nombre: 'AYACUCHO',      lat: -13.5,   lon: -74.2  },
    { nombre: 'CAJAMARCA',     lat: -6.9,    lon: -78.5  },
    { nombre: 'CALLAO',        lat: -12.0,   lon: -77.14 },
    { nombre: 'CUSCO',         lat: -13.5,   lon: -71.9  },
    { nombre: 'HUANCAVELICA',  lat: -12.7,   lon: -74.9  },
    { nombre: 'HUÁNUCO',       lat: -9.5,    lon: -75.9  },
    { nombre: 'ICA',           lat: -14.1,   lon: -75.5  },
    { nombre: 'JUNÍN',         lat: -11.4,   lon: -74.8  },
    { nombre: 'LA LIBERTAD',   lat: -8.0,    lon: -78.3  },
    { nombre: 'LAMBAYEQUE',    lat: -6.7,    lon: -79.9  },
    { nombre: 'LIMA',          lat: -11.5,   lon: -76.5  },
    { nombre: 'LORETO',        lat: -5.0,    lon: -74.5  },
    { nombre: 'MADRE DE DIOS', lat: -11.7,   lon: -70.9  },
    { nombre: 'MOQUEGUA',      lat: -16.8,   lon: -70.8  },
    { nombre: 'PASCO',         lat: -10.4,   lon: -75.6  },
    { nombre: 'PIURA',         lat: -5.2,    lon: -80.4  },
    { nombre: 'PUNO',          lat: -15.0,   lon: -70.1  },
    { nombre: 'SAN MARTÍN',    lat: -6.8,    lon: -76.5  },
    { nombre: 'TACNA',         lat: -17.7,   lon: -70.2  },
    { nombre: 'TUMBES',        lat: -3.6,    lon: -80.5  },
    { nombre: 'UCAYALI',       lat: -9.5,    lon: -73.0  }
];

// ================================
// CAPAS OFICIALES (WMS/REST)
// ================================
const OFFICIAL_LAYERS = [
  {
    category: 'Cartografía y Base',
    color: 'amber',
    icon: 'fa-map',
    layers: [
      { id: 'SERV_AREA_RESERVADA', name: 'Área Reservada', type: 'arcgis' },
      { id: 'SERV_BOLETINES', name: 'Boletines', type: 'arcgis' },
      { id: 'SERV_CARTA_IGN', name: 'Carta IGN', type: 'arcgis' },
      { id: 'SERV_CARTOGRAFIA_BASE_WGS84', name: 'Cartografía Base WGS84', type: 'arcgis' },
      { id: 'SERV_CARTOGRAFIA_DEMARCACION_WGS84', name: 'Demarcación WGS84', type: 'arcgis' },
      { id: 'SERV_CERTIFICADO_AMBIENTAL', name: 'Certificado Ambiental', type: 'arcgis' },
      { id: 'SERV_ESTUDIO_SUELO', name: 'Estudio Suelo', type: 'arcgis' },
      { id: 'SERV_GEOCATMIN_PAISES', name: 'Geocatmin Países', type: 'arcgis' },
      { id: 'SERV_OTRAS_FUENTES', name: 'Otras Fuentes', type: 'arcgis' },
      { id: 'SERV_PATRIMONIO_GEOLOGICO', name: 'Patrimonio Geológico', type: 'arcgis' }
    ]
  },
  {
    category: 'Catastro y Minería',
    color: 'yellow',
    icon: 'fa-gem',
    layers: [
      { id: 'SERV_CARTERA_PROYECTOS_MINEROS', name: 'Cartera Proyectos Mineros', type: 'arcgis' },
      { id: 'SERV_CATASTRO_FORESTAL', name: 'Catastro Forestal', type: 'arcgis' },
      { id: 'SERV_CATASTRO_MADRE_DIOS', name: 'Catastro Madre de Dios', type: 'arcgis' },
      { id: 'SERV_CATASTRO_MINERO_WGS84', name: 'Catastro Minero WGS84', type: 'arcgis' },
      { id: 'SERV_LIBREDENUNCIABILIDAD', name: 'Libre Denunciabilidad', type: 'arcgis' },
      { id: 'SERV_PEQUENA_MINERIA', name: 'Pequeña Minería', type: 'arcgis' },
      { id: 'SERV_REINFO', name: 'REINFO', type: 'arcgis' }
    ]
  },
  {
    category: 'Cultura',
    color: 'rose',
    icon: 'fa-landmark',
    layers: [
      { id: 'cultura:vi_cira_lineas', name: 'CIRA Longitudinal', type: 'wms' },
      { id: 'cultura:vi_cira_poligonos', name: 'CIRA Polígonos', type: 'wms' }
    ]
  },
  {
    category: 'Geología Regional',
    color: 'emerald',
    icon: 'fa-mountain-city',
    layers: [
      { id: 'SERV_GEOLOGIA_100K_INTEGRADA', name: 'Geología 100K Integrada', type: 'arcgis' },
      { id: 'SERV_GEOLOGIA_50K_INTEGRADA', name: 'Geología 50K Integrada', type: 'arcgis' },
      { id: 'SERV_GEOLOGIA_AMBIENTAL', name: 'Geología Ambiental', type: 'arcgis' },
      { id: 'SERV_GEOLOGIA_FALLAS', name: 'Fallas Geológicas', type: 'arcgis' },
      { id: 'SERV_GEOLOGIA_MARINA', name: 'Geología Marina', type: 'arcgis' },
      { id: 'SERV_GEOLOGIA_REGIONAL', name: 'Geología Regional', type: 'arcgis' },
      { id: 'SERV_GEOMORFOLOGIA', name: 'Geomorfología', type: 'arcgis' },
      { id: 'SERV_MAPAS_GEOLOGICOS', name: 'Mapas Geológicos', type: 'arcgis' },
      { id: 'SERV_METALOGENETICO', name: 'Metalogenético', type: 'arcgis' },
      { id: 'SERV_NEOTECTONICO', name: 'Neotectónico', type: 'arcgis' },
      { id: 'SERV_PALEONTOLOGIA', name: 'Paleontología', type: 'arcgis' }
    ]
  },
  {
    category: 'Recursos Naturales',
    color: 'lime',
    icon: 'fa-leaf',
    layers: [
      { id: 'SERV_ANOMALIA_ESPECTRAL', name: 'Anomalía Espectral', type: 'arcgis' },
      { id: 'SERV_ATLAS_GEOQUIMICO', name: 'Atlas Geoquímico', type: 'arcgis' },
      { id: 'SERV_GEOQUIMICA', name: 'Geoquímica', type: 'arcgis' },
      { id: 'SERV_GEOTERMICO', name: 'Geotérmico', type: 'arcgis' },
      { id: 'SERV_HIDROGEOLOGIA_PERU', name: 'Hidrogeología', type: 'arcgis' },
      { id: 'SERV_OCURRENCIA_MINERAL', name: 'Ocurrencia Mineral', type: 'arcgis' },
      { id: 'SERV_POTENCIALMINERO', name: 'Potencial Minero', type: 'arcgis' },
      { id: 'SERV_ROCAS_MINERALES_INDUSTRIALES', name: 'Rocas y Minerales Ind.', type: 'arcgis' }
    ]
  },
  {
    category: 'Riesgos y Alertas',
    color: 'red',
    icon: 'fa-triangle-exclamation',
    layers: [
      { id: 'SERV_PASIVO_AMBIENTAL', name: 'Pasivo Ambiental', type: 'arcgis' },
      { id: 'SERV_PELIGROS_GEOLOGICOS', name: 'Peligros Geológicos', type: 'arcgis' },
      { id: 'SERV_PERU_ALERTA', name: 'Perú Alerta', type: 'arcgis' },
      { id: 'SERV_SUSCEPTIBILIDAD_INUNDACION_FLUVIAL_MIL1', name: 'Susceptibilidad Inundación', type: 'arcgis' },
      { id: 'SERV_SUSCEPTIBLE_MOV_MASA_REGIONAL', name: 'Movimiento de Masas', type: 'arcgis' },
      { id: 'SERV_VOLCANES', name: 'Volcanes', type: 'arcgis' }
    ]
  }
];
