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

      // ===== SIMPAN FILE =====
      const inputPath = path.join(__dirname, "../temp_input.mp4")
      const outputPath = path.join(__dirname, "../temp_output.mp4")

      fs.writeFileSync(inputPath, buffer)

      await sock.sendMessage(from, {
        text: "⚙️ Processing HD..."
      })

      // ===== FFMPEG PROCESS =====
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -i ${inputPath} -vf scale=720:-2 -c:v libx264 -preset veryfast -crf 18 -b:v 2M -c:a aac -b:a 128k ${outputPath}`,
          (err) => {
            if (err) return reject(err)
            resolve()
          }
        )
      })

      const finalBuffer = fs.readFileSync(outputPath)

      // ===== UPLOAD STATUS =====
      await sock.sendMessage("status@broadcast", {
        video: finalBuffer,
        caption: "✨ HD Status"
      })

      // ===== KIRIM KE USER =====
      await sock.sendMessage(from, {
        video: finalBuffer,
        caption: "🎥 HD Version"
      })

      await sock.sendMessage(from, {
        text: "✅ Selesai! Video sudah di-HD-kan"
      })

      // ===== CLEAN FILE =====
      fs.unlinkSync(inputPath)
      fs.unlinkSync(outputPath)

    } catch (err) {
      console.log("HD ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal proses HD"
      })
    }
  }
}
