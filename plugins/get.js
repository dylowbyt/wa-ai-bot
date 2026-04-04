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
        text: "🔎 Mencari link..."
      })

      // ===== SEARCH
      const res = await axios.get(
        `https://duckduckgo.com/html/?q=${encodeURIComponent(query + " download")}`
      )

      const html = res.data

      const links = [...html.matchAll(/uddg=(https[^&"]+)/g)]
        .map(v => decodeURIComponent(v[1]))

      const allowedSites = [
        "mediafire",
        "drive.google",
        "mega.nz",
        "1file",
        "dropbox"
      ]

      const candidates = links.filter(link =>
        allowedSites.some(site => link.includes(site))
      ).slice(0, 5)

      if (!candidates.length) {
        return sock.sendMessage(from, {
          text: "❌ Tidak ada link valid"
        })
      }

      await sock.sendMessage(from, {
        text: `✅ ${candidates.length} link ditemukan, mencoba...`
      })

      for (let i = 0; i < candidates.length; i++) {
        const url = candidates[i]

        try {
          await sock.sendMessage(from, {
            text: `⏳ (${i + 1}/${candidates.length})\n${url}`
          })

          const direct = await bypass(url)

          const ok = await download(sock, from, direct)

          if (ok) {
            await sock.sendMessage(from, {
              text: "✅ Berhasil download!"
            })
            return
          }

        } catch (e) {}
      }

      await sock.sendMessage(from, {
        text: "❌ Semua link gagal"
      })

    } catch (err) {
      console.log(err)
      sock.sendMessage(from, { text: "❌ Error" })
    }
  }
}

// ================= BYPASS =================
async function bypass(url) {
  // ===== MEDIAFIRE
  if (url.includes("mediafire")) {
    const res = await axios.get(url)
    const match = res.data.match(/href="(https:\/\/download[^"]+)"/)
    if (match) return match[1]
  }

  // ===== GOOGLE DRIVE
  if (url.includes("drive.google")) {
    const idMatch = url.match(/\/d\/(.*?)\//)
    if (idMatch) {
      return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`
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
      timeout: 30000
    })

    const buffer = Buffer.from(res.data)
    const type = res.headers["content-type"] || ""

    // IMAGE
    if (type.includes("image")) {
      await sock.sendMessage(from, { image: buffer })
      return true
    }

    // VIDEO
    if (type.includes("video")) {
      await sock.sendMessage(from, { video: buffer })
      return true
    }

    // AUDIO
    if (type.includes("audio")) {
      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mpeg"
      })
      return true
    }

    // FILE
    await sock.sendMessage(from, {
      document: buffer,
      fileName: "downloaded_file"
    })

    return true

  } catch {
    return false
  }
}
