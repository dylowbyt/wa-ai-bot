const { downloadMediaMessage } = require("@whiskeysockets/baileys")

module.exports = {
  name: "sticker",
  alias: ["s"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const isImage =
        m.message.imageMessage ||
        quoted?.imageMessage

      if (!isImage) {
        return sock.sendMessage(from, {
          text: "⚠️ Kirim / reply gambar dengan .s"
        })
      }

      const msg = quoted
        ? { message: quoted }
        : m

      const buffer = await downloadMediaMessage(
        msg,
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      )

      await sock.sendMessage(from, {
        sticker: buffer
      })

    } catch (err) {
      console.log("STICKER ERROR:", err.message)

      await sock.sendMessage(from, {
        text: "❌ Gagal buat sticker"
      })
    }
  }
}
