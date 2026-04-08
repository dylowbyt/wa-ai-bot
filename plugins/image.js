const OpenAI = require("openai")

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

module.exports = {
  name: "image",
  alias: ["imgfree"],

  async run(sock, m) {
    const from = m.key.remoteJid

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""

    const prompt = text.replace(/^\.(image|img)\s*/i, "").trim()

    if (!prompt) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.image kucing lucu\n.img sunset di pantai"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🎨 Membuat gambar AI..." })

      const res = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url"
      })

      const imageUrl = res.data[0]?.url

      if (!imageUrl) throw new Error("Tidak ada URL gambar dari API")

      await sock.sendMessage(from, {
        image: { url: imageUrl },
        caption: `🎨 *AI Image*\n_${prompt}_`
      })

    } catch (err) {
      console.log("IMG ERROR:", err.message)

      await sock.sendMessage(from, {
        text: "❌ Gagal generate gambar\nPastikan OPENAI_API_KEY sudah diset"
      })
    }
  }
}
