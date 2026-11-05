/**
 * Wara Wiri - Dynamic Search Engine & Real-Time Filters
 * Intelligent Destination Route Matching Engine:
 * Flights, Buses, Hotels, and Tours strictly and dynamically match
 * the user's selected origin and destination (e.g. Berlin shows Lufthansa & Qatar to Berlin, NOT Jogja or Bali!).
 */

class SearchManager {
  constructor() {
    this.activeTab = "flight";
    this.currentFilters = {
      maxPrice: 20000000,
      transit: "all", // all, direct, 1transit
      hotelStars: "all", // all, 4, 5
      airline: "all",
      busOperator: "all",
      sort: "cheapest" // cheapest, fastest, rating
    };
    this.searchParams = {
      origin: "jkt",
      destination: "bali",
      departureDate: "2026-11-20",
      returnDate: "2026-11-24",
      passengers: 1,
      rooms: 1
    };
  }

  init() {
    this.populateCitySelects();
    this.renderSearchResults();
  }

  populateCitySelects() {
    const originSelect = document.getElementById("searchOriginSelect");
    const destSelect = document.getElementById("searchDestSelect");
    if (!originSelect || !destSelect) return;

    const indonesias = WARA_DATA.destinations.filter(d => d.region === "indonesia");
    const asias = WARA_DATA.destinations.filter(d => d.region === "asia");
    const europes = WARA_DATA.destinations.filter(d => d.region === "eropa");

    const buildOptions = () => `
      <optgroup label="🇮🇩 Indonesia (Prioritas)">
        ${indonesias.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join("")}
      </optgroup>
      <optgroup label="🌏 Asia (Pilihan Internasional)">
        ${asias.map(d => `<option value="${d.id}">${d.name} - ${d.country} (${d.code})</option>`).join("")}
      </optgroup>
      <optgroup label="🌍 Eropa (Kota Utama)">
        ${europes.map(d => `<option value="${d.id}">${d.name} - ${d.country} (${d.code})</option>`).join("")}
      </optgroup>
    `;

    originSelect.innerHTML = buildOptions();
    destSelect.innerHTML = buildOptions();

    // Default values
    originSelect.value = "jkt";
    destSelect.value = "bali";
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab button styles
    const tabButtons = document.querySelectorAll(".hero-search-tab");
    tabButtons.forEach(btn => {
      const isTarget = btn.getAttribute("data-tab") === tabName;
      if (isTarget) {
        btn.classList.add("bg-[#6B1D2F]", "text-white", "shadow-md");
        btn.classList.remove("text-slate-600", "hover:bg-slate-100", "bg-transparent");
      } else {
        btn.classList.remove("bg-[#6B1D2F]", "text-white", "shadow-md");
        btn.classList.add("text-slate-600", "hover:bg-slate-100", "bg-transparent");
      }
    });

    // Toggle origin field visibility
    const originWrapper = document.getElementById("originInputWrapper");
    const destLabel = document.getElementById("destInputLabel");
    if (originWrapper && destLabel) {
      if (tabName === "hotel" || tabName === "wisata") {
        originWrapper.classList.add("hidden");
        destLabel.textContent = tabName === "hotel" ? "Kota / Lokasi Menginap" : "Kota Destinasi Wisata";
      } else {
        originWrapper.classList.remove("hidden");
        destLabel.textContent = "Ke (Kota Tujuan)";
      }
    }

    this.renderSearchResults();
  }

  setDestination(cityId, cityName) {
    const destSelect = document.getElementById("searchDestSelect");
    if (destSelect) {
      destSelect.value = cityId;
    }
    this.searchParams.destination = cityId;

    // Update weather
    window.WeatherServiceInstance.updateNavbarWidget(cityId);

    // Render results
    this.renderSearchResults();

    // Scroll to results
    const resultsSec = document.getElementById("searchResultsSection");
    if (resultsSec) {
      resultsSec.scrollIntoView({ behavior: "smooth" });
    }

    window.showToast(`Destinasi tujuan diubah ke ${cityName}`, "info");
  }

  handleSearchSubmit(e) {
    if (e) e.preventDefault();

    const originSelect = document.getElementById("searchOriginSelect");
    const destSelect = document.getElementById("searchDestSelect");
    const dateInput = document.getElementById("searchDateInput");

    if (originSelect) this.searchParams.origin = originSelect.value;
    if (destSelect) this.searchParams.destination = destSelect.value;
    if (dateInput && dateInput.value) this.searchParams.departureDate = dateInput.value;

    window.WeatherServiceInstance.updateNavbarWidget(this.searchParams.destination);
    this.renderSearchResults();

    const resultsSec = document.getElementById("searchResultsSection");
    if (resultsSec) {
      resultsSec.scrollIntoView({ behavior: "smooth" });
    }
  }

