const axios = require("axios")

module.exports = {
  name: "vid2",
  alias: ["jsonvideo", "j2v"],
  category: "ai",

  async run(sock, m, args) {
    try {
      const text = args.join(" ")
      if (!text) {
        return m.reply("Contoh: .vid2 kucing jadi narator berita lucu")
      }

      const API_KEY = process.env.JSON2VIDEO_API_KEY
      if (!API_KEY) {
        return m.reply("❌ API key JSON2Video belum di set di .env")
      }

      await m.reply("🎬 Membuat video JSON2Video...")

      // ================= STEP 1: CREATE VIDEO
      const create = await axios.post(
        "https://api.json2video.com/v2/movies",
        {
          template: {
            name: "simple",
            data: {
              text: text
            }
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
        return m.reply("❌ Gagal membuat video")
      }

      // ================= STEP 2: POLLING STATUS
      let videoUrl = null

      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 5000))

        const status = await axios.get(
          `https://api.json2video.com/v2/movies/${jobId}`,
          {
            headers: {
              "x-api-key": API_KEY
            }
          }
        )

        if (status.data.status === "done") {
          videoUrl = status.data.movie_url
          break
        }

        if (status.data.status === "failed") {
          return m.reply("❌ Gagal generate video")
        }
      }

      if (!videoUrl) {
        return m.reply("⏳ Video belum selesai, coba lagi nanti")
      }

      // ================= STEP 3: SEND
      await sock.sendMessage(
        m.chat,
        {
          video: { url: videoUrl },
          caption: `🎥 JSON2Video:\n${text}`
        },
        { quoted: m }
      )

    } catch (err) {
      console.error(err)
      m.reply("❌ Error JSON2Video")
    }
  }
}
