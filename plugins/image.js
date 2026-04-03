const OpenAI = require("openai")

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

module.exports = {
  name: "image",
  alias: ["img", "aiimg"],

  async run(sock, m) {
    const from = m.key.remoteJid

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text

    const prompt = text.replace(/^\.image|\.img|\.aiimg/, "").trim()

    if (!prompt) {
      return sock.sendMessage(from, {
        text: "⚠️ Masukkan prompt gambar"
      })
    }

    try {
      const res = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024"
      })

      const img = res.data[0].url

      await sock.sendMessage(from, {
        image: { url: img },
        caption: "🎨 AI Image"
      })

    } catch (err) {
      console.log(err)

      await sock.sendMessage(from, {
        text: "❌ Gagal generate gambar"
      })
    }
  }
}
