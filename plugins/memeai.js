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

      const message = quoted || m.message

      if (!message.imageMessage) {
        return sock.sendMessage(from, {
          text: "⚠️ Reply foto dengan .memeai"
        })
      }

      await sock.sendMessage(from, {
        text: "🧠 AI lagi mikir meme..."
      })

      // ===== DOWNLOAD FOTO
      const buffer = await downloadMediaMessage(
        { message },
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      )

      const base64 = buffer.toString("base64")

      // ===== GEMINI VISION (LIHAT GAMBAR)
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
        }
      )

      let text = gemini.data.candidates?.[0]?.content?.parts?.[0]?.text || ""

      // parsing atas|bawah
      let [top, bottom] = text.split("|")

      if (!top || !bottom) {
        top = "Ketika hidup..."
        bottom = "ya begitulah"
      }

      // ===== UPLOAD FOTO
      const form = new FormData()
      form.append("file", buffer, "image.jpg")

      const upload = await axios.post("https://0x0.st", form, {
        headers: form.getHeaders()
      })

      const imageUrl = upload.data.trim()

      // ===== GENERATE MEME
      const memeUrl = `https://api.popcat.xyz/meme?image=${encodeURIComponent(imageUrl)}&top=${encodeURIComponent(top)}&bottom=${encodeURIComponent(bottom)}`

      await sock.sendMessage(from, {
        image: { url: memeUrl },
        caption: "😂 Meme AI (fresh)"
      })

    } catch (err) {
      console.log("MEMEAI ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal bikin meme AI"
      })
    }
  }
}
