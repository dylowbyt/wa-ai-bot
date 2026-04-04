const { downloadMediaMessage } = require("@whiskeysockets/baileys")

module.exports = {
  name: "toimg",

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const isSticker =
        m.message.stickerMessage ||
        quoted?.stickerMessage

      if (!isSticker) {
        return sock.sendMessage(from, {
          text: "⚠️ Reply sticker dengan .toimg"
        })
      }

      const msg = quoted ? { message: quoted } : m

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
        image: buffer,
        caption: "🖼️ Sticker jadi foto"
      })

    } catch (e) {
      sock.sendMessage(from, { text: "❌ Gagal convert" })
    }
  }
}
