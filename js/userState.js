/**
 * Wara Wiri - State Management & LocalStorage Persistence
 * Handles Customizable User Profile, Active Bookings, Reschedule,
 * Complete Multi-Step Transparent Refund System, Wishlist, and Itineraries.
 */

const STORAGE_KEYS = {
  USER: "warawiri_user_profile",
  WISHLIST: "warawiri_wishlist",
  BOOKINGS: "warawiri_bookings",
  ITINERARY: "warawiri_itinerary"
};

class UserStateManager {
  constructor() {
    this.init();
  }

  init() {
    // Load or initialize user profile
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (e) {
        this.user = { ...WARA_DATA.initialUserProfile };
      }
    } else {
      this.user = {
        ...WARA_DATA.initialUserProfile,
        homeCity: "jkt",
        homeCityName: "Jakarta (CGK)",
        travelStyle: "Solo & Explorer",
        bio: "Menjelajahi keindahan nusantara dan pesona cakrawala dunia bersama Wara Wiri."
      };
      this.saveUser();
    }

    // Load or initialize bookings
    const savedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (savedBookings) {
      try {
        this.bookings = JSON.parse(savedBookings);
      } catch (e) {
        this.bookings = [...WARA_DATA.initialUserProfile.bookings];
      }
    } else {
      this.bookings = [...WARA_DATA.initialUserProfile.bookings];
      this.saveBookings();
    }

    // Load or initialize wishlist
    const savedWishlist = localStorage.getItem(STORAGE_KEYS.WISHLIST);
    if (savedWishlist) {
      try {
        this.wishlist = JSON.parse(savedWishlist);
      } catch (e) {
        this.wishlist = [...WARA_DATA.initialUserProfile.savedWishlist];
      }
    } else {
      this.wishlist = [...WARA_DATA.initialUserProfile.savedWishlist];
      this.saveWishlist();
    }

