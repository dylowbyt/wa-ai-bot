const axios = require("axios")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

module.exports = {
  name: "hd",
  alias: ["remini"],

  async run(sock, m) {
    const from = m.key.remoteJid

    const isImage =
      m.message.imageMessage ||
      m.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

    if (!isImage) {
      return sock.sendMessage(from, {
        text: "⚠️ Kirim / reply foto dengan caption .hd"
      })
    }

    try {
      const buffer = await downloadMediaMessage(
        m,
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      )

      // 🔥 upload ke temp server
      const form = new FormData()
      form.append("file", buffer, "image.jpg")

      const upload = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
        headers: form.getHeaders()
      })

      const url = upload.data.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/")

      // 🔥 API upscale gratis
      const api = `https://api.popcat.xyz/imgenhance?image=${encodeURIComponent(url)}`

      await sock.sendMessage(from, {
        image: { url: api },
        caption: "✨ Foto sudah di HD kan"
      })

    } catch (err) {
      console.log(err)

      await sock.sendMessage(from, {
        text: "❌ Gagal proses HD"
      })
    }
  }
}
