// main.js
maplibregl.accessToken = ''; // 不要だが書いても可

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [138.0, 36.5],
  zoom: 6
});

let geojsonData;
let mapSourceId = 'points';

map.on('load', async () => {
  // GeoJSON読み込み
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
});

function setupFilter() {
  const yearSelect = document.getElementById('year-select');
  const targetSelect = document.getElementById('target-select');

  function applyFilter() {
    const year = yearSelect.value;
    const target = targetSelect.value;

    const filtered = {
      type: 'FeatureCollection',
      features: geojsonData.features.filter(f => {
        return (!year || f.properties['調査年'] === year) &&
               (!target || f.properties['調査対象'] === target);
      })
    };

    map.getSource(mapSourceId).setData(filtered);
  }

  yearSelect.addEventListener('change', applyFilter);
  targetSelect.addEventListener('change', applyFilter);
}
