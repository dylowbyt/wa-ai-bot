const axios = require("axios")
const yts = require("yt-search")

module.exports = {
  name: "ytsearch",
  alias: ["yts"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const q = args.join(" ")

    if (!q) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.ytsearch lagu terbaru"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🔎 Mencari di YouTube..." })

      const search = await yts(q)
      const videos = search.videos.slice(0, 5)

      if (!videos.length) {
        return sock.sendMessage(from, { text: "❌ Tidak ditemukan" })
      }

      let txt = "🎬 *Hasil Pencarian YouTube:*\n\n"
      txt += videos.map((v, i) =>
        `${i + 1}. *${v.title}*\n⏱️ ${v.timestamp} | 👁️ ${v.views}\n🔗 ${v.url}`
      ).join("\n\n")

      sock.sendMessage(from, { text: txt })

    } catch (err) {
      console.log("YTSEARCH ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal mencari video" })
    }
  }
}
