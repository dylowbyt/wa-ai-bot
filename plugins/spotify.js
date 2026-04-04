const axios = require("axios")

module.exports = {
  name: "spotify",
  alias: ["cariLagu", "trackInfo", "musikinfo"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      return sock.sendMessage(from, {
        text: "🎵 Contoh:\n.spotify Shape of You\n.spotify Kangen Band Biarkan"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🎵 Mencari info lagu..." })

      const res = await axios.get(
        `https://api.siputzx.my.id/api/music/spotify?query=${encodeURIComponent(query)}`,
        { timeout: 12000 }
      )

      const data = res.data?.data?.[0] || res.data?.data
      if (!data) {
        const res2 = await axios.get(
          `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`,
          { timeout: 10000 }
        )
        const track = res2.data?.results?.[0]
        if (!track) return sock.sendMessage(from, { text: `❌ Lagu *${query}* tidak ditemukan.` })

        return sock.sendMessage(from, {
          text: `🎵 *INFO LAGU*
━━━━━━━━━━━━━━━
🎶 Judul: ${track.trackName}
🎤 Artis: ${track.artistName}
💿 Album: ${track.collectionName}
📅 Rilis: ${track.releaseDate?.slice(0, 10)}
🎸 Genre: ${track.primaryGenreName}
⏱️ Durasi: ${Math.floor(track.trackTimeMillis / 60000)}:${String(Math.floor((track.trackTimeMillis % 60000) / 1000)).padStart(2, "0")}
🍎 iTunes: ${track.trackViewUrl}`
        })
      }

      await sock.sendMessage(from, {
        text: `🎵 *INFO LAGU*
━━━━━━━━━━━━━━━
🎶 Judul: ${data.name || data.title || query}
🎤 Artis: ${data.artist || data.artists || "N/A"}
💿 Album: ${data.album || "N/A"}
📅 Rilis: ${data.release_date || data.date || "N/A"}
⏱️ Durasi: ${data.duration || "N/A"}
🔗 Spotify: ${data.url || data.link || "N/A"}`
      })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mencari info lagu. Coba lagi." })
    }
  }
}
