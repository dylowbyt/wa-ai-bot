const axios = require("axios")

const RAPIDAPI_KEY = "c0c4506840msh0c2e5468f11345ep10d8c0jsnb3a976a9c6f0"
const RAPIDAPI_HOST = "allmedia-downloader.p.rapidapi.com"

module.exports = {
  name: "dl2",
  alias: ["dlmedia", "download2", "unduh", "save"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const url = args[0]

    if (!url) {
      return sock.sendMessage(from, {
        text: `📥 *DOWNLOAD ALL MEDIA*

Format: .dl2 <link>

Platform yang didukung:
• Instagram (post, reel, story)
• TikTok
• Facebook
• Twitter / X
• YouTube
• Pinterest
• Snapchat
• LinkedIn
• Reddit
• Dan banyak lagi!

Contoh:
.dl2 https://www.instagram.com/p/ABC123/
.dl2 https://www.tiktok.com/@user/video/123
.dl2 https://twitter.com/user/status/123`
      })
    }

    if (!url.startsWith("http")) {
      return sock.sendMessage(from, { text: "❌ Masukkan URL yang valid (dimulai dengan https://)" })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Memproses link, harap tunggu..." })

      const res = await axios.get(
        `https://${RAPIDAPI_HOST}/`,
        {
          params: { url },
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Host": RAPIDAPI_HOST,
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY
          },
          timeout: 30000
        }
      )

      const data = res.data

      if (!data) {
        return sock.sendMessage(from, { text: "❌ Gagal memproses link. Pastikan URL benar dan konten tersedia." })
      }

      const medias = data.medias || data.media || data.data?.medias || data.data?.media || data.result || []
      const title = data.title || data.data?.title || data.caption || ""
      const thumb = data.thumbnail || data.data?.thumbnail || data.cover || ""

      if (!medias || (Array.isArray(medias) && medias.length === 0)) {
        return sock.sendMessage(from, {
          text: `❌ Tidak ada media ditemukan.\n\nResponse: ${JSON.stringify(data).slice(0, 200)}`
        })
      }

      const mediaList = Array.isArray(medias) ? medias : [medias]

      if (title) {
        await sock.sendMessage(from, {
          text: `📥 *Ditemukan ${mediaList.length} media*\n${title ? `📝 ${title.slice(0, 100)}` : ""}`
        })
      }

      let sent = 0
      for (const item of mediaList.slice(0, 5)) {
        const mediaUrl = item.url || item.link || item.src || item.download_url || (typeof item === "string" ? item : null)
        const quality = item.quality || item.resolution || item.type || "default"

        if (!mediaUrl) continue

        try {
          const mediaRes = await axios.get(mediaUrl, {
            responseType: "arraybuffer",
            timeout: 30000,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            maxContentLength: 50 * 1024 * 1024
          })

          const buffer = Buffer.from(mediaRes.data)
          const contentType = mediaRes.headers["content-type"] || ""

          if (contentType.includes("video") || mediaUrl.match(/\.(mp4|webm|mov|avi)/i)) {
            await sock.sendMessage(from, {
              video: buffer,
              caption: `🎥 ${quality ? `[${quality}]` : ""} ${sent + 1}/${Math.min(mediaList.length, 5)}`
            })
          } else if (contentType.includes("image") || mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
            await sock.sendMessage(from, {
              image: buffer,
              caption: `🖼️ ${quality ? `[${quality}]` : ""} ${sent + 1}/${Math.min(mediaList.length, 5)}`
            })
          } else if (contentType.includes("audio") || mediaUrl.match(/\.(mp3|m4a|ogg|wav)/i)) {
            await sock.sendMessage(from, {
              audio: buffer,
              mimetype: "audio/mp4",
              ptt: false
            })
          } else {
            await sock.sendMessage(from, {
              document: buffer,
              fileName: `media_${sent + 1}.${contentType.split("/")[1] || "bin"}`,
              mimetype: contentType || "application/octet-stream",
              caption: `📄 ${sent + 1}/${Math.min(mediaList.length, 5)}`
            })
          }

          sent++
          await new Promise(r => setTimeout(r, 1000))
        } catch (dlErr) {
          await sock.sendMessage(from, {
            text: `⚠️ Gagal download media ${sent + 1}:\n🔗 ${mediaUrl.slice(0, 100)}\n\nCoba buka link ini langsung.`
          })
        }
      }

      if (sent === 0) {
        const links = mediaList
          .slice(0, 5)
          .map((item, i) => {
            const u = item.url || item.link || item.src || (typeof item === "string" ? item : null)
            return u ? `${i + 1}. ${u}` : null
          })
          .filter(Boolean)
          .join("\n")

        await sock.sendMessage(from, {
          text: `📥 *Link Download Langsung:*\n${links || "Tidak tersedia"}`
        })
      } else if (mediaList.length > 5) {
        await sock.sendMessage(from, {
          text: `ℹ️ Hanya mengirim 5 media pertama dari ${mediaList.length} yang tersedia.`
        })
      }

    } catch (err) {
      if (err.response?.status === 429) {
        return sock.sendMessage(from, { text: "❌ Limit API tercapai. Coba lagi nanti." })
      }
      if (err.response?.status === 401 || err.response?.status === 403) {
        return sock.sendMessage(from, { text: "❌ API key tidak valid atau tidak aktif." })
      }
      if (err.response?.status === 404) {
        return sock.sendMessage(from, { text: "❌ Media tidak ditemukan. Pastikan link benar dan konten masih tersedia." })
      }
      await sock.sendMessage(from, {
        text: `❌ Gagal download: ${err.message || "Unknown error"}\n\nPastikan:\n• Link valid & dapat diakses\n• Konten tidak private/terkunci\n• Coba lagi beberapa saat`
      })
    }
  }
}
