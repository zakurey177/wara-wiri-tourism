/**
 * Wara Wiri - Live Flight & Bus Seat Selector
 * Features aircraft 3-3 cabin layout and executive bus 2-2 cabin layout
 * with real-time seat status, price calculations, and visual feedback.
 */

class SeatSelector {
  constructor() {
    this.currentMode = "flight"; // 'flight' or 'bus'
    this.currentBookingData = null;
    this.selectedSeats = [];
    this.occupiedSeats = new Set(["1B", "2C", "3D", "4A", "4B", "6F", "7A", "8C", "10D", "12E"]);
    this.onConfirmCallback = null;
  }

  open(bookingData, type = "flight", onConfirm) {
    this.currentBookingData = bookingData;
    this.currentMode = type;
    this.selectedSeats = [];
    this.onConfirmCallback = onConfirm;

    // Seed occupied seats randomly based on booking id
    this.seedOccupiedSeats(bookingData.id || "101");

    const modal = document.getElementById("seatSelectorModal");
    if (!modal) return;

    this.renderHeader();
    this.renderCabin();
    this.updateSummary();

    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }

  close() {
    const modal = document.getElementById("seatSelectorModal");
    if (modal) {
      modal.classList.add("hidden");
    }
    document.body.classList.remove("overflow-hidden");
  }

  seedOccupiedSeats(seedStr) {
    this.occupiedSeats.clear();
    const count = this.currentMode === "flight" ? 22 : 8;
    const cols = this.currentMode === "flight" ? ["A", "B", "C", "D", "E", "F"] : ["A", "B", "C", "D"];
    const maxRow = this.currentMode === "flight" ? 14 : 7;

    for (let r = 1; r <= maxRow; r++) {
      for (const c of cols) {
        // pseudo random deterministic based on row & col
        const val = (r * 13 + c.charCodeAt(0) * 7 + seedStr.charCodeAt(seedStr.length - 1)) % 10;
        if (val < 4) {
          this.occupiedSeats.add(`${r}${c}`);
        }
      }
    }
  }

  renderHeader() {
    const titleEl = document.getElementById("seatModalTitle");
    const subTitleEl = document.getElementById("seatModalSubtitle");
    if (!titleEl || !subTitleEl) return;

    if (this.currentMode === "flight") {
      titleEl.innerHTML = `✈️ Pilih Kursi Penerbangan: <span class="text-[#800020]">${this.currentBookingData.airline} (${this.currentBookingData.flightNumber})</span>`;
      subTitleEl.textContent = `${this.currentBookingData.origin} → ${this.currentBookingData.destination} • Pesawat ${this.currentBookingData.aircraft || "Airbus A320"}`;
    } else {
      titleEl.innerHTML = `🚌 Pilih Kursi Bus: <span class="text-[#800020]">${this.currentBookingData.operator}</span>`;
      subTitleEl.textContent = `${this.currentBookingData.origin} → ${this.currentBookingData.destination} • Kelas ${this.currentBookingData.busClass || "Executive"}`;
    }
  }

  renderCabin() {
    const cabinContainer = document.getElementById("seatCabinContainer");
    if (!cabinContainer) return;

    if (this.currentMode === "flight") {
      this.renderFlightCabin(cabinContainer);
    } else {
      this.renderBusCabin(cabinContainer);
    }
  }

