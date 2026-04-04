const axios = require("axios")

module.exports = {
  name: "ai",

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const text = args.join(" ")

    if (!text) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.ai apa itu api?"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🤖 Thinking..." })

      const res = await axios.get(
        `https://api.affiliateplus.xyz/api/chatbot?message=${encodeURIComponent(text)}&botname=AI&ownername=User`
      )

      await sock.sendMessage(from, {
        text: res.data.message
      })

    } catch {
      sock.sendMessage(from, { text: "❌ AI error" })
    }
  }
}
