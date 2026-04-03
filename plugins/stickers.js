const { downloadContentFromMessage } = require("@whiskeysockets/baileys")

module.exports = {
  name: "sticker",
  alias: ["s"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const message = quoted || m.message

      const imageMessage =
        message.imageMessage ||
        message.videoMessage

      if (!imageMessage) {
        return sock.sendMessage(from, {
          text: "⚠️ Kirim / reply gambar atau video dengan .s"
        })
      }

      const stream = await downloadContentFromMessage(
        imageMessage,
        imageMessage.mimetype.split("/")[0]
      )

      let buffer = Buffer.from([])

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      await sock.sendMessage(from, {
        sticker: buffer
      })

    } catch (err) {
      console.log("STICKER ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal buat sticker"
      })
    }
  }
}
