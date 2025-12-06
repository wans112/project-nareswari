const path = require('path');
const Database = require('better-sqlite3');

const DB_FILE = path.join(__dirname, 'database', 'app.db');
const db = new Database(DB_FILE);

// --- Helper Functions ---

function cleanPrice(priceStr) {
    if (!priceStr) return 0;
    let clean = priceStr.toString().replace(/[^\d]/g, '');
    return parseInt(clean, 10) || 0;
}

function parseBenefits(benefitString) {
    if (!benefitString || benefitString === '-') return [];
    return benefitString.split(',').map(b => b.trim()).filter(b => b.length > 0);
}

// --- DATA SOURCE ---
const rawData = [
    // === 1. RUMAH (Code: R) ===
    {
        category: { name: 'Pernikahan', sub: 'Rumah', code: 'pernikahan' },
        items: [
            { name: 'Paket Simple 7.4', price: '7.400.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Melati, Softlens, Nail Art, Keluarga: Makeup Ibu Hajat Only',
                'Dekorasi & Perlengkapan': 'Dekor Akad Tanpa Panggung 3m, Gapura, Meja Tamu, Welcome Sign, 1 Set Tenda Serut, 50 Kursi, 1 Set Prasmanan',
                'Dokumentasi': 'Foto 1 roll, Cetak Album, File CD'
            }},
            { name: 'Paket Hemat 8.3', price: '8.300.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Melati, Softlens (bonus), Nail Art, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu',
                'Dekorasi & Perlengkapan': 'Pelaminan 4m, Mini Garden, Welcome Sign, Gapura, Meja Penerima Tamu, Kotak Amplop, (TANPA TENDA)',
                'Dokumentasi': 'Foto 2 roll (72 cetak), Cetak Album, File CD'
            }},
            { name: 'Paket Standard 9.8', price: '9.800.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Melati, Softlens, Henna, Keluarga: Ibu Hajat+Besan, 2 Kakak/Adik, 2 Pagar Ayu',
                'Dekorasi & Perlengkapan': 'Pelaminan 4m, 2 Set Tenda Serut (Lebar max 4m x 10m), 100 Kursi+Cover, 1 Set Prasmanan, Blower Air 1',
                'Dokumentasi': 'Foto 2 roll (72-80 cetak), Cetak Album, File CD'
            }},
            { name: 'Paket Standard 10.8', price: '10.800.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Melati, Softlens, Henna, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu',
                'Dekorasi & Perlengkapan': 'Pelaminan 5m, 2 Set Tenda Serut, 100 Kursi+Cover, 1 Set Prasmanan, Blower Air 1',
                'Dokumentasi': 'Foto 2 roll (72 cetak), Cetak Album, File CD'
            }},
            { name: 'Paket Full Karpet 12.5', price: '12.500.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Melati, Softlens, Henna, Nail Art, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu',
                'Dekorasi & Perlengkapan': 'Pelaminan 5m, 2 Set Tenda Serut, 2 Set Tirai + Karpet, 1 Blower Air, 100 Kursi, Prasmanan Roll Top',
                'Dokumentasi': 'Foto 2 roll (72 cetak), Cetak Album, File CD'
            }},
            { name: 'Paket Full Karpet 13.8', price: '13.800.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & 1-2 Resepsi, Melati, Softlens, Henna, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu',
                'Dekorasi & Perlengkapan': 'Pelaminan 6m, 2 Set Tenda Serut/Sisir, 2 Set Tirai + Full Karpet, 1 Blower Air, 100 Kursi, Prasmanan Roll Top',
                'Dokumentasi': 'Foto 2 roll (72 cetak), Cetak Album, File CD'
            }},
            { name: 'Paket Full Karpet 14 Juta', price: '14.000.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Melati, Softlens, Henna, Keluarga: 2 Ibu, 2 Bapak, 2 Pagar Ayu, 2 Keluarga',
                'Dekorasi & Perlengkapan': 'Pelaminan Kaca 5m, 2 Set Tenda Serut/Sisir, 2 Set Tirai + Full Karpet, 100 Kursi, Prasmanan Biasa',
                'Dokumentasi': 'Foto 2 roll (72 cetak), Cetak Album, File CD'
            }},
            { name: 'Paket Dekor Besar 15.5', price: '15.500.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & 1-2 Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu',
                'Dekorasi & Perlengkapan': 'Pelaminan Kaca 6m, 3 Set Tenda Serut, 3 Set Tirai + Karpet (Full seperti gedung), 1 Blower Air, 100 Kursi, Prasmanan Roll Top',
                'Dokumentasi': 'Foto 2 roll (72 cetak), Cetak Album, File CD'
            }},
            { name: 'Paket Multimedia 15.7', price: '15.700.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu',
                'Dekorasi & Perlengkapan': 'Pelaminan 5m, 2 Set Tenda Serut, 2 Set Tirai + Karpet, 1 Blower Air, 100 Kursi, Prasmanan Roll Top',
                'Entertainment': 'MC Akad, Sound Sistem (Pagi-Sore), Video Liputan',
                'Dokumentasi': 'Foto 2 roll'
            }},
            { name: 'Paket Entertainment 17 Juta', price: '17.000.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu',
                'Dekorasi & Perlengkapan': 'Pelaminan 5m, 2 Set Tenda Serut, 2 Set Tirai + Karpet, 1 Blower Air, 100 Kursi, Prasmanan Roll Top',
                'Entertainment': 'MC Akad-Resepsi, 2 Penari, 2 WO Person, Sound Sistem',
                'Dokumentasi': 'Foto 2 roll, Video (2 keping)'
            }},
            { name: 'Paket Luxury 18 Juta', price: '18.000.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & 1-2 Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu/Keluarga',
                'Dekorasi & Perlengkapan': 'Pelaminan Kaca 6m Bunga Imitasi, Dekor Lorong 5m, Photo Booth, 3 Set Tenda Serut + Tenda Lorong, 3.5 Set Karpet & Tirai (Semi Indoor), 1 Blower',
                'Dokumentasi': 'Foto 2 roll, Cetak Album (72 lembar), File CD, File via WA'
            }},
            { name: 'Paket Wedding 19.5', price: '19.500.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu, 2 Keluarga',
                'Dekorasi & Perlengkapan': 'Pelaminan 6m Bunga Segar, Photo Booth 3m, Tenda Toserba Sisir Modif Jumbo 1 Set, Tenda Serut 2 Set, 3 Set Karpet/Tirai (Semi Indoor), 1 Blower, 100 Kursi',
                'Dokumentasi': 'Foto 2 roll, Cetak Album, File CD'
            }},
            { name: 'Paket Platinum 20 Juta', price: '20.000.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & 1-2 Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu/Keluarga',
                'Dekorasi & Perlengkapan': 'Pelaminan Kaca 6m, Dekor Lorong 5m, Photo Booth, 3 Set Tenda Serut + Tenda Lorong, 3.5 Set Karpet & Tirai (Semi Indoor), 1 Blower',
                'Entertainment': 'MC Akad, Sound Sistem, Video Liputan',
                'Dokumentasi': 'Foto 2 roll, Album'
            }},
            { name: 'Paket Wedding 22.8', price: '22.800.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu, 2 Keluarga',
                'Dekorasi & Perlengkapan': 'Pelaminan 6m Bunga Segar, Dekor Lorong 5m Bunga Segar, Bunga Mobil, Photo Booth, Tenda Sisir 3 Set, 3.5 Set Karpet/Tirai, Tenda Lorong, 1 Blower',
                'Entertainment': 'Video Liputan 1 Keping',
                'Dokumentasi': 'Foto 2 roll, Cetak Album (106 lembar)'
            }},
            { name: 'Paket Exclusive 28.5', price: '28.500.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu, 2 Pagar Bagus',
                'Dekorasi & Perlengkapan': 'Pelaminan 6m Bunga Segar, Dekor Lorong 5m, Photo Booth dlm Lorong, Bunga Mobil, Tenda Tower Jumbo Sisir Modif 1 Set, Tenda Serut 3 Set, 3.5 Set Karpet/Tirai, Lampu Tenda',
                'Entertainment': 'MC Akad & Resepsi, 2 WO Person, Video Cinematik',
                'Dokumentasi': 'Foto 2 roll'
            }},
            { name: 'Paket Premium 29.5', price: '29.500.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu, 2 Pagar Bagus, 2 Keluarga',
                'Dekorasi & Perlengkapan': 'Pelaminan 8m Bunga Segar, Point Center 3x3m, Dekor Lorong 5m Bunga Segar, Tenda Tower Jumbo Modif 1 Set, Tenda Sisir 3 Set, 2 Blower, 150 Kursi, Lampu Tenda',
                'Entertainment': 'MC Akad & Resepsi',
                'Dokumentasi': 'Foto 2 roll, Album'
            }},
            { name: 'Paket Sultan 33.5', price: '33.500.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu, 2 Pagar Bagus, 2 Keluarga',
                'Dekorasi & Perlengkapan': 'Pelaminan 8m Bunga Segar, Dekor Lorong 5m Bunga Segar, Tenda Tower Jumbo Gelembung Modif 1 Set, Tenda Gelembung 3 Set, 4.5 Set Karpet/Tirai, 2 Blower, 2 Meja VIP, Lampu Diesel',
                'Entertainment': 'MC Akad & Resepsi, 2 WO Person, Video Cinematik',
                'Dokumentasi': 'Foto 2 roll'
            }}
        ]
    },

    // === 2. GEDUNG (Code: G) ===
    {
        category: { name: 'Pernikahan', sub: 'Gedung', code: 'pernikahan' },
        items: [
            { name: 'Paket Islamic Center Basic', price: '15.500.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu',
                'Dekorasi & Perlengkapan': 'Pelaminan 6m Bunga Imitasi, Mini Garden, Karpet Jalan, Welcome Sign, Gapura, Meja Tamu, Kursi Akad, 1 Blower Air',
                'Entertainment': 'MC (Master of Ceremony)',
                'Dokumentasi': 'Foto 2 roll, Cetak Album'
            }},
            { name: 'Promo Intimate (Islamic Center/Setara)', price: '26.000.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi (Retouch), Keluarga: 2 Ibu, 2 Bapak',
                'Dekorasi & Perlengkapan': 'Pelaminan 5-6m, Mini Garden, Set Meja Kursi Akad, Welcome Sign, Gapura Masuk & Jalan, Karpet Jalan, Kotak Amplop',
                'Entertainment': 'CATERING 300 PAX, MC Akad & Resepsi, 2 Team WO',
                'Dokumentasi': 'Foto 2 roll, Album'
            }},
            { name: 'Dekorasi Gedung Type A (Trisula/Prima/Kopsuka)', price: '15.000.000', benefits: {
                'Dekorasi & Perlengkapan': 'Pelaminan 8m Fresh Flower, Mini Garden, Gapura, Dekor Lorong Full, Photobooth Taman Bunga Asli, Lighting Pro, Fireworks, Point Center'
            }},
            { name: 'Dekorasi Gedung Type B (Handayani/Patra/NU)', price: '18.000.000', benefits: {
                'Dekorasi & Perlengkapan': 'Pelaminan 10m Fresh Flower, Mini Garden, Gapura, Dekor Lorong Full, Photobooth Taman Bunga Asli, Lighting Pro, Fireworks, Point Center'
            }},
            { name: 'Dekorasi Gedung Type C (Gedung PGRI)', price: '25.000.000', benefits: {
                'Dekorasi & Perlengkapan': 'Pelaminan 12m Fresh Flower, Mini Garden, Gapura, Dekor Lorong Full, Photobooth Taman Bunga Asli, Lighting Pro, Dekor Panggung Hiburan'
            }},
            { name: 'Paket MUA+Dekor (Gedung PGRI)', price: '35.000.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu, 2 Keluarga',
                'Dekorasi & Perlengkapan': 'Pelaminan 12m Fresh Flower, Taman, Gapura, Dekor Lorong Kiri Kanan, Photobooth Lighting Point Center 3x3m, 2 Blower Air, Tenda Lorong, Bonus: Janur, Hias Mobil, Panggung & Dekor Stand Band'
            }},
            { name: 'Full Paket Gedung Type A (Trisula/Prima/Kopsuka)', price: '35.000.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu, 2 Keluarga',
                'Dekorasi & Perlengkapan': 'Pelaminan 8m Fresh Flower, Taman, Gapura, Dekor Lorong Full, Photobooth Lighting Fireworks, Dekor Stage Band, Tenda 1-2 Set, 4 Blower',
                'Entertainment': 'MC, 4 WO Person, 4 Penari, Full Band Music, Video Cinematik',
                'Dokumentasi': 'Album Magazine'
            }},
            { name: 'Full Paket Gedung Type B (Handayani/Patra/NU)', price: '40.000.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu, 2 Keluarga',
                'Dekorasi & Perlengkapan': 'Pelaminan 10m Fresh Flower, Taman, Gapura, Dekor Lorong Full, Photobooth Lighting Fireworks, Dekor Stage Band, Tenda 1-2 Set, 4-6 Blower',
                'Entertainment': 'MC Akad & Resepsi, 4 WO Person, 4 Penari, Full Band Music, Video Cinematik',
                'Dokumentasi': 'Album Magazine'
            }},
            { name: 'Full Paket Gedung Type C (Gedung PGRI)', price: '50.000.000', benefits: {
                'Makeup & Busana': 'Pengantin: Akad & Resepsi, Keluarga: 2 Ibu, 2 Bapak, 4 Pagar Ayu, 2 Keluarga',
                'Dekorasi & Perlengkapan': 'Pelaminan 12m Fresh Flower, Taman, Gapura, Dekor Lorong Full, Photobooth Lighting Fireworks, Dekor Stage Band, Tenda 1-2 Set, 4-6 Blower',
                'Entertainment': 'MC Akad & Resepsi, 4 WO Person, 4 Penari, Full Band Music, Video Cinematik',
                'Dokumentasi': 'Album Magazine'
            }}
        ]
    },

    // === 3. KHITAN / RASULAN (Code: K) ===
    {
        category: { name: 'Khitan/Rasul', sub: null, code: 'khitan' },
        items: [
            { name: 'Paket Khitan 3 Juta (Makeup Only)', price: '3.000.000', benefits: {
                'Makeup & Busana': '1 Makeup & Baju Anak Sunat, Ibu Hajat (Kebaya Resepsi), Bapak Hajat, 4 Anak Depok (Gatot Kaca/Kebaya)'
            }},
            { name: 'Paket Khitan 7 Juta', price: '7.000.000', benefits: {
                'Makeup & Busana': 'Ibu Hajat (Kebaya Resepsi), Bapak Hajat, 4 Anak',
                'Dekorasi & Perlengkapan': 'Pelaminan 3m + Daun, Gapura, Meja Tamu, Tenda Serut 1 Set (atau Polos 2 Set), 50 Kursi, Prasmanan 1 Set, 100 Piring',
                'Dokumentasi': 'Foto 1 Roll, Cetak Album'
            }},
            { name: 'Paket Khitan 8 Juta', price: '8.000.000', benefits: {
                'Makeup & Busana': 'Ibu Hajat (Kebaya Resepsi), Bapak Hajat, 4 Anak',
                'Dekorasi & Perlengkapan': 'Pelaminan 4m + Daun, Gapura, Meja Tamu, Tenda Serut 2 Set, 100 Kursi+Cover, Prasmanan 1 Set, 100 Piring',
                'Dokumentasi': 'Foto 1 Roll, Cetak Album, CD File'
            }},
            { name: 'Paket Khitan 10.5 Juta', price: '10.500.000', benefits: {
                'Makeup & Busana': 'Ibu Hajat (Kebaya Resepsi), Bapak Hajat, 4 Anak, 2 Dewasa',
                'Dekorasi & Perlengkapan': 'Pelaminan 5m + Daun, Gapura, Meja Tamu, Tenda Serut 2 Set, 2 Set Karpet Tirai (Semi Indoor), 100 Kursi+Cover, Prasmanan Roll Top, 100 Piring',
                'Dokumentasi': 'Foto 1 Roll, Cetak Album, CD File'
            }},
            { name: 'Paket Khitan 15 Juta', price: '15.000.000', benefits: {
                'Makeup & Busana': 'Ibu Hajat (Kebaya Resepsi), Bapak Hajat, 6 Anak, 2 Dewasa',
                'Dekorasi & Perlengkapan': 'Pelaminan Kaca 6m + Daun, Gapura, Meja Tamu, Tenda Tower Jumbo 1 Set, Tenda Sisir Biasa 2 Set, Tenda Polos 1 Set, Full Karpet Tirai (Semi Indoor), 100 Kursi+Cover, Prasmanan Roll Top, 100 Piring',
                'Dokumentasi': 'Foto 2 Roll, Cetak Album, CD File'
            }}
        ]
    },

    // === 4. WEDDING MAKEUP ===
    {
        category: { name: 'Wedding', sub: null, code: 'wedding' },
        items: [
            { name: 'Wedding Makeup Only', price: '2.500.000', benefits: {
                'Makeup & Busana': 'Makeup Pengantin (Akad/Resepsi), Free Softlens Normal, Free Nail Art'
            }},
            { name: 'Wedding Makeup + 1 Busana', price: '3.000.000', benefits: {
                'Makeup & Busana': 'Makeup Pengantin (Akad/Resepsi), 1 Pasang Busana Pengantin (Fitting), 1 Pasang Aksesoris, Free Softlens Normal, Free Nail Art'
            }}
        ]
    },

    // === 5. MAKEUP & HAIRSTYLING ===
    {
        category: { name: 'Makeup & Hairstyling', sub: null, code: 'makeup' },
        items: [
            { name: 'Makeup Lamaran (By Owner)', price: '1.000.000', benefits: { 'Makeup & Busana': 'Makeup Lamaran Natural/Bold (Dikerjakan Owner)' } },
            { name: 'Makeup Lamaran (By Team)', price: '500.000', benefits: { 'Makeup & Busana': 'Makeup Lamaran Natural/Bold (Dikerjakan Team)' } },
            { name: 'Makeup Siraman (By Owner)', price: '1.000.000', benefits: { 'Makeup & Busana': 'Makeup Prosesi Siraman (Dikerjakan Owner)' } },
            { name: 'Makeup Siraman (By Team)', price: '500.000', benefits: { 'Makeup & Busana': 'Makeup Prosesi Siraman (Dikerjakan Team)' } },
            { name: 'Makeup Prewedding (By Owner)', price: '800.000', benefits: { 'Makeup & Busana': 'Makeup Sesi Foto Prewedding (Dikerjakan Owner)' } },
            { name: 'Makeup Prewedding (By Team)', price: '400.000', benefits: { 'Makeup & Busana': 'Makeup Sesi Foto Prewedding (Dikerjakan Team)' } },
            { name: 'Makeup Wisuda/Graduation (By Owner)', price: '700.000', benefits: { 'Makeup & Busana': 'Makeup Wisuda (Dikerjakan Owner)' } },
            { name: 'Makeup Wisuda/Graduation (By Team)', price: '250.000', benefits: { 'Makeup & Busana': 'Makeup Wisuda (Dikerjakan Team)' } },
            { name: 'Makeup Pendamping Wisuda', price: '200.000', benefits: { 'Makeup & Busana': 'Makeup Pendamping Wisuda (By Team)' } },
            { name: 'Makeup Carnaval', price: '250.000', benefits: { 'Makeup & Busana': 'Makeup Karakter/Artistik' } },
            { name: 'Makeup Photoshoot', price: '200.000', benefits: { 'Makeup & Busana': 'Makeup Foto Studio/Yearbook' } },
            { name: 'Makeup Ibu Hajat', price: '250.000', benefits: { 'Makeup & Busana': 'Makeup Ibu Hajat' } },
            { name: 'Makeup Pagar Ayu', price: '200.000', benefits: { 'Makeup & Busana': 'Makeup Pagar Ayu' } },
            { name: 'Makeup Anak (Event)', price: '150.000', benefits: { 'Makeup & Busana': 'Makeup Anak, Termasuk Sewa Baju Anak' } },
            { name: 'Makeup Anak (Makeup Only)', price: '100.000', benefits: { 'Makeup & Busana': 'Makeup Anak (Tanpa Busana)' } },
        ]
    },

    // === 6. SEWA BUSANA ===
    {
        category: { name: 'Sewa Kebaya & Busana', sub: null, code: 'sewa' },
        items: [
            { name: 'Sewa Baju Ibu Hajat', price: '200.000', benefits: { 'Makeup & Busana': 'Harga mulai Rp 200.000, menyesuaikan model' } },
            { name: 'Sewa Baju Bapak Hajat', price: '200.000', benefits: { 'Makeup & Busana': 'Harga mulai Rp 200.000, menyesuaikan kelengkapan' } },
            { name: 'Sewa Baju Pagar Ayu', price: '150.000', benefits: { 'Makeup & Busana': 'Kebaya atau seragam pagar ayu' } },
            { name: 'Tambahan Busana Resepsi', price: '700.000', benefits: { 'Makeup & Busana': 'Busana ganti untuk sesi resepsi ke-2' } },
            { name: 'Sewa Baju Adat Jawa (Studio Only)', price: '200.000', benefits: { 'Makeup & Busana': 'Khusus tambahan untuk paket Prewed Studio' } }
        ]
    },

    // === 7. PREWEDDING ===
    {
        category: { name: 'Prewedding', sub: null, code: 'prewedding' },
        items: [
            { name: 'Prewedding Outdoor 1 (Lengkap)', price: '2.800.000', benefits: {
                'Makeup & Busana': '1 Makeup Konsep, 1 Pasang Gaun Pengantin, Retouch Makeup',
                'Dokumentasi': '2 Lokasi Pemotretan, 1 Asisten Standby, 1 Cetak 16RP (40x60)+Bingkai, 4 Cetak 10R+Bingkai, 30 File Edit, Flashdisk 16GB'
            }},
            { name: 'Prewedding Outdoor 2 (Hemat)', price: '2.000.000', benefits: {
                'Makeup & Busana': '1 Makeup Konsep (Tanpa Gaun)',
                'Dokumentasi': '1 Lokasi Pemotretan, 1 Cetak 16RP (40x60)+Bingkai, 2 Cetak 10R+Bingkai, 20 File Edit, Flashdisk 16GB'
            }},
            { name: 'Prewedding Studio', price: '1.500.000', benefits: {
                'Makeup & Busana': '1 Makeup Konsep (Tanpa Gaun)',
                'Dokumentasi': '2 Jam Pemotretan Studio, 1 Cetak 16RP (40x60), 20 File Edit, Flashdisk 16GB'
            }}
        ]
    }
];

