# Wara Wiri - Platform E-Tourism & Pariwisata ("Traveloka Lite")

**Wara Wiri** adalah website e-tourism modern berbasis web yang mengadopsi konsep **Traveloka Lite**: ringan, cepat, fokus pada fitur pemesanan esensial, bebas *clutter*, dan nyaman di mata pengguna.

---

## 🎨 1. Identitas & Visual Branding

- **Nama Brand:** Wara Wiri (Platform E-Tourism & Pariwisata)
- **Logo:** Siluet pulau/daratan nusantara dipadukan dengan pesawat terbang yang memotong melintas di atasnya (`assets/logo.svg` dan `assets/favicon.svg`).
- **Ikon Navigasi Profesional:** Menggunakan vektor SVG kustom bertema Calm Burgundy berjarak lega (menggantikan emotikon standar WhatsApp) sehingga tampilan tampak premium dan rapi tanpa patahan baris teks.
- **Skema Warna:**
  - *Calm Burgundy* (`#6B1D2F`, `#800020`, `#4A0E17`) sebagai aksen utama tombol, header, dan elemen aktif.
  - *Pure White* (`#FFFFFF`) & *Off-White* (`#F8F9FA`, `#F5F6F8`) sebagai latar belakang agar mata pengguna nyaman saat menjelajah.
- **Tipografi:** Plus Jakarta Sans & Inter font geometris modern.

---

## 🌍 2. Destinasi & Cakupan Wilayah (Total 29 Kota Lengkap)

### 🇮🇩 Indonesia (10 Kota Prioritas Utama)
1. **Jakarta (CGK)**
2. **Bali / Denpasar (DPS)**
3. **Yogyakarta (YIA)**
4. **Bandung (BDO)**
5. **Surabaya (SUB)**
6. **Labuan Bajo (LBJ)**
7. **Medan (KNO)**
8. **Malang (MLG)**
9. **Makassar (UPG)**
10. **Lombok (LOP)**

### 🌏 Asia (12 Kota Pilihan Luar Indonesia)
1. **Tokyo (HND/NRT - Jepang)**
2. **Singapore (SIN - Singapura)**
3. **Bangkok (BKK - Thailand)**
4. **Kuala Lumpur (KUL - Malaysia)**
5. **Seoul (ICN - Korea Selatan)**
6. **Hanoi (HAN - Vietnam)**
7. **Taipei (TPE - Taiwan)**
8. **Osaka (KIX - Jepang)**
9. **Hong Kong (HKG)**
10. **Manila (MNL - Filipina)**
11. **Beijing (PEK - Tiongkok)**
12. **Maldives / Male (MLE - Maladewa)**

### 🌍 Eropa (7 Kota Pilihan Utama)
1. **Paris (CDG - Prancis)**
2. **London (LHR - Inggris)**
3. **Amsterdam (AMS - Belanda)**
4. **Rome (FCO - Italia)**
5. **Barcelona (BCN - Spanyol)**
6. **Zurich (ZRH - Swiss)**
7. **Berlin (BER - Jerman)**

---

## 🚀 3. Fitur Utama & Pembaruan Interaktif

1. **Interactive Destination Map Picker:**
   - Didukung Leaflet.js dengan layer Esri World Street Map presisi tinggi (bebas watermark / tidak membutuhkan API key).
   - Filter kawasan: *Semua*, *Indonesia*, *Asia*, dan *Eropa*.
   - Pop-up info dengan estimasi tarif terendah, kondisi cuaca, dan tombol satu-klik *"Pilih Tujuan"*.

2. **Kustomisasi Profil Pengguna Lengkap:**
   - Ubah Nama Lengkap, Email, dan Nomor WhatsApp/HP.
   - Pilihan Avatar: 6 Karakter Avatar Wisatawan pilihan atau Unggah Foto Sendiri dari perangkat.
   - Pilihan Kota Asal Default (Jakarta, Surabaya, Bandung, Bali, Yogyakarta, Medan).
   - Pilihan Gaya Traveling (Solo & Explorer, Family & Leisure, Couple Romantic, Luxury Seeker, Budget Backpacker).
   - Bio & Motto perjalanan pribadi.

