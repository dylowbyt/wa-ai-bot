const axios = require("axios")

module.exports = {
  name: "aivideo",
  alias: ["videoai", "genvideo"],

  async run(sock, m, args) {
    try {
      const prompt = args.join(" ")
      if (!prompt) {
        return m.reply("Contoh: /aivideo kucing terbang di luar angkasa")
      }

      await m.reply("🎬 Lagi bikin video... tunggu bentar")

      // ================= API GRATIS (NO KEY)
      const API_URL = "https://zsky.ai/api/v1/video/generate"

      const res = await axios.post(
        API_URL,
        {
          prompt: prompt,
          duration: 5
        },
        {
          responseType: "arraybuffer", // penting biar dapet video
          timeout: 60000
        }
      )

      // ================= KIRIM KE WHATSAPP
      await sock.sendMessage(
        m.chat,
        {
          video: res.data,
          mimetype: "video/mp4",
          caption: `🎥 Hasil video:\n${prompt}`
        },
        { quoted: m }
      )

    } catch (err) {
      console.error(err)

      // fallback error message biar gak kosong
      if (err.response) {
        return m.reply("❌ API error, coba lagi nanti")
      }

      if (err.code === "ECONNABORTED") {
        return m.reply("⏱️ Timeout, coba prompt lebih simple")
      }

      m.reply("❌ Gagal bikin video")
    }
  }
}
