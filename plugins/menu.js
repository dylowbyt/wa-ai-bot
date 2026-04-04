module.exports = {
  name: "menu",
  alias: ["help", "start", "bantuan"],

  async run(sock, m) {
    const from = m.key.remoteJid

    const menu = `🤖 *WA AI BOT — MENU*
━━━━━━━━━━━━━━━━━━

🎵 *MUSIK & VIDEO*
• .play <judul> — Download lagu MP3
• .tt <link> — Download TikTok (no watermark)
• .dl <link> — Download file dari URL
• .get <keyword> — Cari & download file

🖼️ *GAMBAR*
• .image <prompt> — Generate gambar AI (DALL-E)
• .pin <keyword> — Cari gambar Pinterest
• .hd — Enhance foto jadi HD (reply foto)
• .sticker — Buat sticker (reply foto)
• .toimg — Konversi sticker ke foto

🤖 *AI & CHAT*
• .ai <pertanyaan> — Tanya AI
• .memeai — Buat meme dari foto (reply foto)
• .tts <teks> — Text to Speech
• .video <prompt> — Generate video AI

🎮 *FUN*
• .fun ganteng/cantik — Tingkat ganteng/cantik
• .fun rate <nama> — Rate seseorang
• .fun ship <nama1>|<nama2> — Cek kecocokan
• .fun truth — Pertanyaan truth
• .fun dare — Tantangan dare
• .fun fakta — Fakta acak
• .fun hoki — Cek keberuntungan

🌍 *INFO*
• .gempa — Cek gempa terbaru dari BMKG
• .gempa on — Aktifkan notifikasi gempa
• .gempa off — Matikan notifikasi gempa
• .qc <teks> — Buat quote card
• .ping — Cek status bot

📁 *FILE*
• .tourl — Upload file ke URL (reply file)
• .statushd — Upload video ke status WA
• .ptv — Konversi foto ke video pendek

━━━━━━━━━━━━━━━━━━
_Ketik .help untuk lihat menu ini_`

    await sock.sendMessage(from, { text: menu })
  }
}
