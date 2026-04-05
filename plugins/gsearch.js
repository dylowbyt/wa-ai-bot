const axios = require("axios")
const path = require("path")
const fs = require("fs")

const RAPIDAPI_KEY = "c0c4506840msh0c2e5468f11345ep10d8c0jsnb3a976a9c6f0"
const LAST_RESULTS = {}

module.exports = {
  name: "gsearch",
  alias: ["gs", "cari", "search", "googling", "google"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    if (!args.length) {
      return sock.sendMessage(from, {
        text: `🔍 *GOOGLE SEARCH + AUTO DOWNLOAD*
━━━━━━━━━━━━━━━
Format: .gsearch <kata kunci>

Contoh:
• .gsearch download lagu Ed Sheeran mp3
• .gsearch download film Avengers mkv
• .gsearch download ebook python pdf

Setelah hasil muncul, ketik:
• .gsearch dl 1  ← download hasil nomor 1
• .gsearch dl 2  ← download hasil nomor 2`
      })
    }

    if (args[0]?.toLowerCase() === "dl") {
      const num = parseInt(args[1]) - 1
      const saved = LAST_RESULTS[from]
      if (!saved || !saved[num]) {
        return sock.sendMessage(from, {
          text: "❌ Tidak ada hasil tersimpan. Lakukan pencarian dulu.\nContoh: .gsearch download lagu mp3"
        })
      }
      return await downloadAndSend(sock, m, from, saved[num])
    }

    const query = args.join(" ")

    try {
      await sock.sendMessage(from, { text: `🔍 Mencari: *"${query}"*...` })

      let results = []

      try {
        const res = await axios.get(
          `https://google-search3.p.rapidapi.com/api/v1/search/q=${encodeURIComponent(query)}&num=8`,
          {
            headers: {
              "x-rapidapi-host": "google-search3.p.rapidapi.com",
              "x-rapidapi-key": RAPIDAPI_KEY
            },
            timeout: 15000
          }
        )
        results = res.data?.results || []
      } catch {
        const res2 = await axios.get(
          "https://real-time-web-search.p.rapidapi.com/search",
          {
            params: { q: query, limit: 8 },
            headers: {
              "x-rapidapi-host": "real-time-web-search.p.rapidapi.com",
              "x-rapidapi-key": RAPIDAPI_KEY
            },
            timeout: 15000
          }
        )
        const raw = res2.data?.data || res2.data?.results || []
        results = raw.map(r => ({
          title: r.title,
          link: r.url || r.link,
          description: r.snippet || r.body || ""
        }))
      }

      if (!results.length) {
        return sock.sendMessage(from, {
          text: `❌ Tidak ada hasil untuk: "${query}"\n\nCoba kata kunci lain.`
        })
      }

      LAST_RESULTS[from] = results.slice(0, 8).map(r => ({
        title: r.title || "Untitled",
        url: r.link || r.url || ""
      }))

      let text = `🔍 *HASIL: "${query}"*\n━━━━━━━━━━━━\n`

      LAST_RESULTS[from].forEach((item, i) => {
        const r = results[i]
        const snippet = (r.description || r.snippet || "").slice(0, 80)
        const isFile = item.url.match(/\.(mp3|mp4|mkv|avi|zip|pdf|m4a|flac|wav|ogg|mov|apk)(\?.*)?$/i)
        const tag = isFile ? " 📥" : ""

        text += `\n*${i + 1}.${tag} ${item.title?.slice(0, 60)}*\n`
        if (snippet) text += `   ${snippet}...\n`
        text += `   🔗 ${item.url?.slice(0, 80)}\n`
      })

      const hasFile = LAST_RESULTS[from].some(r =>
        r.url.match(/\.(mp3|mp4|mkv|avi|zip|pdf|m4a|flac|wav|ogg|mov|apk)(\?.*)?$/i)
      )

      text += `\n━━━━━━━━━━━━`
      if (hasFile) {
        text += `\n📥 Ketik *.gsearch dl <nomor>* untuk download`
      } else {
        text += `\n💡 Ketik *.gsearch dl <nomor>* untuk coba download link`
      }

      await sock.sendMessage(from, { text })

      const autoTarget = LAST_RESULTS[from].find(r =>
        r.url.match(/\.(mp3|mp4|mkv|avi|m4a|flac|wav|ogg)(\?.*)?$/i)
      )
      if (autoTarget) {
        await sock.sendMessage(from, { text: `⚡ Auto-download: *${autoTarget.title?.slice(0, 50)}*...` })
        await downloadAndSend(sock, m, from, autoTarget)
      }

    } catch (err) {
      if (err.response?.status === 429) {
        return sock.sendMessage(from, { text: "❌ Limit API habis. Coba lagi nanti." })
      }
      await sock.sendMessage(from, {
        text: `❌ Gagal mencari. ${err.message?.slice(0, 100)}`
      })
    }
  }
}

