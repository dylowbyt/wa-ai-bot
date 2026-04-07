const axios = require("axios")

module.exports = {
  name: "tt",
  alias: ["tiktok"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""

    const url = args[0] || text.replace(/^\.(tt|tiktok)\s*/i, "").trim()

    if (!url || !url.includes("tiktok")) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.tt https://vt.tiktok.com/xxxxx"
      })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Downloading TikTok..." })

      let videoUrl = null

      try {
        const r1 = await axios.get(
          `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
          { timeout: 15000 }
        )
        videoUrl = r1.data?.video?.noWatermark || r1.data?.video?.url || r1.data?.url
      } catch {}

      if (!videoUrl) {
        try {
          const r2 = await axios.get(
            `https://api.siputzx.my.id/api/dl/tiktok?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r2.data?.data?.play || r2.data?.data?.wmplay
        } catch {}
      }

      if (!videoUrl) {
        return sock.sendMessage(from, {
          text: "❌ Gagal download TikTok\nServer API sedang down, coba lagi nanti"
        })
      }

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: "TikTok Download"
      })

    } catch (err) {
      console.log("TT ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Error download TikTok" })
    }
  }
}
