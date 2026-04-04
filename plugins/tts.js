const axios = require("axios")

module.exports = {
  name: "tts",

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const text = args.join(" ")

    if (!text) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.tts halo dunia"
      })
    }

    try {
      const url = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(text)}`

      await sock.sendMessage(from, {
        audio: { url },
        mimetype: "audio/mpeg",
        ptt: true
      })

    } catch {
      sock.sendMessage(from, { text: "❌ Gagal TTS" })
    }
  }
}
