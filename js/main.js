// main.js（調査区分を追加した3条件フィルター、探査機器ごとに色分け：濃いピンクに調整）

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
      'circle-color': [
        'match',
        ['get', '探査機器'],
        'オーリス',      'blue',      // オーリス：青
        'ミラ',        '#FF1493',   // ミラ：濃いピンクに変更
        'パルサー',    'orange',    // パルサー：オレンジ
        'オーリス、ミラ','green',   // オーリス、ミラ：緑
        '#007cbf'                     // デフォルト色
      ],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  });

  // ポップアップ設定
  map.on('mouseenter', 'points-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'points-layer', () => {
    map.getCanvas().style.cursor = '';
  });
  map.on('click', 'points-layer', (e) => {
    const props = e.features[0].properties;
    const info = Object.keys(props)
      .map(key => `<strong>${key}:</strong> ${props[key]}`)
      .join('<br>');
    new maplibregl.Popup({ offset: 10 })
      .setLngLat(e.lngLat)
      .setHTML(`<div>${info}</div>`)
      .addTo(map);
  });

  setupFilter();
  setupBasemapSwitcher();
}

function setupFilter() {
  const deviceSelect = document.getElementById('device-select');
  const categorySelect = document.getElementById('category-select');
  const targetSelect = document.getElementById('target-select');

  function updateTargetOptions(deviceValue) {
    const targets = new Set();
    geojsonData.features.forEach(f => {
      if (!deviceValue || f.properties['探査機器'] === deviceValue) {
        targets.add(f.properties['調査対象']);
      }
    });
    targetSelect.innerHTML = '<option value="">すべて</option>' +
      Array.from(targets).map(t => `<option value="${t}">${t}</option>`).join('');
  }

  function applyFilter() {
    const device = deviceSelect.value;
    const category = categorySelect.value;
    const target = targetSelect.value;

    const filtered = {
      type: 'FeatureCollection',
      features: geojsonData.features.filter(f => {
        return (!device || f.properties['探査機器'] === device) &&
               (!category || f.properties['調査区分'] === category) &&
               (!target || f.properties['調査対象'] === target);
      })
    };

    map.getSource(mapSourceId).setData(filtered);
  }

  deviceSelect.addEventListener('change', () => {
    updateTargetOptions(deviceSelect.value);
    applyFilter();
  });

  categorySelect.addEventListener('change', applyFilter);
  targetSelect.addEventListener('change', applyFilter);

  updateTargetOptions(deviceSelect.value);
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
          'circle-color': [
            'match',
            ['get', '探査機器'],
            'オーリス',      'blue',
            'ミラ',        '#FF1493',
            'パルサー',    'orange',
            'オーリス、ミラ','green',
            '#007cbf'
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      // ポップアップ設定（スタイル切り替え後も有効に）
      map.on('mouseenter', 'points-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'points-layer', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('click', 'points-layer', (e) => {
        const props = e.features[0].properties;
        const info = Object.keys(props)
          .map(key => `<strong>${key}:</strong> ${props[key]}`)
          .join('<br>');
        new maplibregl.Popup({ offset: 10 })
          .setLngLat(e.lngLat)
          .setHTML(`<div>${info}</div>`)
          .addTo(map);
      });
    });
  });
}

createMap();
