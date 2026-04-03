module.exports = {
  name: "statushd",

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const video =
        m.message.videoMessage ||
        quoted?.videoMessage

      if (!video) {
        return sock.sendMessage(from, {
          text: "⚠️ Kirim atau reply video dengan .statushd"
        })
      }

      // ambil video dari pesan / reply
      const msg = quoted ? { message: quoted } : m

      // 🔥 upload ke status
      await sock.sendMessage("status@broadcast", {
        video: video,
        caption: "✨ HD Status"
      })

      // 🔥 kirim balik ke chat
      await sock.sendMessage(from, {
        video: video,
        caption: "🎥 Ini videonya (HD)"
      })

      // notifikasi
      await sock.sendMessage(from, {
        text: "✅ Status berhasil di upload"
      })

    } catch (err) {
      console.log("STATUS ERROR:", err.message)

      await sock.sendMessage(from, {
        text: "❌ Gagal upload status"
      })
    }
  }
}
