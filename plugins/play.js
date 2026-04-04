const axios = require("axios")
const yts = require("yt-search")

module.exports = {
  name: "play",
  alias: ["lagu", "music"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""

    const query = args.length ? args.join(" ") : text.replace(/^\.(play|lagu|music)\s*/i, "").trim()

    if (!query) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.play judul lagu"
      })
    }

    let search, video
    try {
      search = await yts(query)
      video = search.videos[0]
    } catch (e) {
      console.log("YTS ERROR:", e.message)
    }

    if (!video) {
      return sock.sendMessage(from, {
        text: "❌ Lagu tidak ditemukan"
      })
    }

    await sock.sendMessage(from, {
      text: `🎵 Ditemukan:\n${video.title}\n⏳ Downloading...`
    })

    const ytUrl = `https://www.youtube.com/watch?v=${video.videoId}`
    let audioUrl = null

    // API 1: cobadeh.xyz
    try {
      const r1 = await axios.get(
        `https://api.cobadeh.xyz/ytdl/mp3?url=${encodeURIComponent(ytUrl)}`,
        { timeout: 20000 }
      )
      audioUrl = r1.data?.download || r1.data?.url || r1.data?.link
    } catch {}

    // API 2: yt-download.org
    if (!audioUrl) {
      try {
        const r2 = await axios.get(
          `https://www.yt-download.org/api/button/mp3/${video.videoId}`,
          { timeout: 20000 }
        )
        const match = r2.data?.match?.(/href="(https?:\/\/[^"]+\.mp3[^"]*)"/)
        if (match) audioUrl = match[1]
      } catch {}
    }

    // API 3: loader.to
    if (!audioUrl) {
      try {
        const r3 = await axios.get(
          `https://loader.to/api/button/?url=${encodeURIComponent(ytUrl)}&f=mp3`,
          { timeout: 20000 }
        )
        audioUrl = r3.data?.url
      } catch {}
    }

    if (!audioUrl) {
      return sock.sendMessage(from, {
        text: `❌ Gagal download: *${video.title}*\nServer API lagi down, coba lagi nanti`
      })
    }

    try {
      await sock.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: video.title + ".mp3"
      })
    } catch (err) {
      console.log("PLAY SEND ERROR:", err.message)
      await sock.sendMessage(from, {
        text: `❌ Gagal kirim audio\n${err.message}`
      })
    }
  }
}
