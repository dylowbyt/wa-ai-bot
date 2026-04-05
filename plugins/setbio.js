const identity = require("./identity")

module.exports = {
  name: "setbio",
  alias: ["ubahbio", "setdeskripsi", "setname", "setnama"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const botJid = sock.user.id
    const sub = args[0]?.toLowerCase()

    if (!sub) {
      return sock.sendMessage(from, {
        text: `✏️ *PENGATURAN PROFIL BOT*
━━━━━━━━━━━━━━━
• .setbio <teks> — Ganti bio/status bot
• .setnama <nama> — Ganti nama bot

Contoh:
.setbio Bot WA AI 100+ fitur | Ketik .menu
.setnama ZenBot Official`
      })
    }

    if (sub === "nama" || m.info?.pushName) {
      const nama = args.slice(1).join(" ")
      if (!nama) return sock.sendMessage(from, { text: "❌ Tulis nama baru setelah .setnama" })

      try {
        await sock.updateProfileName(nama)
        identity.nama = nama
        await sock.sendMessage(from, { text: `✅ Nama bot berhasil diubah ke: *${nama}*` })
      } catch (err) {
        await sock.sendMessage(from, { text: `❌ Gagal ubah nama: ${err.message?.slice(0, 80)}` })
      }
      return
    }

    const bio = args.join(" ")
    if (!bio || bio.length < 2) {
      return sock.sendMessage(from, { text: "❌ Tulis bio setelah .setbio\nContoh: .setbio Bot AI 100+ fitur | Ketik .menu" })
    }

    if (bio.length > 139) {
      return sock.sendMessage(from, { text: `❌ Bio terlalu panjang (${bio.length}/139 karakter). Persingkat dulu.` })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Mengubah bio bot..." })
      await sock.updateProfileStatus(bio)
      await sock.sendMessage(from, {
        text: `✅ Bio *${identity.nama}* berhasil diperbarui!

📝 Bio baru:
_"${bio}"_`
      })
    } catch (err) {
      await sock.sendMessage(from, {
        text: `❌ Gagal ubah bio: ${err.message?.slice(0, 100)}`
      })
    }
  }
}
