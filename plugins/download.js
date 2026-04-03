const axios = require("axios")

module.exports = {
  name: "dl",
  alias: ["download"],

  async run(sock, m) {
    const from = m.key.remoteJid

    let text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text

    const url = text.replace(/^\.dl|\.download/, "").trim()

    if (!url) {
      return sock.sendMessage(from, {
        text: "⚠️ Masukkan link"
      })
    }

    await handleDownload(sock, from, url)
  }
}

// 🔥 AUTO DETECT (dipakai juga buat AI nanti)
async function handleDownload(sock, from, url) {
  try {
    await sock.sendMessage(from, {
      text: "⏳ Processing link..."
    })

    // ===== FILE DIRECT (pdf, mp4, dll) =====
    if (url.match(/\.(mp4|mp3|jpg|png|pdf|zip|docx?)$/i)) {
      return await sock.sendMessage(from, {
        document: { url },
        fileName: "file"
      })
    }

    // ===== TIKTOK =====
    if (url.includes("tiktok.com")) {
      const api = `https://api.tiklydown.eu.org/api/download?url=${url}`
      const res = await axios.get(api)

      const video = res.data.video?.noWatermark

      if (!video) throw "TT ERROR"

      return await sock.sendMessage(from, {
        video: { url: video },
        caption: "🎵 TikTok downloaded"
      })
    }

    // ===== INSTAGRAM =====
    if (url.includes("instagram.com")) {
      const api = `https://api.vreden.my.id/api/igdl?url=${url}`
      const res = await axios.get(api)

      const media = res.data.result?.[0]?.url

      if (!media) throw "IG ERROR"

      return await sock.sendMessage(from, {
        video: { url: media },
        caption: "📸 Instagram downloaded"
      })
    }

    // ===== YOUTUBE =====
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const api = `https://api.dlmp3.xyz/api/download?url=${url}`
      const res = await axios.get(api)

      const audio = res.data.download

      if (!audio) throw "YT ERROR"

      return await sock.sendMessage(from, {
        audio: { url: audio },
        mimetype: "audio/mpeg"
      })
    }

    // ===== FALLBACK (Coba kirim sebagai file) =====
    return await sock.sendMessage(from, {
      document: { url },
      fileName: "download"
    })

  } catch (err) {
    console.log("DL ERROR:", err)

    await sock.sendMessage(from, {
      text: "❌ Gagal download link"
    })
  }
}
