const { downloadContentFromMessage } = require("@whiskeysockets/baileys")
const fs = require("fs")
const { exec } = require("child_process")
const path = require("path")

module.exports = {
  name: "statushd",

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const message = quoted || m.message
      const videoMessage = message?.videoMessage

      if (!videoMessage) {
        return sock.sendMessage(from, {
          text: "⚠️ Kirim / reply video dengan .statushd"
        })
      }

      await sock.sendMessage(from, { text: "⏳ Memproses video..." })

      // ===== DOWNLOAD =====
      const stream = await downloadContentFromMessage(videoMessage, "video")

      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      // ===== SAVE TEMP =====
      // Beri nama unik agar tidak bentrok jika banyak request
      const timestamp = Date.now()
      const inputPath = path.join(__dirname, `../temp_input_${timestamp}.mp4`)
      const outputPath = path.join(__dirname, `../temp_output_${timestamp}.mp4`)

      fs.writeFileSync(inputPath, buffer)

      // ===== RE-ENCODE — tanda kutip path agar aman =====
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${inputPath}" -vcodec libx264 -acodec aac -preset fast -crf 28 "${outputPath}"`,
          { timeout: 60000 },
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      const fixedBuffer = fs.readFileSync(outputPath)

      // ===== KIRIM KE STATUS =====
      await sock.sendMessage("status@broadcast", {
        video: fixedBuffer,
        caption: "✨ HD Status"
      })

      // ===== KIRIM KE USER =====
      await sock.sendMessage(from, {
        video: fixedBuffer,
        caption: "🎥 Video siap jadi status"
      })

      await sock.sendMessage(from, {
        text: "✅ Status berhasil di upload"
      })

      // ===== CLEANUP =====
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)

    } catch (err) {
      console.log("STATUS ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal upload status\nPastikan ffmpeg terinstall di server"
      })
    }
  }
}
