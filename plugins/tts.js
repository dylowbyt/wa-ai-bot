const axios = require("axios")

module.exports = {
  name: "tts",

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const text = args.join(" ")

    if (!text) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.tts halo dunia\n.tts en hello world"
      })
    }

    try {
      // Deteksi bahasa: kalau awalan "en", gunakan suara English
      let voice = "id-ID-ArdiNeural"
      let cleanText = text

      if (text.startsWith("en ")) {
        voice = "en-US-GuyNeural"
        cleanText = text.slice(3).trim()
      }

      // Batasi 500 karakter
      cleanText = cleanText.slice(0, 500)

      // ===== FIX: Gunakan API TTS yang lebih stabil =====
      // Opsi 1: StreamElements (Brian = English, tapi tetap dicoba)
      const url = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(cleanText)}`

      let audioBuffer = null

      try {
        const res = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 15000,
          headers: { "User-Agent": "Mozilla/5.0" }
        })
        audioBuffer = Buffer.from(res.data)
      } catch {}

      // Opsi 2: TTS Google sebagai fallback
      if (!audioBuffer) {
        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=id&client=tw-ob`
        const res = await axios.get(googleUrl, {
          responseType: "arraybuffer",
          timeout: 15000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Referer": "https://translate.google.com"
          }
        })
        audioBuffer = Buffer.from(res.data)
      }

      await sock.sendMessage(from, {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        ptt: true
      })

    } catch (err) {
      console.log("TTS ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal TTS, coba lagi nanti" })
    }
  }
}