  updateMaxPriceFilter(value) {
    this.currentFilters.maxPrice = parseInt(value);
    const label = document.getElementById("filterPriceValue");
    if (label) {
      label.textContent = formatRupiah(value);
    }
    this.renderSearchResults();
  }

  updateTransitFilter(transitVal) {
    this.currentFilters.transit = transitVal;
    this.renderSearchResults();
  }

  updateHotelStarsFilter(starVal) {
    this.currentFilters.hotelStars = starVal;
    this.renderSearchResults();
  }

  updateSort(sortVal) {
    this.currentFilters.sort = sortVal;
    this.renderSearchResults();
  }

  renderSearchResults() {
    const container = document.getElementById("searchResultsGrid");
    const countEl = document.getElementById("searchResultCount");
    const headerTitle = document.getElementById("searchResultsTitle");
    if (!container) return;

    const origObj = WARA_DATA.destinations.find(d => d.id === this.searchParams.origin) || WARA_DATA.destinations[0];
    const destObj = WARA_DATA.destinations.find(d => d.id === this.searchParams.destination) || WARA_DATA.destinations[1];

    if (this.activeTab === "flight") {
      headerTitle.innerHTML = `Penerbangan ${origObj.name} (${origObj.code}) ke <span class="text-[#800020]">${destObj.name} (${destObj.code})</span>`;
      this.renderFlights(container, countEl, origObj, destObj);
    } else if (this.activeTab === "bus") {
      headerTitle.innerHTML = `Bus Antar-Kota ${origObj.name} ke <span class="text-[#800020]">${destObj.name}</span>`;
      this.renderBuses(container, countEl, origObj, destObj);
    } else if (this.activeTab === "hotel") {
      headerTitle.innerHTML = `Hotel Ternama & Tepercaya di <span class="text-[#800020]">${destObj.name}</span>`;
      this.renderHotels(container, countEl, destObj);
    } else if (this.activeTab === "wisata") {
      headerTitle.innerHTML = `Atraksi & Wisata Ikonik di <span class="text-[#800020]">${destObj.name}</span>`;
      this.renderWisata(container, countEl, destObj);
    } else if (this.activeTab === "bundling") {
      headerTitle.innerHTML = `Paket Bundling Liburan Hemat`;
      this.renderBundling(container, countEl, destObj);
    }
  }