3. **Fitur Pengajuan & Pelacakan Refund Lengkap:**
   - **Kalkulasi Transparan:** Rincian harga tiket, potongan regulasi (10% untuk pembatalan pribadi / 0% untuk medis/maskapai), pengembalian pajak bandara 100%, serta bonus koin 5% jika memilih Wara Wallet.
   - **Lampiran Bukti:** Dukungan unggah berkas bukti pendukung (surat dokter / konfirmasi maskapai).
   - **Metode Pencairan Fleksibel:**
     1. *Wara Wiri Travel Wallet* (Instan hari ini + Bonus 5% Poin Koin).
     2. *Transfer Bank* (BCA, Mandiri, BRI, BNI, CIMB Niaga).
     3. *E-Wallet* (GoPay, OVO, DANA, ShopeePay).
   - **Pelacakan Status Refund Real-Time (ID: RF-2026-XXXXX):**
     - Timeline 4 tahap progres:
       1. 🟢 Pengajuan Diterima
       2. 🟡 Verifikasi Maskapai & Administrasi
       3. ⚪ Penerbitan Dana Kliring Bank / E-Wallet
       4. ⚪ Dana Berhasil Masuk ke Rekening
     - Tombol simulasi demo untuk mempercepat tahapan status hingga dana cair.
     - Opsi pembatalan refund jika berubah pikiran.

4. **Dynamic & Real-Time Travel Filters:**
   - Filter harga dinamis dengan range slider instan tanpa *reload* halaman.
   - Filter jenis penerbangan (Langsung / Direct vs 1 Transit).
   - Filter hotel berdasarkan kelas bintang (⭐ 4+ dan ⭐ 5 Luxury).
   - Sorting otomatis: Termurah, Tercepat, Rating Tertinggi.

5. **Interactive Itinerary Builder:**
   - Day-by-day travel planner (Hari 1, Hari 2, Hari 3 + tombol tambah hari).
   - Indikator jam aktivitas, kategori, estimasi durasi antar-lokasi, dan catatan penting.
   - Checklist interaktif untuk menandai tempat yang sudah dikunjungi.
   - Tombol pindah urutan (naik/turun), hapus, serta fitur **Cetak / Simpan PDF**.

6. **Live Flight & Bus Seat Selector:**
   - Layout kabin pesawat realistis (Boeing 737 / Airbus A320 konfigurasi 3-3, indikator kokpit, lorong tengah, pintu darurat, dan kursi extra legroom).
   - Layout kabin bus eksekutif antar-kota Indonesia (konfigurasi 2-2, kursi sopir, toilet bus, dan pintu darurat).
   - Status visual kursi: *Tersedia*, *Terisi*, dan *Dipilih*.

7. **Pencarian Tiket Presisi Sesuai Destinasi (Dynamic Route Matching):**
   - Hasil pencarian tiket pesawat terhubung 100% dengan destinasi yang dipilih pengguna:
     - Rute **Eropa (Berlin, Paris, London, Amsterdam, Roma, Zurich, Barcelona)**: Menampilkan maskapai resmi penerbangan global (Lufthansa LH-779, Qatar Airways QR-958, Emirates EK-360, Air France, British Airways, KLM) dengan kode bandara tujuan presisi (seperti BER untuk Berlin), transit hub resmi, estimasi durasi dan bagasi internasional.
     - Rute **Asia (Tokyo, Singapura, Seoul, Bangkok, Kuala Lumpur, Taipei, Osaka, dll.)**: Menampilkan maskapai All Nippon Airways (ANA), Singapore Airlines, Korean Air, Garuda Indonesia, dan AirAsia.
     - Rute **Domestik Indonesia (Bali, Jogja, Labuan Bajo, dll.)**: Menampilkan Garuda Indonesia, Batik Air, Citilink, dan Super Air Jet.
   - Menghilangkan anomali pemilihan tiket acak (mencari Berlin dipastikan hanya menampilkan tiket ke Berlin, bukan ke Jogja).
   - Rute tiket bus antar-kota dibatasi secara cerdas untuk jalur darat Indonesia dengan rekomendasi langsung ke tiket pesawat jika pengguna memilih destinasi luar negeri.

8. **Fitur Live Chat Customer Support 24/7 ("Sarah - Travel Specialist"):**
   - Tombol widget floating di pojok kanan bawah dengan animasi status online hijau dan badge pesan belum terbaca.
   - Pintasan akses cepat juga disematkan pada navigasi desktop, menu drawer mobile, serta footer.
   - Respon pintar otomatis menjawab kendala seputar pemesanan tiket luar negeri (Berlin/Eropa/Asia), transparansi alur refund, tata cara reschedule gratis 1x, petunjuk pemilihan kursi, promo paket tour bundling, hingga bus antar-kota.
   - Dilengkapi *Quick FAQ Chips* untuk tanya jawab satu kali klik, simulasi waktu respons pengetikan (*typing indicator*), dan opsi nomor hotline darurat / WhatsApp 24 jam.

---

## 💻 Cara Menjalankan Website

Website dapat diakses langsung pada server lokal:
```bash
http://localhost:8080/
```
Atau cukup klik dua kali berkas `index.html` pada file manager.
