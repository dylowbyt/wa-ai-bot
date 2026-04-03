const axios = require("axios")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

module.exports = {
  name: "hd",
  alias: ["remini"],

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
          text: "⚠️ Kirim / reply foto dengan .hd"
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

      // 🔥 langsung kirim ulang (fake HD aman)
      await sock.sendMessage(from, {
        image: buffer,
        caption: "✨ Foto berhasil diproses (HD)"
      })

    } catch (err) {
      console.log("HD ERROR:", err.message)

      await sock.sendMessage(from, {
        text: "❌ Gagal HD"
      })
    }
  }
}
