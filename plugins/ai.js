const { OpenAI } = require("openai")
const axios = require("axios")
const fs = require("fs")
const brain = require("./brain")
const identity = require("./identity")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

module.exports = {
  name: "ai",
  alias: ["ai", "mode", "voice"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || from
    const user = brain.getUser(sender)

    let text = args.join(" ")

    // ================= VN → TEXT
    if (m.message?.audioMessage) {
      const buffer = await sock.downloadMediaMessage(m)

      const res = await openai.audio.transcriptions.create({
        file: buffer,
        model: "whisper-1"
      })

      text = res.text
    }

    // ================= MODE
    if (text.startsWith("mode ")) {
      const val = text.split(" ")[1]
      brain.updateUser(sender, { mode: val })
      return sock.sendMessage(from, { text: `Mode: ${val}` })
    }

    // ================= VOICE SELECT
    if (text.startsWith("voice ")) {
      const val = text.split(" ")[1]
      const voice = val === "cewek" ? "Amy" : "Brian"
      brain.updateUser(sender, { voice })
      return sock.sendMessage(from, { text: `Voice: ${val}` })
    }

    // ================= PERSONALITY
    if (text.startsWith("persona ")) {
      const val = text.split(" ")[1]
      brain.updateUser(sender, { persona: val })
      return sock.sendMessage(from, { text: `Persona: ${val}` })
    }

    if (!text) return

    await sock.sendMessage(from, { text: "⏳..." })

    // ================= PERSONA SYSTEM PROMPT
    let systemPrompt = identity.sistemPrompt()

    if (user.persona === "santai") systemPrompt += "\nJawab santai dan gaul."
    if (user.persona === "galak") systemPrompt += "\nJawab tegas dan galak."
    if (user.persona === "anime") systemPrompt += "\nJawab seperti karakter anime."

    const messages = [
      { role: "system", content: systemPrompt },
      ...user.history,
      { role: "user", content: text }
    ]

    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages
    })

    const reply = res.choices[0].message.content

    brain.pushHistory(sender, { role: "user", content: text })
    brain.pushHistory(sender, { role: "assistant", content: reply })

    // ================= VOICE / TEXT OUTPUT
    if (user.mode === "voice") {
      const tts = `https://api.streamelements.com/kappa/v2/speech?voice=${user.voice}&text=${encodeURIComponent(reply)}`
      const audio = await axios.get(tts, { responseType: "arraybuffer" })

      return sock.sendMessage(from, {
        audio: audio.data,
        mimetype: "audio/mp4",
        ptt: true
      })
    }

    return sock.sendMessage(from, { text: reply })
  }
}
