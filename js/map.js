/**
 * Wara Wiri - Interactive Destination Map Picker (Leaflet.js)
 * Supports all 29 destinations with custom Calm Burgundy pins,
 * reliable Esri & OSM tile layers (no API key required),
 * regional filtering (Semua, Indonesia, Asia, Eropa), and quick-booking selection.
 */

class DestinationMap {
  constructor(containerId = "interactiveMap") {
    this.containerId = containerId;
    this.map = null;
    this.markersGroup = null;
    this.activeRegion = "all";
  }

  init() {
    const mapElement = document.getElementById(this.containerId);
    if (!mapElement) return;

    // Center map around Southeast Asia - Europe corridor
    this.map = L.map(this.containerId, {
      center: [18.0, 78.0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 16,
      scrollWheelZoom: false
    });

    // High quality Esri World Street Map tiles - reliable, ultra-clean, no watermark, no API key required!
    const esriLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; National Geographic, Esri, DeLorme, NAVTEQ',
      maxZoom: 18
    });

    esriLayer.addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);

    // Initial render of all markers
    this.renderMarkers();

    // Map controls: allow wheel zoom after user clicks on map
    this.map.on("click", () => {
      this.map.scrollWheelZoom.enable();
    });

    // Invalidate map size after initialization to prevent blank tile rendering
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 400);

    // Also invalidate size on window resize
    window.addEventListener("resize", () => {
      if (this.map) {
        this.map.invalidateSize();
      }
    });
  }

  filterRegion(region) {
    this.activeRegion = region;
    this.renderMarkers();

    if (region === "indonesia") {
      // Zoom into Indonesia archipelago
      this.map.flyTo([-2.5, 118.0], 5, { duration: 1.2 });
    } else if (region === "asia") {
      // Zoom into Asia
      this.map.flyTo([22.0, 110.0], 4, { duration: 1.2 });
    } else if (region === "eropa") {
      // Zoom into Europe
      this.map.flyTo([48.0, 8.0], 4.5, { duration: 1.2 });
    } else {
      // Zoom out to global view
      this.map.flyTo([18.0, 78.0], 3, { duration: 1.2 });
    }

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 300);
  }

  createBurgundyIcon(destination) {
    return L.divIcon({
      className: "custom-map-pin",
      html: `
        <div class="pin-marker group cursor-pointer transform hover:scale-125 transition-all duration-300">
          <div class="relative flex items-center justify-center">
            <div class="pin-glow absolute w-8 h-8 rounded-full bg-[#800020] opacity-25 animate-ping"></div>
            <div class="pin-body w-7 h-7 rounded-full bg-[#6B1D2F] border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div class="pin-tail absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#6B1D2F]"></div>
          </div>
          <div class="pin-label mt-1 px-1.5 py-0.5 bg-white/95 text-[#6B1D2F] text-[10px] font-bold rounded shadow-sm whitespace-nowrap border border-slate-200 text-center">
            ${destination.name}
          </div>
        </div>
      `,
      iconSize: [40, 50],
      iconAnchor: [20, 35],
      popupAnchor: [0, -32]
    });
  }

  renderMarkers() {
    if (!this.markersGroup) return;
    this.markersGroup.clearLayers();

    const filtered = WARA_DATA.destinations.filter(dest => {
      if (this.activeRegion === "all") return true;
      return dest.region === this.activeRegion;
    });

    filtered.forEach(dest => {
      const marker = L.marker([dest.lat, dest.lng], {
        icon: this.createBurgundyIcon(dest)
      });

      const popupContent = `
        <div class="destination-popup p-1 font-sans" style="min-width: 240px; max-width: 280px;">
          <div class="relative h-28 rounded-lg overflow-hidden mb-2">
            <img src="${dest.image}" alt="${dest.name}" class="w-full h-full object-cover">
            <div class="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-bold text-[#6B1D2F]">
              ${dest.region.toUpperCase()} • ${dest.code}
            </div>
            <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-semibold text-white flex items-center gap-1">
              <span>🌡️</span> ${dest.weather.temp}°C
            </div>
          </div>

          <h4 class="font-extrabold text-[#6B1D2F] text-base leading-tight">${dest.name}</h4>
          <p class="text-xs text-slate-500 font-medium mb-1.5">${dest.country}</p>
          <p class="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">${dest.description}</p>

          <div class="flex items-center justify-between pt-2 border-t border-slate-100 mb-2.5">
            <div>
              <span class="text-[10px] text-slate-400 block font-medium">Mulai Dari</span>
              <span class="text-xs font-extrabold text-[#800020]">${formatRupiah(dest.flightPriceStart)}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                ${dest.hasBusRoute ? "Pesawat & Bus" : "Pesawat"}
              </span>
            </div>
          </div>

          <div class="flex gap-1.5">
            <button onclick="window.selectDestinationFromMap('${dest.id}', '${dest.name}')" 
                    class="flex-1 bg-[#6B1D2F] hover:bg-[#800020] text-white text-xs font-bold py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm">
              <span>Pilih Tujuan</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
            <button onclick="window.showDestinationModal('${dest.id}')" 
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors" title="Lihat Panduan Kota">
              ℹ️ Info
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: "custom-leaflet-popup"
      });

      this.markersGroup.addLayer(marker);
    });
  }

  focusCity(cityId) {
    const dest = WARA_DATA.destinations.find(d => d.id === cityId);
    if (dest && this.map) {
      this.map.flyTo([dest.lat, dest.lng], 8, { duration: 1.5 });
      setTimeout(() => {
        this.markersGroup.eachLayer(layer => {
          const latLng = layer.getLatLng();
          if (Math.abs(latLng.lat - dest.lat) < 0.001 && Math.abs(latLng.lng - dest.lng) < 0.001) {
            layer.openPopup();
          }
        });
      }, 1600);
    }
  }
}

// Global instance
window.DestinationMapInstance = new DestinationMap();
