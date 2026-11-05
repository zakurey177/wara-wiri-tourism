/**
 * Wara Wiri - Main Application Coordinator
 * Handles Checkout/Payment flows, E-Ticket previews, Reschedule,
 * Complete Multi-Step Transparent Refund System & Live Tracking,
 * Customizable User Profile, On-Page Booking History Dashboard, Toast notifications, and Global Modals.
 */

// Global state variables
let pendingCheckoutData = null;
let currentRefundBookingCode = null;
let currentTrackingBookingCode = null;
let currentRescheduleBookingCode = null;
let currentDashboardFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize subsystems
  window.SearchManagerInstance.init();
  window.DestinationMapInstance.init();
  window.ItineraryInstance.init();
  window.WeatherServiceInstance.updateNavbarWidget("bali");
  if (window.LiveChatInstance) {
    window.LiveChatInstance.init();
  }

  // Setup UI Listeners
  setupNavigationListeners();
  setupFilterListeners();
  setupProfileUI();
  updateWishlistCountBadge();

  // Listen to state changes
  window.addEventListener("wishlistUpdated", () => {
    updateWishlistCountBadge();
    setupProfileUI();
    window.SearchManagerInstance.renderSearchResults();
  });

  window.addEventListener("bookingsUpdated", () => {
    setupProfileUI();
    renderUserBookingsList();
    renderDashboardBookings(currentDashboardFilter);
  });

  window.addEventListener("userUpdated", () => {
    setupProfileUI();
    renderDashboardBookings(currentDashboardFilter);
  });

  // Render initial profile bookings list and dashboard
  renderUserBookingsList();
  renderDashboardBookings("all");
  renderFeaturedSections();
});

// --- NAVIGATION & UI LISTENERS ---
function setupNavigationListeners() {
  const searchForm = document.getElementById("heroSearchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      window.SearchManagerInstance.handleSearchSubmit(e);
    });
  }

  const priceRange = document.getElementById("filterPriceRange");
  if (priceRange) {
    priceRange.addEventListener("input", (e) => {
      window.SearchManagerInstance.updateMaxPriceFilter(e.target.value);
    });
  }

  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileNav = document.getElementById("mobileNavDrawer");
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileNav.classList.toggle("hidden");
    });
  }
}

function setupFilterListeners() {
  const starFilters = document.querySelectorAll(".filter-star-btn");
  starFilters.forEach(btn => {
    btn.addEventListener("click", () => {
      starFilters.forEach(b => b.classList.remove("bg-[#6B1D2F]", "text-white"));
      btn.classList.add("bg-[#6B1D2F]", "text-white");
      window.SearchManagerInstance.updateHotelStarsFilter(btn.getAttribute("data-stars"));
    });
  });

  const transitFilters = document.querySelectorAll(".filter-transit-btn");
  transitFilters.forEach(btn => {
    btn.addEventListener("click", () => {
      transitFilters.forEach(b => b.classList.remove("bg-[#6B1D2F]", "text-white"));
      btn.classList.add("bg-[#6B1D2F]", "text-white");
      window.SearchManagerInstance.updateTransitFilter(btn.getAttribute("data-transit"));
    });
  });
}

function resetSearchFilters() {
  const priceRange = document.getElementById("filterPriceRange");
  if (priceRange) {
    priceRange.value = 20000000;
  }
  window.SearchManagerInstance.currentFilters = {
    maxPrice: 20000000,
    transit: "all",
    hotelStars: "all",
    sort: "cheapest"
  };
  const label = document.getElementById("filterPriceValue");
  if (label) label.textContent = formatRupiah(20000000);

  window.SearchManagerInstance.renderSearchResults();
  showToast("Filter pencarian telah di-reset", "info");
}

// --- USER PROFILE & DASHBOARD SYNCHRONIZATION ---
function setupProfileUI() {
  const u = UserState.user;
  const bookings = UserState.bookings || [];

  // 1. Top Navbar Sync
  const userNameEl = document.getElementById("navUserName");
  const userPointsEl = document.getElementById("navUserPoints");
  const navAvatarEl = document.getElementById("navUserAvatar");
  const navBookingBadge = document.getElementById("navBookingBadge");

  if (userNameEl) userNameEl.textContent = u.name.split(" ")[0];
  if (userPointsEl) userPointsEl.textContent = `${u.points || 4250} Poin`;
  if (navAvatarEl && u.avatar) navAvatarEl.src = u.avatar;
  if (navBookingBadge) navBookingBadge.textContent = bookings.length;

  // 2. Slide-over Drawer Sync
  const drawerAvatar = document.getElementById("drawerAvatarImg");
  const drawerName = document.getElementById("profileDrawerName");
  const drawerEmail = document.getElementById("profileDrawerEmail");
  const drawerPhone = document.getElementById("profileDrawerPhone");
  const drawerPoints = document.getElementById("profileDrawerPoints");
  const drawerMembership = document.getElementById("profileDrawerMembership");
  const drawerHomeCity = document.getElementById("drawerHomeCityBadge");
  const drawerStyle = document.getElementById("drawerTravelStyleBadge");

  if (drawerAvatar && u.avatar) drawerAvatar.src = u.avatar;
  if (drawerName) drawerName.textContent = u.name;
  if (drawerEmail) drawerEmail.textContent = u.email;
  if (drawerPhone) drawerPhone.textContent = u.phone;
  if (drawerPoints) drawerPoints.textContent = `${u.points || 4250} Poin`;
  if (drawerMembership) drawerMembership.textContent = u.membership || "Wara Platinum Member";
  if (drawerHomeCity) drawerHomeCity.textContent = `📍 Asal: ${u.homeCityName || "Jakarta (CGK)"}`;
  if (drawerStyle) drawerStyle.textContent = u.travelStyle || "Solo & Explorer";

  // 3. On-Page Dashboard Section Sync (Requirement: Visible Profile & History)
  const dashAvatar = document.getElementById("dashboardCardAvatar");
  const dashName = document.getElementById("dashboardCardName");
  const dashMembership = document.getElementById("dashboardCardMembership");
  const dashPoints = document.getElementById("dashboardCardPoints");
  const dashHome = document.getElementById("dashboardCardHome");

  if (dashAvatar && u.avatar) dashAvatar.src = u.avatar;
  if (dashName) dashName.textContent = u.name;
  if (dashMembership) dashMembership.textContent = u.membership || "Wara Platinum Member";
  if (dashPoints) dashPoints.textContent = `⭐ ${u.points || 4250} Poin`;
  if (dashHome) dashHome.textContent = `📍 ${u.homeCityName || "Jakarta (CGK)"}`;

  // Update tab counts
  const allCount = bookings.length;
  const activeCount = bookings.filter(b => b.status === "Aktif" || b.status === "Dijadwalkan Ulang").length;
  const refundCount = bookings.filter(b => b.status === "Refund Diajukan" || (b.refundDetails && b.refundDetails.step < 4)).length;
  const doneCount = bookings.filter(b => b.status === "Selesai" || b.status === "Refund Selesai").length;
  const wishlistCount = UserState.wishlist ? UserState.wishlist.length : 0;

  const countAllEl = document.getElementById("dashCountAll");
  const countActiveEl = document.getElementById("dashCountActive");
  const countRefundEl = document.getElementById("dashCountRefund");
  const countDoneEl = document.getElementById("dashCountDone");
  const countWishlistEl = document.getElementById("dashCountWishlist");

  if (countAllEl) countAllEl.textContent = allCount;
  if (countActiveEl) countActiveEl.textContent = activeCount;
  if (countRefundEl) countRefundEl.textContent = refundCount;
  if (countDoneEl) countDoneEl.textContent = doneCount;
  if (countWishlistEl) countWishlistEl.textContent = wishlistCount;
}

