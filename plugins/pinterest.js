const axios = require("axios")

module.exports = {
  name: "pinterest",
  alias: ["pin"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.pin anime"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🔎 Mencari gambar..." })

      const res = await axios.get(
        `https://pinterest-api-one.vercel.app/?q=${encodeURIComponent(query)}`
      )

      const results = res.data

      if (!results.length) throw "err"

      const random = results[Math.floor(Math.random() * results.length)]

      await sock.sendMessage(from, {
        image: { url: random },
        caption: `📌 ${query}`
      })

    } catch {
      sock.sendMessage(from, { text: "❌ Gagal ambil gambar" })
    }
  }
}
