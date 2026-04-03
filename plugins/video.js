const axios = require("axios")
const { useVideoLimit, getVideoLimit } = require("../ai/limit")

module.exports = {
  name: "video",
  alias: ["vid", "genvideo"],

  async run(sock, m) {
    const from = m.key.remoteJid
    const user = m.key.participant || m.key.remoteJid

    let text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text

    text = text.trim()

    // ===== LIMIT CHECK =====
    if (!useVideoLimit(user)) {
      return sock.sendMessage(from, {
        text: `⚠️ Limit video habis!\nSisa: ${getVideoLimit(user)}\nReset besok`
      })
    }

    // ===== DETECT MODE =====
    let mode = "normal"

    if (text.includes("cepat")) mode = "fast"
    if (text.includes("hd")) mode = "hd"

    const prompt = text
      .replace(/^(\.video|\.vid|\.genvideo)/, "")
      .replace("cepat", "")
      .replace("hd", "")
      .trim()

    if (!prompt) {
      return sock.sendMessage(from, {
        text: `⚠️ Contoh:
.video cepat kucing
.video hd kota cyberpunk`
      })
    }

    try {
      // ===== LOADING =====
      let info = "⏳ Proses 10–30 detik"
      if (mode === "hd") info = "⏳ Proses 30–60 detik (HD)"
      if (mode === "fast") info = "⏳ Proses cepat (low quality)"

      await sock.sendMessage(from, {
        text: `🎬 Membuat video...\n${info}`
      })

      // ===== PARAMETER =====
      let input = { prompt }

      if (mode === "fast") {
        input.num_frames = 12
        input.guidance_scale = 7
      }

      if (mode === "hd") {
        input.num_frames = 24
        input.guidance_scale = 10
      }

      // ===== REQUEST =====
      const res = await axios.post(
        "https://api.replicate.com/v1/predictions",
        {
          version:
            "3f0457f0b0a5b0b6d8d4b6c2d9a7e3c1b5e8d6f9a4c2b1e0f7d6c5b4a3a2a1",
          input
        },
        {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      )

      let videoUrl = null

      for (let i = 0; i < 25; i++) {
        const check = await axios.get(
          `https://api.replicate.com/v1/predictions/${res.data.id}`,
          {
            headers: {
              Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`
            }
          }
        )

        if (check.data.status === "succeeded") {
          videoUrl = check.data.output[0]
          break
        }

        await new Promise(r => setTimeout(r, 3000))
      }

      if (!videoUrl) {
        throw new Error("Video gagal dibuat")
      }

      // ===== CAPTION =====
      let caption = "🎬 Video selesai!"
      if (mode === "fast") caption = "⚡ Video cepat (low quality)"
      if (mode === "hd") caption = "🔥 Video HD (high quality)"

      // ===== SEND =====
      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: `${caption}\n\n${prompt}\n\nSisa limit: ${getVideoLimit(user)}`
      })

    } catch (err) {
      console.log("VIDEO ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal membuat video"
      })
    }
  }
}