  // --- DYNAMIC FLIGHT ROUTE GENERATOR & MATCHER ---
  getDynamicFlightsForRoute(origObj, destObj) {
    if (origObj.id === destObj.id) {
      return [];
    }

    const basePrice = destObj.flightPriceStart || 1200000;
    const isDomestic = destObj.region === "indonesia" && origObj.region === "indonesia";
    const isAsia = destObj.region === "asia";
    const isEurope = destObj.region === "eropa";

    let flightTemplates = [];

    if (isDomestic) {
      // Domestic Indonesian Flight Routes
      flightTemplates = [
        {
          airline: "Garuda Indonesia",
          flightNumber: `GA-${Math.floor(200 + Math.random() * 400)}`,
          logo: "🦅",
          departureTime: "07:30",
          arrivalTime: "09:45",
          duration: "2j 15m",
          transit: "Langsung",
          transitCount: 0,
          priceFactor: 1.35,
          baggage: "20 kg Bagasi + 7 kg Kabin",
          meal: "Makanan Hangat & Minuman",
          aircraft: "Boeing 737-800",
          seatsAvailable: 14
        },
        {
          airline: "Batik Air",
          flightNumber: `ID-${Math.floor(6000 + Math.random() * 800)}`,
          logo: "🕊️",
          departureTime: "11:15",
          arrivalTime: "13:35",
          duration: "2j 20m",
          transit: "Langsung",
          transitCount: 0,
          priceFactor: 1.15,
          baggage: "20 kg Bagasi",
          meal: "Snack & Minum",
          aircraft: "Airbus A320",
          seatsAvailable: 18
        },
        {
          airline: "Citilink",
          flightNumber: `QG-${Math.floor(100 + Math.random() * 500)}`,
          logo: "✈️",
          departureTime: "14:40",
          arrivalTime: "17:00",
          duration: "2j 20m",
          transit: "Langsung",
          transitCount: 0,
          priceFactor: 1.0,
          baggage: "20 kg Bagasi",
          meal: "Berbayar Onboard",
          aircraft: "Airbus A320neo",
          seatsAvailable: 9
        },
        {
          airline: "Super Air Jet",
          flightNumber: `IU-${Math.floor(700 + Math.random() * 200)}`,
          logo: "⚡",
          departureTime: "17:25",
          arrivalTime: "19:45",
          duration: "2j 20m",
          transit: "Langsung",
          transitCount: 0,
          priceFactor: 0.92,
          baggage: "20 kg Bagasi",
          meal: "Berbayar Onboard",
          aircraft: "Airbus A320",
          seatsAvailable: 22
        }
      ];
    } else if (isAsia) {
      // Asian International Routes
      const isShortAsia = ["sin", "kul", "bkk"].includes(destObj.id);

      flightTemplates = [
        {
          airline: destObj.id === "tyo" || destObj.id === "osa" ? "All Nippon Airways (ANA)" :
                   destObj.id === "sin" ? "Singapore Airlines" :
                   destObj.id === "sel" ? "Korean Air" :
                   destObj.id === "bkk" ? "Thai Airways" :
                   destObj.id === "kul" ? "Malaysia Airlines" : "Singapore Airlines",
          flightNumber: destObj.id === "tyo" || destObj.id === "osa" ? `NH-${Math.floor(850 + Math.random() * 20)}` :
                        destObj.id === "sin" ? `SQ-${Math.floor(950 + Math.random() * 20)}` :
                        destObj.id === "sel" ? `KE-${Math.floor(620 + Math.random() * 20)}` :
                        destObj.id === "bkk" ? `TG-${Math.floor(430 + Math.random() * 20)}` :
                        destObj.id === "kul" ? `MH-${Math.floor(710 + Math.random() * 20)}` : `SQ-${Math.floor(800 + Math.random() * 100)}`,
          logo: destObj.country === "Jepang" ? "🇯🇵" : destObj.country === "Singapura" ? "🇸🇬" : "🌏",
          departureTime: "06:15",
          arrivalTime: isShortAsia ? "09:05" : "15:45",
          duration: isShortAsia ? "1j 50m" : "7j 30m",
          transit: isShortAsia ? "Langsung" : "Langsung",
          transitCount: 0,
          priceFactor: 1.25,
          baggage: "25 kg Bagasi + Entertainment",
          meal: "Hot Gourmet Meal & Fine Drinks",
          aircraft: "Boeing 787-9 Dreamliner",
          seatsAvailable: 12
        },
        {
          airline: "Garuda Indonesia",
          flightNumber: `GA-${Math.floor(860 + Math.random() * 40)}`,
          logo: "🦅",
          departureTime: "10:30",
          arrivalTime: isShortAsia ? "13:20" : "19:50",
          duration: isShortAsia ? "1j 50m" : "7j 20m",
          transit: "Langsung",
          transitCount: 0,
          priceFactor: 1.1,
          baggage: "30 kg Bagasi",
          meal: "Full Indonesian Gourmet Course",
          aircraft: "Airbus A330-900neo",
          seatsAvailable: 16
        },
        {
          airline: "AirAsia International",
          flightNumber: `QZ-${Math.floor(200 + Math.random() * 300)}`,
          logo: "🔴",
          departureTime: "15:20",
          arrivalTime: isShortAsia ? "18:10" : "00:45 (+1)",
          duration: isShortAsia ? "1j 50m" : "8j 25m",
          transit: isShortAsia ? "Langsung" : "1 Transit (Kuala Lumpur)",
          transitCount: isShortAsia ? 0 : 1,
          priceFactor: 0.85,
          baggage: "7 kg Kabin (Add-on Bagasi)",
          meal: "Pre-book Santan Meals",
          aircraft: "Airbus A320 / A330",
          seatsAvailable: 25
        }
      ];
    } else if (isEurope) {
      // European Routes (e.g. Berlin, Paris, London, Amsterdam, Rome, Zurich, Barcelona)
      const euroFlagCarrier = destObj.id === "ber" ? { name: "Lufthansa", num: "LH-779", logo: "🇩🇪", hub: "Frankfurt (FRA)" } :
                              destObj.id === "par" ? { name: "Air France", num: "AF-257", logo: "🇫🇷", hub: "Paris (CDG)" } :
                              destObj.id === "lon" ? { name: "British Airways", num: "BA-12", logo: "🇬🇧", hub: "London (LHR)" } :
                              destObj.id === "ams" ? { name: "KLM Royal Dutch Airlines", num: "KL-810", logo: "🇳🇱", hub: "Amsterdam (AMS)" } :
                              destObj.id === "rom" ? { name: "ITA Airways / Qatar", num: "AZ-782", logo: "🇮🇹", hub: "Rome (FCO)" } :
                              destObj.id === "zrh" ? { name: "Swiss International", num: "LX-177", logo: "🇨🇭", hub: "Zurich (ZRH)" } :
                              { name: "Qatar Airways", num: "QR-141", logo: "🇶🇦", hub: "Doha (DOH)" };

      flightTemplates = [
        {
          airline: euroFlagCarrier.name,
          flightNumber: euroFlagCarrier.num,
          logo: euroFlagCarrier.logo,
          departureTime: "18:25",
          arrivalTime: "07:35 (+1)",
          duration: "17j 10m",
          transit: `1 Transit (${euroFlagCarrier.hub})`,
          transitCount: 1,
          priceFactor: 1.08,
          baggage: "2 x 23 kg Bagasi",
          meal: "2x Full Gourmet Course + Wine/Drinks",
          aircraft: "Boeing 777-300ER / A350",
          seatsAvailable: 8
        },
        {
          airline: "Qatar Airways",
          flightNumber: `QR-${Math.floor(950 + Math.random() * 20)}`,
          logo: "🇶🇦",
          departureTime: "19:15",
          arrivalTime: "06:50 (+1)",
          duration: "16j 35m",
          transit: "1 Transit (Hamad Intl Doha 2j 10m)",
          transitCount: 1,
          priceFactor: 1.0,
          baggage: "30 kg Bagasi",
          meal: "World Best Business & Economy Dining",
          aircraft: "Airbus A350-1000",
          seatsAvailable: 11
        },
        {
          airline: "Emirates",
          flightNumber: `EK-${Math.floor(350 + Math.random() * 20)}`,
          logo: "🇦🇪",
          departureTime: "17:40",
          arrivalTime: "07:15 (+1)",
          duration: "18j 35m",
          transit: "1 Transit (Dubai DXB 2j 30m)",
          transitCount: 1,
          priceFactor: 1.12,
          baggage: "30 kg Bagasi + Entertainment ICE",
          meal: "Multi-course Gourmet Meals",
          aircraft: "Airbus A380 Superjumbo",
          seatsAvailable: 14
        },
        {
          airline: "Turkish Airlines",
          flightNumber: "TK-57",
          logo: "🇹🇷",
          departureTime: "21:00",
          arrivalTime: "09:40 (+1)",
          duration: "17j 40m",
          transit: "1 Transit (Istanbul IST 1j 50m)",
          transitCount: 1,
          priceFactor: 0.95,
          baggage: "30 kg Bagasi",
          meal: "Flying Chef Signature Dining",
          aircraft: "Boeing 787-9 Dreamliner",
          seatsAvailable: 17
        }
      ];
    }

    return flightTemplates.map((t, idx) => ({
      id: `dyn-fl-${destObj.id}-${idx + 1}`,
      airline: t.airline,
      flightNumber: t.flightNumber,
      logo: t.logo,
      origin: `${origObj.name} (${origObj.code})`,
      originCode: origObj.code,
      destination: `${destObj.name} (${destObj.code})`,
      destinationCode: destObj.code,
      departureTime: t.departureTime,
      arrivalTime: t.arrivalTime,
      duration: t.duration,
      transit: t.transit,
      transitCount: t.transitCount,
      price: Math.round(basePrice * t.priceFactor / 10000) * 10000,
      baggage: t.baggage,
      meal: t.meal,
      aircraft: t.aircraft,
      seatsAvailable: t.seatsAvailable
    }));
  }