    // Load or initialize itinerary
    const savedItinerary = localStorage.getItem(STORAGE_KEYS.ITINERARY);
    if (savedItinerary) {
      try {
        this.itinerary = JSON.parse(savedItinerary);
      } catch (e) {
        this.itinerary = this.getDefaultItinerary();
      }
    } else {
      this.itinerary = this.getDefaultItinerary();
      this.saveItinerary();
    }
  }

  saveUser() {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.user));
    this.dispatchUpdateEvent("userUpdated");
  }

  saveBookings() {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(this.bookings));
    this.dispatchUpdateEvent("bookingsUpdated");
  }

  saveWishlist() {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(this.wishlist));
    this.dispatchUpdateEvent("wishlistUpdated");
  }

  saveItinerary() {
    localStorage.setItem(STORAGE_KEYS.ITINERARY, JSON.stringify(this.itinerary));
    this.dispatchUpdateEvent("itineraryUpdated");
  }

  dispatchUpdateEvent(eventName) {
    window.dispatchEvent(new CustomEvent(eventName));
  }

  // --- USER PROFILE CUSTOMIZATION ---
  updateProfile(newData) {
    this.user = {
      ...this.user,
      ...newData
    };
    this.saveUser();
    return this.user;
  }

  // --- WISHLIST ---
  toggleWishlist(destinationId) {
    const idx = this.wishlist.indexOf(destinationId);
    let added = false;
    if (idx > -1) {
      this.wishlist.splice(idx, 1);
      added = false;
    } else {
      this.wishlist.push(destinationId);
      added = true;
    }
    this.saveWishlist();
    return added;
  }

  isWishlisted(destinationId) {
    return this.wishlist.includes(destinationId);
  }

  getWishlistDestinations() {
    return WARA_DATA.destinations.filter(d => this.wishlist.includes(d.id));
  }

  // --- BOOKINGS ---
  createBooking(bookingData) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const prefix = bookingData.serviceType === "flight" ? "WW-FL" :
                   bookingData.serviceType === "bus" ? "WW-BS" :
                   bookingData.serviceType === "hotel" ? "WW-HT" : "WW-PKG";

    const newBooking = {
      bookingCode: `${prefix}-${randomSuffix}`,
      createdAt: new Date().toISOString(),
      status: "Aktif",
      canReschedule: true,
      canRefund: true,
      ...bookingData
    };

    this.bookings.unshift(newBooking);
    this.saveBookings();

    // Reward points (100 points per Rp 1.000.000)
    const bonusPoints = Math.max(50, Math.floor((bookingData.amountPaid || 1000000) / 10000));
    this.user.points = (this.user.points || 0) + bonusPoints;
    this.saveUser();

    return newBooking;
  }

  rescheduleBooking(bookingCode, newDate, reason) {
    const booking = this.bookings.find(b => b.bookingCode === bookingCode);
    if (!booking) return { success: false, message: "Tiket tidak ditemukan" };

    booking.oldDate = booking.date;
    booking.date = newDate;
    booking.rescheduleReason = reason;
    booking.rescheduledAt = new Date().toISOString();
    booking.status = "Dijadwalkan Ulang";

    this.saveBookings();
    return { success: true, booking };
  }

  // --- FULL-FEATURED MULTI-STEP REFUND SYSTEM ---
  requestRefund(bookingCode, refundFormData) {
    const booking = this.bookings.find(b => b.bookingCode === bookingCode);
    if (!booking) return { success: false, message: "Tiket tidak ditemukan" };

    const originalAmount = booking.amountPaid || 1000000;
    
    // Policy logic:
    // If reason is Medical/Airline Cancellation -> 100% full refund
    // If reason is Wallet refund -> 100% + 5% bonus travel coin
    // If personal change -> 90% (10% airline/hotel processing fee)
    let deductionPercentage = 0.10;
    let bonusAmount = 0;

    if (refundFormData.reasonCategory === "airline_cancel" || refundFormData.reasonCategory === "medical") {
      deductionPercentage = 0.0;
    } else if (refundFormData.disbursementMethod === "wallet") {
      deductionPercentage = 0.0;
      bonusAmount = Math.round(originalAmount * 0.05); // 5% bonus coin incentive
    }

    const airlineFee = Math.round(originalAmount * deductionPercentage);
    const airportTaxRefund = Math.min(150000, Math.round(originalAmount * 0.08));
    const refundAmount = (originalAmount - airlineFee) + bonusAmount;

    const refundId = `RF-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    booking.status = "Refund Diajukan";
    booking.canRefund = false;
    booking.canReschedule = false;

    booking.refundDetails = {
      refundId: refundId,
      step: 1, // 1: Pengajuan Diterima, 2: Verifikasi Maskapai, 3: Penerbitan Bank, 4: Selesai
      stepLabel: "Pengajuan Diterima & Menunggu Verifikasi Maskapai",
      requestedAt: new Date().toISOString(),
      originalAmount,
      airlineFee,
      airportTaxRefund,
      bonusAmount,
      refundAmount,
      reasonCategory: refundFormData.reasonCategory,
      reasonDetails: refundFormData.reasonDetails,
      evidenceFile: refundFormData.evidenceFile || "Dokumen_Keterangan.pdf",
      disbursementMethod: refundFormData.disbursementMethod, // 'bank', 'ewallet', 'wallet'
      accountInfo: {
        providerName: refundFormData.providerName, // BCA, GoPay, Wara Wallet, etc.
        accountNumber: refundFormData.accountNumber,
        accountHolder: refundFormData.accountHolder
      },
      estimatedArrival: refundFormData.disbursementMethod === "wallet" ? "Instan (Hari Ini)" : "1 - 3 Hari Kerja",
      historyTimeline: [
        {
          title: "Pengajuan Refund Berhasil Diterima Sistem",
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
          status: "done",
          description: `Pengajuan ID ${refundId} telah masuk ke sistem audit Wara Wiri.`
        },
        {
          title: "Verifikasi Kelayakan dengan Mitra Maskapai / Hotel",
          time: "Estimasi 2-6 Jam",
          status: "current",
          description: "Tim operasional memverifikasi nomor tiket & status kursi dengan operator."
        },
        {
          title: "Penerbitan Dana oleh Bank Kliring / Mitra Pembayaran",
          time: "Estimasi 1 Hari Kerja",
          status: "pending",
          description: `Pengiriman dana sebesar ${formatRupiah(refundAmount)} ke ${refundFormData.providerName}.`
        },
        {
          title: "Dana Masuk ke Rekening Pengguna",
          time: "Estimasi Maksimal 3 Hari Kerja",
          status: "pending",
          description: "Notifikasi transfer bank selesai dan mutasi rekening terverifikasi."
        }
      ]
    };

    this.saveBookings();
    return { success: true, booking, refundAmount, refundId };
  }

  // Cancel refund request (revert back to active ticket)
  cancelRefund(bookingCode) {
    const booking = this.bookings.find(b => b.bookingCode === bookingCode);
    if (!booking || !booking.refundDetails) return { success: false, message: "Tiket tidak dalam proses refund" };

    if (booking.refundDetails.step >= 3) {
      return { success: false, message: "Refund sudah dalam tahap penerbitan bank, tidak dapat dibatalkan." };
    }

    booking.status = "Aktif";
    booking.canRefund = true;
    booking.canReschedule = true;
    delete booking.refundDetails;

    this.saveBookings();
    return { success: true, booking };
  }

  // Simulate advancing the refund step for testing/demo
  advanceRefundStep(bookingCode) {
    const booking = this.bookings.find(b => b.bookingCode === bookingCode);
    if (!booking || !booking.refundDetails) return { success: false };

    const currentStep = booking.refundDetails.step;
    if (currentStep < 4) {
      booking.refundDetails.step = currentStep + 1;
      
      if (booking.refundDetails.step === 2) {
        booking.refundDetails.stepLabel = "Terverifikasi oleh Maskapai, Menunggu Transfer Bank";
        booking.refundDetails.historyTimeline[1].status = "done";
        booking.refundDetails.historyTimeline[2].status = "current";
      } else if (booking.refundDetails.step === 3) {
        booking.refundDetails.stepLabel = "Proses Penerbitan Kliring Bank / E-Wallet";
        booking.refundDetails.historyTimeline[2].status = "done";
        booking.refundDetails.historyTimeline[3].status = "current";
      } else if (booking.refundDetails.step === 4) {
        booking.status = "Refund Selesai";
        booking.refundDetails.stepLabel = "Dana Berhasil Dikirim ke Rekening";
        booking.refundDetails.historyTimeline[3].status = "done";
        booking.refundDetails.completedAt = new Date().toISOString();
      }

      this.saveBookings();
      return { success: true, booking, step: booking.refundDetails.step };
    }
    return { success: false, message: "Refund sudah selesai." };
  }

  // --- DEFAULT ITINERARY ---
  getDefaultItinerary() {
    return {
      title: "Liburan Impian 3 Hari 2 Malam di Bali",
      destination: "Bali (Denpasar & Ubud)",
      days: [
        {
          dayNumber: 1,
          dateLabel: "Hari 1 - Tiba di Bali & Sunset Jimbaran",
          items: [
            {
              id: "it-1",
              time: "10:20",
              title: "Tiba di Bandara Ngurah Rai (DPS)",
              type: "flight",
              category: "Transportasi",
              estDuration: "45 Menit",
              location: "Bandara Internasional I Gusti Ngurah Rai",
              notes: "Ambil bagasi dan temui driver penjemputan.",
              completed: true
            },
            {
              id: "it-2",
              time: "14:00",
              title: "Check-in di AYANA Resort Bali",
              type: "hotel",
              category: "Akomodasi",
              estDuration: "1 Jam",
              location: "Jimbaran, Bali",
              notes: "Menikmati welcome drink dan istirahat sejenak di kamar Terrace Suite.",
              completed: false
            },
            {
              id: "it-3",
              time: "17:30",
              title: "Sunset di Rock Bar Bali",
              type: "attraction",
              category: "Wisata & Santai",
              estDuration: "2 Jam",
              location: "Tebing Karang Jimbaran",
              notes: "Akses jalur antrean prioritas tamu resor untuk menikmati senja Samudra Hindia.",
              completed: false
            }
          ]
        },
        {
          dayNumber: 2,
          dateLabel: "Hari 2 - Eksplorasi Seni Ubud & Kuliner",
          items: [
            {
              id: "it-4",
              time: "09:00",
              title: "Jelajah Sawah Terasering Tegalalang",
              type: "attraction",
              category: "Wisata Alam",
              estDuration: "2 Jam",
              location: "Ubud, Gianyar",
              notes: "Foto di ayunan sawah dan trekking ringan di pematang.",
              completed: false
            },
            {
              id: "it-5",
              time: "12:30",
              title: "Makan Siang Bebek Bengil Ubud",
              type: "culinary",
              category: "Kuliner",
              estDuration: "1.5 Jam",
              location: "Jl. Hanoman, Ubud",
              notes: "Coba menu crispy duck khas Ubud dengan 3 varian sambal.",
              completed: false
            },
            {
              id: "it-6",
              time: "16:00",
              title: "Mengunjungi Garuda Wisnu Kencana (GWK)",
              type: "attraction",
              category: "Budaya",
              estDuration: "2.5 Jam",
              location: "Ungasan, Bali",
              notes: "Menyaksikan Tari Kecak kolosal berlatar senja megah patung GWK.",
              completed: false
            }
          ]
        },
        {
          dayNumber: 3,
          dateLabel: "Hari 3 - Relaksasi Pantai & Oleh-oleh Krisna",
          items: [
            {
              id: "it-7",
              time: "08:30",
              title: "Berenang di Kubu Private Beach",
              type: "attraction",
              category: "Pantai",
              estDuration: "2 Jam",
              location: "Pantai Kubu, Jimbaran",
              notes: "Turun menggunakan inclinator rel tebing yang unik.",
              completed: false
            },
            {
              id: "it-8",
              time: "12:00",
              title: "Check-out & Belanja di Krisna Oleh-Oleh",
              type: "shopping",
              category: "Belanja",
              estDuration: "1.5 Jam",
              location: "Tuban, Kuta",
              notes: "Beli pie susu, kacang disco, dan kain pantai.",
              completed: false
            },
            {
              id: "it-9",
              time: "15:00",
              title: "Menuju Bandara Ngurah Rai untuk Kepulangan",
              type: "flight",
              category: "Transportasi",
              estDuration: "1 Jam",
              location: "Bandara DPS",
              notes: "Penerbangan pulang ke Jakarta pukul 17:30.",
              completed: false
            }
          ]
        }
      ]
    };
  }
}

// Global user state instance
const UserState = new UserStateManager();
