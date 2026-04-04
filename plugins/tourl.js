const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const axios = require("axios")
const FormData = require("form-data")

module.exports = {
  name: "tourl",

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const message = quoted || m.message

      const isMedia =
        message.imageMessage ||
        message.videoMessage ||
        message.documentMessage

      if (!isMedia) {
        return sock.sendMessage(from, {
          text: "⚠️ Reply file/foto/video dengan .tourl"
        })
      }

      const buffer = await downloadMediaMessage(
        { message },
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      )

      await sock.sendMessage(from, { text: "⏳ Uploading..." })

      const form = new FormData()
      form.append("file", buffer, "file")

      const res = await axios.post("https://0x0.st", form, {
        headers: form.getHeaders()
      })

      await sock.sendMessage(from, {
        text: `🔗 Link:\n${res.data}`
      })

    } catch (err) {
      console.log("TOURL ERROR:", err)
      sock.sendMessage(from, { text: "❌ Gagal upload" })
    }
  }
}
