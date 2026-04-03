const { downloadContentFromMessage } = require("@whiskeysockets/baileys")

module.exports = {
  name: "statushd",

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const message = quoted || m.message
      const videoMessage = message.videoMessage

      if (!videoMessage) {
        return sock.sendMessage(from, {
          text: "⚠️ Kirim / reply video dengan .statushd"
        })
      }

      // ===== DOWNLOAD VIDEO =====
      const stream = await downloadContentFromMessage(videoMessage, "video")

      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      // ===== KIRIM KE STATUS =====
      await sock.sendMessage("status@broadcast", {
        video: buffer,
        caption: "✨ HD Status"
      })

      // ===== KIRIM KE USER =====
      await sock.sendMessage(from, {
        video: buffer,
        caption: "🎥 Video siap jadi status"
      })

      await sock.sendMessage(from, {
        text: "✅ Status berhasil di upload"
      })

    } catch (err) {
      console.log("STATUS ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal upload status"
      })
    }
  }
}
