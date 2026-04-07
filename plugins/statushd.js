const { downloadContentFromMessage } = require("@whiskeysockets/baileys")
const fs = require("fs")
const { exec } = require("child_process")
const path = require("path")

// Batas file size WA status = 16MB
const MAX_SIZE_MB = 15
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function runFfmpeg(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message))
      else resolve()
    })
  })
}

function getFileSize(filePath) {
  try { return fs.statSync(filePath).size } catch { return 0 }
}

module.exports = {
  name: "statushd",
  alias: ["statusvid", "statusfix"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const message = quoted || m.message
      const videoMessage = message?.videoMessage

      if (!videoMessage) {
        return sock.sendMessage(from, {
          text: `⚠️ *Cara pakai:*\nReply video dengan *.statushd*\n\nFungsi:\n✅ Video jadi jernih saat upload status WA\n✅ Format dioptimasi khusus WhatsApp\n✅ Ukuran file diperkecil otomatis`
        })
      }

      await sock.sendMessage(from, { text: "⏳ Memproses video untuk status WA..." })

      // ===== DOWNLOAD VIDEO =====
      const stream = await downloadContentFromMessage(videoMessage, "video")
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      if (!buffer || buffer.length < 1000) {
        throw new Error("Video kosong atau gagal didownload")
      }

      // ===== CEK FFMPEG =====
      const hasFfmpeg = await new Promise(resolve => {
        exec("ffmpeg -version", { timeout: 5000 }, err => resolve(!err))
      })

      if (!hasFfmpeg) {
        // Kirim langsung kalau tidak ada ffmpeg
        await sock.sendMessage(from, {
          video: buffer,
          caption: "⚠️ ffmpeg tidak tersedia, video dikirim apa adanya"
        })
        return
      }

      // ===== PROSES DENGAN FFMPEG =====
      const ts = Date.now()
      const inputPath = `/tmp/statushd_input_${ts}.mp4`
      const outputPath = `/tmp/statushd_output_${ts}.mp4`

      fs.writeFileSync(inputPath, buffer)

      let finalBuffer = null

      try {
        /*
          Setting khusus WhatsApp Status:
          - scale: max 720px lebar, tinggi menyesuaikan (tidak pecah)
          - libx264 + profile baseline: paling kompatibel dengan WA
          - pix_fmt yuv420p: WAJIB agar video mau diputar di WA
          - crf 23: kualitas bagus (makin kecil angka makin bagus, max 51)
          - movflags +faststart: agar video langsung bisa diputar
          - aac 128k: audio jernih
          - r 30: max 30fps
        */
        await runFfmpeg(
          `ffmpeg -y -i "${inputPath}" ` +
          `-vf "scale='min(720,iw)':-2:flags=lanczos" ` +
          `-c:v libx264 -profile:v baseline -level 3.1 ` +
          `-crf 23 -preset medium ` +
          `-pix_fmt yuv420p ` +
          `-movflags +faststart ` +
          `-r 30 ` +
          `-c:a aac -b:a 128k -ar 44100 ` +
          `"${outputPath}"`
        )

        const fileSize = getFileSize(outputPath)

        // Kalau masih > 15MB, compress lebih agresif
        if (fileSize > MAX_SIZE_BYTES) {
          const outputPath2 = `/tmp/statushd_output2_${ts}.mp4`
          await sock.sendMessage(from, { text: "📦 File terlalu besar, kompres ulang..." })

          await runFfmpeg(
            `ffmpeg -y -i "${outputPath}" ` +
            `-vf "scale='min(480,iw)':-2:flags=lanczos" ` +
            `-c:v libx264 -profile:v baseline -level 3.1 ` +
            `-crf 28 -preset fast ` +
            `-pix_fmt yuv420p ` +
            `-movflags +faststart ` +
            `-r 30 ` +
            `-c:a aac -b:a 96k -ar 44100 ` +
            `"${outputPath2}"`
          )

          if (fs.existsSync(outputPath2) && getFileSize(outputPath2) > 1000) {
            finalBuffer = fs.readFileSync(outputPath2)
          }

          if (fs.existsSync(outputPath2)) fs.unlinkSync(outputPath2)
        } else {
          if (fs.existsSync(outputPath) && fileSize > 1000) {
            finalBuffer = fs.readFileSync(outputPath)
          }
        }

      } catch (ffErr) {
        console.log("FFMPEG ERROR:", ffErr.message)
        // Fallback: kirim video asli
        finalBuffer = buffer
      }

      // CLEANUP
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)

      if (!finalBuffer || finalBuffer.length < 1000) {
        finalBuffer = buffer
      }

      const sizeMB = (finalBuffer.length / 1024 / 1024).toFixed(2)

      // ===== KIRIM KE USER =====
      await sock.sendMessage(from, {
        video: finalBuffer,
        caption: `✅ *Video siap untuk status WA!*\n\n📦 Ukuran: ${sizeMB} MB\n\n💡 Simpan video ini lalu upload manual ke status WA kamu`
      })

      // ===== COBA KIRIM KE STATUS WA (opsional) =====
      try {
        await sock.sendMessage("status@broadcast", {
          video: finalBuffer,
          caption: "",
          backgroundColor: "#000000"
        }, {
          statusJidList: [from]
        })
        await sock.sendMessage(from, { text: "📤 Video juga sudah dicoba upload ke status WA otomatis" })
      } catch (e) {
        console.log("Status broadcast gagal:", e.message)
        // Tidak masalah kalau gagal, user sudah dapat videonya
      }

    } catch (err) {
      console.log("STATUSHD ERROR:", err?.message || err)
      await sock.sendMessage(from, {
        text: "❌ Gagal memproses video\nCoba lagi atau kirim ulang videonya"
      })
    }
  }
}
