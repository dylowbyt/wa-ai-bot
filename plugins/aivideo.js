export default {
  name: "aivideo",
  command: ["videoai"],
  category: "ai",
  async execute({ sock, m, text }) {
    if (!text) return m.reply("Masukkan prompt!")

    // demo aja (pakai link video random)
    const videoUrl = "https://files.catbox.moe/o0kqk9.mp4"

    await sock.sendMessage(m.chat, {
      video: { url: videoUrl },
      caption: `Video AI (demo): ${text}`
    }, { quoted: m })
  }
}
