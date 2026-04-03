const axios = require("axios")
const yts = require("yt-search")

module.exports = {
  name: "play",

  async run(sock, m) {
    const from = m.key.remoteJid

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text

    const query = text.replace(".play", "").trim()

    if (!query) {
      return sock.sendMessage(from, {
        text: "⚠️ Masukkan judul lagu"
      })
    }

    const search = await yts(query)
    const video = search.videos[0]

    if (!video) {
      return sock.sendMessage(from, {
        text: "❌ Lagu tidak ditemukan"
      })
    }

    await sock.sendMessage(from, {
      text: `🎵 Ditemukan:\n${video.title}\n⏳ Downloading...`
    })

    try {
      // 🔥 API baru (lebih stabil)
      const api = `https://api.dlmp3.xyz/api/download?url=https://www.youtube.com/watch?v=${video.videoId}`

      const res = await axios.get(api)

      if (!res.data || !res.data.download) {
        throw new Error("API gagal")
      }

      const url = res.data.download

      await sock.sendMessage(from, {
        audio: { url },
        mimetype: "audio/mpeg",
        fileName: video.title + ".mp3"
      })

    } catch (err) {
      console.log("DOWNLOAD ERROR:", err.message)

      await sock.sendMessage(from, {
        text: "❌ Gagal download lagu (server API lagi down)"
      })
    }
  }
}
