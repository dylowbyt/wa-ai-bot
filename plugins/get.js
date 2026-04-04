const axios = require("axios")

module.exports = {
  name: "get",
  alias: ["searchdl"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.get config pubg"
      })
    }

    try {
      await sock.sendMessage(from, {
        text: "🔎 Mencari link download..."
      })

      // ===== FIX: Gunakan DuckDuckGo dengan header browser agar tidak diblok =====
      const res = await axios.get(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + " download")}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "id-ID,id;q=0.9,en;q=0.8"
          },
          timeout: 15000
        }
      )

      const html = res.data

      // ===== FIX: Perbaiki regex agar cocok dengan format DuckDuckGo terbaru =====
      const rawLinks = [
        ...(html.matchAll(/uddg=(https[^&"]+)/g) || []),
        ...(html.matchAll(/href="(https:\/\/(?:www\.)?(?:mediafire|drive\.google|mega\.nz|dropbox|1fichier)[^"]+)"/g) || [])
      ].map(v => {
        try { return decodeURIComponent(v[1]) } catch { return v[1] }
      })

      const allowedSites = [
        "mediafire.com",
        "drive.google.com",
        "mega.nz",
        "1fichier.com",
        "dropbox.com"
      ]

      const candidates = [...new Set(rawLinks)]
        .filter(link => allowedSites.some(site => link.includes(site)))
        .slice(0, 5)

      if (!candidates.length) {
        return sock.sendMessage(from, {
          text: `❌ Tidak ada link download ditemukan untuk:\n*${query}*\n\nCoba kata kunci yang lebih spesifik`
        })
      }

      await sock.sendMessage(from, {
        text: `✅ ${candidates.length} link ditemukan, mencoba download...`
      })

      for (let i = 0; i < candidates.length; i++) {
        const url = candidates[i]

        try {
          await sock.sendMessage(from, {
            text: `⏳ Mencoba (${i + 1}/${candidates.length})\n${url}`
          })

          const direct = await bypass(url)
          const ok = await download(sock, from, direct)

          if (ok) {
            await sock.sendMessage(from, {
              text: "✅ Berhasil download!"
            })
            return
          }

        } catch (e) {
          console.log("GET bypass error:", e?.message)
        }
      }

      // Kalau semua gagal download, kirim daftar linknya saja
      const linkList = candidates.map((l, i) => `${i + 1}. ${l}`).join("\n")
      await sock.sendMessage(from, {
        text: `⚠️ Tidak bisa auto-download, ini linknya:\n\n${linkList}`
      })

    } catch (err) {
      console.log("GET ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal mencari link" })
    }
  }
}

// ================= BYPASS =================
async function bypass(url) {
  // ===== MEDIAFIRE
  if (url.includes("mediafire.com")) {
    try {
      const res = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 10000
      })
      const match = res.data.match(/href="(https:\/\/download[^"]+mediafire[^"]+)"/)
      if (match) return match[1]
    } catch {}
  }

  // ===== GOOGLE DRIVE
  if (url.includes("drive.google.com")) {
    const idMatch = url.match(/\/d\/(.*?)\//)
    if (idMatch) {
      return `https://drive.google.com/uc?export=download&id=${idMatch[1]}&confirm=t`
    }
  }

  return url
}

// ================= DOWNLOAD =================
async function download(sock, from, url) {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
      maxRedirects: 5,
      timeout: 45000
    })

    const buffer = Buffer.from(res.data)
    const type = res.headers["content-type"] || ""

    if (type.includes("image")) {
      await sock.sendMessage(from, { image: buffer })
      return true
    }

    if (type.includes("video")) {
      await sock.sendMessage(from, { video: buffer })
      return true
    }

    if (type.includes("audio")) {
      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mpeg"
      })
      return true
    }

    if (type.includes("html") || type.includes("text")) {
      return false // Bukan file, mungkin halaman web
    }

    // Ambil nama file dari URL
    const fileName = url.split("/").pop().split("?")[0] || "downloaded_file"

    await sock.sendMessage(from, {
      document: buffer,
      fileName,
      mimetype: type || "application/octet-stream"
    })

    return true

  } catch {
    return false
  }
}
