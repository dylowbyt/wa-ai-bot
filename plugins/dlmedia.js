const axios = require("axios")

module.exports = {
  name: "ytmp3",
  alias: ["dl2", "musik"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""

    const url = args[0] || text.replace(/^\.(ytmp3|dl2|musik)\s*/i, "").trim()

    if (!url || !url.includes("http")) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.ytmp3 https://youtube.com/watch?v=xxxxx"
      })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Downloading audio..." })

      let audioUrl = null

      try {
        const r1 = await axios.get(
          `https://api.cobadeh.xyz/ytdl/mp3?url=${encodeURIComponent(url)}`,
          { timeout: 20000 }
        )
        audioUrl = r1.data?.download || r1.data?.url || r1.data?.link
      } catch {}

      if (!audioUrl) {
        try {
          const r2 = await axios.get(
            `https://loader.to/api/button/?url=${encodeURIComponent(url)}&f=mp3`,
            { timeout: 20000 }
          )
          audioUrl = r2.data?.url
        } catch {}
      }

      if (!audioUrl) {
        return sock.sendMessage(from, {
          text: "❌ Gagal download audio\nServer API lagi down, coba lagi nanti"
        })
      }

      await sock.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg"
      })

    } catch (err) {
      console.log("DLMEDIA ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Error download media" })
    }
  }
}
