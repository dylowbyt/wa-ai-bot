const axios = require("axios")

module.exports = {
  name: "qc",

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const text = args.join(" ")

    if (!text) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.qc halo"
      })
    }

    try {
      const url = `https://api.popcat.xyz/quote?text=${encodeURIComponent(text)}`

      await sock.sendMessage(from, {
        image: { url },
        caption: "📝 Quote"
      })

    } catch {
      sock.sendMessage(from, { text: "❌ Gagal buat quote" })
    }
  }
}
