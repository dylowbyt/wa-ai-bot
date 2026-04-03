const axios = require("axios")

module.exports = {
  name: "dl",
  alias: ["download"],

  async run(sock, m) {
    const from = m.key.remoteJid

    let text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text

    const url = text.replace(/^(\.dl|\.download)\s*/, "").trim()

    if (!url) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.dl https://link.com"
      })
    }

    await handleDownload(sock, from, url)
  }
}

// ===== MAIN HANDLER =====
async function handleDownload(sock, from, url) {
  try {
    await sock.sendMessage(from, {
      text: "⏳ Processing link..."
    })

    if (!isValidUrl(url)) {
      return sock.sendMessage(from, {
        text: "❌ Link tidak valid"
      })
    }

    // ===== TIKTOK =====
    if (url.includes("tiktok.com")) {
      try {
        const api = `https://api.tiklydown.eu.org/api/download?url=${url}`
        const res = await axios.get(api)

        const video = res.data.video?.noWatermark

        if (video) {
          return await sock.sendMessage(from, {
            video: { url: video },
            caption: "🎵 TikTok HD"
          })
        }
      } catch {}
    }

    // ===== INSTAGRAM =====
    if (url.includes("instagram.com")) {
      try {
        const api = `https://api.vreden.my.id/api/igdl?url=${url}`
        const res = await axios.get(api)

        const media = res.data.result?.[0]?.url

        if (media) {
          return await sock.sendMessage(from, {
            video: { url: media },
            caption: "📸 Instagram"
          })
        }
      } catch {}
    }

    // ===== YOUTUBE =====
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      try {
        const api = `https://api.dlmp3.xyz/api/download?url=${url}`
        const res = await axios.get(api)

        const audio = res.data.download

        if (audio) {
          return await sock.sendMessage(from, {
            audio: { url: audio },
            mimetype: "audio/mpeg"
          })
        }
      } catch {}
    }

    // ===== SMART DIRECT DOWNLOAD (FIX PDF BUG) =====
    try {
      const head = await axios.head(url)
      const contentType = head.headers["content-type"] || ""

      // IMAGE
      if (
        contentType.startsWith("image") ||
        url.match(/\.(jpg|jpeg|png|webp)$/i)
      ) {
        return await sock.sendMessage(from, {
          image: { url },
          caption: "🖼️ Image downloaded"
        })
      }

      // VIDEO
      if (
        contentType.startsWith("video") ||
        url.match(/\.(mp4|mkv|mov)$/i)
      ) {
        return await sock.sendMessage(from, {
          video: { url },
          caption: "🎥 Video downloaded"
        })
      }

      // AUDIO
      if (
        contentType.startsWith("audio") ||
        url.match(/\.(mp3|wav|ogg)$/i)
      ) {
        return await sock.sendMessage(from, {
          audio: { url },
          mimetype: "audio/mpeg"
        })
      }

      // FALLBACK FILE
      return await sock.sendMessage(from, {
        document: { url },
        mimetype: "application/octet-stream",
        fileName: "download.file"
      })

    } catch {
      return await sock.sendMessage(from, {
        document: { url },
        mimetype: "application/octet-stream",
        fileName: "download.file"
      })
    }

  } catch (err) {
    console.log("DL ERROR:", err)

    await sock.sendMessage(from, {
      text: "❌ Gagal download link"
    })
  }
}

// ===== VALIDATOR =====
function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}
