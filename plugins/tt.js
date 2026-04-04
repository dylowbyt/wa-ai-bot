const axios = require("axios")

module.exports = {
  name: "tt",
  alias: ["tiktok"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const url = args[0]

    if (!url || !url.startsWith("http")) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.tt https://vt.tiktok.com/xxxxx"
      })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Download TikTok..." })

      // ===== FIX: Coba beberapa API TikTok sebagai fallback =====
      let videoUrl = null
      let title = ""

      // API 1: tiklydown
      try {
        const res1 = await axios.get(
          `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
          { timeout: 15000 }
        )
        videoUrl = res1.data?.video?.noWatermark ||
                   res1.data?.video?.watermark ||
                   res1.data?.result?.video?.noWatermark
        title = res1.data?.title || ""
      } catch {}

      // API 2: tikwm.com sebagai fallback
      if (!videoUrl) {
        try {
          const res2 = await axios.post(
            "https://www.tikwm.com/api/",
            new URLSearchParams({ url, count: 12, cursor: 0, web: 1, hd: 1 }),
            {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              timeout: 15000
            }
          )
          videoUrl = res2.data?.data?.hdplay || res2.data?.data?.play
          title = res2.data?.data?.title || ""
        } catch {}
      }

      // API 3: sssTik sebagai fallback terakhir
      if (!videoUrl) {
        try {
          const res3 = await axios.get(
            `https://api.vvxd.net/download/tiktok?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = res3.data?.data?.video?.noWatermark || res3.data?.url
        } catch {}
      }

      if (!videoUrl) {
        return sock.sendMessage(from, {
          text: "❌ Gagal download TikTok\nLink mungkin private atau API sedang down"
        })
      }

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: title
          ? `🎵 *${title}*\n\nDownloaded via .tt`
          : "🎵 TikTok HD No Watermark"
      })

    } catch (err) {
      console.log("TT ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal download TikTok" })
    }
  }
}