  renderFlightCabin(container) {
    const rows = 12;
    const columnsLeft = ["A", "B", "C"];
    const columnsRight = ["D", "E", "F"];

    let html = `
      <!-- Cockpit & Nose -->
      <div class="flex flex-col items-center mb-6">
        <div class="w-24 h-10 border-t-4 border-l-4 border-r-4 border-slate-300 rounded-t-full flex items-center justify-center bg-slate-100">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kokpit 👨‍✈️</span>
        </div>
        <div class="w-full text-center py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded mt-1">
          Baris 1-3: Kursi Prioritas / Extra Legroom (+Rp 60.000)
        </div>
      </div>

      <!-- Column Labels -->
      <div class="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2 px-4">
        <div>A</div>
        <div>B</div>
        <div>C</div>
        <div class="text-[10px] text-slate-300 uppercase">Lorong</div>
        <div>D</div>
        <div>E</div>
        <div>F</div>
      </div>

      <div class="space-y-2 px-2">
    `;

    for (let r = 1; r <= rows; r++) {
      const isExtraLegroom = r <= 3;
      const isExitRow = r === 8;

      html += `
        <div class="flex items-center gap-1.5 justify-center">
          <!-- Left side 3 seats -->
          <div class="grid grid-cols-3 gap-1.5">
            ${columnsLeft.map(col => this.buildSeatButton(r, col, isExtraLegroom, isExitRow)).join("")}
          </div>

          <!-- Aisle / Row Number -->
          <div class="w-9 text-center text-xs font-bold text-slate-400 flex items-center justify-center">
            ${isExitRow ? '<span class="text-[9px] text-red-500 font-bold">🚪 ' + r + '</span>' : r}
          </div>

          <!-- Right side 3 seats -->
          <div class="grid grid-cols-3 gap-1.5">
            ${columnsRight.map(col => this.buildSeatButton(r, col, isExtraLegroom, isExitRow)).join("")}
          </div>
        </div>
      `;
    }

    html += `
      </div>
      <!-- Rear Galley & Restroom -->
      <div class="flex justify-between items-center mt-6 pt-3 border-t border-dashed border-slate-300 text-xs text-slate-400 px-4">
        <span>🚻 Toilet Belakang</span>
        <span>🍽️ Galley Pramugari</span>
        <span>🚻 Toilet Belakang</span>
      </div>
    `;

    container.innerHTML = html;
  }

  renderBusCabin(container) {
    const rows = 7;
    const columnsLeft = ["A", "B"];
    const columnsRight = ["C", "D"];

    let html = `
      <!-- Bus Front -->
      <div class="flex justify-between items-center mb-5 p-2 bg-slate-100 rounded-lg border border-slate-200">
        <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <span>🚪 Pintu Depan</span>
        </div>
        <div class="px-3 py-1 bg-slate-800 text-white rounded text-xs font-bold flex items-center gap-1">
          <span>🎮 Sopir Bus</span>
        </div>
      </div>

      <!-- Column Labels -->
      <div class="grid grid-cols-5 gap-2 text-center text-xs font-bold text-slate-400 mb-2 px-4">
        <div>A (Jendela)</div>
        <div>B (Lorong)</div>
        <div class="text-[10px] text-slate-300">Lorong</div>
        <div>C (Lorong)</div>
        <div>D (Jendela)</div>
      </div>

      <div class="space-y-3 px-2">
    `;

    for (let r = 1; r <= rows; r++) {
      html += `
        <div class="flex items-center gap-2 justify-center">
          <!-- Left side 2 seats -->
          <div class="grid grid-cols-2 gap-2">
            ${columnsLeft.map(col => this.buildSeatButton(r, col, r === 1, false)).join("")}
          </div>

          <!-- Aisle / Row Number -->
          <div class="w-8 text-center text-xs font-bold text-slate-400">
            ${r}
          </div>

          <!-- Right side 2 seats -->
          <div class="grid grid-cols-2 gap-2">
            ${columnsRight.map(col => this.buildSeatButton(r, col, r === 1, false)).join("")}
          </div>
        </div>
      `;
    }

    html += `
      </div>
      <!-- Bus Back -->
      <div class="flex justify-between items-center mt-5 pt-3 border-t border-dashed border-slate-300 text-xs text-slate-500 px-4">
        <span>🚪 Pintu Darurat</span>
        <span>🚻 Toilet Bus</span>
        <span>❄️ Dispenser Air Minum</span>
      </div>
    `;

    container.innerHTML = html;
  }

