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

      if (!buffer || buffer.length < 1000) {
        throw new Error("Video kosong atau gagal didownload")
      }

      // ===== CEK APAKAH FFMPEG TERSEDIA =====
      const hasFfmpeg = await new Promise(resolve => {
        exec("ffmpeg -version", { timeout: 5000 }, (err) => resolve(!err))
      })

      let finalBuffer = buffer

      if (hasFfmpeg) {
        // ===== SAVE TEMP & RE-ENCODE =====
        const timestamp = Date.now()
        const inputPath = path.join(__dirname, `../temp_input_${timestamp}.mp4`)
        const outputPath = path.join(__dirname, `../temp_output_${timestamp}.mp4`)

        fs.writeFileSync(inputPath, buffer)

        try {
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

          if (fs.existsSync(outputPath)) {
            finalBuffer = fs.readFileSync(outputPath)
          }
        } catch (ffErr) {
          console.log("FFMPEG ERROR:", ffErr.message, "— kirim video asli")
        }

        // CLEANUP
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
      } else {
        console.log("[STATUSHD] ffmpeg tidak tersedia, kirim video langsung")
      }

      // ===== KIRIM KE STATUS =====
      try {
        await sock.sendMessage("status@broadcast", {
          video: finalBuffer,
          caption: "✨ HD Status"
        })
      } catch (e) {
        console.log("Gagal kirim ke status:", e.message)
      }

      // ===== KIRIM KE USER =====
      await sock.sendMessage(from, {
        video: finalBuffer,
        caption: "🎥 Video siap jadi status"
      })

      await sock.sendMessage(from, {
        text: "✅ Status berhasil diproses"
      })

    } catch (err) {
      console.log("STATUS ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal memproses video"
      })
    }
  }
}