async function downloadAndSend(sock, m, from, item) {
  const { title, url } = item

  if (!url) {
    return sock.sendMessage(from, { text: "❌ URL tidak tersedia." })
  }

  const ext = (url.match(/\.(mp3|mp4|mkv|avi|m4a|flac|wav|ogg|mov|pdf|zip|apk)(\?.*)?$/i) || [])[1]?.toLowerCase()

  try {
    const head = await axios.head(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*"
      },
      maxRedirects: 5
    })

    const contentLength = parseInt(head.headers["content-length"] || "0")
    const contentType = head.headers["content-type"] || ""
    const sizeMB = contentLength / (1024 * 1024)

    if (contentLength > 0 && sizeMB > 50) {
      return sock.sendMessage(from, {
        text: `📦 *${title?.slice(0, 60)}*\n\n⚠️ Ukuran file: ${sizeMB.toFixed(1)} MB (terlalu besar untuk dikirim)\n\n🔗 *Link download langsung:*\n${url}`
      })
    }

    if (contentLength === 0 && !contentType.match(/audio|video|pdf|zip|octet/)) {
      return sock.sendMessage(from, {
        text: `🔗 *${title?.slice(0, 60)}*\n\nLink: ${url}`
      })
    }

    await sock.sendMessage(from, {
      text: `⬇️ Mendownload... ${sizeMB > 0 ? `(${sizeMB.toFixed(1)} MB)` : ""}`
    })

    const dlRes = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 120000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*"
      },
      maxContentLength: 50 * 1024 * 1024,
      maxRedirects: 5
    })

    const buffer = Buffer.from(dlRes.data)
    const actualSize = buffer.length / (1024 * 1024)
    const finalType = dlRes.headers["content-type"] || contentType

    if (actualSize > 50) {
      return sock.sendMessage(from, {
        text: `⚠️ File terlalu besar (${actualSize.toFixed(1)} MB) setelah download.\n\n🔗 ${url}`
      })
    }

    const cleanName = (title?.slice(0, 40) || "file").replace(/[^a-zA-Z0-9 _-]/g, "_")

    if (finalType.includes("audio") || ["mp3", "m4a", "flac", "wav", "ogg"].includes(ext)) {
      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mp4",
        ptt: false
      })
      await sock.sendMessage(from, { text: `🎵 *${title?.slice(0, 60)}*\n📦 ${actualSize.toFixed(1)} MB` })
    } else if (finalType.includes("video") || ["mp4", "mkv", "avi", "mov"].includes(ext)) {
      await sock.sendMessage(from, {
        video: buffer,
        caption: `🎬 ${title?.slice(0, 60)}\n📦 ${actualSize.toFixed(1)} MB`
      })
    } else if (finalType.includes("pdf") || ext === "pdf") {
      await sock.sendMessage(from, {
        document: buffer,
        fileName: cleanName + ".pdf",
        mimetype: "application/pdf",
        caption: `📄 ${title?.slice(0, 60)}\n📦 ${actualSize.toFixed(1)} MB`
      })
    } else {
      await sock.sendMessage(from, {
        document: buffer,
        fileName: cleanName + (ext ? "." + ext : ".bin"),
        mimetype: finalType || "application/octet-stream",
        caption: `📦 ${title?.slice(0, 60)}\n${actualSize.toFixed(1)} MB`
      })
    }

  } catch (err) {
    if (err.response?.status === 403) {
      return sock.sendMessage(from, {
        text: `🔒 Akses ditolak oleh server.\n\n🔗 Buka manual:\n${url}`
      })
    }
    if (err.message?.includes("maxContentLength")) {
      return sock.sendMessage(from, {
        text: `⚠️ File melebihi 50 MB.\n\n🔗 Download langsung:\n${url}`
      })
    }
    await sock.sendMessage(from, {
      text: `❌ Gagal download.\n\n🔗 Link manual:\n${url}`
    })
  }
}
