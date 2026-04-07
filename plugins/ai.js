const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { OpenAI } = require("openai")
const brain = require("../ai/brain")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const VOICE_MAP = {
  brian:"onyx",
  amy:"nova",
  cowok:"onyx",
  cewek:"nova",
  justin:"echo",
  joanna:"shimmer",
  matthew:"fable"
}

async function textToSpeech(text, voice = "Brian", persona = "default") {
  let oaiVoice = VOICE_MAP[(voice||"brian").toLowerCase()] || "alloy"

  let emotion = "normal"
  const lower = text.toLowerCase()

  if (/anj|goblok|tolol|diam|apaan|apa sih|berisik/.test(lower)) {
    emotion = "marah"
  } else if (/haha|wkwk|lol|ngakak|lucu/.test(lower)) {
    emotion = "happy"
  } else if (/sedih|capek|lelah|kecewa|hiks/.test(lower)) {
    emotion = "sad"
  }

  let styled = text

  if (persona === "anime") {
    styled = styled.replace(/\.$/, "!").replace(/\?/g, "?!")
  }

  if (emotion === "marah") {
    styled = styled.toUpperCase().replace(/\.$/, "!")
  }
  if (emotion === "happy") {
    styled = styled + " hehe~"
  }
  if (emotion === "sad") {
    styled = "..." + styled
  }

  styled = styled
    .replace(/,/g, ", ... ")
    .replace(/\./g, ". ... ")
    .replace(/!/g, "! ... ")

  styled = styled
    .replace(/bacakan.*?:/gi, "")
    .replace(/dengan gaya.*?:/gi, "")
    .replace(/dalam bahasa indonesia.*?:/gi, "")
    .trim()

  const audio = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: oaiVoice,
    input: styled,
    format: "opus"
  })

  return Buffer.from(await audio.arrayBuffer())
}

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

    if (text.startsWith("mode ")) {
      const val = text.split(" ")[1]
      if (val === "voice" || val === "text") {
        brain.updateSettings(sender, { mode: val })
        return sock.sendMessage(from, { text: `✅ Mode diubah ke *${val}*` })
      }
      return sock.sendMessage(from, { text: "❌ Mode tidak valid. Gunakan: voice / text" })
    }

    if (text.startsWith("voice ")) {
      const val = text.split(" ")[1]
      const voice = val === "cewek" ? "Amy" : val === "cowok" ? "Brian" : val
      brain.updateSettings(sender, { voice })
      return sock.sendMessage(from, { text: `✅ Voice diubah ke *${voice}*` })
    }

    if (text.startsWith("persona ")) {
      const val = text.split(" ")[1]
      brain.updateSettings(sender, { persona: val })
      return sock.sendMessage(from, { text: `✅ Persona diubah ke *${val}*` })
    }

    if (text === "reset") {
      brain.getMemory(sender).splice(0)
      return sock.sendMessage(from, { text: "🗑️ Memory direset!" })
    }

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

    const quoted =
      m.message?.extendedTextMessage?.contextInfo?.quotedMessage

    const directImage = m.message?.imageMessage
    const quotedImage = quoted?.imageMessage
    const hasImage = !!(directImage || quotedImage)

    if (!text && !hasImage) {
      return sock.sendMessage(from, {
        text:
          "🤖 *Cara pakai .ai:*\n" +
          "• `.ai <tanya>` — tanya AI\n" +
          "• `.ai mode voice` — mode suara\n" +
          "• `.ai mode text` — mode teks\n" +
          "• `.ai voice cewek/cowok` — ganti suara\n" +
          "• `.ai persona santai/galak/anime/default`\n" +
          "• `.ai reset` — hapus memory\n" +
          "• `.ai info` — lihat setting\n" +
          "• kirim/reply gambar + `.ai` → analisa gambar"
      })
    }

    await sock.sendMessage(from, { text: "⏳..." })

    let systemPrompt = identity.sistemPrompt()

    if (userSetting.persona === "santai") systemPrompt += "\nJawab santai dan gaul."
    if (userSetting.persona === "galak") systemPrompt += "\nJawab tegas dan galak."
    if (userSetting.persona === "anime") systemPrompt += "\nJawab seperti karakter anime."

    try {
      let userContent = []

      if (text) {
        userContent.push({ type: "text", text })
      }

      if (hasImage) {
        try {
          const targetMsg = quotedImage
            ? { key: m.key, message: quoted }
            : m

          const buffer = await downloadMediaMessage(
            targetMsg,
            "buffer",
            {},
            {
              logger: console,
              reuploadRequest: sock.updateMediaMessage
            }
          )

          const base64 = buffer.toString("base64")
          const mime = directImage?.mimetype || quotedImage?.mimetype || "image/jpeg"

          userContent.push({
            type: "image_url",
            image_url: {
              url: `data:${mime};base64,${base64}`
            }
          })

          if (!text) {
            userContent.unshift({ type: "text", text: "Analisis dan deskripsikan gambar ini dalam bahasa Indonesia" })
          }
        } catch (e) {
          console.log("Vision download error:", e.message)
          return sock.sendMessage(from, { text: "❌ Gagal membaca gambar" })
        }
      }

      if (userContent.length === 0) {
        userContent.push({ type: "text", text: "Halo" })
      }

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          {
            role: "user",
            content: userContent
          }
        ],
        temperature: 0.7
      })

      const reply = res.choices[0].message.content

      brain.addBotReply(sender, reply)

      if (userSetting.mode === "voice") {
        try {
          const audioBuffer = await textToSpeech(
            reply,
            userSetting.voice,
            userSetting.persona
          )

          return sock.sendMessage(from, {
            audio: audioBuffer,
            mimetype: "audio/ogg; codecs=opus",
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
      return sock.sendMessage(from, { text: "⚠️ AI error, coba lagi nanti" })
    }
  }
}