  buildSeatButton(row, col, isExtraLegroom, isExitRow) {
    const seatId = `${row}${col}`;
    const isOccupied = this.occupiedSeats.has(seatId);
    const isSelected = this.selectedSeats.includes(seatId);

    let priceSurcharge = 0;
    if (this.currentMode === "flight") {
      if (isExtraLegroom) priceSurcharge = 60000;
      else if (isExitRow) priceSurcharge = 40000;
    } else {
      if (row === 1) priceSurcharge = 25000;
    }

    if (isOccupied) {
      return `
        <button disabled class="w-10 h-10 rounded-lg bg-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center cursor-not-allowed border border-slate-300" title="Kursi ${seatId} telah terisi">
          ✕
        </button>
      `;
    }

    if (isSelected) {
      return `
        <button onclick="window.SeatSelectorInstance.toggleSeat('${seatId}', ${priceSurcharge})" 
                class="w-10 h-10 rounded-lg bg-[#6B1D2F] text-white font-extrabold text-xs flex flex-col items-center justify-center shadow-md border-2 border-[#800020] animate-pulse">
          <span>${seatId}</span>
          <span class="text-[9px]">✓</span>
        </button>
      `;
    }

    // Available seat
    const extraStyle = priceSurcharge > 0 ? "border-amber-400 bg-amber-50/40" : "border-slate-300 hover:border-[#6B1D2F] bg-white";
    return `
      <button onclick="window.SeatSelectorInstance.toggleSeat('${seatId}', ${priceSurcharge})" 
              class="w-10 h-10 rounded-lg ${extraStyle} text-slate-700 font-bold text-xs flex flex-col items-center justify-center transition-all hover:shadow hover:bg-rose-50/50 border">
        <span>${seatId}</span>
        ${priceSurcharge > 0 ? `<span class="text-[8px] text-amber-700">+${Math.round(priceSurcharge / 1000)}k</span>` : ''}
      </button>
    `;
  }

  toggleSeat(seatId, surcharge = 0) {
    const idx = this.selectedSeats.indexOf(seatId);
    if (idx > -1) {
      this.selectedSeats.splice(idx, 1);
    } else {
      // allow selecting 1 seat per flow (or up to 4)
      if (this.selectedSeats.length >= 2) {
        window.showToast("Maksimal 2 kursi per pemesanan sekaligus", "warning");
        return;
      }
      this.selectedSeats.push(seatId);
    }
    this.renderCabin();
    this.updateSummary();
  }

  updateSummary() {
    const summarySeatEl = document.getElementById("seatSummarySelected");
    const summaryPriceEl = document.getElementById("seatSummaryPrice");
    const confirmBtn = document.getElementById("seatConfirmBtn");

    if (!summarySeatEl || !summaryPriceEl || !confirmBtn) return;

    if (this.selectedSeats.length === 0) {
      summarySeatEl.innerHTML = `<span class="text-slate-400 italic">Belum ada kursi dipilih</span>`;
      summaryPriceEl.textContent = formatRupiah(this.currentBookingData ? this.currentBookingData.price : 0);
      confirmBtn.disabled = true;
      confirmBtn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      summarySeatEl.innerHTML = `
        <span class="font-extrabold text-[#6B1D2F] bg-[#6B1D2F]/10 px-2 py-0.5 rounded text-sm">
          ${this.selectedSeats.join(", ")}
        </span>
      `;

      // calculate total price
      const basePrice = (this.currentBookingData ? this.currentBookingData.price : 0) * this.selectedSeats.length;
      let totalSurcharges = 0;
      this.selectedSeats.forEach(seat => {
        const row = parseInt(seat);
        if (this.currentMode === "flight" && row <= 3) totalSurcharges += 60000;
        else if (this.currentMode === "flight" && row === 8) totalSurcharges += 40000;
        else if (this.currentMode === "bus" && row === 1) totalSurcharges += 25000;
      });

      const total = basePrice + totalSurcharges;
      summaryPriceEl.textContent = formatRupiah(total);

      confirmBtn.disabled = false;
      confirmBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }

  confirm() {
    if (this.selectedSeats.length === 0) return;
    if (this.onConfirmCallback) {
      this.onConfirmCallback(this.selectedSeats);
    }
    this.close();
    window.showToast(`Kursi ${this.selectedSeats.join(", ")} berhasil dipilih!`, "success");
  }
}

// Global instance
window.SeatSelectorInstance = new SeatSelector();
