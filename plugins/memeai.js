const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const axios = require("axios")
const FormData = require("form-data")

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

module.exports = {
  name: "memeai",
  alias: ["memegen"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const hasImage =
        m.message?.imageMessage ||
        quoted?.imageMessage

      if (!hasImage) {
        return sock.sendMessage(from, {
          text: "⚠️ Reply foto dengan .memeai"
        })
      }

      await sock.sendMessage(from, {
        text: "🧠 AI lagi mikir meme..."
      })

      // ===== FIX: bungkus dengan key agar downloadMediaMessage bisa kerja =====
      const targetMsg = quoted
        ? { key: m.key, message: quoted }
        : m

      const buffer = await downloadMediaMessage(
        targetMsg,
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      )

      const base64 = buffer.toString("base64")

      // ===== GEMINI VISION =====
      const gemini = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: "Buatkan teks meme lucu bahasa Indonesia dari gambar ini, format: atas|bawah, singkat dan relate"
                },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64
                  }
                }
              ]
            }
          ]
        },
        { timeout: 20000 }
      )

      let text = gemini.data.candidates?.[0]?.content?.parts?.[0]?.text || ""

      // Bersihkan dari karakter markdown
      text = text.replace(/\*/g, "").trim()

      let [top, bottom] = text.split("|").map(s => s.trim())

      if (!top || !bottom) {
        top = "Ketika hidup..."
        bottom = "ya begitulah"
      }

      // ===== UPLOAD FOTO ke 0x0.st =====
      const form = new FormData()
      form.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" })

      const upload = await axios.post("https://0x0.st", form, {
        headers: form.getHeaders(),
        timeout: 30000
      })

      const imageUrl = upload.data.trim()

      if (!imageUrl.startsWith("http")) {
        throw new Error("Upload gagal: " + imageUrl)
      }

      // ===== GENERATE MEME =====
      const memeUrl = `https://api.popcat.xyz/meme?image=${encodeURIComponent(imageUrl)}&top=${encodeURIComponent(top)}&bottom=${encodeURIComponent(bottom)}`

      await sock.sendMessage(from, {
        image: { url: memeUrl },
        caption: `😂 *${top}*\n_${bottom}_`
      })

    } catch (err) {
      console.log("MEMEAI ERROR:", err?.message || err)

      await sock.sendMessage(from, {
        text: "❌ Gagal bikin meme AI\nPastikan GEMINI_API_KEY sudah diset"
      })
    }
  }
}
