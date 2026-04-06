const { OpenAI } = require("openai")
const axios = require("axios")
const brain = require("../ai/brain")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Load identity kalau ada, kalau tidak pakai default
let identity
try {
  identity = require("../ai/identity")
} catch {
  identity = {
    sistemPrompt: () => "Kamu adalah AI WhatsApp yang santai dan helpful."
  }
}

module.exports = {
  name: "ai",
  alias: [],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || from

    const userSetting = brain.getSettings(sender)
    const history = brain.getMemory(sender)

    let text = args.join(" ")

    // ================= VN → TEXT
    if (m.message?.audioMessage) {
      try {
        const buffer = await sock.downloadMediaMessage(m)
        const res = await openai.audio.transcriptions.create({
          file: buffer,
          model: "whisper-1"
        })
        text = res.text
      } catch (e) {
        return sock.sendMessage(from, { text: "❌ Gagal baca suara" })
      }
    }

    // ================= MODE
    if (text.startsWith("mode ")) {
      const val = text.split(" ")[1]
      if (val === "voice" || val === "text") {
        brain.updateSettings(sender, { mode: val })
        return sock.sendMessage(from, { text: `✅ Mode diubah ke *${val}*` })
      }
      return sock.sendMessage(from, { text: "❌ Mode tidak valid. Gunakan: voice / text" })
    }

    // ================= VOICE
    if (text.startsWith("voice ")) {
      const val = text.split(" ")[1]
      const voice = val === "cewek" ? "Amy" : val === "cowok" ? "Brian" : val
      brain.updateSettings(sender, { voice })
      return sock.sendMessage(from, { text: `✅ Voice diubah ke *${voice}*` })
    }

    // ================= PERSONA
    if (text.startsWith("persona ")) {
      const val = text.split(" ")[1]
      brain.updateSettings(sender, { persona: val })
      return sock.sendMessage(from, { text: `✅ Persona diubah ke *${val}*` })
    }

    // ================= RESET
    if (text === "reset") {
      brain.getMemory(sender).splice(0)
      return sock.sendMessage(from, { text: "🗑️ Memory direset!" })
    }

    // ================= INFO
    if (text === "info") {
      const s = brain.getSettings(sender)
      return sock.sendMessage(from, {
        text:
          `📊 *Setting kamu:*\n` +
          `• Mode: ${s.mode}\n` +
          `• Voice: ${s.voice}\n` +
          `• Persona: ${s.persona}\n` +
          `• Memory: ${(brain.getMemory(sender) || []).length} pesan`
      })
    }

    if (!text) {
      return sock.sendMessage(from, {
        text:
          "🤖 *Cara pakai .ai:*\n" +
          "• `.ai <tanya>` — tanya AI\n" +
          "• `.ai mode voice` — mode suara\n" +
          "• `.ai mode text` — mode teks\n" +
          "• `.ai voice cewek/cowok` — ganti suara\n" +
          "• `.ai persona santai/galak/anime/default`\n" +
          "• `.ai reset` — hapus memory\n" +
          "• `.menu` — melihat semua commands\n" +
          "• `.infobot` — info bot\n" +
          "• `.ping` — cek ai on\n" +
          "• `.ai info` — lihat setting"
      })
    }

    await sock.sendMessage(from, { text: "⏳..." })

    // ================= SYSTEM PROMPT
    let systemPrompt = identity.sistemPrompt()

    if (userSetting.persona === "santai") systemPrompt += "\nJawab santai dan gaul."
    if (userSetting.persona === "galak") systemPrompt += "\nJawab tegas dan galak."
    if (userSetting.persona === "anime") systemPrompt += "\nJawab seperti karakter anime."

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: text }
    ]

    try {
      const res = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages
      })

      const reply = res.choices[0].message.content

      brain.addBotReply(sender, reply)

      // ================= VOICE / TEXT
      if (userSetting.mode === "voice") {
        try {
          const tts = `https://api.streamelements.com/kappa/v2/speech?voice=${userSetting.voice}&text=${encodeURIComponent(reply)}`
          const audio = await axios.get(tts, { responseType: "arraybuffer" })

          return sock.sendMessage(from, {
            audio: Buffer.from(audio.data), // ✅ FIX: wajib pakai Buffer.from()
            mimetype: "audio/mp4",
            ptt: true
          })
        } catch (e) {
          console.log("TTS error:", e.message)
          return sock.sendMessage(from, { text: reply })
        }
      }

      return sock.sendMessage(from, { text: reply })

    } catch (err) {
      console.log("AI plugin error:", err.message)
      return sock.sendMessage(from, { text: "⚠️ AI error" })
    }
  }
}
