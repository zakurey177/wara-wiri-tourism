/**
 * Wara Wiri - Live Chat Support Assistant (24/7 Customer Care)
 * Handles interactive floating live chat widget, automated smart responses,
 * quick FAQ chips, typing simulation, and real-time guidance for travel inquiries.
 */

class LiveChatAssistant {
  constructor() {
    this.isOpen = false;
    this.unreadCount = 1;
    this.messages = [];
    this.isAgentTyping = false;
  }

  init() {
    this.messages = [
      {
        sender: "agent",
        senderName: "Sarah (Customer Support)",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
        time: this.getCurrentTimeString(),
        text: `Halo Kak <b>${UserState.user ? UserState.user.name.split(" ")[0] : "Traveler"}</b>! 👋 Selamat datang di Layanan Bantuan 24/7 Wara Wiri. Ada kendala dalam pemesanan tiket, pemilihan destinasi, reschedule, atau refund yang bisa saya bantu?`
      }
    ];

    this.renderMessages();
    this.updateBadge();
  }

  getCurrentTimeString() {
    const d = new Date();
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    const widget = document.getElementById("liveChatWidget");
    const toggleBtn = document.getElementById("liveChatToggleBtn");

    if (!widget) return;

    if (this.isOpen) {
      widget.classList.remove("hidden");
      this.unreadCount = 0;
      this.updateBadge();
      this.scrollToBottom();
      // focus input
      setTimeout(() => {
        const input = document.getElementById("liveChatInput");
        if (input) input.focus();
      }, 200);
    } else {
      widget.classList.add("hidden");
    }
  }

