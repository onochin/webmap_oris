// main.js（チェックボックスフィルター対応、探査機器色分け、ポップアップ：写真→Title→項目順）

const basemapSources = {
  pale: { id: 'gsi_pale', tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'] },
  photo: { id: 'gsi_photo', tiles: ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'] },
  osm:   { id: 'osm',       tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'] }
};

let map;
const mapSourceId = 'points';
let geojsonData;

function createMap(sourceKey = 'pale') {
  map = new maplibregl.Map({
    container: 'map',
    center: [138.0, 36.5],
    zoom: 6,
    style: getStyleFromSource(basemapSources[sourceKey])
  });
  map.on('load', loadGeoJSON);
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
    layers: [{ id: `${source.id}_layer`, type: 'raster', source: source.id }]
  };
}

async function loadGeoJSON() {
  const res = await fetch('data/points.geojson');
  geojsonData = await res.json();

  map.addSource(mapSourceId, { type: 'geojson', data: geojsonData });
  map.addLayer({
    id: 'points-layer',
    type: 'circle',
    source: mapSourceId,
    paint: {
      'circle-radius': 6,
      'circle-color': [
        'match', ['get', '探査機器'],
        'オーリス','blue',
        'ミラ','#FF1493',
        'パルサー','orange',
        'オーリス、ミラ','green',
        '#007cbf'
      ],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  });

  // カーソル変更とポップアップ
  map.on('mouseenter', 'points-layer', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', 'points-layer', () => map.getCanvas().style.cursor = '');
  map.on('click', 'points-layer', e => showPopup(e.features[0]));

  setupFilter();
  setupBasemapSwitcher();
}

// ポップアップ表示処理
function showPopup(feature) {
  const props = feature.properties;
  // 写真
  const imgHtml = props.photo
    ? `<img src="/photo/${props.photo}" style="max-width:200px; display:block; margin-bottom:8px; cursor: zoom-in; transition: max-width 0.2s;" onclick="this.style.maxWidth = this.style.maxWidth === '200px' ? '400px' : '200px';">`
    : '';
  // タイトル
  const title = props.Title || 'No title';
  const titleHtml = `<h3 style="margin:8px 0;">${title}</h3>`;
  // 項目順
  const fields = ['調査年度', '探査機器', '調査区分', '調査対象', '調査場所'];
  const rows = fields.map(key => {
    const val = props[key] || '';
    return `<tr><th style="text-align:right; padding:4px 8px; white-space:nowrap;">${key}：</th><td style="padding:4px 8px; word-break:break-word;">${val}</td></tr>`;
  }).join('');
  const tableHtml = `<table style="border-collapse:collapse; width:auto;">${rows}</table>`;

  const html = `
    <div>
      ${imgHtml}
      ${titleHtml}
      ${tableHtml}
    </div>
  `;

  new maplibregl.Popup({ offset: 10 })
    .setLngLat(feature.geometry.coordinates)
    .setHTML(html)
    .addTo(map);
}

// フィルター設定
function setupFilter() {
  const deviceList   = ['オーリス','ミラ','パルサー','オーリス、ミラ'];
  const targetList   = ['コンクリート構造物','鋼構造物','自然物（岩石等）'];
  const categoryList = ['形状調査','状態調査'];

  buildCheckboxFilter('filter-device',   deviceList,   applyFilter);
  buildCheckboxFilter('filter-target',   targetList,   applyFilter);
  buildCheckboxFilter('filter-category', categoryList, applyFilter);
}

// チェックボックス UI 生成
function buildCheckboxFilter(containerId, items, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = items.map(v =>
    `<label style="display:block; margin:2px 0;"><input type=\"checkbox\" value=\"${v}\"> ${v}</label>`
  ).join('');
  container.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', onChange));
}

// チェック値取得
function getCheckedValues(containerId) {
  return Array.from(
    document.querySelectorAll(`#${containerId} input:checked`)
  ).map(input => input.value);
}

// フィルター適用
function applyFilter() {
  const devices = getCheckedValues('filter-device');
  const targets = getCheckedValues('filter-target');
  const cats    = getCheckedValues('filter-category');
  const filtered = geojsonData.features.filter(f => {
    const p = f.properties;
    return (devices.length === 0 || devices.includes(p['探査機器']))
        && (targets.length === 0 || targets.includes(p['調査対象']))
        && (cats   .length === 0 || cats   .includes(p['調査区分']));
  });
  map.getSource(mapSourceId).setData({ type: 'FeatureCollection', features: filtered });
}

// ベースマップ切替
function setupBasemapSwitcher() {
  const sel = document.getElementById('basemap-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    map.setStyle(getStyleFromSource(basemapSources[sel.value]));
    map.once('styledata', () => {
      map.addSource(mapSourceId, { type: 'geojson', data: geojsonData });
      map.addLayer({
        id: 'points-layer', type: 'circle', source: mapSourceId,
        paint: {
          'circle-radius': 6,
          'circle-color': ['match', ['get', '探査機器'],
            'オーリス','blue','ミラ','#FF1493','パルサー','orange','オーリス、ミラ','green','#007cbf'
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });
      map.on('mouseenter','points-layer',()=>map.getCanvas().style.cursor='pointer');
      map.on('mouseleave','points-layer',()=>map.getCanvas().style.cursor='');
      map.on('click','points-layer',e=>showPopup(e.features[0]));
    });
  });
}

// 初期実行
createMap();
