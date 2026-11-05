/**
 * Wara Wiri - Interactive Itinerary Builder
 * Allows users to organize travel days, add attractions/hotels/transport,
 * drag-and-drop or reorder items, calculate estimated transit time, and print/export.
 */

class ItineraryBuilder {
  constructor() {
    this.activeDay = 1;
  }

  init() {
    this.render();
    window.addEventListener("itineraryUpdated", () => this.render());
  }

  getActiveDayData() {
    const it = UserState.itinerary;
    if (!it || !it.days || it.days.length === 0) return null;
    return it.days.find(d => d.dayNumber === this.activeDay) || it.days[0];
  }

  setActiveDay(dayNum) {
    this.activeDay = dayNum;
    this.render();
  }

  addDay() {
    const it = UserState.itinerary;
    const nextDayNum = (it.days.length || 0) + 1;
    it.days.push({
      dayNumber: nextDayNum,
      dateLabel: `Hari ${nextDayNum} - Eksplorasi Lanjutan`,
      items: []
    });
    UserState.saveItinerary();
    this.activeDay = nextDayNum;
    this.render();
    window.showToast(`Hari ${nextDayNum} berhasil ditambahkan ke Itinerary`, "success");
  }

  deleteDay(dayNum) {
    const it = UserState.itinerary;
    if (it.days.length <= 1) {
      window.showToast("Minimal harus memiliki 1 hari perjalanan", "warning");
      return;
    }
    it.days = it.days.filter(d => d.dayNumber !== dayNum);
    // re-number days
    it.days.forEach((d, i) => {
      d.dayNumber = i + 1;
    });
    UserState.saveItinerary();
    this.activeDay = 1;
    this.render();
    window.showToast("Hari perjalanan berhasil dihapus", "info");
  }

  toggleItemCompleted(itemId) {
    const day = this.getActiveDayData();
    if (!day) return;
    const item = day.items.find(i => i.id === itemId);
    if (item) {
      item.completed = !item.completed;
      UserState.saveItinerary();
      this.render();
    }
  }

  deleteItem(itemId) {
    const day = this.getActiveDayData();
    if (!day) return;
    day.items = day.items.filter(i => i.id !== itemId);
    UserState.saveItinerary();
    this.render();
    window.showToast("Aktivitas dihapus dari jadwal", "info");
  }

  moveItem(itemId, direction) {
    const day = this.getActiveDayData();
    if (!day) return;
    const idx = day.items.findIndex(i => i.id === itemId);
    if (idx === -1) return;

    if (direction === "up" && idx > 0) {
      const temp = day.items[idx];
      day.items[idx] = day.items[idx - 1];
      day.items[idx - 1] = temp;
    } else if (direction === "down" && idx < day.items.length - 1) {
      const temp = day.items[idx];
      day.items[idx] = day.items[idx + 1];
      day.items[idx + 1] = temp;
    }
    UserState.saveItinerary();
    this.render();
  }