  // --- RENDER FLIGHTS (Accurately filtered by destination!) ---
  renderFlights(container, countEl, origObj, destObj) {
    if (origObj.id === destObj.id) {
      countEl.textContent = "Kota asal dan tujuan tidak boleh sama";
      container.innerHTML = `
        <div class="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
          <div class="text-3xl mb-2">🛫</div>
          <h4 class="font-bold text-slate-800 text-sm">Kota Asal dan Tujuan Sama</h4>
          <p class="text-xs text-slate-500 mt-1">Silakan pilih kota tujuan yang berbeda dari kota keberangkatan Anda.</p>
        </div>
      `;
      return;
    }

    let list = this.getDynamicFlightsForRoute(origObj, destObj);

    // Apply price filter
    list = list.filter(f => f.price <= this.currentFilters.maxPrice);

    // Apply transit filter
    if (this.currentFilters.transit === "direct") {
      list = list.filter(f => f.transitCount === 0);
    } else if (this.currentFilters.transit === "transit") {
      list = list.filter(f => f.transitCount > 0);
    }

    // Sorting
    if (this.currentFilters.sort === "cheapest") list.sort((a, b) => a.price - b.price);
    else if (this.currentFilters.sort === "fastest") list.sort((a, b) => a.duration.localeCompare(b.duration));

    countEl.textContent = `Menampilkan ${list.length} penerbangan resmi ${origObj.name} (${origObj.code}) ke ${destObj.name} (${destObj.code})`;

    if (list.length === 0) {
      container.innerHTML = this.getEmptyState(`Tidak ada penerbangan ke ${destObj.name} yang sesuai dengan filter harga atau transit saat ini.`);
      return;
    }

    container.innerHTML = list.map(f => `
      <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 group">
        <!-- Airline Info & Schedule -->
        <div class="flex-1 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-xl shadow-inner border border-rose-100 flex-shrink-0">
              ${f.logo}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-black text-slate-800 text-base">${f.airline}</h4>
                <span class="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">${f.flightNumber}</span>
                <span class="text-[11px] text-slate-400 font-medium">• ${f.aircraft}</span>
              </div>
              <div class="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                <span class="flex items-center gap-1">🧳 ${f.baggage}</span>
                <span class="flex items-center gap-1">🍽️ ${f.meal}</span>
              </div>
            </div>
          </div>

          <!-- Time & Route Flow -->
          <div class="flex items-center gap-4 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
            <div class="text-left min-w-[70px]">
              <span class="text-xl font-black text-slate-800 block leading-tight">${f.departureTime}</span>
              <span class="text-xs font-black text-[#6B1D2F]">${f.originCode}</span>
              <span class="text-[10px] text-slate-400 block truncate max-w-[100px]">${f.origin}</span>
            </div>

            <div class="flex-1 flex flex-col items-center px-2">
              <span class="text-[11px] font-bold text-slate-600 mb-0.5">⏱️ ${f.duration}</span>
              <div class="relative w-full flex items-center">
                <div class="h-[2px] bg-slate-300 w-full"></div>
                <span class="absolute left-1/2 -translate-x-1/2 text-[10px] bg-white px-2.5 py-0.5 rounded-full border border-slate-300 text-[#6B1D2F] font-bold shadow-xs whitespace-nowrap">
                  ${f.transit}
                </span>
              </div>
              <span class="text-[10px] text-emerald-600 font-bold mt-1">Estimasi Tiba: ${f.arrivalTime}</span>
            </div>

            <div class="text-right min-w-[70px]">
              <span class="text-xl font-black text-slate-800 block leading-tight">${f.arrivalTime}</span>
              <span class="text-xs font-black text-[#800020]">${f.destinationCode}</span>
              <span class="text-[10px] text-slate-400 block truncate max-w-[100px]">${f.destination}</span>
            </div>
          </div>
        </div>

        <!-- Price & CTA -->
        <div class="md:w-56 md:border-l md:border-slate-100 md:pl-6 flex flex-col justify-between items-end gap-3 text-right">
          <div>
            <span class="text-xs text-slate-400 font-medium block">Harga per Penumpang</span>
            <div class="text-xl sm:text-2xl font-black text-[#800020]">${formatRupiah(f.price)}</div>
            <span class="text-[11px] text-amber-600 font-semibold block mt-0.5">Sisa ${f.seatsAvailable} kursi tersedia</span>
          </div>

          <div class="w-full flex flex-col gap-2">
            <button onclick="window.startFlightBookingObj('${encodeURIComponent(JSON.stringify(f))}')" 
                    class="w-full bg-[#6B1D2F] hover:bg-[#800020] text-white font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-98">
              <span>Pilih Kursi & Pesan</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
            <button onclick="window.quickBookingFlightObj('${encodeURIComponent(JSON.stringify(f))}')" 
                    class="w-full bg-rose-50 hover:bg-rose-100 text-[#6B1D2F] font-bold text-xs py-1.5 px-3 rounded-lg transition-colors">
              Pesan Langsung
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }

  // --- RENDER BUSES (Intelligently restricted to valid Indonesian ground routes) ---
  renderBuses(container, countEl, origObj, destObj) {
    if (destObj.region !== "indonesia") {
      countEl.textContent = `Layanan bus hanya melayani rute domestik Indonesia`;
      container.innerHTML = `
        <div class="text-center py-12 px-6 bg-white rounded-3xl border border-slate-200 space-y-4">
          <div class="w-14 h-14 rounded-full bg-amber-50 text-amber-800 text-2xl flex items-center justify-center mx-auto border border-amber-200">
            🚌
          </div>
          <div class="max-w-md mx-auto">
            <h4 class="font-black text-slate-800 text-base mb-1">Rute Bus Tidak Tersedia untuk ${destObj.name} (${destObj.country})</h4>
            <p class="text-xs text-slate-500 leading-relaxed">
              Layanan bus antar-kota Wara Wiri khusus melayani jalur darat dan penyeberangan feri di wilayah Indonesia. Untuk bepergian ke <b>${destObj.name}</b>, silakan gunakan tiket penerbangan internasional resmi.
            </p>
          </div>
          <button onclick="window.SearchManagerInstance.switchTab('flight')" 
                  class="bg-[#6B1D2F] hover:bg-[#800020] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm inline-flex items-center gap-2">
            <span>✈️ Cari Tiket Pesawat ke ${destObj.name}</span>
          </button>
        </div>
      `;
      return;
    }

    // Domestic Indonesian bus generation
    const busList = [
      {
        id: `bus-${origObj.id}-${destObj.id}-1`,
        operator: "DayTrans Executive Shuttle",
        busClass: "Executive Captain Seat",
        logo: "🚐",
        origin: `${origObj.name} (Pool Utama)`,
        destination: `${destObj.name} (Terminal Pusat)`,
        departureTime: "07:00",
        arrivalTime: "11:30",
        duration: "4j 30m",
        price: 185000,
        amenities: ["Captain Seat Ergonomis", "Full AC Dingin", "USB Fast Charger", "Air Mineral Botol", "Bagasi 15kg"],
        seatsAvailable: 6
      },
      {
        id: `bus-${origObj.id}-${destObj.id}-2`,
        operator: "Sinar Jaya Suite Class",
        busClass: "Sleeper Suite Class",
        logo: "🚌",
        origin: `${origObj.name} (Terminal Terpadu)`,
        destination: `${destObj.name} (Terminal Kedatangan)`,
        departureTime: "18:30",
        arrivalTime: "05:00 (+1)",
        duration: "10j 30m",
        price: 380000,
        amenities: ["Reclining Bed 180° Full Flat", "Personal AVOD TV", "Bantal Selimut", "Makan Malam Prasmanan", "Toilet Bersih"],
        seatsAvailable: 4
      },
      {
        id: `bus-${origObj.id}-${destObj.id}-3`,
        operator: "Rosalia Indah Super Top",
        busClass: "Super Top SHD 2-1",
        logo: "🚌",
        origin: `${origObj.name}`,
        destination: `${destObj.name}`,
        departureTime: "19:30",
        arrivalTime: "06:15 (+1)",
        duration: "10j 45m",
        price: 320000,
        amenities: ["Konfigurasi Kursi 2-1 Lega", "Legrest Lebar", "Makan Malam Gratis", "Pramugara Onboard", "USB Charger"],
        seatsAvailable: 8
      }
    ];

    countEl.textContent = `Menampilkan ${busList.length} jadwal bus eksekutif ${origObj.name} ke ${destObj.name}`;

    container.innerHTML = busList.map(b => `
      <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 group">
        <div class="flex-1 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shadow-inner border border-amber-100 flex-shrink-0">
              ${b.logo}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-slate-800 text-base">${b.operator}</h4>
                <span class="text-[11px] font-bold bg-[#6B1D2F]/10 text-[#6B1D2F] px-2 py-0.5 rounded">${b.busClass}</span>
              </div>
              <p class="text-xs text-slate-500 font-medium mt-0.5">Berangkat: ${b.origin}</p>
            </div>
          </div>

          <div class="flex items-center gap-4 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
            <div class="text-left">
              <span class="text-lg font-black text-slate-800 block">${b.departureTime}</span>
              <span class="text-xs font-semibold text-slate-500">${origObj.name}</span>
            </div>

            <div class="flex-1 flex flex-col items-center px-2">
              <span class="text-[11px] font-bold text-slate-500 mb-0.5">Durasi ${b.duration}</span>
              <div class="relative w-full flex items-center">
                <div class="h-[2px] bg-slate-300 w-full"></div>
                <span class="absolute left-1/2 -translate-x-1/2 text-[10px] bg-white px-2 py-0.2 rounded-full border border-slate-200 text-slate-600 font-semibold whitespace-nowrap">
                  Executive Tol
                </span>
              </div>
              <span class="text-[10px] text-emerald-600 font-semibold mt-1">Estimasi Tiba: ${b.arrivalTime}</span>
            </div>

            <div class="text-right">
              <span class="text-lg font-black text-slate-800 block">${b.arrivalTime}</span>
              <span class="text-xs font-semibold text-slate-500">${destObj.name}</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-1.5 pt-1">
            ${b.amenities.map(a => `<span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">✓ ${a}</span>`).join("")}
          </div>
        </div>

        <div class="md:w-56 md:border-l md:border-slate-100 md:pl-6 flex flex-col justify-between items-end gap-3 text-right">
          <div>
            <span class="text-xs text-slate-400 font-medium block">Tarif per Kursi</span>
            <div class="text-xl sm:text-2xl font-black text-[#800020]">${formatRupiah(b.price)}</div>
            <span class="text-[11px] text-emerald-600 font-semibold block mt-0.5">Tersedia ${b.seatsAvailable} Kursi</span>
          </div>

          <button onclick="window.startBusBookingObj('${encodeURIComponent(JSON.stringify(b))}')" 
                  class="w-full bg-[#6B1D2F] hover:bg-[#800020] text-white font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5">
            <span>Pilih Kursi Bus</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      </div>
    `).join("");
  }

  // --- RENDER HOTELS (Specifically tailored for destObj) ---
  renderHotels(container, countEl, destObj) {
    let list = WARA_DATA.hotels.filter(h => h.cityId === destObj.id);

    // If no direct static hotel exists in basic array for that city, generate authentic luxury hotel options for that specific city!
    if (list.length === 0) {
      list = [
        {
          id: `h-${destObj.id}-1`,
          name: destObj.id === "ber" ? "Hotel Adlon Kempinski Berlin" :
                destObj.id === "par" ? "Hôtel Plaza Athénée Paris" :
                destObj.id === "lon" ? "The Ritz London" :
                destObj.id === "tyo" ? "Park Hyatt Tokyo" :
                destObj.id === "ams" ? "Conservatorium Hotel Amsterdam" :
                destObj.id === "rom" ? "Hotel de Russie Rome" :
                destObj.id === "bcn" ? "Hotel Arts Barcelona" :
                destObj.id === "zrh" ? "The Dolder Grand Zurich" :
                `The Grand Luxury Palace ${destObj.name}`,
          cityId: destObj.id,
          cityName: destObj.name,
          rating: 4.9,
          stars: 5,
          pricePerNight: Math.round(destObj.flightPriceStart * 0.45 / 10000) * 10000,
          image: destObj.image,
          address: `Kawasan Pusat Wisata & Bisnis Terpadu, ${destObj.name}`,
          roomTypes: ["Deluxe King Suite", "Executive Landmark View", "Presidential Suite"],
          amenities: ["Sarapan Mewah Prasmanan", "Rooftop Sky Pool", "Spa & Wellness Center", "Free High-speed 5G WiFi", "Airport Transfer"]
        },
        {
          id: `h-${destObj.id}-2`,
          name: destObj.id === "ber" ? "The Ritz-Carlton Berlin" :
                destObj.id === "par" ? "Le Meurice Paris" :
                destObj.id === "lon" ? "The Savoy London" :
                destObj.id === "tyo" ? "Imperial Hotel Tokyo" :
                `Boutique Heritage Hotel ${destObj.name}`,
          cityId: destObj.id,
          cityName: destObj.name,
          rating: 4.8,
          stars: 5,
          pricePerNight: Math.round(destObj.flightPriceStart * 0.38 / 10000) * 10000,
          image: destObj.heroImage || destObj.image,
          address: `Pusat Kota Sejarah, ${destObj.name}`,
          roomTypes: ["Premier City View", "Heritage Suite"],
          amenities: ["Michelin-starred Restaurant", "Indoor Heated Pool", "Fitness Center", "Concierge Service"]
        }
      ];
    }

    countEl.textContent = `Menampilkan ${list.length} hotel ternama & tepercaya di ${destObj.name}`;

    container.innerHTML = list.map(h => `
      <div class="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col lg:flex-row group">
        <div class="lg:w-2/5 relative h-56 lg:h-auto overflow-hidden">
          <img src="${h.image}" alt="${h.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute top-3 left-3 bg-[#6B1D2F] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <span>⭐ ${h.stars} Bintang Luxury</span>
          </div>
        </div>

        <div class="lg:w-3/5 p-5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-[#6B1D2F] uppercase tracking-wider">${h.cityName}</span>
              <div class="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-amber-700 text-xs font-extrabold border border-amber-200">
                <span>★</span> ${h.rating} / 5.0
              </div>
            </div>

            <h3 class="text-lg font-black text-slate-800 leading-snug group-hover:text-[#6B1D2F] transition-colors">${h.name}</h3>
            <p class="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">📍 ${h.address}</p>

            <div class="mt-3 flex flex-wrap gap-1.5">
              ${h.amenities.slice(0, 4).map(a => `<span class="text-[10px] font-semibold bg-rose-50/70 text-[#6B1D2F] px-2 py-0.5 rounded border border-rose-100">✓ ${a}</span>`).join("")}
            </div>

            <div class="mt-3 text-xs text-slate-600">
              <span class="font-bold text-slate-700">Pilihan Kamar:</span> ${h.roomTypes.join(" • ")}
            </div>
          </div>

          <div class="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-medium block">Mulai dari per malam</span>
              <span class="text-xl font-black text-[#800020]">${formatRupiah(h.pricePerNight)}</span>
            </div>

            <button onclick="window.bookHotelModal('${h.id}')" 
                    class="bg-[#6B1D2F] hover:bg-[#800020] text-white font-extrabold text-xs sm:text-sm py-2 px-4 rounded-xl shadow-sm transition-all flex items-center gap-1">
              <span>Pesan Kamar</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }

  // --- RENDER WISATA (Specifically tailored for destObj) ---
  renderWisata(container, countEl, destObj) {
    let list = WARA_DATA.attractions.filter(a => a.cityId === destObj.id);

    // If no direct static attraction, generate city highlight tour
    if (list.length === 0) {
      list = [
        {
          id: `att-${destObj.id}-1`,
          name: `Tur Ikonik & Sejarah Terbaik ${destObj.name}`,
          cityId: destObj.id,
          cityName: destObj.name,
          category: "City Landmark & Culture",
          rating: 4.9,
          reviews: "8.5k",
          price: Math.round(destObj.flightPriceStart * 0.08 / 10000) * 10000,
          image: destObj.image,
          description: `Eksplorasi destinasi ikonik paling memukau di ${destObj.name} dipandu pemandu profesional dan tiket antrean prioritas.`,
          highlights: ["Pemandu Berbahasa Indonesia / Inggris", "Tiket Jalur Cepat", "Dokumentasi Foto", "Transportasi AC"]
        }
      ];
    }

    countEl.textContent = `Menampilkan ${list.length} atraksi ikonik di ${destObj.name}`;

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
        ${list.map(a => `
          <div class="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
            <div class="relative h-48 overflow-hidden">
              <img src="${a.image}" alt="${a.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              <div class="absolute top-3 left-3 bg-[#6B1D2F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                ${a.category}
              </div>
              <div class="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-black px-2 py-0.5 rounded shadow">
                ⭐ ${a.rating} (${a.reviews})
              </div>
            </div>

            <div class="p-4 flex-1 flex flex-col justify-between">
              <div>
                <span class="text-[11px] font-bold text-slate-400 block">${a.cityName}</span>
                <h4 class="font-extrabold text-slate-800 text-base leading-tight group-hover:text-[#6B1D2F] transition-colors mb-1.5">${a.name}</h4>
                <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">${a.description}</p>
                <div class="flex flex-wrap gap-1 mb-3">
                  ${a.highlights.slice(0, 2).map(h => `<span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">✨ ${h}</span>`).join("")}
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-slate-400 block font-medium">Tiket Masuk</span>
                  <span class="text-base font-black text-[#800020]">${formatRupiah(a.price)}</span>
                </div>

                <div class="flex gap-1.5">
                  <button onclick="window.ItineraryInstance.addAttractionToItinerary('${a.id}')" 
                          class="bg-rose-50 hover:bg-rose-100 text-[#6B1D2F] text-xs font-bold px-2.5 py-1.5 rounded-lg border border-rose-100 transition-colors" title="Tambah ke Rencana Jadwal">
                    + Itinerary
                  </button>
                  <button onclick="window.bookAttractionTicket('${a.id}')" 
                          class="bg-[#6B1D2F] hover:bg-[#800020] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                    Beli Tiket
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  // --- RENDER BUNDLING ---
  renderBundling(container, countEl) {
    const list = WARA_DATA.bundlingPackages;
    countEl.textContent = `Menampilkan ${list.length} paket bundling hemat liburan`;

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        ${list.map(p => `
          <div class="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
            <div class="relative h-56 overflow-hidden">
              <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              <div class="absolute top-3 left-3 bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full shadow">
                🔥 Hemat ${p.discountPercent}%
              </div>
              <div class="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                ⏱️ ${p.duration}
              </div>
            </div>

            <div class="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span class="text-xs font-extrabold text-[#6B1D2F] uppercase tracking-wider">${p.destination}</span>
                <h4 class="text-lg font-black text-slate-800 leading-snug group-hover:text-[#6B1D2F] transition-colors mt-0.5 mb-2">${p.title}</h4>
                
                <div class="space-y-1.5 bg-rose-50/40 p-3 rounded-xl border border-rose-100 mb-4">
                  <span class="text-[11px] font-extrabold text-slate-700 block uppercase">Fasilitas Termasuk:</span>
                  ${p.includes.map(inc => `<div class="text-xs text-slate-600 flex items-center gap-1.5 font-medium"><span class="text-emerald-500 font-bold">✓</span> ${inc}</div>`).join("")}
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span class="text-xs text-slate-400 line-through block font-medium">${formatRupiah(p.originalPrice)}</span>
                  <span class="text-xl font-black text-[#800020]">${formatRupiah(p.discountPrice)}</span>
                </div>

                <button onclick="window.bookBundlingModal('${p.id}')" 
                        class="bg-[#6B1D2F] hover:bg-[#800020] text-white font-extrabold text-xs sm:text-sm py-2 px-4 rounded-xl shadow-sm transition-all">
                  Pesan Paket Ini
                </button>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  getEmptyState(msg) {
    return `
      <div class="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200">
        <div class="text-4xl mb-2">🔍</div>
        <h4 class="font-bold text-slate-700 text-base mb-1">Hasil Tidak Ditemukan</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mb-4">${msg}</p>
        <button onclick="window.resetSearchFilters()" class="bg-rose-50 text-[#6B1D2F] font-bold text-xs px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-100 transition-colors">
          Reset Filter Pencarian
        </button>
      </div>
    `;
  }
}

// Global instance
window.SearchManagerInstance = new SearchManager();
