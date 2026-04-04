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

      let audioBuffer = null

      // Opsi 1: StreamElements
      try {
        const seVoice = text.startsWith("en ") ? "Brian" : "id-ID-ArdiNeural"
        const seUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${seVoice}&text=${encodeURIComponent(cleanText)}`
        const res = await axios.get(seUrl, {
          responseType: "arraybuffer",
          timeout: 15000,
          headers: { "User-Agent": "Mozilla/5.0" }
        })
        if (res.data && res.data.byteLength > 1000) {
          audioBuffer = Buffer.from(res.data)
        }
      } catch {}

      // Opsi 2: Google TTS
      if (!audioBuffer) {
        try {
          const lang = text.startsWith("en ") ? "en" : "id"
          const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${lang}&client=tw-ob`
          const res = await axios.get(googleUrl, {
            responseType: "arraybuffer",
            timeout: 15000,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              "Referer": "https://translate.google.com"
            }
          })
          if (res.data && res.data.byteLength > 1000) {
            audioBuffer = Buffer.from(res.data)
          }
        } catch {}
      }

      // Opsi 3: TikTok TTS API (gratis, stabil)
      if (!audioBuffer) {
        try {
          const tiktokLang = text.startsWith("en ") ? "en_us_001" : "id_001"
          const res3 = await axios.post(
            "https://tiktok-tts.weilnet.workers.dev/api/generation",
            { text: cleanText, voice: tiktokLang },
            { timeout: 15000 }
          )
          if (res3.data?.data) {
            audioBuffer = Buffer.from(res3.data.data, "base64")
          }
        } catch {}
      }

      if (!audioBuffer) {
        throw new Error("Semua API TTS gagal")
      }

      await sock.sendMessage(from, {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        ptt: true
      })

    } catch (err) {
      console.log("TTS ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal TTS, semua server sedang down. Coba lagi nanti" })
    }
  }
}
