const axios = require("axios")

module.exports = {
  name: "ytmp4",
  alias: ["ytvideo"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""

    const url = args[0] || text.replace(/^\.(ytmp4|ytvideo)\s*/i, "").trim()

    if (!url || !url.includes("http")) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.ytmp4 https://youtube.com/watch?v=xxxxx"
      })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Downloading video..." })

      let videoUrl = null

      try {
        const r1 = await axios.get(
          `https://api.cobadeh.xyz/ytdl/mp4?url=${encodeURIComponent(url)}`,
          { timeout: 20000 }
        )
        videoUrl = r1.data?.download || r1.data?.url || r1.data?.link
      } catch {}

      if (!videoUrl) {
        try {
          const r2 = await axios.get(
            `https://loader.to/api/button/?url=${encodeURIComponent(url)}&f=mp4`,
            { timeout: 20000 }
          )
          videoUrl = r2.data?.url
        } catch {}
      }

      if (!videoUrl) {
        return sock.sendMessage(from, {
          text: "❌ Gagal download video\nServer API lagi down, coba lagi nanti"
        })
      }

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: "🎥 YouTube Video"
      })

    } catch (err) {
      console.log("YTB ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Error download video YouTube" })
    }
  }
}
