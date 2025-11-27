// Load config.json dynamically
fetch('config.json')
  .then(response => response.json())
  .then(config => {
    // Build basemap dictionary
    const baseMaps = {};
    for (const key in config.basemaps) {
      const bm = config.basemaps[key];
      baseMaps[bm.name] = L.tileLayer(bm.url, { attribution: bm.attribution });
    }

    // Default basemap
    const defaultName = config.basemaps[config.defaultBasemap].name;
    const defaultBase = baseMaps[defaultName];

    // --- Build overlays dictionary ---
    const overlays = {};
    if (config.overlays) {
      for (const key in config.overlays) {
        const ov = config.overlays[key];
        overlays[ov.name] = L.tileLayer(ov.url, {
          tms: !!ov.tms,
          minZoom: ov.minZoom ?? 0,
          maxZoom: ov.maxZoom ?? 25,
          opacity: ov.opacity ?? 1.0,
          attribution: ov.attribution
        });
      }
    } else if (config.orthomosaic) {
      // Fallback for legacy single orthomosaic configs
      const ortho = L.tileLayer(config.orthomosaic.url, {
        tms: !!config.orthomosaic.tms,
        minZoom: config.orthomosaic.minZoom ?? 0,
        maxZoom: config.orthomosaic.maxZoom ?? 25,
        opacity: config.orthomosaic.opacity ?? 1.0,
        attribution: config.orthomosaic.attribution
      });
      overlays[config.orthomosaic.name] = ortho;
    }

    // --- Init map with default basemap + all overlays ---
    const map = L.map('map', {
      center: config.center ?? [53.525, -0.397],
      zoom: config.zoom ?? 15,
      layers: [defaultBase, ...Object.values(overlays)]
    });

    // --- Layer controls: basemaps vs overlays ---
    L.control.layers(baseMaps, overlays, { position: 'topright' }).addTo(map);

    // --- Opacity slider tied to the topmost overlay ---
    function getTopOverlay() {
      const layers = Object.values(map._layers);
      const overlayLayers = layers.filter(l => Object.values(overlays).includes(l));
      return overlayLayers[overlayLayers.length - 1]; // topmost overlay
    }

    function attachOpacitySlider(layer) {
      if (!layer) return;

      const opacityControl = L.control({ position: 'bottomleft' });
      opacityControl.onAdd = function () {
        const div = L.DomUtil.create('div', 'leaflet-bar');
        div.style.padding = '8px';
        div.style.background = 'white';
        div.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';
        div.style.minWidth = '160px';
        div.innerHTML = `
          <label style="font:12px/1.2 sans-serif; display:block;">
            <strong>${layer.options.name || 'Opacity'}:</strong>
            <input id="overlay-opacity" type="range" min="0" max="1" step="0.05"
                   value="${layer.options.opacity ?? 1}" style="width:100%;">
          </label>
        `;
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        return div;
      };
      opacityControl.addTo(map);

      setTimeout(() => {
        const slider = document.getElementById('overlay-opacity');
        if (slider) {
          slider.addEventListener('input', e => {
            layer.setOpacity(parseFloat(e.target.value));
          });
        }
      }, 0);
    }

    // Attach slider to whichever overlay is currently on top
    attachOpacitySlider(getTopOverlay());

    // Update slider whenever overlays change
    function refreshOpacitySlider() {
  const old = document.querySelector('#overlay-opacity')?.closest('.leaflet-bar');
  if (old) old.remove();
  attachOpacitySlider(getTopOverlay());
}

map.on('overlayadd', refreshOpacitySlider);
map.on('overlayremove', refreshOpacitySlider);


    // --- PolylineMeasure tool (bottom-right) ---
    L.control.polylineMeasure({
      position: 'bottomright',
      unit: 'metres',
      showBearings: true,
      clearMeasurementsOnStop: true,
      showClearControl: true,
      showUnitControl: true
    }).addTo(map);

    // --- Console summary for debugging ---
    console.log("=== Viewer Config Summary ===");
    console.log("Default basemap:", defaultName);
    console.log("Available basemaps:", Object.keys(config.basemaps));
    if (config.overlays) {
      console.log("Overlays:", Object.keys(config.overlays));
    } else if (config.orthomosaic) {
      console.log("Orthomosaic URL:", config.orthomosaic.url);
    }
    console.log("Center:", config.center);
    console.log("Zoom:", config.zoom);
    console.log("=============================");
  })
  .catch(err => console.error("Config load error:", err));
