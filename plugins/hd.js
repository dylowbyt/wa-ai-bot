const { downloadContentFromMessage } = require("@whiskeysockets/baileys")
const fs = require("fs")
const path = require("path")
const axios = require("axios")
const { useLimit, getLimit } = require("../ai/limit")

module.exports = {
  name: "hd",
  alias: ["remini", "enhance"],

  async run(sock, m) {
    const from = m.key.remoteJid
    const user = m.key.participant || m.key.remoteJid

    try {
      // ===== LIMIT CHECK =====
      if (!useLimit(user)) {
        return sock.sendMessage(from, {
          text: `⚠️ Limit HD habis!\nSisa: ${getLimit(user)}\nReset besok`
        })
      }

      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const message = quoted || m.message
      const imageMessage = message.imageMessage

      if (!imageMessage) {
        return sock.sendMessage(from, {
          text: "⚠️ Kirim / reply foto dengan .hd"
        })
      }

      // ===== DOWNLOAD IMAGE =====
      const stream = await downloadContentFromMessage(imageMessage, "image")

      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      const inputPath = path.join(__dirname, "../input.jpg")
      fs.writeFileSync(inputPath, buffer)

      await sock.sendMessage(from, {
        text: "🧠 Upscaling AI (HD)..."
      })

      // ===== UPLOAD KE API =====
      const uploadRes = await axios.post(
        "https://api.replicate.com/v1/files",
        buffer,
        {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
            "Content-Type": "application/octet-stream"
          }
        }
      )

      const imageUrl = uploadRes.data.urls.get

      // ===== RUN ESRGAN =====
      const prediction = await axios.post(
        "https://api.replicate.com/v1/predictions",
        {
          version:
            "42fed1c497ed5c4a4f64e4b2f1c8b3f8c3b4f9c3c7b9e4b1f6d2e1a9c8f7d6e5",
          input: {
            image: imageUrl,
            scale: 2
          }
        },
        {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      )

      let outputUrl = null

      // ===== WAIT RESULT =====
      for (let i = 0; i < 12; i++) {
        const check = await axios.get(
          `https://api.replicate.com/v1/predictions/${prediction.data.id}`,
          {
            headers: {
              Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`
            }
          }
        )

        if (check.data.status === "succeeded") {
          outputUrl = check.data.output[0]
          break
        }

        await new Promise(r => setTimeout(r, 2000))
      }

      if (!outputUrl) {
        throw new Error("Upscale timeout")
      }

      // ===== DOWNLOAD RESULT =====
      const final = await axios.get(outputUrl, {
        responseType: "arraybuffer"
      })

      await sock.sendMessage(from, {
        image: Buffer.from(final.data),
        caption: `✨ HD Real Upscale\nSisa limit: ${getLimit(user)}`
      })

      fs.unlinkSync(inputPath)

    } catch (err) {
      console.log("HD ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal upscale HD"
      })
    }
  }
}
