const axios = require("axios")

module.exports = {
  name: "qc",

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const text = args.join(" ")

    if (!text) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.qc Hidup itu indah kalau kamu bahagia"
      })
    }

    try {
      // Batasi panjang teks agar API tidak error
      const safeText = text.slice(0, 200)

      const url = `https://api.popcat.xyz/quote?text=${encodeURIComponent(safeText)}`

      await sock.sendMessage(from, {
        image: { url },
        caption: `📝 *${safeText}*`
      })

    } catch (err) {
      console.log("QC ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal buat quote, coba lagi nanti" })
    }
  }
}
