// main.js
maplibregl.accessToken = '';

const basemapStyles = {
  pale: 'https://tiles.gsj.jp/tiles/app/carto/pale.json',
  photo: 'https://tiles.gsj.jp/tiles/app/photo/airphoto.json',
  osm: 'https://demotiles.maplibre.org/style.json'
};

const map = new maplibregl.Map({
  container: 'map',
  style: basemapStyles.pale,
  center: [138.0, 36.5],
  zoom: 6
});

let geojsonData;
let mapSourceId = 'points';

map.on('load', async () => {
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
});

function setupFilter() {
  const yearSelect = document.getElementById('year-select');
  const targetSelect = document.getElementById('target-select');
  const deviceSelect = document.getElementById('device-select');

  function applyFilter() {
    const year = yearSelect.value;
    const target = targetSelect.value;
    const device = deviceSelect ? deviceSelect.value : '';

    const filtered = {
      type: 'FeatureCollection',
      features: geojsonData.features.filter(f => {
        return (!year || f.properties['調査年'] === year) &&
               (!target || f.properties['調査対象'] === target) &&
               (!device || f.properties['探査機器'] === device);
      })
    };

    map.getSource(mapSourceId).setData(filtered);
  }

  yearSelect.addEventListener('change', applyFilter);
  targetSelect.addEventListener('change', applyFilter);
  if (deviceSelect) deviceSelect.addEventListener('change', applyFilter);
}

function setupBasemapSwitcher() {
  const basemapSelect = document.getElementById('basemap-select');
  if (!basemapSelect) return;

  basemapSelect.addEventListener('change', () => {
    const selected = basemapSelect.value;
    if (basemapStyles[selected]) {
      map.setStyle(basemapStyles[selected]);

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
    }
  });
}
