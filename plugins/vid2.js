const axios = require("axios")

module.exports = {
  name: "vid2",
  alias: ["jsonvideo", "j2v"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const text = args.join(" ")
    if (!text) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.vid2 kucing jadi narator berita lucu"
      })
    }

    const API_KEY = process.env.JSON2VIDEO_API_KEY
    if (!API_KEY) {
      return sock.sendMessage(from, {
        text: "❌ API key JSON2Video belum diset di ENV"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🎬 Membuat video JSON2Video..." })

      const create = await axios.post(
        "https://api.json2video.com/v2/movies",
        {
          template: {
            name: "simple",
            data: { text }
          }
        },
        {
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json"
          }
        }
      )

      const jobId = create.data.id
      if (!jobId) {
        return sock.sendMessage(from, { text: "❌ Gagal membuat video" })
      }

      let videoUrl = null
      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 5000))

        const status = await axios.get(
          `https://api.json2video.com/v2/movies/${jobId}`,
          { headers: { "x-api-key": API_KEY } }
        )

        if (status.data.status === "done") {
          videoUrl = status.data.movie_url
          break
        }

        if (status.data.status === "failed") {
          return sock.sendMessage(from, { text: "❌ Gagal generate video" })
        }
      }

      if (!videoUrl) {
        return sock.sendMessage(from, { text: "⏳ Video belum selesai, coba lagi nanti" })
      }

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: `🎥 JSON2Video:\n${text}`
      })

    } catch (err) {
      console.log("VID2 ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Error JSON2Video" })
    }
  }
}