// --- DEDICATED ON-PAGE DASHBOARD BOOKINGS RENDERING ---
function renderDashboardBookings(filter = "all", searchQuery = "") {
  currentDashboardFilter = filter;
  const container = document.getElementById("dashboardBookingsGrid");
  if (!container) return;

  const bookings = UserState.bookings || [];
  let list = [];

  if (filter === "wishlist") {
    // Render wishlist cards inside dashboard
    const wishlisted = UserState.getWishlistDestinations();
    if (wishlisted.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
          <span class="text-3xl block mb-2">❤️</span>
          <h4 class="font-bold text-slate-700 text-sm">Belum ada destinasi tersimpan di Wishlist</h4>
          <p class="text-xs text-slate-500 mt-1">Jelajahi peta atau hasil pencarian untuk menambahkan destinasi impianmu.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = wishlisted.map(d => `
      <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col group">
        <div class="relative h-40 overflow-hidden">
          <img src="${d.image}" alt="${d.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <span class="absolute top-2.5 left-2.5 bg-[#6B1D2F] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
            ${d.region.toUpperCase()} • ${d.code}
          </span>
          <button onclick="window.toggleWishlist('${d.id}')" class="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 text-rose-500 flex items-center justify-center text-xs shadow hover:scale-110 transition-transform">
            ❤️
          </button>
        </div>
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h5 class="font-extrabold text-slate-800 text-base leading-snug">${d.name}, ${d.country}</h5>
            <p class="text-xs text-slate-500 line-clamp-2 mt-1">${d.description}</p>
          </div>
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
            <div>
              <span class="text-[10px] text-slate-400 block font-medium">Mulai Dari</span>
              <span class="text-sm font-black text-[#800020]">${formatRupiah(d.flightPriceStart)}</span>
            </div>
            <button onclick="window.selectDestinationFromMap('${d.id}', '${d.name}')" 
                    class="bg-[#6B1D2F] hover:bg-[#800020] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm">
              Pesan Tiket
            </button>
          </div>
        </div>
      </div>
    `).join("");
    return;
  }

  // Filter regular bookings
  if (filter === "active") {
    list = bookings.filter(b => b.status === "Aktif" || b.status === "Dijadwalkan Ulang");
  } else if (filter === "refund") {
    list = bookings.filter(b => b.status === "Refund Diajukan" || (b.refundDetails && b.refundDetails.step < 4));
  } else if (filter === "done") {
    list = bookings.filter(b => b.status === "Selesai" || b.status === "Refund Selesai");
  } else {
    list = [...bookings];
  }

  // Search filter
  if (searchQuery && searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(b => 
      b.bookingCode.toLowerCase().includes(q) ||
      b.title.toLowerCase().includes(q) ||
      (b.provider && b.provider.toLowerCase().includes(q))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-14 bg-slate-50/70 rounded-2xl border border-slate-200">
        <span class="text-3xl block mb-2">🔍</span>
        <h4 class="font-bold text-slate-700 text-base">Tidak Ada Riwayat Pemesanan Sesuai Filter</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">Coba ganti kategori filter atau pesan tiket baru untuk memulai perjalanan Anda.</p>
        <button onclick="window.SearchManagerInstance.switchTab('flight'); document.getElementById('searchTabsNav').scrollIntoView({behavior:'smooth'});" 
                class="mt-4 bg-[#6B1D2F] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#800020] transition-colors shadow">
          Mulai Cari Tiket Baru
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(b => {
    const isRefundActive = b.status === "Refund Diajukan" || (b.refundDetails && b.refundDetails.step < 4);
    const isRefundDone = b.status === "Refund Selesai";
    const isFinished = b.status === "Selesai" || isRefundDone;

    const statusBadge = b.status === "Aktif" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                        b.status === "Dijadwalkan Ulang" ? "bg-blue-50 text-blue-800 border-blue-200" :
                        isRefundActive ? "bg-amber-50 text-amber-900 border-amber-300 animate-pulse font-extrabold" :
                        isRefundDone ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-slate-100 text-slate-600 border-slate-200";

    const serviceIcon = b.serviceType === "flight" ? "✈️ Penerbangan" :
                        b.serviceType === "bus" ? "🚌 Bus Antar-Kota" :
                        b.serviceType === "hotel" ? "🏨 Akomodasi Hotel" : "🎁 Paket Tour";

    return `
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
        <div>
          <!-- Top Row: Code & Status -->
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-black text-slate-400 font-mono tracking-wider">${b.bookingCode}</span>
            <span class="text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusBadge}">
              ${isRefundActive ? '⏳ ' + b.status : b.status}
            </span>
          </div>

          <!-- Service Type & Title -->
          <span class="text-[10px] font-extrabold text-[#6B1D2F] uppercase tracking-wider block mb-0.5">${serviceIcon}</span>
          <h4 class="font-black text-slate-800 text-base leading-snug group-hover:text-[#6B1D2F] transition-colors mb-2">${b.title}</h4>
          
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1 mb-3">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Jadwal:</span>
              <span class="font-bold text-slate-800">${b.date} • ${b.departureTime}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Penyedia:</span>
              <span class="font-semibold text-slate-700">${b.provider}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Kursi / Kamar:</span>
              <span class="font-bold text-[#6B1D2F]">${b.seat}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Penumpang:</span>
              <span class="font-semibold text-slate-700">${b.passengers ? b.passengers[0] : UserState.user.name}</span>
            </div>
          </div>
        </div>

        <div>
          <!-- Price & Payment Summary -->
          <div class="flex items-center justify-between pb-3 pt-1 border-t border-slate-100 mb-3">
            <span class="text-[11px] text-slate-400 font-medium">Total Pembayaran:</span>
            <span class="text-base font-black text-[#800020]">${formatRupiah(b.amountPaid)}</span>
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-1.5">
            <button onclick="window.viewTicketModal('${b.bookingCode}')" 
                    class="bg-[#6B1D2F] hover:bg-[#800020] text-white text-xs font-black py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1">
              <span>🎟️ E-Ticket</span>
            </button>

            ${isRefundActive || isRefundDone ? `
              <button onclick="window.openRefundTrackingModal('${b.bookingCode}')" 
                      class="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black py-2 rounded-xl transition-colors flex items-center justify-center gap-1">
                <span>🔍 Lacak Refund</span>
              </button>
            ` : b.canReschedule && !isFinished ? `
              <button onclick="window.openRescheduleModal('${b.bookingCode}')" 
                      class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors">
                Reschedule
              </button>
            ` : `
              <button onclick="window.viewTicketModal('${b.bookingCode}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors">
                Detail Transaksi
              </button>
            `}
          </div>

          ${b.canRefund && !isFinished && !isRefundActive ? `
            <button onclick="window.openRefundModal('${b.bookingCode}')" 
                    class="w-full mt-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold py-1.5 rounded-xl border border-rose-200 transition-colors">
              Ajukan Refund Transparan
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join("");
}

function filterDashboardBookings(filterName, btnEl) {
  currentDashboardFilter = filterName;

  const tabButtons = document.querySelectorAll(".dash-tab-btn");
  tabButtons.forEach(btn => {
    btn.classList.remove("bg-[#6B1D2F]", "text-white", "shadow-sm");
    btn.classList.add("bg-slate-100", "text-slate-700");
  });

  if (btnEl) {
    btnEl.classList.add("bg-[#6B1D2F]", "text-white", "shadow-sm");
    btnEl.classList.remove("bg-slate-100", "text-slate-700");
  }

  const searchInput = document.getElementById("dashboardSearchInput");
  const query = searchInput ? searchInput.value : "";
  renderDashboardBookings(filterName, query);
}

function searchDashboardBookings(query) {
  renderDashboardBookings(currentDashboardFilter, query);
}

// Open Edit Profile Modal
function openEditProfileModal() {
  const u = UserState.user;
  const modal = document.getElementById("editProfileModal");
  if (!modal) return;

  document.getElementById("editFullName").value = u.name;
  document.getElementById("editEmail").value = u.email;
  document.getElementById("editPhone").value = u.phone;
  document.getElementById("editHomeCity").value = u.homeCityName || "Jakarta (CGK)";
  document.getElementById("editTravelStyle").value = u.travelStyle || "Solo & Explorer";
  document.getElementById("editBio").value = u.bio || "";
  document.getElementById("editAvatarUrl").value = u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80";
  document.getElementById("editAvatarPreview").src = u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80";

  modal.classList.remove("hidden");
}

function closeEditProfileModal() {
  const modal = document.getElementById("editProfileModal");
  if (modal) modal.classList.add("hidden");
}

function selectPresetAvatar(src) {
  document.getElementById("editAvatarUrl").value = src;
  document.getElementById("editAvatarPreview").src = src;
}

function handleAvatarFileUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      document.getElementById("editAvatarUrl").value = dataUrl;
      document.getElementById("editAvatarPreview").src = dataUrl;
      showToast("Foto profil baru dipilih!", "info");
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function saveProfileCustomization(e) {
  e.preventDefault();

  const name = document.getElementById("editFullName").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const phone = document.getElementById("editPhone").value.trim();
  const homeCityName = document.getElementById("editHomeCity").value;
  const travelStyle = document.getElementById("editTravelStyle").value;
  const bio = document.getElementById("editBio").value.trim();
  const avatar = document.getElementById("editAvatarUrl").value;

  if (!name || !email) {
    showToast("Nama lengkap dan email wajib diisi", "warning");
    return;
  }

  UserState.updateProfile({
    name,
    email,
    phone,
    homeCityName,
    travelStyle,
    bio,
    avatar
  });

  closeEditProfileModal();
  showToast("Profil Anda berhasil diperbarui!", "success");
}

// Drawer Bookings List
function renderUserBookingsList() {
  const container = document.getElementById("profileBookingsContainer");
  const countBadge = document.getElementById("profileBookingCount");
  if (!container) return;

  const bookings = UserState.bookings || [];
  if (countBadge) countBadge.textContent = `${bookings.length} Tiket`;

  if (bookings.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-xs">
        Belum ada riwayat transaksi atau tiket aktif.
      </div>
    `;
    return;
  }

  container.innerHTML = bookings.map(b => {
    const isRefundActive = b.status === "Refund Diajukan" || (b.refundDetails && b.refundDetails.step < 4);
    const isRefundDone = b.status === "Refund Selesai";
    const isFinished = b.status === "Selesai" || isRefundDone;

    const statusColor = b.status === "Aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        b.status === "Dijadwalkan Ulang" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        isRefundActive ? "bg-amber-50 text-amber-800 border-amber-300 animate-pulse font-extrabold" :
                        isRefundDone ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-600 border-slate-200";

    return `
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-black text-slate-500 tracking-wider font-mono">${b.bookingCode}</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${statusColor}">
            ${isRefundActive ? '⏳ ' + b.status : b.status}
          </span>
        </div>

        <h5 class="font-extrabold text-slate-800 text-sm leading-snug">${b.title}</h5>
        <div class="text-xs text-slate-500 font-medium space-y-0.5">
          <div>🗓️ ${b.date} • 🕒 ${b.departureTime}</div>
          <div>💺 ${b.seat} • 👤 ${b.passengers ? b.passengers[0] : UserState.user.name}</div>
        </div>

        <div class="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <span class="text-xs font-black text-[#800020]">${formatRupiah(b.amountPaid)}</span>

          <div class="flex items-center gap-1.5 flex-wrap">
            <button onclick="window.viewTicketModal('${b.bookingCode}')" 
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors">
              Lihat Tiket
            </button>

            ${b.canReschedule && !isFinished && !isRefundActive ? `
              <button onclick="window.openRescheduleModal('${b.bookingCode}')" 
                      class="bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-200 transition-colors">
                Reschedule
              </button>
            ` : ''}

            ${b.canRefund && !isFinished && !isRefundActive ? `
              <button onclick="window.openRefundModal('${b.bookingCode}')" 
                      class="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-rose-200 transition-colors">
                Refund
              </button>
            ` : ''}

            ${isRefundActive || isRefundDone ? `
              <button onclick="window.openRefundTrackingModal('${b.bookingCode}')" 
                      class="bg-gradient-to-r from-[#6B1D2F] to-[#800020] text-white text-xs font-extrabold px-3 py-1 rounded-lg shadow-sm hover:opacity-95 transition-all flex items-center gap-1">
                <span>🔍 Lacak Refund</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderUserWishlistList() {
  const container = document.getElementById("profileWishlistContainer");
  if (!container) return;

  const wishlisted = UserState.getWishlistDestinations();
  if (wishlisted.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-slate-400 text-xs">
        Belum ada destinasi favorit yang disimpan.
      </div>
    `;
    return;
  }

  container.innerHTML = wishlisted.map(d => `
    <div class="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
      <img src="${d.image}" alt="${d.name}" class="w-12 h-12 rounded-lg object-cover">
      <div class="flex-1">
        <h6 class="text-xs font-bold text-slate-800">${d.name} (${d.country})</h6>
        <span class="text-[10px] text-slate-400 block">${d.region.toUpperCase()}</span>
        <span class="text-xs font-extrabold text-[#800020]">${formatRupiah(d.flightPriceStart)}</span>
      </div>
      <button onclick="window.selectDestinationFromMap('${d.id}', '${d.name}'); window.closeUserProfileDrawer();" 
              class="bg-[#6B1D2F] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-[#800020] transition-colors">
        Pesan
      </button>
    </div>
  `).join("");
}

// Drawer open/close
function openUserProfileDrawer() {
  const drawer = document.getElementById("userProfileDrawer");
  if (!drawer) return;

  setupProfileUI();
  renderUserBookingsList();
  renderUserWishlistList();

  drawer.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeUserProfileDrawer() {
  const drawer = document.getElementById("userProfileDrawer");
  if (drawer) drawer.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

// --- REFUND MODAL & LIVE TRACKING ---
function openRefundModal(bookingCode) {
  currentRefundBookingCode = bookingCode;
  const booking = UserState.bookings.find(b => b.bookingCode === bookingCode);
  if (!booking) return;

  const modal = document.getElementById("refundModal");
  if (!modal) return;

  document.getElementById("refundBookingCode").textContent = booking.bookingCode;
  document.getElementById("refundBookingTitle").textContent = booking.title;
  document.getElementById("refundTicketDate").textContent = `Jadwal Keberangkatan: ${booking.date} • ${booking.departureTime}`;
  document.getElementById("refundUploadLabel").textContent = "Lampirkan Bukti (Surat Dokter / Tiket Maskapai)";

  recalculateRefundPreview();

  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeRefundModal() {
  const modal = document.getElementById("refundModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  currentRefundBookingCode = null;
}

function recalculateRefundPreview() {
  const booking = UserState.bookings.find(b => b.bookingCode === currentRefundBookingCode);
  if (!booking) return;

  const originalAmount = booking.amountPaid || 1000000;
  const reasonCategory = document.getElementById("refundReasonCategory").value;
  const methodRadio = document.querySelector("input[name='refundMethod']:checked");
  const method = methodRadio ? methodRadio.value : "wallet";

  let deductionPercentage = 0.10;
  let bonusAmount = 0;

  if (reasonCategory === "medical" || reasonCategory === "airline_cancel" || reasonCategory === "force_majeure") {
    deductionPercentage = 0.0;
  } else if (method === "wallet") {
    deductionPercentage = 0.0;
    bonusAmount = Math.round(originalAmount * 0.05);
  }

  const airlineFee = Math.round(originalAmount * deductionPercentage);
  const airportTax = Math.min(150000, Math.round(originalAmount * 0.08));
  const refundTotal = (originalAmount - airlineFee) + bonusAmount;

  document.getElementById("refundOriginalAmount").textContent = formatRupiah(originalAmount);
  
  const feeLabel = document.getElementById("refundFeeLabel");
  const deductionEl = document.getElementById("refundDeduction");
  if (deductionPercentage === 0) {
    feeLabel.textContent = "Biaya Regulasi Maskapai (Dikecualikan):";
    deductionEl.textContent = "Rp 0 (100% Full Refund)";
    deductionEl.className = "text-emerald-600 font-bold";
  } else {
    feeLabel.textContent = "Potongan Biaya Regulasi Maskapai:";
    deductionEl.textContent = `-${formatRupiah(airlineFee)} (10%)`;
    deductionEl.className = "text-rose-600 font-bold";
  }

  document.getElementById("refundAirportTax").textContent = `+${formatRupiah(airportTax)} (100% Refundable)`;

  const walletBonusRow = document.getElementById("refundWalletBonusRow");
  if (method === "wallet" && bonusAmount > 0) {
    walletBonusRow.classList.remove("hidden");
    document.getElementById("refundWalletBonusAmount").textContent = `+${formatRupiah(bonusAmount)} (5% Koin)`;
  } else {
    walletBonusRow.classList.add("hidden");
  }

  document.getElementById("refundEstimatedAmount").textContent = formatRupiah(refundTotal);
}

function selectRefundMethod(method) {
  const accountForm = document.getElementById("refundAccountForm");
  const providerLabel = document.getElementById("refundProviderLabel");
  const numberLabel = document.getElementById("refundNumberLabel");
  const bankInput = document.getElementById("refundBankInput");

  if (method === "wallet") {
    accountForm.classList.add("hidden");
  } else if (method === "bank") {
    accountForm.classList.remove("hidden");
    providerLabel.textContent = "Pilihan Bank";
    numberLabel.textContent = "Nomor Rekening Bank";
    bankInput.innerHTML = `
      <option value="Bank BCA">Bank BCA</option>
      <option value="Bank Mandiri">Bank Mandiri</option>
      <option value="Bank BRI">Bank BRI</option>
      <option value="Bank BNI">Bank BNI</option>
      <option value="Bank CIMB Niaga">Bank CIMB Niaga</option>
    `;
  } else if (method === "ewallet") {
    accountForm.classList.remove("hidden");
    providerLabel.textContent = "Pilihan E-Wallet";
    numberLabel.textContent = "Nomor HP Terdaftar E-Wallet";
    bankInput.innerHTML = `
      <option value="GoPay">GoPay</option>
      <option value="OVO">OVO</option>
      <option value="DANA">DANA</option>
      <option value="ShopeePay">ShopeePay</option>
    `;
  }

  recalculateRefundPreview();
}

function handleRefundFileUpload(input) {
  if (input.files && input.files[0]) {
    document.getElementById("refundUploadLabel").textContent = `✓ ${input.files[0].name}`;
    showToast("Berkas bukti pendukung berhasil dilampirkan", "success");
  }
}

function submitRefund() {
  if (!currentRefundBookingCode) return;

  const agreeCheckbox = document.getElementById("refundAgreeCheckbox");
  if (!agreeCheckbox.checked) {
    showToast("Harap centang persetujuan syarat dan ketentuan", "warning");
    return;
  }

  const reasonCategory = document.getElementById("refundReasonCategory").value;
  const reasonDetails = document.getElementById("refundReasonInput").value || "Pengajuan pembatalan resmi via aplikasi";
  const methodRadio = document.querySelector("input[name='refundMethod']:checked");
  const disbursementMethod = methodRadio ? methodRadio.value : "wallet";

  let providerName = "Wara Wiri Travel Wallet";
  let accountNumber = "WALLET-INSTANT-" + UserState.user.phone;
  let accountHolder = UserState.user.name;

  if (disbursementMethod !== "wallet") {
    providerName = document.getElementById("refundBankInput").value;
    accountNumber = document.getElementById("refundAccountNumInput").value.trim();
    accountHolder = document.getElementById("refundHolderInput").value.trim();

    if (!accountNumber || !accountHolder) {
      showToast("Lengkapi nomor rekening/HP dan nama pemilik", "warning");
      return;
    }
  }

  const result = UserState.requestRefund(currentRefundBookingCode, {
    reasonCategory,
    reasonDetails,
    disbursementMethod,
    providerName,
    accountNumber,
    accountHolder
  });

  if (result.success) {
    const savedCode = currentRefundBookingCode;
    closeRefundModal();
    fireCelebrationConfetti();
    showToast(`Pengajuan refund ${formatRupiah(result.refundAmount)} berhasil diajukan! (ID: ${result.refundId})`, "success");
    setupProfileUI();

    setTimeout(() => {
      openRefundTrackingModal(savedCode);
    }, 500);
  }
}

function openRefundTrackingModal(bookingCode) {
  currentTrackingBookingCode = bookingCode;
  const booking = UserState.bookings.find(b => b.bookingCode === bookingCode);
  if (!booking || !booking.refundDetails) return;

  const modal = document.getElementById("refundTrackingModal");
  if (!modal) return;

  const rd = booking.refundDetails;
  document.getElementById("trackRefundId").textContent = rd.refundId;
  document.getElementById("trackTicketTitle").textContent = booking.title;
  document.getElementById("trackRefundAmount").textContent = formatRupiah(rd.refundAmount);

  document.getElementById("trackTargetProvider").textContent = rd.accountInfo.providerName;
  document.getElementById("trackTargetNumber").textContent = rd.accountInfo.accountNumber;
  document.getElementById("trackTargetHolder").textContent = rd.accountInfo.accountHolder;
  document.getElementById("trackEstimatedArrival").textContent = rd.estimatedArrival;

  const timelineEl = document.getElementById("trackTimelineContainer");
  timelineEl.innerHTML = rd.historyTimeline.map((step, idx) => {
    const isDone = step.status === "done";
    const isCurrent = step.status === "current";

    const dotStyle = isDone ? "bg-emerald-500 border-emerald-500 text-white" :
                     isCurrent ? "bg-amber-400 border-amber-400 text-slate-900 animate-pulse" :
                     "bg-slate-200 border-slate-300 text-slate-400";

    return `
      <div class="relative pl-6 pb-2.5 last:pb-0 before:absolute before:left-2 before:top-3 before:bottom-0 before:w-0.5 ${isDone ? 'before:bg-emerald-300' : 'before:bg-slate-200'} last:before:hidden">
        <span class="absolute -left-1 top-0.5 w-6 h-6 rounded-full border-2 ${dotStyle} flex items-center justify-center text-[10px] font-black shadow-sm">
          ${isDone ? '✓' : idx + 1}
        </span>
        <div class="flex items-center justify-between">
          <h6 class="text-xs font-black ${isDone ? 'text-slate-800' : isCurrent ? 'text-amber-800 font-bold' : 'text-slate-400'}">
            ${step.title}
          </h6>
          <span class="text-[10px] font-bold text-slate-400">${step.time}</span>
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">${step.description}</p>
      </div>
    `;
  }).join("");

  const advanceBtn = document.getElementById("trackAdvanceStepBtn");
  if (advanceBtn) {
    if (rd.step >= 4) {
      advanceBtn.disabled = true;
      advanceBtn.textContent = "Refund Selesai ✓";
      advanceBtn.className = "bg-emerald-600 text-white text-[11px] font-black px-3 py-1.5 rounded-lg opacity-80 cursor-not-allowed";
    } else {
      advanceBtn.disabled = false;
      advanceBtn.textContent = `Percepat ke Tahap ${rd.step + 1} ⏩`;
      advanceBtn.className = "bg-[#6B1D2F] hover:bg-[#800020] text-white text-[11px] font-black px-3 py-1.5 rounded-lg transition-all shadow-sm";
    }
  }

  const cancelBtn = document.getElementById("trackCancelRefundBtn");
  if (cancelBtn) {
    if (rd.step >= 3) {
      cancelBtn.disabled = true;
      cancelBtn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      cancelBtn.disabled = false;
      cancelBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }

  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeRefundTrackingModal() {
  const modal = document.getElementById("refundTrackingModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  currentTrackingBookingCode = null;
}

function advanceRefundDemoStep() {
  if (!currentTrackingBookingCode) return;
  const res = UserState.advanceRefundStep(currentTrackingBookingCode);
  if (res.success) {
    showToast(`Status Refund berhasil ditingkatkan ke Tahap ${res.step}!`, "info");
    openRefundTrackingModal(currentTrackingBookingCode);
    setupProfileUI();
  }
}

function cancelActiveRefund() {
  if (!currentTrackingBookingCode) return;
  const res = UserState.cancelRefund(currentTrackingBookingCode);
  if (res.success) {
    closeRefundTrackingModal();
    showToast("Pengajuan refund berhasil dibatalkan. Tiket kembali Aktif!", "success");
    setupProfileUI();
  } else {
    showToast(res.message, "warning");
  }
}

// --- RESCHEDULE WORKFLOW ---
function openRescheduleModal(bookingCode) {
  currentRescheduleBookingCode = bookingCode;
  const booking = UserState.bookings.find(b => b.bookingCode === bookingCode);
  if (!booking) return;

  const modal = document.getElementById("rescheduleModal");
  if (!modal) return;

  document.getElementById("rescheduleTitle").textContent = booking.title;
  document.getElementById("rescheduleOldDate").textContent = `Jadwal Saat Ini: ${booking.date}`;
  document.getElementById("rescheduleBookingCode").textContent = booking.bookingCode;

  const dateInput = document.getElementById("rescheduleNewDateInput");
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split("T")[0];
    dateInput.value = tomorrow.toISOString().split("T")[0];
  }

  modal.classList.remove("hidden");
}

function closeRescheduleModal() {
  const modal = document.getElementById("rescheduleModal");
  if (modal) modal.classList.add("hidden");
  currentRescheduleBookingCode = null;
}

function submitReschedule() {
  if (!currentRescheduleBookingCode) return;
  const newDate = document.getElementById("rescheduleNewDateInput").value;
  const reason = document.getElementById("rescheduleReasonInput").value || "Perubahan jadwal pribadi";

  if (!newDate) {
    showToast("Silakan pilih tanggal jadwal baru", "warning");
    return;
  }

  const result = UserState.rescheduleBooking(currentRescheduleBookingCode, newDate, reason);
  if (result.success) {
    closeRescheduleModal();
    showToast(`Tiket ${currentRescheduleBookingCode} berhasil dijadwalkan ulang ke ${newDate}!`, "success");
    setupProfileUI();
  }
}

// --- E-TICKET / BOARDING PASS MODAL ---
function viewTicketModal(bookingCode) {
  const booking = UserState.bookings.find(b => b.bookingCode === bookingCode);
  if (!booking) return;

  const modal = document.getElementById("eTicketModal");
  if (!modal) return;

  document.getElementById("ticketBookingCode").textContent = booking.bookingCode;
  document.getElementById("ticketServiceType").textContent = booking.serviceType.toUpperCase();
  document.getElementById("ticketTitle").textContent = booking.title;
  document.getElementById("ticketProvider").textContent = booking.provider;
  document.getElementById("ticketDate").textContent = booking.date;
  document.getElementById("ticketDeparture").textContent = booking.departureTime;
  document.getElementById("ticketArrival").textContent = booking.arrivalTime;
  document.getElementById("ticketSeat").textContent = booking.seat;
  document.getElementById("ticketPassengerName").textContent = booking.passengers ? booking.passengers[0] : UserState.user.name;
  document.getElementById("ticketStatusBadge").textContent = booking.status;
  document.getElementById("ticketAmount").textContent = formatRupiah(booking.amountPaid);

  const downloadBtn = document.getElementById("ticketDownloadBtn");
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      showToast(`Mengunduh E-Ticket ${booking.bookingCode}.pdf ...`, "info");
      setTimeout(() => {
        showToast("E-Ticket berhasil diunduh ke perangkat Anda!", "success");
      }, 1200);
    };
  }

  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeTicketModal() {
  const modal = document.getElementById("eTicketModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

// --- CHECKOUT & PAYMENT MODAL FLOW ---
function openPaymentCheckout(data) {
  pendingCheckoutData = data;
  const modal = document.getElementById("paymentModal");
  if (!modal) return;

  document.getElementById("checkoutTitle").textContent = data.title;
  document.getElementById("checkoutProvider").textContent = data.provider;
  document.getElementById("checkoutDate").textContent = `Tanggal: ${data.date}`;
  document.getElementById("checkoutSeat").textContent = data.seat || "-";
  document.getElementById("checkoutPrice").textContent = formatRupiah(data.amountPaid);
  document.getElementById("checkoutPassenger").textContent = UserState.user.name;

  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closePaymentModal() {
  const modal = document.getElementById("paymentModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  pendingCheckoutData = null;
}

function processPayment() {
  if (!pendingCheckoutData) return;

  const payBtn = document.getElementById("confirmPaymentBtn");
  if (payBtn) {
    payBtn.disabled = true;
    payBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      Memproses Transaksi...
    `;
  }

  setTimeout(() => {
    const createdBooking = UserState.createBooking(pendingCheckoutData);

    if (payBtn) {
      payBtn.disabled = false;
      payBtn.innerHTML = `Bayar Sekarang`;
    }

    closePaymentModal();
    fireCelebrationConfetti();

    showToast(`Pemesanan berhasil! Kode: ${createdBooking.bookingCode}`, "success");
    setupProfileUI();
    viewTicketModal(createdBooking.bookingCode);
  }, 1000);
}

// --- FEATURED SECTIONS RENDERING ---
function renderFeaturedSections() {
  const featuredAttContainer = document.getElementById("featuredAttractionsGrid");
  if (featuredAttContainer) {
    const featuredList = WARA_DATA.attractions.slice(0, 4);
    featuredAttContainer.innerHTML = featuredList.map(a => `
      <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
        <div class="relative h-44 overflow-hidden">
          <img src="${a.image}" alt="${a.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <span class="absolute top-3 left-3 bg-[#6B1D2F] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
            ${a.category}
          </span>
          <span class="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
            ⭐ ${a.rating}
          </span>
        </div>
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${a.cityName}</span>
            <h4 class="font-extrabold text-slate-800 text-sm group-hover:text-[#6B1D2F] transition-colors leading-snug mt-0.5 mb-1.5">${a.name}</h4>
            <p class="text-xs text-slate-500 line-clamp-2">${a.description}</p>
          </div>
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
            <div>
              <span class="text-[10px] text-slate-400 block font-medium">Mulai Dari</span>
              <span class="text-sm font-black text-[#800020]">${formatRupiah(a.price)}</span>
            </div>
            <button onclick="window.bookAttractionTicket('${a.id}')" 
                    class="bg-rose-50 hover:bg-[#6B1D2F] hover:text-white text-[#6B1D2F] text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200 transition-colors">
              Pesan Tiket
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }

  const culinaryContainer = document.getElementById("featuredCulinaryGrid");
  if (culinaryContainer) {
    culinaryContainer.innerHTML = WARA_DATA.culinary.map(c => `
      <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group">
        <div class="relative h-40 overflow-hidden">
          <img src="${c.image}" alt="${c.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <span class="absolute top-2 left-2 bg-[#6B1D2F] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
            ${c.cuisine}
          </span>
        </div>
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <span class="text-[10px] font-bold text-slate-400 block">${c.cityName}</span>
            <h4 class="font-black text-slate-800 text-sm leading-snug group-hover:text-[#6B1D2F] transition-colors mt-0.5 mb-1">${c.name}</h4>
            <p class="text-xs text-[#800020] font-semibold mb-1">🍽️ ${c.specialty}</p>
            <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">${c.description}</p>
          </div>
          <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between mt-3">
            <span class="text-xs font-bold text-slate-700">${c.priceRange}</span>
            <button onclick="window.ItineraryInstance.addItemModal()" class="text-[11px] font-bold text-[#6B1D2F] hover:underline">
              + Ke Jadwal
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }

  const dealsContainer = document.getElementById("featuredDealsGrid");
  if (dealsContainer) {
    dealsContainer.innerHTML = WARA_DATA.bundlingPackages.slice(0, 3).map(p => `
      <div class="bg-white rounded-2xl overflow-hidden border border-rose-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
        <div class="relative h-44 overflow-hidden">
          <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <span class="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow">
            Hemat ${p.discountPercent}%
          </span>
          <span class="absolute top-3 right-3 bg-white/90 text-slate-800 text-[11px] font-extrabold px-2 py-0.5 rounded shadow">
            ⏱️ ${p.duration}
          </span>
        </div>
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <span class="text-[10px] font-extrabold text-[#6B1D2F] uppercase">${p.destination}</span>
            <h4 class="font-extrabold text-slate-800 text-sm leading-snug mt-0.5 mb-2">${p.title}</h4>
            <div class="text-[11px] text-slate-600 space-y-1 mb-3">
              ${p.includes.slice(0, 3).map(inc => `<div class="truncate">✓ ${inc}</div>`).join("")}
            </div>
          </div>
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 line-through block font-medium">${formatRupiah(p.originalPrice)}</span>
              <span class="text-base font-black text-[#800020]">${formatRupiah(p.discountPrice)}</span>
            </div>
            <button onclick="window.bookBundlingModal('${p.id}')" 
                    class="bg-[#6B1D2F] hover:bg-[#800020] text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm">
              Ambil Promo
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }
}

// --- BOOKING WORKFLOW ---
function startFlightBookingObj(flightEncoded) {
  try {
    const flight = typeof flightEncoded === "string" ? JSON.parse(decodeURIComponent(flightEncoded)) : flightEncoded;
    if (!flight) return;

    window.SeatSelectorInstance.open(flight, "flight", (selectedSeats) => {
      const seatStr = selectedSeats.join(", ");
      openPaymentCheckout({
        serviceType: "flight",
        title: `Penerbangan ${flight.origin} ke ${flight.destination}`,
        provider: `${flight.airline} (${flight.flightNumber})`,
        date: window.SearchManagerInstance.searchParams.departureDate || new Date().toISOString().split("T")[0],
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        seat: seatStr,
        passengers: [UserState.user ? UserState.user.name : "Traveler"],
        amountPaid: flight.price * selectedSeats.length,
        destinationId: (flight.destinationCode || "dest").toLowerCase()
      });
    });
  } catch (err) {
    console.error("Error startFlightBookingObj:", err);
  }
}

function quickBookingFlightObj(flightEncoded) {
  try {
    const flight = typeof flightEncoded === "string" ? JSON.parse(decodeURIComponent(flightEncoded)) : flightEncoded;
    if (!flight) return;

    openPaymentCheckout({
      serviceType: "flight",
      title: `Penerbangan ${flight.origin} ke ${flight.destination}`,
      provider: `${flight.airline} (${flight.flightNumber})`,
      date: window.SearchManagerInstance.searchParams.departureDate || new Date().toISOString().split("T")[0],
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      seat: "14C (Auto Assigned)",
      passengers: [UserState.user ? UserState.user.name : "Traveler"],
      amountPaid: flight.price,
      destinationId: (flight.destinationCode || "dest").toLowerCase()
    });
  } catch (err) {
    console.error("Error quickBookingFlightObj:", err);
  }
}

function startBusBookingObj(busEncoded) {
  try {
    const bus = typeof busEncoded === "string" ? JSON.parse(decodeURIComponent(busEncoded)) : busEncoded;
    if (!bus) return;

    window.SeatSelectorInstance.open(bus, "bus", (selectedSeats) => {
      const seatStr = selectedSeats.map(s => `Kursi ${s}`).join(", ");
      openPaymentCheckout({
        serviceType: "bus",
        title: `Bus ${bus.origin} ke ${bus.destination}`,
        provider: `${bus.operator} (${bus.busClass})`,
        date: window.SearchManagerInstance.searchParams.departureDate || new Date().toISOString().split("T")[0],
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        seat: seatStr,
        passengers: [UserState.user ? UserState.user.name : "Traveler"],
        amountPaid: bus.price * selectedSeats.length,
        destinationId: "bus-dest"
      });
    });
  } catch (err) {
    console.error("Error startBusBookingObj:", err);
  }
}

function startFlightBooking(flightId) {
  const flight = WARA_DATA.flights.find(f => f.id === flightId);
  if (!flight) return;

  window.SeatSelectorInstance.open(flight, "flight", (selectedSeats) => {
    const seatStr = selectedSeats.join(", ");
    openPaymentCheckout({
      serviceType: "flight",
      title: `Penerbangan ${flight.origin} ke ${flight.destination}`,
      provider: `${flight.airline} (${flight.flightNumber})`,
      date: window.SearchManagerInstance.searchParams.departureDate,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      seat: seatStr,
      passengers: [UserState.user.name],
      amountPaid: flight.price * selectedSeats.length,
      destinationId: flight.destinationCode.toLowerCase()
    });
  });
}

function quickBookingFlight(flightId) {
  const flight = WARA_DATA.flights.find(f => f.id === flightId);
  if (!flight) return;

  openPaymentCheckout({
    serviceType: "flight",
    title: `Penerbangan ${flight.origin} ke ${flight.destination}`,
    provider: `${flight.airline} (${flight.flightNumber})`,
    date: window.SearchManagerInstance.searchParams.departureDate,
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    seat: "14C (Auto Assigned)",
    passengers: [UserState.user.name],
    amountPaid: flight.price,
    destinationId: flight.destinationCode.toLowerCase()
  });
}

function startBusBooking(busId) {
  const bus = WARA_DATA.buses.find(b => b.id === busId);
  if (!bus) return;

  window.SeatSelectorInstance.open(bus, "bus", (selectedSeats) => {
    const seatStr = selectedSeats.map(s => `Kursi ${s}`).join(", ");
    openPaymentCheckout({
      serviceType: "bus",
      title: `Bus ${bus.origin} ke ${bus.destination}`,
      provider: `${bus.operator} (${bus.busClass})`,
      date: window.SearchManagerInstance.searchParams.departureDate,
      departureTime: bus.departureTime,
      arrivalTime: bus.arrivalTime,
      seat: seatStr,
      passengers: [UserState.user.name],
      amountPaid: bus.price * selectedSeats.length,
      destinationId: bus.destinationCode.toLowerCase()
    });
  });
}

function bookHotelModal(hotelId) {
  const hotel = WARA_DATA.hotels.find(h => h.id === hotelId);
  if (!hotel) return;

  openPaymentCheckout({
    serviceType: "hotel",
    title: `${hotel.name} - 1 Malam`,
    provider: `${hotel.name} (${hotel.roomTypes[0]})`,
    date: window.SearchManagerInstance.searchParams.departureDate,
    departureTime: "Check-in: 14:00",
    arrivalTime: "Check-out: 12:00",
    seat: `Kamar: ${hotel.roomTypes[0]}`,
    passengers: [`${UserState.user.name} (1 Kamar, 2 Tamu)`],
    amountPaid: hotel.pricePerNight,
    destinationId: hotel.cityId
  });
}

function bookAttractionTicket(attractionId) {
  const att = WARA_DATA.attractions.find(a => a.id === attractionId);
  if (!att) return;

  openPaymentCheckout({
    serviceType: "attraction",
    title: `Tiket Masuk: ${att.name}`,
    provider: `${att.name} (${att.category})`,
    date: window.SearchManagerInstance.searchParams.departureDate,
    departureTime: "Jam Buka: 09:00 - 18:00",
    arrivalTime: "Akses Terusan Langsung",
    seat: "Tiket Reguler Dewasa",
    passengers: [UserState.user.name],
    amountPaid: att.price,
    destinationId: att.cityId
  });
}

function bookBundlingModal(bundleId) {
  const bundle = WARA_DATA.bundlingPackages.find(b => b.id === bundleId);
  if (!bundle) return;

  openPaymentCheckout({
    serviceType: "bundling",
    title: bundle.title,
    provider: `Wara Wiri Holiday Bundling (${bundle.destination})`,
    date: window.SearchManagerInstance.searchParams.departureDate,
    departureTime: `Paket Lengkap ${bundle.duration}`,
    arrivalTime: "Termasuk Tiket + Hotel + Tour",
    seat: "All-Inclusive Tour Voucher",
    passengers: [UserState.user.name],
    amountPaid: bundle.discountPrice,
    destinationId: bundle.destinationId
  });
}

// --- DESTINATION GUIDE / INFO MODAL ---
function showDestinationModal(cityId) {
  const dest = WARA_DATA.destinations.find(d => d.id === cityId);
  if (!dest) return;

  const modal = document.getElementById("destinationDetailModal");
  if (!modal) return;

  document.getElementById("destModalImg").src = dest.heroImage || dest.image;
  document.getElementById("destModalTitle").textContent = `${dest.name}, ${dest.country}`;
  document.getElementById("destModalRegionBadge").textContent = `${dest.region.toUpperCase()} • ${dest.code}`;
  document.getElementById("destModalTagline").textContent = `"${dest.tagline}"`;
  document.getElementById("destModalDesc").textContent = dest.description;
  document.getElementById("destModalPrice").textContent = formatRupiah(dest.flightPriceStart);

  const tagsContainer = document.getElementById("destModalTags");
  if (tagsContainer) {
    tagsContainer.innerHTML = (dest.popularTags || []).map(t => `<span class="bg-rose-50 text-[#6B1D2F] font-bold text-xs px-2.5 py-1 rounded-full border border-rose-100">#${t}</span>`).join("");
  }

  const ctaBtn = document.getElementById("destModalSelectBtn");
  if (ctaBtn) {
    ctaBtn.onclick = () => {
      window.selectDestinationFromMap(dest.id, dest.name);
      closeDestinationModal();
    };
  }

  modal.classList.remove("hidden");
}

function closeDestinationModal() {
  const modal = document.getElementById("destinationDetailModal");
  if (modal) modal.classList.add("hidden");
}

function selectDestinationFromMap(cityId, cityName) {
  window.SearchManagerInstance.setDestination(cityId, cityName);
}

function toggleWishlist(destId) {
  const added = UserState.toggleWishlist(destId);
  const dest = WARA_DATA.destinations.find(d => d.id === destId);
  const name = dest ? dest.name : "Destinasi";

  if (added) {
    showToast(`❤️ ${name} ditambahkan ke Wishlist!`, "success");
  } else {
    showToast(`🤍 ${name} dihapus dari Wishlist`, "info");
  }
}

function updateWishlistCountBadge() {
  const countBadge = document.getElementById("wishlistCountBadge");
  if (countBadge) {
    countBadge.textContent = UserState.wishlist.length;
  }
}

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  const bgClass = type === "success" ? "bg-[#6B1D2F] text-white" :
                  type === "warning" ? "bg-amber-600 text-white" :
                  type === "error" ? "bg-red-700 text-white" : "bg-slate-900 text-white";

  toast.className = `transform translate-y-2 opacity-0 transition-all duration-300 pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-semibold max-w-sm ${bgClass}`;
  
  const icon = type === "success" ? "✓" :
               type === "warning" ? "⚠️" :
               type === "error" ? "✕" : "ℹ️";

  toast.innerHTML = `
    <span class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-black flex-shrink-0">${icon}</span>
    <span class="flex-1">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  }, 10);

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function fireCelebrationConfetti() {
  if (typeof confetti === "function") {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6B1D2F", "#800020", "#E56B6F", "#F4E8EA", "#FFD700"]
    });
  }
}

// Expose globals to window
window.selectDestinationFromMap = selectDestinationFromMap;
window.showDestinationModal = showDestinationModal;
window.closeDestinationModal = closeDestinationModal;
window.startFlightBooking = startFlightBooking;
window.startFlightBookingObj = startFlightBookingObj;
window.quickBookingFlight = quickBookingFlight;
window.quickBookingFlightObj = quickBookingFlightObj;
window.startBusBooking = startBusBooking;
window.startBusBookingObj = startBusBookingObj;
window.bookHotelModal = bookHotelModal;
window.bookAttractionTicket = bookAttractionTicket;
window.bookBundlingModal = bookBundlingModal;
window.openPaymentCheckout = openPaymentCheckout;
window.closePaymentModal = closePaymentModal;
window.processPayment = processPayment;
window.viewTicketModal = viewTicketModal;
window.closeTicketModal = closeTicketModal;
window.openRescheduleModal = openRescheduleModal;
window.closeRescheduleModal = closeRescheduleModal;
window.submitReschedule = submitReschedule;
window.openRefundModal = openRefundModal;
window.closeRefundModal = closeRefundModal;
window.recalculateRefundPreview = recalculateRefundPreview;
window.selectRefundMethod = selectRefundMethod;
window.handleRefundFileUpload = handleRefundFileUpload;
window.submitRefund = submitRefund;
window.openRefundTrackingModal = openRefundTrackingModal;
window.closeRefundTrackingModal = closeRefundTrackingModal;
window.advanceRefundDemoStep = advanceRefundDemoStep;
window.cancelActiveRefund = cancelActiveRefund;
window.openUserProfileDrawer = openUserProfileDrawer;
window.closeUserProfileDrawer = closeUserProfileDrawer;
window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;
window.selectPresetAvatar = selectPresetAvatar;
window.handleAvatarFileUpload = handleAvatarFileUpload;
window.saveProfileCustomization = saveProfileCustomization;
window.renderDashboardBookings = renderDashboardBookings;
window.filterDashboardBookings = filterDashboardBookings;
window.searchDashboardBookings = searchDashboardBookings;
window.toggleWishlist = toggleWishlist;
window.resetSearchFilters = resetSearchFilters;
window.showToast = showToast;
