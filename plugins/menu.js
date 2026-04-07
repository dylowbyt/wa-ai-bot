require("dotenv").config()

module.exports = {
  name: "menu",
  alias: ["help", "start", "commands"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const pushName = m.pushName || "Kak"

    // Jika user minta detail kategori tertentu
    const cat = args[0]?.toLowerCase()

    if (cat) {
      const detail = getCategoryDetail(cat)
      if (detail) return sock.sendMessage(from, { text: detail })
    }

    const now = new Date()
    const jam = now.getHours()
    const sapa = jam < 11 ? "Selamat Pagi" : jam < 15 ? "Selamat Siang" : jam < 18 ? "Selamat Sore" : "Selamat Malam"

    const menu = `
╔══════════════════════════╗
║  🌸  *AI ASSISTANT BOT*  🌸  ║
╚══════════════════════════╝

${sapa}, *${pushName}*! ✨
Aku siap bantu kamu~ 🤖💕

┌─────────────────────────┐
│   📚  *DAFTAR KATEGORI*   │
└─────────────────────────┘

🧠 *[1] AI & KREATIF*
   .ai • .tts • .image • .memeai
   .aivideo • .j2v • .vanime
   .imgai • .textsummarize

🎵 *[2] DOWNLOAD & MEDIA*
   .play • .video • .spotify
   .tt • .pinterest • .dlmedia
   .toimg • .tourl • .stickers

📰 *[3] INFO & BERITA*
   .berita • .wikipedia • .kbbi
   .cuaca • .gempa • .googlemaps
   .animeinfo • .jadwalfilm
   .jadwalbola • .jadwaltv

🔍 *[4] CEK & VALIDASI*
   .cekip • .ceknik • .ceknpwp
   .cekpajak • .cekstatus • .ceklink
   .cekobat • .cekhargaemas
   .ceknilaisaham • .nomorhp
   .cekregno • .rekening

🛠️ *[5] TOOLS & UTILITAS*
   .kalkulator • .konversi • .encode
   .qrgen • .wifiqr • .shortlink
   .password • .translate • .warna
   .sensor • .aksara • .umur

💰 *[6] KEUANGAN*
   .kurs • .kripto • .saham
   .investasi • .kredit • .listrik
   .diskon • .pbb • .zakat
   .uang (catat pengeluaran)

🕌 *[7] ISLAMI*
   .jadwalsholat • .jadwalsaur
   .zakat • .gizi • .resep

🎮 *[8] HIBURAN*
   .fun • .tebak • .random
   .motivasi • .zodiak
   .peribahasa • .sinonim

📅 *[9] PRODUKTIVITAS*
   .reminder • .catat • .pomodoro
   .countdown • .logbook • .level

⚙️ *[10] BOT & PROFIL*
   .setbio • .setpp • .botinfo
   .ping • .level

✂️ *[BONUS] YOUTUBE AI CLIP*
   .ytclip — AI potong highlight
   otomatis dari video YouTube!

━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *CARA LIHAT DETAIL:*
.menu ai → detail AI & Kreatif
.menu download → detail Media
.menu info → detail Informasi
.menu cek → detail Cek & Validasi
.menu tools → detail Tools
.menu uang → detail Keuangan
.menu islam → detail Islami
.menu hiburan → detail Hiburan
.menu produktif → detail Produktivitas
━━━━━━━━━━━━━━━━━━━━━━━━━
_Prefix: titik (.) sebelum command_
_Contoh: .ai halo, kamu siapa?_
`

    await sock.sendMessage(from, { text: menu })
  }
}

