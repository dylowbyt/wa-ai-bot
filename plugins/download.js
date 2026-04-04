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

async function handleDownload(sock, from, url) {
  try {
    await sock.sendMessage(from, { text: "⏳ Processing link..." })

    if (!isValidUrl(url)) {
      return sock.sendMessage(from, { text: "❌ Link tidak valid" })
    }

    // ===== FORCE DOWNLOAD =====
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      },
      maxRedirects: 5,
      timeout: 30000
    })

    const buffer = Buffer.from(res.data)
    const contentType = res.headers["content-type"] || ""

    // ===== DETEKSI DARI HEADER
    if (contentType.includes("image")) {
      return sock.sendMessage(from, {
        image: buffer,
        caption: "🖼️ Image downloaded"
      })
    }

    if (contentType.includes("video")) {
      return sock.sendMessage(from, {
        video: buffer,
        caption: "🎥 Video downloaded"
      })
    }

    if (contentType.includes("audio")) {
      return sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mpeg"
      })
    }

    // ===== DETEKSI DARI SIGNATURE (MAGIC BYTE)
    const hex = buffer.toString("hex", 0, 12)

    // JPG
    if (hex.startsWith("ffd8ff")) {
      return sock.sendMessage(from, {
        image: buffer,
        caption: "🖼️ Image"
      })
    }

    // PNG
    if (hex.startsWith("89504e47")) {
      return sock.sendMessage(from, {
        image: buffer,
        caption: "🖼️ Image"
      })
    }

    // MP4
    if (hex.includes("66747970")) {
      return sock.sendMessage(from, {
        video: buffer,
        caption: "🎥 Video"
      })
    }

    // MP3
    if (hex.startsWith("494433") || hex.startsWith("fff")) {
      return sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mpeg"
      })
    }

    // ===== FALLBACK EXTENSION
    if (url.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return sock.sendMessage(from, {
        image: buffer
      })
    }

    if (url.match(/\.(mp4|mkv|mov)$/i)) {
      return sock.sendMessage(from, {
        video: buffer
      })
    }

    if (url.match(/\.(mp3|wav|ogg)$/i)) {
      return sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mpeg"
      })
    }

    // ===== LAST (JARANG BANGET KE SINI)
    return sock.sendMessage(from, {
      document: buffer,
      mimetype: contentType || "application/octet-stream",
      fileName: "unknown.bin"
    })

  } catch (err) {
    console.log("DL ERROR:", err)

    await sock.sendMessage(from, {
      text: "❌ Gagal download link"
    })
  }
}

function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}