console.log('Starting seed process...');

// === CLEANUP SECTION ===
try {
    console.log('Cleaning up old data to prevent duplicates...');
    // Order matters due to foreign keys
    db.exec("DELETE FROM produk_benefit;");
    db.exec("DELETE FROM produk;");
    db.exec("DELETE FROM benefit;");
    // Reset auto-increment sequences so IDs start from 1 again
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('produk', 'benefit', 'produk_benefit');");
    console.log('Cleanup complete.');
} catch (err) {
    console.error('Cleanup failed (proceeding anyway):', err.message);
}

// Transaction wrapper for atomicity
const insertAll = db.transaction((categories) => {
    
    // Get Category Map to save lookups
    const catStmt = db.prepare('SELECT id, code_kategori, sub_kategori FROM kategori_produk');
    const benCatStmt = db.prepare('SELECT id, nama_kategori FROM kategori_benefit');
    
    const existingCats = catStmt.all();
    const existingBenCats = benCatStmt.all();

    // Prepared statements
    const insProduct = db.prepare('INSERT INTO produk (kategori_produk_id, nama_paket, harga) VALUES (?, ?, ?)');
    const insBenefit = db.prepare('INSERT INTO benefit (benefit, kategori_benefit_id) VALUES (?, ?)');
    const insProdBen = db.prepare('INSERT INTO produk_benefit (produk_id, benefit_id) VALUES (?, ?)');
    const findBen = db.prepare('SELECT id FROM benefit WHERE benefit = ? AND kategori_benefit_id = ?');

    for (const group of categories) {
        // 1. Find Product Category ID
        let catId = existingCats.find(c => 
            c.code_kategori === group.category.code && 
            c.sub_kategori === group.category.sub
        )?.id;

        if (!catId) {
            const insCat = db.prepare('INSERT INTO kategori_produk (nama_kategori, sub_kategori, code_kategori, deskripsi_kategori) VALUES (?, ?, ?, ?)');
            const info = insCat.run(group.category.name, group.category.sub, group.category.code, 'Auto-generated category');
            catId = info.lastInsertRowid;
            existingCats.push({ id: catId, code_kategori: group.category.code, sub_kategori: group.category.sub });
            console.log(`Created new category: ${group.category.name} - ${group.category.sub}`);
        }

        for (const item of group.items) {
            const priceVal = cleanPrice(item.price);
            
            // 2. Insert Product
            const prodInfo = insProduct.run(catId, item.name, priceVal);
            const prodId = prodInfo.lastInsertRowid;
            console.log(`Inserted Product: ${item.name}`);

            // 3. Process Benefits
            if (item.benefits) {
                for (const [benCatName, benText] of Object.entries(item.benefits)) {
                    
                    // Find Benefit Category ID
                    let benCatId = existingBenCats.find(bc => bc.nama_kategori === benCatName)?.id;
                    
                    // Fallback mapping
                    if (!benCatId) {
                        if (benCatName === 'Dekorasi & Perlengkapan') benCatId = existingBenCats.find(bc => bc.nama_kategori.includes('Dekorasi'))?.id;
                        else if (benCatName === 'Makeup & Busana') benCatId = existingBenCats.find(bc => bc.nama_kategori.includes('Makeup'))?.id;
                        else if (benCatName === 'Entertainment') benCatId = existingBenCats.find(bc => bc.nama_kategori.includes('Entertainment'))?.id;
                        
                        if (!benCatId) {
                            const insBenCat = db.prepare('INSERT INTO kategori_benefit (nama_kategori) VALUES (?)');
                            const info = insBenCat.run(benCatName);
                            benCatId = info.lastInsertRowid;
                            existingBenCats.push({ id: benCatId, nama_kategori: benCatName }); 
                        }
                    }

                    // Parse individual benefit items
                    const items = parseBenefits(benText);
                    
                    for (const bText of items) {
                        // Check if benefit exists (to avoid creating duplicate benefit text entries)
                        let benId = findBen.get(bText, benCatId)?.id;
                        
                        if (!benId) {
                            const bInfo = insBenefit.run(bText, benCatId);
                            benId = bInfo.lastInsertRowid;
                        }

                        // Link Product <-> Benefit
                        try {
                            insProdBen.run(prodId, benId);
                        } catch (e) {
                            // Ignore duplicate links
                        }
                    }
                }
            }
        }
    }
});

try {
    insertAll(rawData);
    console.log('Seeding complete!');
} catch (err) {
    console.error('Seeding failed:', err);
} finally {
    db.close();
}