const { downloadContentFromMessage } = require("@whiskeysockets/baileys")

module.exports = {
  name: "sticker",
  alias: ["s"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const message = quoted || m.message
      const image = message.imageMessage

      if (!image) {
        return sock.sendMessage(from, {
          text: "⚠️ Kirim / reply gambar dengan .s"
        })
      }

      // download
      const stream = await downloadContentFromMessage(image, "image")

      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      // kirim sticker
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
