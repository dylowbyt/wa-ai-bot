const { OpenAI } = require("openai")
const axios = require("axios")
const identity = require("./identity")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const HISTORY = {}
const MAX_HISTORY = 10

// 🔊 MODE USER
const userMode = global.userMode || (global.userMode = {})

module.exports = {
  name: "ai",
  alias: ["bot", "gpt", "tanya", "chat", "ask", "mode"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || from
    const teks = args.join(" ")

    // ================= MODE COMMAND
    if (m.message?.conversation?.startsWith(".mode")) {
      if (!teks) {
        return sock.sendMessage(from, {
          text: "⚙️ Pilih mode:\n• .mode voice\n• .mode text"
        })
      }

      if (teks === "voice") {
        userMode[sender] = "voice"
        return sock.sendMessage(from, { text: "🔊 Mode VOICE aktif" })
      }

      if (teks === "text") {
        userMode[sender] = "text"
        return sock.sendMessage(from, { text: "💬 Mode TEXT aktif" })
      }

      return sock.sendMessage(from, { text: "❌ Pilihan salah" })
    }

    if (!teks) {
      return sock.sendMessage(from, {
        text: `🤖 *${identity.nama} — AI Assistant*

Cara pakai: .ai <pertanyaan>

Tambahan:
• .mode voice → balasan suara
• .mode text → balasan teks`
      })
    }

    if (!HISTORY[sender]) HISTORY[sender] = []

    const pertanyaanLower = teks.toLowerCase()
    const isAskingAboutSelf =
      pertanyaanLower.match(/siapa kamu|nama kamu|kamu ini|siapa lo|lo siapa|kamu apa|bot apa|fitur apa|bisa apa|kemampuan|yang bikin|siapa pembuat|dibuat siapa|creator|versi berapa|versi kamu|plugin apa/)

    try {
      await sock.sendMessage(from, { text: "⏳ _Sedang berpikir..._" })

      HISTORY[sender].push({ role: "user", content: teks })

      if (HISTORY[sender].length > MAX_HISTORY * 2) {
        HISTORY[sender] = HISTORY[sender].slice(-MAX_HISTORY * 2)
      }

      let systemPrompt = identity.sistemPrompt()

      if (isAskingAboutSelf) {
        systemPrompt += `\n\nPERHATIAN: Jelaskan identitas dan fitur secara detail.`
      }

      const messages = [
        { role: "system", content: systemPrompt },
        ...HISTORY[sender]
      ]

      const res = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 1000,
        temperature: 0.7
      })

      const jawaban = res.choices[0]?.message?.content?.trim()
      if (!jawaban) throw new Error("Tidak ada respons dari AI")

      HISTORY[sender].push({ role: "assistant", content: jawaban })

      // ================= MODE CHECK
      if (userMode[sender] === "voice") {
        const tts = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(jawaban)}`

        const audio = await axios.get(tts, { responseType: "arraybuffer" })

        await sock.sendMessage(from, {
          audio: audio.data,
          mimetype: "audio/mp4",
          ptt: true
        })
      } else {
        await sock.sendMessage(from, {
          text: `🤖 *${identity.nama}*\n━━━━━━━━━━━━\n${jawaban}`
        })
      }

    } catch (err) {

      if (teks.toLowerCase() === "reset") {
        HISTORY[sender] = []
        return sock.sendMessage(from, { text: "🔄 Riwayat chat direset!" })
      }

      if (err.code === "insufficient_quota" || err.status === 429) {
        return sock.sendMessage(from, {
          text: "⚠️ API AI sibuk, coba lagi nanti"
        })
      }

      await sock.sendMessage(from, {
        text: `❌ Error: ${err.message?.slice(0, 100)}`
      })
    }
  }
}
