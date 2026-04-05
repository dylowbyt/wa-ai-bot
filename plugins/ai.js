const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const OpenAI = require("openai")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

module.exports = {
  name: "ai",
  alias: ["tanya", "gpt"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const text = args.join(" ")

    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const directImage = m.message?.imageMessage
    const quotedImage = quoted?.imageMessage
    const isImage = !!(directImage || quotedImage)

    if (!text && !isImage) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.ai apa itu api?\n.tanya kenapa langit biru?\n\nAtau kirim gambar dengan caption .ai untuk analisis gambar."
      })
    }

    await sock.sendMessage(from, { text: "🤖 Thinking..." })

    try {
      // ===== GAMBAR → OPENAI VISION =====
      if (isImage) {
        let imageBuffer = null

        try {
          const targetMsg = quotedImage
            ? { key: m.key, message: quoted }
            : m

          imageBuffer = await downloadMediaMessage(
            targetMsg,
            "buffer",
            {},
            {
              logger: console,
              reuploadRequest: sock.updateMediaMessage
            }
          )
        } catch (e) {
          console.log("Download gambar error:", e.message)
        }

        if (!imageBuffer) {
          return sock.sendMessage(from, {
            text: "⚠️ Gagal baca gambar, coba kirim ulang"
          })
        }

        const base64 = imageBuffer.toString("base64")

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: text || "Jelaskan gambar ini dengan santai"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })

        const reply =
          completion.choices[0]?.message?.content ||
          "Hmm, gambarnya gak bisa dibaca 😅"

        return sock.sendMessage(from, { text: reply })
      }

      // ===== TEXT → OPENAI =====
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Kamu adalah AI asisten yang helpful, singkat dan santai."
          },
          { role: "user", content: text }
        ]
      })

      const reply = completion.choices[0]?.message?.content
      if (reply) {
        await sock.sendMessage(from, { text: reply })
      } else {
        await sock.sendMessage(from, { text: "❌ AI sedang tidak bisa diakses, coba lagi nanti" })
      }

    } catch (e) {
      console.log("OPENAI ERROR:", e.message)
      await sock.sendMessage(from, { text: "❌ AI error, coba lagi nanti" })
    }
  }
}
