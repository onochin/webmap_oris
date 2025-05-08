// main.js（ラスタタイル対応＋setStyle方式）

const basemapSources = {
  pale: {
    id: 'gsi_pale',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png']
  },
  photo: {
    id: 'gsi_photo',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg']
  },
  osm: {
    id: 'osm',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png']
  }
};

let map;

function createMap(sourceKey = 'pale') {
  const source = basemapSources[sourceKey];

  map = new maplibregl.Map({
    container: 'map',
    center: [138.0, 36.5],
    zoom: 6,
    style: getStyleFromSource(source)
  });

  map.on('load', () => {
    loadGeoJSON();
  });
}

function getStyleFromSource(source) {
  return {
    version: 8,
    sources: {
      [source.id]: {
        type: 'raster',
        tiles: source.tiles,
        tileSize: 256,
        attribution: '地理院タイル 他'
      }
    },
    layers: [
      {
        id: source.id + '_layer',
        type: 'raster',
        source: source.id
      }
    ]
  };
}

let geojsonData;
const mapSourceId = 'points';

async function loadGeoJSON() {
  const res = await fetch('data/points.geojson');
  geojsonData = await res.json();

  map.addSource(mapSourceId, {
    type: 'geojson',
    data: geojsonData
  });

  map.addLayer({
    id: 'points-layer',
    type: 'circle',
    source: mapSourceId,
    paint: {
      'circle-radius': 6,
      'circle-color': '#007cbf',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  });

  setupFilter();
  setupBasemapSwitcher();
}

function setupFilter() {
  const targetSelect = document.getElementById('target-select');
  const deviceSelect = document.getElementById('device-select');

  function applyFilter() {
    const target = targetSelect.value;
    const device = deviceSelect.value;

    const filtered = {
      type: 'FeatureCollection',
      features: geojsonData.features.filter(f => {
        return (!target || f.properties['調査対象'] === target) &&
               (!device || f.properties['探査機器'] === device);
      })
    };

    map.getSource(mapSourceId).setData(filtered);
  }

  targetSelect.addEventListener('change', applyFilter);
  deviceSelect.addEventListener('change', applyFilter);
}

function setupBasemapSwitcher() {
  const basemapSelect = document.getElementById('basemap-select');
  if (!basemapSelect) return;

  basemapSelect.addEventListener('change', () => {
    const selected = basemapSelect.value;
    const source = basemapSources[selected];

    map.setStyle(getStyleFromSource(source));

    map.once('styledata', () => {
      map.addSource(mapSourceId, {
        type: 'geojson',
        data: geojsonData
      });

      map.addLayer({
        id: 'points-layer',
        type: 'circle',
        source: mapSourceId,
        paint: {
          'circle-radius': 6,
          'circle-color': '#007cbf',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });
    });
  });
}

createMap();
