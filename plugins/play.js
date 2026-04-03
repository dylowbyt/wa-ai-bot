const yts = require("yt-search")
const ytdl = require("ytdl-core")

module.exports = {
  name: "play",
  run: async (sock, m) => {
    try {
      const from = m.key.remoteJid

      const text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text

      const query = text.replace(".play", "").trim()

      if (!query) {
        return sock.sendMessage(from, {
          text: "Masukin judul lagu!\nContoh: .play cinta untuk starla"
        })
      }

      // 🔍 cari di YouTube
      const search = await yts(query)
      const video = search.videos[0]

      if (!video) {
        return sock.sendMessage(from, {
          text: "Lagu tidak ditemukan 😢"
        })
      }

      const url = video.url

      await sock.sendMessage(from, {
        text: `🎵 Ditemukan:\n${video.title}\n⏳ Downloading...`
      })

      // 🎧 download audio
      const stream = ytdl(url, {
        filter: "audioonly"
      })

      await sock.sendMessage(from, {
        audio: stream,
        mimetype: "audio/mp4"
      })

    } catch (err) {
      console.log(err)
      await sock.sendMessage(m.key.remoteJid, {
        text: "❌ Gagal download lagu"
      })
    }
  }
}
