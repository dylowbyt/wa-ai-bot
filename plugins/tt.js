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

      // API 1: tikwm.com (paling stabil)
      try {
        const res1 = await axios.post(
          "https://www.tikwm.com/api/",
          new URLSearchParams({ url, count: 12, cursor: 0, web: 1, hd: 1 }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "Mozilla/5.0"
            },
            timeout: 15000
          }
        )
        videoUrl = res1.data?.data?.hdplay || res1.data?.data?.play
        title = res1.data?.data?.title || ""
      } catch {}

      // API 2: snaptiksave
      if (!videoUrl) {
        try {
          const res2 = await axios.post(
            "https://api.snaptiksave.com/api/ajaxSearch",
            new URLSearchParams({ q: url, lang: "id" }),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0"
              },
              timeout: 15000
            }
          )
          const html = res2.data?.data || ""
          const m = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/)
          if (m) videoUrl = m[1]
        } catch {}
      }

      // API 3: tiklydown
      if (!videoUrl) {
        try {
          const res3 = await axios.get(
            `https://api.tiklydown.eu.org/api/download/v2?url=${encodeURIComponent(url)}`,
            {
              timeout: 15000,
              headers: { "User-Agent": "Mozilla/5.0" }
            }
          )
          videoUrl = res3.data?.video?.noWatermark ||
                     res3.data?.video?.watermark ||
                     res3.data?.result?.video?.noWatermark
          title = res3.data?.title || title
        } catch {}
      }

      // API 4: musicaldown fallback
      if (!videoUrl) {
        try {
          const res4 = await axios.get(
            `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = res4.data?.data?.videoNoWatermark || res4.data?.data?.video
          title = res4.data?.data?.title || title
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
