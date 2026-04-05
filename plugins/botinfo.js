const identity = require("./identity")

module.exports = {
  name: "botinfo",
  alias: ["about", "tentangbot", "siapakamu", "whoami"],

  async run(sock, m) {
    const from = m.key.remoteJid

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
      text: `🤖 *TENTANG ${identity.nama.toUpperCase()}*
━━━━━━━━━━━━━━━━━━
📛 Nama    : ${identity.nama}
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
