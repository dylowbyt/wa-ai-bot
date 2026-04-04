const axios = require("axios")

module.exports = {
  name: "dl",
  alias: ["download"],

  async run(sock, m) {
    const from = m.key.remoteJid

    // ===== FIX: null check untuk text =====
    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""

    const url = text.replace(/^\.(dl|download)\s*/i, "").trim()

    if (!url) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.dl https://link.com/file.mp4\n.dl https://link.com/gambar.jpg"
      })
    }

    if (!isValidUrl(url)) {
      return sock.sendMessage(from, { text: "❌ Link tidak valid, pastikan diawali https://" })
    }

    await handleDownload(sock, from, url)
  }
}

async function handleDownload(sock, from, url) {
  try {
    await sock.sendMessage(from, { text: "⏳ Mengunduh file..." })

    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*"
      },
      maxRedirects: 5,
      timeout: 60000
    })

    const buffer = Buffer.from(res.data)
    const contentType = res.headers["content-type"] || ""

    // Ambil nama file dari URL atau header
    const disposition = res.headers["content-disposition"] || ""
    const nameMatch = disposition.match(/filename="?([^";\n]+)"?/)
    const fileName = nameMatch
      ? nameMatch[1]
      : url.split("/").pop().split("?")[0] || "downloaded_file"

    // ===== CEK CONTENT-TYPE =====
    if (contentType.includes("image")) {
      return sock.sendMessage(from, {
        image: buffer,
        caption: `🖼️ ${fileName}`
      })
    }

    if (contentType.includes("video")) {
      return sock.sendMessage(from, {
        video: buffer,
        caption: `🎥 ${fileName}`
      })
    }

    if (contentType.includes("audio")) {
      return sock.sendMessage(from, {
        audio: buffer,
        mimetype: contentType.includes("ogg") ? "audio/ogg; codecs=opus" : "audio/mpeg",
        ptt: contentType.includes("ogg")
      })
    }

    // ===== CEK MAGIC BYTES (lebih reliable) =====
    const hex = buffer.toString("hex", 0, 16)

    // JPEG
    if (hex.startsWith("ffd8ff")) {
      return sock.sendMessage(from, {
        image: buffer,
        caption: `🖼️ ${fileName}`
      })
    }

    // PNG
    if (hex.startsWith("89504e47")) {
      return sock.sendMessage(from, {
        image: buffer,
        caption: `🖼️ ${fileName}`
      })
    }

    // WebP
    if (hex.startsWith("52494646") && buffer.toString("ascii", 8, 12) === "WEBP") {
      return sock.sendMessage(from, {
        image: buffer,
        mimetype: "image/webp",
        caption: `🖼️ ${fileName}`
      })
    }

    // MP4 / MKV / MOV (ftyp box)
    if (hex.includes("66747970") || hex.startsWith("1a45dfa3")) {
      return sock.sendMessage(from, {
        video: buffer,
        caption: `🎥 ${fileName}`
      })
    }

    // MP3
    if (hex.startsWith("494433") || hex.startsWith("fffb") || hex.startsWith("fff3")) {
      return sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mpeg"
      })
    }

    // GIF
    if (hex.startsWith("47494638")) {
      return sock.sendMessage(from, {
        video: buffer,
        gifPlayback: true,
        caption: `🎞️ ${fileName}`
      })
    }

    // ===== FALLBACK DARI EKSTENSI URL =====
    const ext = fileName.split(".").pop()?.toLowerCase()

    if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
      return sock.sendMessage(from, { image: buffer, caption: fileName })
    }
    if (["mp4", "mkv", "mov", "avi"].includes(ext)) {
      return sock.sendMessage(from, { video: buffer, caption: fileName })
    }
    if (["mp3", "wav", "ogg", "m4a"].includes(ext)) {
      return sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mpeg"
      })
    }

    // ===== KIRIM SEBAGAI DOKUMEN =====
    await sock.sendMessage(from, {
      document: buffer,
      mimetype: contentType || "application/octet-stream",
      fileName
    })

  } catch (err) {
    console.log("DL ERROR:", err?.message)

    const errMsg = err?.response?.status === 403
      ? "❌ Link diblok (403 Forbidden)"
      : err?.code === "ECONNABORTED"
      ? "❌ Timeout — file terlalu besar atau server lambat"
      : "❌ Gagal download link"

    await sock.sendMessage(from, { text: errMsg })
  }
}

function isValidUrl(string) {
  try {
    const u = new URL(string)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}
