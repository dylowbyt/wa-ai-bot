module.exports = {
  name: "menu",
  alias: ["help", "start", "bantuan"],

  async run(sock, m) {
    const from = m.key.remoteJid

    const menu = `🤖 *WA AI BOT — MENU LENGKAP*
━━━━━━━━━━━━━━━━━━

🎵 *MUSIK & VIDEO*
• .play <judul> — Download lagu MP3
• .tt <link> — Download TikTok (no watermark)
• .dl <link> — Download file dari URL
• .get <keyword> — Cari & download file
• .spotify <judul> — Info lagu & artis

🖼️ *GAMBAR & MEDIA*
• .image <prompt> — Generate gambar AI
• .pin <keyword> — Cari gambar Pinterest
• .hd — Enhance foto jadi HD (reply foto)
• .sticker — Buat sticker (reply foto)
• .toimg — Konversi sticker ke foto
• .qrgen <teks/url> — Buat QR Code
• .wifiqr <ssid> <pass> — QR Code WiFi
• .tapaktilas <url> — Reverse image search link

🤖 *AI & CHAT*
• .ai <pertanyaan> — Tanya AI
• .memeai — Buat meme dari foto (reply foto)
• .tts <teks> — Text to Speech
• .video <prompt> — Generate video AI
• .ringkas <teks> — Ringkas teks panjang
• .wiki <topik> — Cari di Wikipedia

🌍 *CUACA & ALAM*
• .cuaca <kota> — Cuaca real-time
• .uvindex <kota> — Indeks UV & prakiraan 3 hari
• .gempa — Gempa terbaru BMKG
• .gempa on/off — Notifikasi gempa otomatis
• .tsunamiinfo — Peringatan dini tsunami

📅 *WAKTU & JADWAL*
• .sholat <kota> — Jadwal sholat hari ini
• .imsakiyah <kota> — Jadwal imsakiyah & berbuka
• .countdown <tanggal> — Hitung mundur event
• .reminder <menit> <pesan> — Set pengingat
• .reminder list/hapus — Kelola reminder
• .pomodoro <menit> — Timer fokus belajar
• .pomodoro stop — Hentikan timer
• .waktu [kota] — Jam saat ini di seluruh dunia
• .holiday [tahun] — Hari libur nasional

💱 *KEUANGAN & BISNIS*
• .kurs — Kurs rupiah hari ini
• .kurs <nominal> <dari> <ke> — Konversi mata uang
• .kripto [nama_coin] — Harga kripto
• .saham <kode> — Harga saham
• .ihsg — IHSG & pasar Indonesia
• .emas — Harga emas semua karat
• .diskon <harga> <diskon%> — Kalkulator diskon
• .kredit <pinjaman> <bunga%> <bulan> — Cicilan kredit/KPR
• .investasi compound/bunga/roi — Kalkulator investasi
• .uang <nominal> <ket> — Catat pengeluaran/pemasukan
• .uang list/total/hapus — Manajemen keuangan harian
• .pajak pph21/ppn/umkm — Kalkulator pajak
• .pbb <njop> <luas> — Kalkulator PBB tanah
• .listrik <watt> <jam> — Estimasi tagihan listrik
• .zakat maal/penghasilan/fitrah — Kalkulator zakat

🔢 *KALKULATOR & MATEMATIKA*
• .hitung <ekspresi> — Kalkulator saintifik
• .konversi <nilai> <dari> <ke> — Konversi satuan
• .matematika kpk/fpb/prima/statistik — Matematika lanjutan
• .bmi <berat_kg> <tinggi_cm> — Cek BMI & berat ideal

🔐 *KEAMANAN & PRIVASI*
• .password <panjang> [tipe] — Generate password aman
• .encode base64/hex/morse <teks> — Enkode/Dekode teks
• .ceklink <url> — Analisis keamanan link
• .statuswebsite <domain> — Cek status website

🔍 *PENCARIAN & INFO*
• .translate <kode> <teks> — Terjemahkan ke 20+ bahasa
• .kbbi <kata> — Kamus Besar Bahasa Indonesia
• .sinonim <kata> — Sinonim & antonim
• .peribahasa [kata kunci] — Peribahasa Indonesia
• .berita [topik] — Berita terbaru Indonesia
• .obat <nama> — Info kegunaan & peringatan obat
• .resep <makanan> — Cari resep masak
• .gizi <makanan> — Info nutrisi & kalori makanan
• .anime <judul> — Info anime (rating, sinopsis, genre)
• .filmbioskop [judul] — Film bioskop & pencarian film
• .jadwaltv <channel> — Jadwal acara TV hari ini
• .jadwalbola [liga] — Jadwal pertandingan bola
• .pesawat <kode> — Status & info penerbangan

📱 *CEK & VALIDASI*
• .ceknomor <nohp> — Info operator nomor HP
• .cekrekening <bank> <norek> — Validasi rekening bank
• .ceknik <nik> — Validasi NIK/KTP 16 digit
• .ceknpwp <npwp> — Validasi & baca info NPWP
• .platno <plat> — Info wilayah plat nomor kendaraan
• .cekip [ip] — Info IP address & geolokasi
• .domain <domain> — Info domain & WHOIS

🗺️ *LOKASI & PERJALANAN*
• .maps <lokasi> — Cari lokasi, koordinat & arah
• .hotel <kota> — Link booking hotel di berbagai platform

🎯 *PRODUKTIVITAS*
• .catat <teks> — Tambah catatan/to-do list
• .catat list/selesai/hapus — Kelola catatan
• .level — Cek level & XP kamu
• .level daily — Klaim XP harian
• .level leaderboard — Lihat top 10 pengguna
• .random <a> | <b> | <c> — Pilih secara acak
• .random dice/coin/angka — Lempar dadu/koin/angka
• .tebak mulai — Game tebak angka (1-100)

🎨 *FORMAT & TEKS*
• .format bold/italic/mono/strike <teks> — Format teks WA
• .sensor <teks> — Sensor kata kasar dalam teks
• .aksara morse/nato/balik <teks> — Konversi aksara & kode
• .warna <hex/rgb/nama> — Info & konversi warna

ℹ️ *INFO UMUM*
• .ping — Cek status bot
• .qc <teks> — Buat quote card aesthetic
• .tourl — Upload file ke URL (reply file)
• .statushd — Upload video ke status WA
• .ptv — Konversi foto ke video pendek
• .zodiak <bintang> — Info zodiak & ramalan harian
• .umur <tgl_lahir> — Hitung umur & countdown ulang tahun
• .jenisdarah <A/B/O/AB> — Info golongan darah & donor
• .selfcheck — Cek gejala COVID-19
• .covid [negara] — Data COVID-19 terkini
• .motivasi [sukses/belajar/hidup/kerja] — Quotes motivasi
• .paketdata <operator> — Info paket internet operator
• .shortlink <url> — Persingkat URL panjang

━━━━━━━━━━━━━━━━━━
_Ketik .help untuk lihat menu ini_
_Total: 100+ fitur tersedia!_ 🚀`

    await sock.sendMessage(from, { text: menu })
  }
}
