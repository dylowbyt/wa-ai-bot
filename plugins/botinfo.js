const fs = require("fs")
const path = require("path")
const identity = require("./identity")

// File untuk menyimpan setting owner secara permanen
const CONFIG_PATH = path.join(__dirname, "../owner-config.json")

// Baca config dari file (kalau ada)
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
    }
  } catch {}
  return {}
}

// Simpan config ke file
function saveConfig(data) {
  try {
    const current = loadConfig()
    const updated = { ...current, ...data }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8")
    return true
  } catch (e) {
    console.log("saveConfig error:", e.message)
    return false
  }
}

// Ambil nama bot aktif (dari config file, fallback ke identity.js)
function getNamaBot() {
  const config = loadConfig()
  return config.nama || identity.nama
}

module.exports = {
  name: "botinfo",
  alias: ["about", "tentangbot", "siapakamu", "whoami", "setname", "ownersetting"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const command = (m.message?.conversation || m.message?.extendedTextMessage?.text || "")
      .trim().toLowerCase().split(" ")[0].replace(".", "")

    // ===== SETNAME — ganti nama bot (owner only) =====
    if (command === "setname") {
      // Cek apakah pengirim adalah owner
      const ownerNumber = identity.nomorPembuat + "@s.whatsapp.net"
      if (sender !== ownerNumber) {
        return sock.sendMessage(from, { text: "❌ Perintah ini hanya untuk owner bot." })
      }

      const namaBaru = args.join(" ").trim()
      if (!namaBaru) {
        return sock.sendMessage(from, {
          text:
            "⚠️ *Cara pakai .setname:*\n" +
            "`.setname <nama baru>`\n\n" +
            `📛 Nama sekarang: *${getNamaBot()}*`
        })
      }

      const berhasil = saveConfig({ nama: namaBaru })
      if (berhasil) {
        return sock.sendMessage(from, {
          text: `✅ Nama bot berhasil diubah!\n📛 *${getNamaBot()}* → *${namaBaru}*\n\nNama baru sudah disimpan permanen.`
        })
      } else {
        return sock.sendMessage(from, { text: "❌ Gagal menyimpan nama. Cek izin file." })
      }
    }

    // ===== OWNERSETTING — menu setting owner =====
    if (command === "ownersetting") {
      const ownerNumber = identity.nomorPembuat + "@s.whatsapp.net"
      if (sender !== ownerNumber) {
        return sock.sendMessage(from, { text: "❌ Perintah ini hanya untuk owner bot." })
      }

      const config = loadConfig()
      return sock.sendMessage(from, {
        text:
          `⚙️ *OWNER SETTINGS*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `📛 Nama Bot : *${getNamaBot()}*\n` +
          `📦 Versi    : ${identity.versi}\n` +
          `👨‍💻 Pembuat  : ${identity.pembuat}\n\n` +
          `🛠️ *Perintah Owner:*\n` +
          `• \`.setname <nama>\` — ganti nama bot\n` +
          `• \`.setbio <teks>\` — ganti bio bot\n` +
          `• \`.setpp\` (reply foto) — ganti foto profil bot\n\n` +
          `💾 Config tersimpan di: owner-config.json`
      })
    }

    // ===== BOTINFO — info lengkap bot =====
    const namaBot = getNamaBot()

    const byKategori = {}
    for (const p of identity.plugins) {
      if (!byKategori[p.kategori]) byKategori[p.kategori] = []
      byKategori[p.kategori].push(`.${p.cmd}`)
    }

    const kategoriText = Object.entries(byKategori)
      .map(([kat, cmds]) => `📌 *${kat}* (${cmds.length})\n${cmds.join(", ")}`)
      .join("\n\n")

    const totalPlugin = identity.plugins.length

    await sock.sendMessage(from, {
      text: `🤖 *TENTANG ${namaBot.toUpperCase()}*
━━━━━━━━━━━━━━━━━━
📛 Nama    : ${namaBot}
🔖 Versi   : ${identity.versi}
👨‍💻 Pembuat : ${identity.pembuat}
📱 Kontak  : ${identity.nomorPembuat}
🌐 Library : ${identity.library}
🗣️ Bahasa  : ${identity.bahasa}

📋 *Deskripsi:*
${identity.deskripsi}

━━━━━━━━━━━━━━━━━━
📦 *TOTAL FITUR: ${totalPlugin} Plugin*
━━━━━━━━━━━━━━━━━━

${kategoriText}

━━━━━━━━━━━━━━━━━━
💡 Ketik *.menu* untuk panduan lengkap
💬 Ketik *.ai <pertanyaan>* untuk tanya AI`
    })
  }
}
