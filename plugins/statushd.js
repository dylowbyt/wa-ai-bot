module.exports = {
  name: "statushd",

  async run(sock, m) {
    const from = m.key.remoteJid

    const video =
      m.message.videoMessage ||
      m.message.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage

    if (!video) {
      return sock.sendMessage(from, {
        text: "⚠️ Reply video dengan .statushd"
      })
    }

    try {
      await sock.sendMessage("status@broadcast", {
        video: video,
        caption: "✨ HD Status"
      })

      await sock.sendMessage(from, {
        text: "✅ Berhasil upload status HD"
      })

    } catch (err) {
      console.log(err)

      await sock.sendMessage(from, {
        text: "❌ Gagal upload status"
      })
    }
  }
}
