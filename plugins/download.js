const axios = require("axios")

module.exports = {
  name: "dl",
  alias: ["download"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    // Gunakan args langsung (sudah di-parse oleh sistem plugin)
    const url = args.join(" ").trim()

    if (!url) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.dl https://tiktok.com/...\n.dl https://youtu.be/...\n.dl https://instagram.com/...\n.dl https://link.com/file.mp4"
      })
    }

    if (!isValidUrl(url)) {
      return sock.sendMessage(from, { text: "❌ Link tidak valid, pastikan diawali https://" })
    }

    await sock.sendMessage(from, { text: "⏳ Memproses link..." })

    // ===== CEK PLATFORM SOSMED =====
    const isTikTok = /tiktok\.com|vm\.tiktok|vt\.tiktok/i.test(url)
    const isYouTube = /youtube\.com|youtu\.be/i.test(url)
    const isInstagram = /instagram\.com/i.test(url)
    const isTwitter = /twitter\.com|x\.com/i.test(url)
    const isFacebook = /facebook\.com|fb\.watch/i.test(url)
    const isSosmed = isTikTok || isYouTube || isInstagram || isTwitter || isFacebook

    if (isSosmed) {
      const success = await trySosmedApis(sock, from, url)
      if (success) return
    }

    // Fallback: download langsung
    await handleDirectDownload(sock, from, url)
  }
}

// ===== COBA 5 API GRATIS SOSMED =====
async function trySosmedApis(sock, from, url) {
  const encoded = encodeURIComponent(url)

  // API 1: Cobalt (support YT, TikTok, Twitter, IG, dll)
  try {
    const res = await axios.post(
      "https://co.wuk.sh/api/json",
      { url, vQuality: "720", filenamePattern: "basic" },
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    )
    if (res.data?.url || res.data?.audio) {
      const dlUrl = res.data.url || res.data.audio
      const buffer = await downloadBuffer(dlUrl)
      if (buffer) {
        await sendByType(sock, from, buffer, dlUrl)
        return true
      }
    }
  } catch {}

  // API 2: siputzx.my.id
  try {
    const endpoints = [
      `https://api.siputzx.my.id/api/d/tiktok?url=${encoded}`,
      `https://api.siputzx.my.id/api/d/ytmp4?url=${encoded}`,
      `https://api.siputzx.my.id/api/d/igdl?url=${encoded}`,
      `https://api.siputzx.my.id/api/d/twitter?url=${encoded}`
    ]
    for (const ep of endpoints) {
      const res = await axios.get(ep, { timeout: 12000 })
      const dlUrl =
        res.data?.data?.url ||
        res.data?.data?.videoUrl ||
        res.data?.data?.high ||
        res.data?.data?.low ||
        res.data?.result?.url ||
        (Array.isArray(res.data?.data) && res.data?.data?.[0]?.url)
      if (dlUrl) {
        const buffer = await downloadBuffer(dlUrl)
        if (buffer) {
          await sendByType(sock, from, buffer, dlUrl)
          return true
        }
      }
    }
  } catch {}

  // API 3: ryzendesu.vip
  try {
    const ryzEndpoints = [
      `https://api.ryzendesu.vip/api/downloader/tiktok?url=${encoded}`,
      `https://api.ryzendesu.vip/api/downloader/igdl?url=${encoded}`,
      `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encoded}`
    ]
    for (const ep of ryzEndpoints) {
      const res = await axios.get(ep, { timeout: 12000 })
      const dlUrl =
        res.data?.data?.url ||
        res.data?.data?.video ||
        res.data?.data?.[0]?.url ||
        res.data?.result?.url
      if (dlUrl) {
        const buffer = await downloadBuffer(dlUrl)
        if (buffer) {
          await sendByType(sock, from, buffer, dlUrl)
          return true
        }
      }
    }
  } catch {}

  // API 4: agatz.xyz
  try {
    const agatzEndpoints = [
      `https://api.agatz.xyz/api/tiktok?url=${encoded}`,
      `https://api.agatz.xyz/api/instagram?url=${encoded}`,
      `https://api.agatz.xyz/api/youtube?url=${encoded}`
    ]
    for (const ep of agatzEndpoints) {
      const res = await axios.get(ep, { timeout: 12000 })
      const dlUrl =
        res.data?.data?.videoUrl ||
        res.data?.data?.url ||
        res.data?.data?.[0]?.url ||
        res.data?.result
      if (dlUrl && typeof dlUrl === "string") {
        const buffer = await downloadBuffer(dlUrl)
        if (buffer) {
          await sendByType(sock, from, buffer, dlUrl)
          return true
        }
      }
    }
  } catch {}

  // API 5: betabotz.eu.org
  try {
    const betaEndpoints = [
      `https://api.betabotz.eu.org/api/download/tiktok?url=${encoded}&apikey=beta`,
      `https://api.betabotz.eu.org/api/download/ytmp4?url=${encoded}&apikey=beta`,
      `https://api.betabotz.eu.org/api/download/ig?url=${encoded}&apikey=beta`
    ]
    for (const ep of betaEndpoints) {
      const res = await axios.get(ep, { timeout: 12000 })
      const dlUrl =
        res.data?.result?.url ||
        res.data?.result?.video ||
        res.data?.result?.videoUrl
      if (dlUrl) {
        const buffer = await downloadBuffer(dlUrl)
        if (buffer) {
          await sendByType(sock, from, buffer, dlUrl)
          return true
        }
      }
    }
  } catch {}

  // API 6: nexoracle.com
  try {
    const nxEndpoints = [
      `https://api.nexoracle.com/downloader/tiktok-no-wm?apikey=free&url=${encoded}`,
      `https://api.nexoracle.com/downloader/youtube-video?apikey=free&url=${encoded}`,
      `https://api.nexoracle.com/downloader/instagram?apikey=free&url=${encoded}`
    ]
    for (const ep of nxEndpoints) {
      const res = await axios.get(ep, { timeout: 12000 })
      const dlUrl =
        res.data?.result?.video ||
        res.data?.result?.url ||
        res.data?.result?.download_url
      if (dlUrl) {
        const buffer = await downloadBuffer(dlUrl)
        if (buffer) {
          await sendByType(sock, from, buffer, dlUrl)
          return true
        }
      }
    }
  } catch {}

  return false
}

