const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const sharp = require("sharp")

module.exports = {
  name: "hd",
  alias: ["remini", "enhance"],

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

      // 🔥 PROSES HD (UPSCALE + SHARPEN)
      const result = await sharp(buffer)
        .resize({
          width: 1024, // upscale
          withoutEnlargement: false
        })
        .sharpen() // tajamkan
        .normalize() // warna lebih hidup
        .jpeg({ quality: 90 }) // kualitas tinggi
        .toBuffer()

      await sock.sendMessage(from, {
        image: result,
        caption: "✨ Foto berhasil di-HD (offline)"
      })

    } catch (err) {
      console.log("HD ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal HD"
      })
    }
  }
}
