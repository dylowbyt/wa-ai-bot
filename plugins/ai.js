const { OpenAI } = require("openai")
const axios = require("axios")
const brain = require("./brain")
const identity = require("./identity")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

module.exports = {
  name: "ai",
  alias: ["ai"],

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
      brain.updateSettings(sender, { mode: val })
      return sock.sendMessage(from, { text: `Mode: ${val}` })
    }

    // ================= VOICE
    if (text.startsWith("voice ")) {
      const val = text.split(" ")[1]
      const voice = val === "cewek" ? "Amy" : "Brian"
      brain.updateSettings(sender, { voice })
      return sock.sendMessage(from, { text: `Voice: ${val}` })
    }

    // ================= PERSONA
    if (text.startsWith("persona ")) {
      const val = text.split(" ")[1]
      brain.updateSettings(sender, { persona: val })
      return sock.sendMessage(from, { text: `Persona: ${val}` })
    }

    if (!text) return

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

      // ================= SAVE MEMORY
      brain.addBotReply(sender, reply)

      // ================= VOICE / TEXT
      if (userSetting.mode === "voice") {
        try {
          const tts = `https://api.streamelements.com/kappa/v2/speech?voice=${userSetting.voice}&text=${encodeURIComponent(reply)}`
          const audio = await axios.get(tts, { responseType: "arraybuffer" })

          return sock.sendMessage(from, {
            audio: audio.data,
            mimetype: "audio/mp4",
            ptt: true
          })
        } catch {
          return sock.sendMessage(from, { text: reply })
        }
      }

      return sock.sendMessage(from, { text: reply })

    } catch (err) {
      return sock.sendMessage(from, {
        text: "⚠️ AI error"
      })
    }
  }
}