function getCategoryDetail(cat) {
  const categories = {
    ai: `
╔══════════════════════════╗
║  🧠  *AI & KREATIF*   🧠  ║
╚══════════════════════════╝

💬 *.ai <pesan>*
   Chat dengan AI (GPT-4o-mini)
   Alias: .tanya .chat .gpt

🎙️ *.tts <suara> <teks>*
   Text-to-Speech multi persona:
   • jessie — Jessie Ceria 🎀
   • anime  — Anak Perempuan 🌸
   • manja  — Iola Manis 🍬
   • menggoda — VA Menggoda 💋
   • dan    — Anime Biru 🌊
   • faye   — Faye Glorious ✨
   • en     — English 🇺🇸

🎨 *.image <prompt>*
   Generate gambar AI dari teks
   Alias: .generateimage .buatgambar

😂 *.memeai <teks>*
   Buat meme otomatis dengan AI

🎬 *.aivideo <prompt>*
   Generate video AI dari teks
   Alias: .videoai

🎥 *.j2v <teks>*
   Buat video animasi JSON2Video
   Alias: .jsonvideo .vid2

🎌 *.vanime*
   Ubah video jadi gaya anime
   (Reply video dengan perintah ini)

🖼️ *.imgai*
   AI image enhancement/processing

📝 *.textsummarize <teks>*
   Ringkas teks panjang otomatis
   Alias: .ringkas .summarize`,

    download: `
╔══════════════════════════╗
║  🎵  *DOWNLOAD & MEDIA*  🎵  ║
╚══════════════════════════╝

▶️ *.play <judul>*
   Download audio YouTube
   Alias: .yt .ytdl .download

📹 *.video <judul/url>*
   Download video YouTube
   Alias: .ytb .youtube

🎧 *.spotify <judul>*
   Cari & download lagu Spotify

📱 *.tt <url>*
   Download video TikTok tanpa watermark
   Alias: .tiktok

📸 *.pinterest <kata kunci>*
   Download gambar dari Pinterest

🔗 *.dlmedia <url>*
   Download media dari berbagai platform

🖼️ *.toimg*
   Konversi sticker/dokumen ke gambar
   (Reply sticker/file)

🔗 *.tourl*
   Upload media → dapatkan URL publik
   (Reply gambar/video)

🧊 *.stickers*
   Buat stiker WhatsApp dari gambar/video
   (Reply gambar/video)`,

    info: `
╔══════════════════════════╗
║  📰  *INFO & BERITA*   📰  ║
╚══════════════════════════╝

📰 *.berita <topik>*
   Berita terkini sesuai topik

📖 *.wikipedia <topik>*
   Info dari Wikipedia Indonesia

📚 *.kbbi <kata>*
   Arti kata dari KAMUS BESAR BI

🌏 *.cuaca <kota>*
   Info cuaca real-time
   Alias: .cekcuaca2

🌋 *.gempa*
   Info gempa terkini dari BMKG
   Alias: .infogempa2

🗺️ *.googlemaps <tempat>*
   Cari lokasi di Google Maps

🗺️ *.animeinfo <judul>*
   Info lengkap anime (MyAnimeList)

🎬 *.jadwalfilm*
   Jadwal bioskop terbaru

⚽ *.jadwalbola*
   Jadwal pertandingan sepak bola

📺 *.jadwaltv*
   Jadwal acara TV hari ini`,

    cek: `
╔══════════════════════════╗
║  🔍  *CEK & VALIDASI*  🔍  ║
╚══════════════════════════╝

🌐 *.cekip <ip>*
   Info detail IP address

🪪 *.ceknik <NIK>*
   Validasi & decode Nomor Induk KTP
   Alias: .nik .ktp

📋 *.ceknpwp <NPWP>*
   Validasi NPWP
   Alias: .npwp

💸 *.cekpajak*
   Hitung & cek pajak
   Alias: .pajak .pph .ppn

✅ *.cekstatus <no. resi/dll>*
   Cek status pengiriman/layanan

🔗 *.ceklink <url>*
   Cek keamanan link/URL

💊 *.cekobat <nama obat>*
   Info obat dari database BPOM

🥇 *.cekhargaemas*
   Harga emas hari ini (Antam)

📈 *.ceknilaisaham <kode>*
   Cek harga saham real-time

📞 *.nomorhp <nomor>*
   Info operator & validasi nomor HP

🚗 *.cekregno <plat>*
   Cek plat nomor kendaraan
   Alias: .platno .cekplat

🏦 *.rekening <no. rek>*
   Cek info rekening bank`,

    tools: `
╔══════════════════════════╗
║  🛠️  *TOOLS & UTILITAS*  🛠️  ║
╚══════════════════════════╝

🔢 *.kalkulator <ekspresi>*
   Hitung matematis
   Alias: .calc .hitung .math

📐 *.matematika <soal>*
   Kalkulator saintifik
   Alias: .mtk .kalkmatematika

🔄 *.konversi <nilai> <dari> ke <ke>*
   Konversi satuan (panjang, berat, dll)
   Alias: .convert .konversiunit

🔐 *.encode <mode> <teks>*
   Enkripsi/dekripsi teks (base64, dll)
   Alias: .enkode .cipher

📷 *.qrgen <teks/url>*
   Generate QR code

📶 *.wifiqr <ssid> <password>*
   Buat QR code WiFi
   Alias: .qrwifi

🔗 *.shortlink <url>*
   Persingkat URL

🔑 *.password <panjang>*
   Generate password acak aman
   Alias: .passgen

🌈 *.warna <hex>*
   Info warna dari kode hex/RGB
   Alias: .colorhex

🌐 *.translate <bahasa> <teks>*
   Terjemahkan teks ke bahasa apapun

🔤 *.aksara <mode> <teks>*
   Konversi teks latin↔Arab/Jawa
   Alias: .arab .jawa

🔠 *.sensor <kata>*
   Sensor/ganti kata tertentu
   Alias: .censor

🎂 *.umur <tanggal lahir>*
   Hitung umur tepat
   Alias: .age .ultah`,

    uang: `
╔══════════════════════════╗
║  💰  *KEUANGAN*    💰  ║
╚══════════════════════════╝

💱 *.kurs <mata uang>*
   Kurs mata uang hari ini

₿  *.kripto <simbol>*
   Harga kripto real-time

📊 *.saham <kode>*
   Harga saham Indonesia/global

📈 *.investasi <nominal> <bunga> <tahun>*
   Simulasi investasi & compound
   Alias: .bunga .ROI

💳 *.kredit <harga> <dp> <tenor>*
   Simulasi cicilan KPR/kredit
   Alias: .cicilan .kpr .angsuran

⚡ *.listrik <daya> <kwh>*
   Hitung tagihan listrik
   Alias: .kalklistrik

🏷️ *.diskon <harga> <persen>*
   Hitung harga setelah diskon
   Alias: .hitungdiskon .sale

🏠 *.pbb <nilai tanah>*
   Hitung Pajak Bumi & Bangunan
   Alias: .kalkulasipbb

🕌 *.zakat <penghasilan>*
   Hitung zakat maal/penghasilan
   Alias: .kalkzakat

📒 *.uang <catatan>*
   Catat pengeluaran harian
   Alias: .pengeluaran .keuangan .dompet`,

    islam: `
╔══════════════════════════╗
║  🕌   *MENU ISLAMI*  🕌   ║
╚══════════════════════════╝

🕐 *.jadwalsholat <kota>*
   Jadwal sholat harian

🌙 *.jadwalsaur*
   Jadwal sahur & imsakiyah

💰 *.zakat <penghasilan>*
   Kalkulator zakat maal

🥗 *.gizi <makanan>*
   Info kandungan gizi makanan

🍳 *.resep <nama makanan>*
   Resep masakan Indonesia`,

    hiburan: `
╔══════════════════════════╗
║  🎮   *HIBURAN*     🎮   ║
╚══════════════════════════╝

🎲 *.fun*
   Mini games & aktivitas seru
   Alias: .game

🔢 *.tebak*
   Tebak angka interaktif
   Alias: .tebakangka

🎯 *.random <pilihan1, pilihan2, ...>*
   Pilihkan secara acak
   Alias: .pilihkan .acak

💪 *.motivasi*
   Quote motivasi harian

♈ *.zodiak <tanggal lahir>*
   Ramalan zodiak hari ini
   Alias: .horoscope .horoskop

📖 *.peribahasa <kata kunci>*
   Cari peribahasa Indonesia

🔤 *.sinonim <kata>*
   Cari sinonim kata Indonesia`,

    produktif: `
╔══════════════════════════╗
║  📅  *PRODUKTIVITAS*  📅  ║
╚══════════════════════════╝

⏰ *.reminder <waktu> <pesan>*
   Set pengingat otomatis
   Alias: .ingatkan .remind

📝 *.catat <teks>*
   Simpan catatan/to-do
   Alias: .note .notes .todo

🍅 *.pomodoro <menit>*
   Timer Pomodoro fokus belajar
   Alias: .fokus .belajar

⏳ *.countdown <tanggal>*
   Hitung mundur ke suatu tanggal
   Alias: .hitungmundur

📒 *.logbook <catatan>*
   Catat kegiatan harian

⭐ *.level*
   Lihat XP & level kamu
   Alias: .xp .rank .profile`
  }

  return categories[cat] || null
}
