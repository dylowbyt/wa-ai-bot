const axios = require("axios")

module.exports = {
  name: "tt",
  alias: ["tiktok"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const url = args[0]

    if (!url) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.tt https://tiktok.com/..."
      })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Download TikTok..." })

      const api = `https://api.tiklydown.eu.org/api/download?url=${url}`
      const res = await axios.get(api)

      const video = res.data.video?.noWatermark

      if (!video) throw "gagal"

      await sock.sendMessage(from, {
        video: { url: video },
        caption: "🎵 TikTok HD No WM"
      })

    } catch {
      sock.sendMessage(from, { text: "❌ Gagal download TikTok" })
    }
  }
}
