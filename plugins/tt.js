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

      // API 1: tikwm.com — paling stabil
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.data?.play || r.data?.data?.wmplay
        } catch {}
      }

      // API 2: tiklydown
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.video?.noWatermark || r.data?.video?.url || r.data?.url
        } catch {}
      }

      // API 3: siputzx
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.siputzx.my.id/api/dl/tiktok?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.data?.play || r.data?.data?.wmplay
        } catch {}
      }

      // API 4: ryzendesu
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.ryzendesu.vip/api/downloader/ttdl?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.data?.play || r.data?.data?.video
        } catch {}
      }

      // API 5: betabotz
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.betabotz.eu.org/api/download/tiktok?url=${encodeURIComponent(url)}&apikey=beta`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.result?.play || r.data?.result?.url
        } catch {}
      }

      // API 6: nexoracle
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.nexoracle.com/downloader/tiktok?apikey=free&url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.result?.play || r.data?.result?.url
        } catch {}
      }

      // API 7: surabaya
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.surabaya.eu.org/api/dl/tiktok?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.data?.play || r.data?.data?.url
        } catch {}
      }

      if (!videoUrl) {
        return sock.sendMessage(from, {
          text: "❌ Gagal download TikTok\nSemua server sedang down, coba lagi nanti"
        })
      }

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: "✅ TikTok Download"
      })

    } catch (err) {
      console.log("TT ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Error download TikTok" })
    }
  }
}
