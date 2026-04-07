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
      await sock.sendMessage(from, { text: "⏳ Downloading video YouTube..." })

      let videoUrl = null

      // API 1: ryzendesu
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.url || r.data?.download || r.data?.link
        } catch {}
      }

      // API 2: siputzx
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.siputzx.my.id/api/dl/ytmp4?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.data?.url || r.data?.data?.download || r.data?.url
        } catch {}
      }

      // API 3: cobadeh
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.cobadeh.xyz/ytdl/mp4?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.download || r.data?.url || r.data?.link
        } catch {}
      }

      // API 4: betabotz
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.betabotz.eu.org/api/download/ytmp4?url=${encodeURIComponent(url)}&apikey=beta`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.result?.url || r.data?.result?.download
        } catch {}
      }

      // API 5: nexoracle
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.nexoracle.com/downloader/ytmp4?apikey=free&url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.result?.url || r.data?.result?.download
        } catch {}
      }

      // API 6: surabaya
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.surabaya.eu.org/api/dl/ytmp4?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.data?.url || r.data?.data?.download
        } catch {}
      }

      // API 7: loader.to
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://loader.to/api/button/?url=${encodeURIComponent(url)}&f=mp4`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.url
        } catch {}
      }

      if (!videoUrl) {
        return sock.sendMessage(from, {
          text: "❌ Gagal download video\nSemua server sedang down, coba lagi nanti"
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
