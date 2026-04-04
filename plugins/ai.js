const axios = require("axios")
const OpenAI = require("openai")

module.exports = {
  name: "ai",
  alias: ["tanya", "gpt"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const text = args.join(" ")

    if (!text) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.ai apa itu api?\n.tanya kenapa langit biru?"
      })
    }

    await sock.sendMessage(from, { text: "🤖 Thinking..." })

    // Coba API gratis dulu
    let replied = false

    try {
      const res = await axios.get(
        `https://api.siputzx.my.id/api/ai/meta-llama?prompt=${encodeURIComponent(text)}`,
        { timeout: 15000 }
      )
      const answer = res.data?.data || res.data?.message || res.data?.result
      if (answer) {
        await sock.sendMessage(from, { text: String(answer) })
        replied = true
      }
    } catch {}

    // Fallback API 2
    if (!replied) {
      try {
        const res2 = await axios.get(
          `https://api.nexoracle.com/ai/gpt-3?apikey=free&text=${encodeURIComponent(text)}`,
          { timeout: 15000 }
        )
        const answer2 = res2.data?.result || res2.data?.message
        if (answer2) {
          await sock.sendMessage(from, { text: String(answer2) })
          replied = true
        }
      } catch {}
    }

    // Fallback ke OpenAI kalau ada key
    if (!replied && process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Kamu adalah AI asisten yang helpful, singkat dan santai." },
            { role: "user", content: text }
          ]
        })
        const answer3 = completion.choices[0]?.message?.content
        if (answer3) {
          await sock.sendMessage(from, { text: answer3 })
          replied = true
        }
      } catch (e) {
        console.log("OPENAI ERROR:", e.message)
      }
    }

    if (!replied) {
      await sock.sendMessage(from, { text: "❌ AI sedang tidak bisa diakses, coba lagi nanti" })
    }
  }
}
