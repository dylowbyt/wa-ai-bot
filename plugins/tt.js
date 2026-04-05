import axios from "axios"

export default {
  name: "tiktok",
  command: ["tt", "tiktok"],
  category: "downloader",
  async execute({ sock, m, text }) {
    if (!text) return m.reply("Masukkan link TikTok!")

    try {
      const api = `https://api.tiklydown.eu.org/api/download?url=${text}`

      const { data } = await axios.get(api)

      await sock.sendMessage(m.chat, {
        video: { url: data.video.noWatermark },
        caption: "TikTok Download"
      }, { quoted: m })

    } catch {
      m.reply("Error download TikTok")
    }
  }
}