  addItemModal() {
    const modal = document.getElementById("addItineraryItemModal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  closeAddItemModal() {
    const modal = document.getElementById("addItineraryItemModal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  submitNewItem(event) {
    event.preventDefault();
    const day = this.getActiveDayData();
    if (!day) return;

    const time = document.getElementById("itTimeInput").value || "10:00";
    const title = document.getElementById("itTitleInput").value;
    const category = document.getElementById("itCategoryInput").value || "Wisata";
    const duration = document.getElementById("itDurationInput").value || "1 Jam";
    const location = document.getElementById("itLocationInput").value || "";
    const notes = document.getElementById("itNotesInput").value || "";

    if (!title) {
      window.showToast("Judul aktivitas wajib diisi", "warning");
      return;
    }

    const newItem = {
      id: "it-custom-" + Date.now(),
      time,
      title,
      type: "custom",
      category,
      estDuration: duration,
      location,
      notes,
      completed: false
    };

    day.items.push(newItem);
    // Sort items by time
    day.items.sort((a, b) => a.time.localeCompare(b.time));

    UserState.saveItinerary();
    this.closeAddItemModal();
    this.render();
    window.showToast("Aktivitas baru berhasil dijadwalkan!", "success");

    // reset form
    document.getElementById("addItineraryForm").reset();
  }

  addAttractionToItinerary(attractionId) {
    const att = WARA_DATA.attractions.find(a => a.id === attractionId);
    if (!att) return;

    const day = this.getActiveDayData();
    if (!day) return;

    const newItem = {
      id: "it-att-" + Date.now(),
      time: "14:00",
      title: att.name,
      type: "attraction",
      category: att.category || "Wisata",
      estDuration: "2 - 3 Jam",
      location: att.cityName,
      notes: att.description.substring(0, 100) + "...",
      completed: false
    };

    day.items.push(newItem);
    day.items.sort((a, b) => a.time.localeCompare(b.time));
    UserState.saveItinerary();
    this.render();
    window.showToast(`${att.name} berhasil ditambahkan ke Hari ${this.activeDay}!`, "success");

    // Scroll to itinerary section
    document.getElementById("itinerarySection").scrollIntoView({ behavior: "smooth" });
  }

  printItinerary() {
    window.print();
  }

  render() {
    const container = document.getElementById("itineraryContentArea");
    if (!container) return;

    const it = UserState.itinerary;
    if (!it || !it.days) return;

    const day = this.getActiveDayData();
    if (!day) return;

    // Render Day Tabs
    const tabsContainer = document.getElementById("itineraryDayTabs");
    if (tabsContainer) {
      tabsContainer.innerHTML = it.days.map(d => {
        const isActive = d.dayNumber === this.activeDay;
        const activeClass = isActive 
          ? "bg-[#6B1D2F] text-white shadow-md font-bold" 
          : "bg-white text-slate-700 hover:bg-slate-100 font-medium border border-slate-200";
        return `
          <button onclick="window.ItineraryInstance.setActiveDay(${d.dayNumber})" 
                  class="px-4 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${activeClass}">
            <span>🗓️ Hari ${d.dayNumber}</span>
            <span class="text-[11px] opacity-75">(${d.items.length})</span>
          </button>
        `;
      }).join("") + `
        <button onclick="window.ItineraryInstance.addDay()" 
                class="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-[#6B1D2F] border border-rose-200 hover:bg-rose-100 transition-all flex items-center gap-1">
          <span>+ Tambah Hari</span>
        </button>
      `;
    }

    // Render Current Day Header & Controls
    const completedCount = day.items.filter(i => i.completed).length;
    const progressPercent = day.items.length > 0 ? Math.round((completedCount / day.items.length) * 100) : 0;

    let itemsHtml = "";
    if (day.items.length === 0) {
      itemsHtml = `
        <div class="text-center py-12 px-4 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <div class="w-16 h-16 bg-rose-50 text-[#6B1D2F] rounded-full flex items-center justify-center mx-auto text-2xl mb-3">
            📅
          </div>
          <h4 class="font-bold text-slate-700 text-base mb-1">Belum ada aktivitas di Hari ke-${this.activeDay}</h4>
          <p class="text-xs text-slate-500 max-w-md mx-auto mb-4">Tambahkan rencana kunjungan ke atraksi, kuliner legendaris, atau santai di penginapan pilihanmu.</p>
          <button onclick="window.ItineraryInstance.addItemModal()" class="inline-flex items-center gap-1.5 bg-[#6B1D2F] text-white text-xs font-bold px-4 py-2 rounded-xl shadow hover:bg-[#800020] transition-colors">
            <span>+ Buat Aktivitas Pertama</span>
          </button>
        </div>
      `;
    } else {
      itemsHtml = `
        <div class="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-rose-200">
          ${day.items.map((item, idx) => {
            const isCompleted = item.completed;
            const badgeBg = item.type === "flight" ? "bg-blue-100 text-blue-700" :
                            item.type === "hotel" ? "bg-amber-100 text-amber-800" :
                            item.type === "culinary" ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700";

            return `
              <div class="relative bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all group ${isCompleted ? 'opacity-60 bg-slate-50' : ''}">
                <!-- Timeline Dot -->
                <button onclick="window.ItineraryInstance.toggleItemCompleted('${item.id}')" 
                        class="absolute -left-[27px] sm:-left-[31px] top-4 w-6 h-6 rounded-full border-2 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-[#6B1D2F] text-transparent hover:text-emerald-500'} flex items-center justify-center text-xs transition-colors shadow-sm" title="Tandai selesai">
                  ✓
                </button>

                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#6B1D2F]/10 text-[#6B1D2F] flex items-center gap-1">
                      🕒 ${item.time}
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeBg}">
                      ${item.category}
                    </span>
                    <span class="text-[11px] text-slate-500 font-medium">⏱️ Est. ${item.estDuration}</span>
                  </div>

                  <!-- Actions (reorder up/down/delete) -->
                  <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button onclick="window.ItineraryInstance.moveItem('${item.id}', 'up')" 
                            class="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 text-xs" title="Geser ke atas">
                      ▲
                    </button>
                    <button onclick="window.ItineraryInstance.moveItem('${item.id}', 'down')" 
                            class="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 text-xs" title="Geser ke bawah">
                      ▼
                    </button>
                    <button onclick="window.ItineraryInstance.deleteItem('${item.id}')" 
                            class="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 text-xs ml-1" title="Hapus">
                      ✕
                    </button>
                  </div>
                </div>

                <h5 class="text-sm sm:text-base font-bold text-slate-800 ${isCompleted ? 'line-through text-slate-400' : ''}">
                  ${item.title}
                </h5>

                ${item.location ? `
                  <p class="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                    <span>📍</span> ${item.location}
                  </p>
                ` : ''}

                ${item.notes ? `
                  <p class="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-2 border border-slate-100 leading-relaxed italic">
                    💡 ${item.notes}
                  </p>
                ` : ''}
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="bg-gradient-to-r from-rose-50 to-white p-4 sm:p-5 rounded-2xl border border-rose-100 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold uppercase tracking-wider text-[#6B1D2F]">Rencana Perjalanan</span>
            <span class="text-xs text-slate-400">•</span>
            <span class="text-xs font-semibold text-slate-600">${it.destination}</span>
          </div>
          <h3 class="text-lg sm:text-xl font-black text-slate-800">${day.dateLabel}</h3>
          <p class="text-xs text-slate-500 mt-0.5">Disusun rapi dengan estimasi transit dan alur kunjungan terstruktur.</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-right">
            <span class="text-[11px] text-slate-500 font-semibold block">Progres Hari Ini</span>
            <span class="text-sm font-extrabold text-[#6B1D2F]">${completedCount} dari ${day.items.length} Selesai (${progressPercent}%)</span>
          </div>
          <div class="w-16 bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div class="bg-[#6B1D2F] h-full transition-all duration-500" style="width: ${progressPercent}%"></div>
          </div>
        </div>
      </div>

      <!-- Action bar -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <button onclick="window.ItineraryInstance.addItemModal()" 
                class="bg-[#6B1D2F] hover:bg-[#800020] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5">
          <span>+ Tambah Aktivitas Hari Ini</span>
        </button>

        <div class="flex items-center gap-2">
          <button onclick="window.ItineraryInstance.printItinerary()" 
                  class="bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 transition-all flex items-center gap-1 shadow-sm">
            <span>🖨️ Cetak / PDF</span>
          </button>
          <button onclick="window.ItineraryInstance.deleteDay(${this.activeDay})" 
                  class="bg-rose-50 hover:bg-rose-100 text-red-600 text-xs font-semibold px-2.5 py-2 rounded-xl transition-all border border-rose-100" title="Hapus Hari Ini">
            Hapus Hari
          </button>
        </div>
      </div>

      <!-- Items Timeline -->
      ${itemsHtml}
    `;
  }
}

// Global instance
window.ItineraryInstance = new ItineraryBuilder();
