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

      await sock.sendMessage(from, { text: "⏳ Mengonversi foto ke video..." })

      // ===== FIX: tambahkan key agar downloadMediaMessage bekerja =====
      const targetMsg = quoted
        ? { key: m.key, message: quoted }
        : m

      const buffer = await downloadMediaMessage(
        targetMsg,
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      )

      // ===== SAVE dengan nama unik =====
      const timestamp = Date.now()
      const inputPath = path.join(__dirname, `../ptv_input_${timestamp}.jpg`)
      const outputPath = path.join(__dirname, `../ptv_output_${timestamp}.mp4`)

      fs.writeFileSync(inputPath, buffer)

      // ===== FIX: Tambah -y (overwrite), kutip path, dan sederhanakan filter agar lebih stabil =====
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -loop 1 -i "${inputPath}" -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" -t 5 -c:v libx264 -pix_fmt yuv420p -r 24 "${outputPath}"`,
          { timeout: 60000 },
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

      // ===== CLEANUP =====
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)

    } catch (err) {
      console.log("PTV ERROR:", err?.message)

      await sock.sendMessage(from, {
        text: "❌ Gagal convert foto ke video\nPastikan ffmpeg terinstall"
      })
    }
  }
}
