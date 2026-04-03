const { downloadMediaMessage } = require("@whiskeysockets/baileys")

module.exports = {
  name: "sticker",
  alias: ["s"]

  async run(sock, m) {
    const from = m.key.remoteJid

    const isImage =
      m.message.imageMessage ||
      m.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

    if (!isImage) {
      return sock.sendMessage(from, {
        text: "⚠️ Kirim gambar dengan caption .sticker atau reply gambar"
      })
    }

    try {
      // ambil gambar
      const buffer = await downloadMediaMessage(
        m,
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      )

      // kirim sebagai sticker
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