  updateBadge() {
    const badge = document.getElementById("liveChatBadge");
    if (!badge) return;
    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  sendMessage(text) {
    if (!text || text.trim() === "") return;
    const cleanText = text.trim();

    // Add user message
    this.messages.push({
      sender: "user",
      senderName: UserState.user ? UserState.user.name : "Saya",
      time: this.getCurrentTimeString(),
      text: cleanText
    });

    this.renderMessages();
    this.scrollToBottom();

    // Clear input
    const input = document.getElementById("liveChatInput");
    if (input) input.value = "";

    // Trigger agent typing & response
    this.triggerAgentResponse(cleanText);
  }

  triggerAgentResponse(userQuery) {
    this.isAgentTyping = true;
    this.renderTypingIndicator(true);
    this.scrollToBottom();

    // Determine smart response
    const replyText = this.generateSmartResponse(userQuery.toLowerCase());

    const delay = Math.min(1800, Math.max(900, cleanWordCount(replyText) * 40));

    setTimeout(() => {
      this.isAgentTyping = false;
      this.renderTypingIndicator(false);

      this.messages.push({
        sender: "agent",
        senderName: "Sarah (Customer Support)",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
        time: this.getCurrentTimeString(),
        text: replyText
      });

      this.renderMessages();
      this.scrollToBottom();

      if (!this.isOpen) {
        this.unreadCount++;
        this.updateBadge();
      }
    }, delay);
  }

  generateSmartResponse(q) {
    // 1. Destinasi & Tiket tidak pas / Berlin / Luar Negeri
    if (q.includes("berlin") || q.includes("eropa") || q.includes("luar negeri") || q.includes("tujuan") || q.includes("rute") || q.includes("sesuai")) {
      return `Untuk rute ke <b>Eropa (seperti Berlin, Paris, London, Roma)</b> dan <b>Asia (Tokyo, Singapura, Seoul)</b>, sistem kami kini telah mengunci penerbangan internasional resmi (seperti Lufthansa, Qatar Airways, Emirates, Singapore Airlines).<br><br>💡 <b>Tips:</b> Silakan pilih kota asal (misal: Jakarta CGK) dan tujuan (misal: Berlin BER), lalu klik tombol <b>Cari Tiket</b>. Tiket yang muncul dijamin 100% tepat menuju Berlin lengkap dengan jadwal transit dan tarif resmi!`;
    }

    // 2. Refund
    if (q.includes("refund") || q.includes("batal") || q.includes("kembali dana") || q.includes("uang")) {
      return `Pengajuan refund di Wara Wiri sangat transparan dan bebas repot! 🙌<br><br>
        1. Buka menu <b>Pesanan Saya</b> di bagian atas.<br>
        2. Pilih tiket aktif dan klik tombol <b>Refund</b>.<br>
        3. Anda akan melihat kalkulasi transparan (100% full refund untuk pembatalan medis/maskapai, atau potongan regulasi 10% untuk perubahan pribadi).<br>
        4. Pilih pencairan ke <b>Transfer Bank (1-3 hari)</b>, <b>E-Wallet</b>, atau <b>Wara Wallet (Instan hari ini + Bonus 5% Poin)</b>.<br>
        5. Anda bisa melacak statusnya secara real-time lewat tombol <b>Lacak Refund</b>!`;
    }

    // 3. Reschedule
    if (q.includes("reschedule") || q.includes("ubah tanggal") || q.includes("ganti jadwal") || q.includes("jadwal")) {
      return `Anda berhak mendapatkan promo <b>Gratis Biaya Admin Reschedule 1x</b>! 🎉<br><br>
        Caranya sangat mudah: buka menu <b>Pesanan Saya</b>, klik tombol <b>Reschedule</b> pada tiket yang ingin diubah, lalu pilih tanggal baru dan alasan perubahan jadwal. Tiket Anda akan langsung terbit ulang dengan jadwal baru.`;
    }

    // 4. Pilih Kursi
    if (q.includes("kursi") || q.includes("seat") || q.includes("duduk")) {
      return `Untuk memilih nomor kursi favorit, saat Anda mencari tiket penerbangan atau bus, klik tombol <b>"Pilih Kursi & Pesan"</b>.<br><br>Denah kabin interaktif (pesawat Boeing/Airbus atau bus eksekutif 2-2) akan terbuka. Anda dapat memilih kursi jendela (window), lorong (aisle), atau kursi dengan <i>extra legroom</i> di baris depan!`;
    }

    // 5. Promo & Bundling
    if (q.includes("promo") || q.includes("diskon") || q.includes("bundling") || q.includes("hemat")) {
      return `Saat ini sedang berlangsung <b>Promo Super Bundling Liburan Hemat hingga 25%</b>! 🎁<br><br>
        Termasuk paket <b>Labuan Bajo 4D3N</b>, <b>Tokyo & Mt. Fuji 5D4N</b>, dan <b>Paris Romantique 7D6N</b>. Paket sudah mencakup Tiket Pesawat PP + Hotel Berbintang 5 + Tur Wisata Ikonik. Anda bisa melihatnya di tab <b>Promo & Bundling</b>!`;
    }

    // 6. Bus
    if (q.includes("bus") || q.includes("travel") || q.includes("shuttle")) {
      return `Layanan bus antar-kota Wara Wiri melayani rute darat populer di Indonesia (seperti Jakarta–Bandung, Jakarta–Yogyakarta, Surabaya–Bali, dll) bersama operator terpercaya seperti DayTrans, Sinar Jaya Suite Class, dan Rosalia Indah. Jika ingin bepergian ke luar negeri, silakan gunakan tiket pesawat.`;
    }

    // Default polite response
    return `Terima kasih atas pertanyaannya, Kak! Pertanyaan Anda telah tercatat di sistem kami.<br><br>Jika Anda membutuhkan bantuan darurat atau eskalasi mendesak, Anda juga dapat menghubungi Call Center 24 Jam kami di <b>021-500-WARA (9272)</b> atau WhatsApp resmi di <b>+62 812-8899-WARA</b>. Ada hal lain yang ingin ditanyakan seputar tiket atau destinasi wisata? 😊`;
  }

  sendQuickPrompt(text) {
    this.sendMessage(text);
  }

  renderMessages() {
    const container = document.getElementById("liveChatMessages");
    if (!container) return;

    container.innerHTML = this.messages.map(m => {
      const isUser = m.sender === "user";
      if (isUser) {
        return `
          <div class="flex justify-end mb-3">
            <div class="max-w-[80%] bg-[#6B1D2F] text-white p-3 rounded-2xl rounded-tr-sm text-xs shadow-sm">
              <p class="leading-relaxed">${m.text}</p>
              <span class="text-[9px] text-rose-200 block text-right mt-1 font-semibold">${m.time}</span>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="flex items-start gap-2.5 mb-3">
            <img src="${m.avatar}" alt="Sarah" class="w-7 h-7 rounded-full object-cover ring-2 ring-rose-200 flex-shrink-0 mt-0.5">
            <div class="max-w-[82%] bg-slate-100 text-slate-800 p-3 rounded-2xl rounded-tl-sm text-xs border border-slate-200/80 shadow-sm">
              <span class="text-[10px] font-black text-[#6B1D2F] block mb-1">${m.senderName}</span>
              <p class="leading-relaxed">${m.text}</p>
              <span class="text-[9px] text-slate-400 block text-right mt-1.5 font-semibold">${m.time}</span>
            </div>
          </div>
        `;
      }
    }).join("");
  }

  renderTypingIndicator(show) {
    const indicator = document.getElementById("liveChatTyping");
    if (!indicator) return;
    if (show) {
      indicator.classList.remove("hidden");
    } else {
      indicator.classList.add("hidden");
    }
  }

  scrollToBottom() {
    const container = document.getElementById("liveChatMessages");
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }
}

function cleanWordCount(str) {
  return str.replace(/<[^>]*>/g, "").split(/\s+/).length;
}

// Global instance
window.LiveChatInstance = new LiveChatAssistant();