// ===== DOWNLOAD LANGSUNG (untuk URL file biasa) =====
async function handleDirectDownload(sock, from, url) {
  try {
    const buffer = await downloadBuffer(url)
    if (!buffer) throw new Error("Buffer kosong")

    const fileName = url.split("/").pop().split("?")[0] || "file"
    await sendByType(sock, from, buffer, url, fileName)
  } catch (err) {
    console.log("DL ERROR:", err?.message)

    const errMsg =
      err?.response?.status === 403
        ? "❌ Link diblok (403 Forbidden)"
        : err?.code === "ECONNABORTED"
        ? "❌ Timeout — file terlalu besar atau server lambat"
        : "❌ Gagal download. Coba link lain."

    await sock.sendMessage(from, { text: errMsg })
  }
}

// ===== HELPER: Download ke Buffer =====
async function downloadBuffer(url) {
  try {
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
    if (buffer.length < 100) return null
    return buffer
  } catch {
    return null
  }
}

// ===== HELPER: Kirim berdasarkan tipe file =====
async function sendByType(sock, from, buffer, url, fileName) {
  const name = fileName || url.split("/").pop().split("?")[0] || "file"
  const hex = buffer.toString("hex", 0, 16)

  // JPEG
  if (hex.startsWith("ffd8ff")) {
    return sock.sendMessage(from, { image: buffer, caption: `🖼️ ${name}` })
  }
  // PNG
  if (hex.startsWith("89504e47")) {
    return sock.sendMessage(from, { image: buffer, caption: `🖼️ ${name}` })
  }
  // WebP
  if (hex.startsWith("52494646") && buffer.toString("ascii", 8, 12) === "WEBP") {
    return sock.sendMessage(from, { image: buffer, mimetype: "image/webp", caption: `🖼️ ${name}` })
  }
  // GIF
  if (hex.startsWith("47494638")) {
    return sock.sendMessage(from, { video: buffer, gifPlayback: true, caption: `🎞️ ${name}` })
  }
  // MP4 / MKV / video
  if (hex.includes("66747970") || hex.startsWith("1a45dfa3")) {
    return sock.sendMessage(from, { video: buffer, caption: `🎥 ${name}` })
  }
  // MP3 / audio
  if (hex.startsWith("494433") || hex.startsWith("fffb") || hex.startsWith("fff3")) {
    return sock.sendMessage(from, { audio: buffer, mimetype: "audio/mpeg" })
  }

  // Fallback dari ekstensi URL
  const ext = name.split(".").pop()?.toLowerCase()
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return sock.sendMessage(from, { image: buffer, caption: name })
  }
  if (["mp4", "mkv", "mov", "avi"].includes(ext)) {
    return sock.sendMessage(from, { video: buffer, caption: name })
  }
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) {
    return sock.sendMessage(from, { audio: buffer, mimetype: "audio/mpeg" })
  }

  // Kirim sebagai dokumen
  await sock.sendMessage(from, {
    document: buffer,
    mimetype: "application/octet-stream",
    fileName: name
  })
}

function isValidUrl(string) {
  try {
    const u = new URL(string)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}
