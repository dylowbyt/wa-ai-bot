const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const fs = require("fs")
const { exec } = require("child_process")
const path = require("path")

module.exports = {
  name: "ptv",
  alias: ["photovideo"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const isImage =
        m.message?.imageMessage ||
        quoted?.imageMessage

      if (!isImage) {
        return sock.sendMessage(from, {
          text: "⚠️ Kirim atau reply foto dengan *.ptv*"
        })
      }

      const msg = quoted ? { message: quoted } : m

      // ===== DOWNLOAD FOTO
      const buffer = await downloadMediaMessage(
        msg,
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      )

      const inputPath = path.join(__dirname, "../ptv_input.jpg")
      const outputPath = path.join(__dirname, "../ptv_output.mp4")

      fs.writeFileSync(inputPath, buffer)

      // ===== CONVERT KE VIDEO
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -loop 1 -i ${inputPath} -vf "zoompan=z='min(zoom+0.002,1.5)':d=125" -t 5 -s 720x1280 -c:v libx264 -pix_fmt yuv420p ${outputPath}`,
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      const videoBuffer = fs.readFileSync(outputPath)

      await sock.sendMessage(from, {
        video: videoBuffer,
        caption: "🎥 Foto jadi video"
      })

      // ===== CLEANUP
      fs.unlinkSync(inputPath)
      fs.unlinkSync(outputPath)

    } catch (err) {
      console.log("PTV ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal convert foto ke video"
      })
    }
  }
}
