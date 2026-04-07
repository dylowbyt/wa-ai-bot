const axios = require("axios")

module.exports = {
  name: "spotify",
  alias: ["spotifydl"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.spotify judul lagu\n.spotify https://open.spotify.com/track/xxxxx"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🎵 Mencari di Spotify..." })

      let audioUrl = null
      let title = query

      try {
        const r1 = await axios.get(
          `https://api.fabdl.com/spotify/get?url=${encodeURIComponent(query)}`,
          { timeout: 15000 }
        )
        if (r1.data?.result) {
          title = r1.data.result.name || title
          const trackId = r1.data.result.id
          if (trackId) {
            const r2 = await axios.get(
              `https://api.fabdl.com/spotify/mp3-convert-task/${r1.data.result.gid}/${trackId}`,
              { timeout: 15000 }
            )
            audioUrl = r2.data?.result?.download_url
            if (audioUrl && !audioUrl.startsWith("http")) {
              audioUrl = `https://api.fabdl.com${audioUrl}`
            }
          }
        }
      } catch {}

      if (!audioUrl) {
        try {
          const r3 = await axios.get(
            `https://api.siputzx.my.id/api/dl/spotify?url=${encodeURIComponent(query)}`,
            { timeout: 15000 }
          )
          audioUrl = r3.data?.data?.url || r3.data?.data?.download
          title = r3.data?.data?.title || title
        } catch {}
      }

      if (!audioUrl) {
        return sock.sendMessage(from, {
          text: "❌ Gagal download Spotify\nServer API sedang down"
        })
      }

      await sock.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`
      })

    } catch (err) {
      console.log("SPOTIFY ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Error download Spotify" })
    }
  }
}
