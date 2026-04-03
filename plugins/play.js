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

    // 🔍 Cari lagu
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
      // 🔥 API downloader (anti error Railway)
      const res = await axios.get(
        `https://api.vevioz.com/api/button/mp3/${video.videoId}`
      )

      const url = res.data.match(/href="(.*?)"/)[1]

      await sock.sendMessage(from, {
        audio: { url },
        mimetype: "audio/mpeg",
        fileName: video.title + ".mp3"
      })

    } catch (err) {
      console.log("DOWNLOAD ERROR:", err.message)

      await sock.sendMessage(from, {
        text: "❌ Gagal download lagu"
      })
    }
  }
}
