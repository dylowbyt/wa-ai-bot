const OpenAI = require("openai")

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

module.exports = {
  name: "image",
  alias: ["img"],

  async run(sock, m) {
    const from = m.key.remoteJid

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text

    const prompt = text.replace(/^\.image|\.img/, "").trim()

    if (!prompt) {
      return sock.sendMessage(from, {
        text: "⚠️ Masukkan prompt"
      })
    }

    try {
      const res = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024"
      })

      const base64 = res.data[0].b64_json
      const buffer = Buffer.from(base64, "base64")

      await sock.sendMessage(from, {
        image: buffer,
        caption: "🎨 AI Image"
      })

    } catch (err) {
      console.log("IMG ERROR:", err.message)

      await sock.sendMessage(from, {
        text: "❌ Gagal generate gambar"
      })
    }
  }
}
