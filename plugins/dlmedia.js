import axios from "axios"

export default {
  name: "ytmp3",
  command: ["ytmp3", "musik"],
  category: "downloader",
  async execute({ sock, m, text }) {
    if (!text) return m.reply("Masukkan link YouTube!")

    try {
      const api = `https://api.y2mate.is/v1/ytmp3?url=${text}`

      const { data } = await axios.get(api)

      await sock.sendMessage(m.chat, {
        audio: { url: data.link },
        mimetype: "audio/mpeg"
      }, { quoted: m })

    } catch {
      m.reply("Error download musik")
    }
  }
}
