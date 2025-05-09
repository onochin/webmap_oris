// main.js（調査区分フィルター、探査機器色分け、ポップアップ新レイアウト：写真→Title→指定項目順）

const basemapSources = {
  pale: { id: 'gsi_pale', tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'] },
  photo: { id: 'gsi_photo', tiles: ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'] },
  osm:   { id: 'osm',       tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'] }
};

let map;
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
    sources: { [source.id]: { type: 'raster', tiles: source.tiles, tileSize: 256, attribution: '地理院タイル 他' } },
    layers: [{ id: `${source.id}_layer`, type: 'raster', source: source.id }]
  };
}

let geojsonData;
const mapSourceId = 'points';

async function loadGeoJSON() {
  const res = await fetch('data/points.geojson');
  geojsonData = await res.json();

  map.addSource(mapSourceId, { type: 'geojson', data: geojsonData });
  map.addLayer({
    id: 'points-layer', type: 'circle', source: mapSourceId,
    paint: {
      'circle-radius': 6,
      'circle-color': ['match', ['get', '探査機器'],
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

  map.on('mouseenter', 'points-layer', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', 'points-layer', () => map.getCanvas().style.cursor = '');

  // クリックでポップアップ表示（写真→Title→項目順に表示）
  map.on('click', 'points-layer', (e) => {
    const props = e.features[0].properties;
    // 画像表示（クリックで拡大）
    const imgHtml = props.photo
      ? `<img src="/photo/${props.photo}" style="max-width:200px; display:block; margin-bottom:8px; cursor: zoom-in; transition: max-width 0.2s;" onclick="this.style.maxWidth = this.style.maxWidth === '200px' ? '400px' : '200px';">`
      : '';
    // Title表示
    const title = props.Title || 'No title';
    const titleHtml = `<h3 style="margin:8px 0;">${title}</h3>`;
    // 指定項目を順にテーブル表示
    const fields = ['調査年度', '探査機器', '調査区分', '調査対象', '調査場所'];
    const rows = fields.map(key => {
      const val = props[key] || '';
      return `<tr><th style=\"text-align:right; padding:4px 8px; white-space:nowrap;\">${key}：</th><td style=\"padding:4px 8px; word-break:break-word;\">${val}</td></tr>`;
    }).join('');
    const tableHtml = `<table style=\"border-collapse:collapse; width:auto;\">${rows}</table>`;

    const html = `
      <div>
        ${imgHtml}
        ${titleHtml}
        ${tableHtml}
      </div>
    `;

    new maplibregl.Popup({ offset: 10 })
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(map);
  });

  setupFilter();
  setupBasemapSwitcher();
}

function setupFilter() {
  // ...既存のフィルター関数を同様に記載...
}
function setupBasemapSwitcher() {
  // ...既存のベースマップ切替関数を同様に記載...
}

createMap();
