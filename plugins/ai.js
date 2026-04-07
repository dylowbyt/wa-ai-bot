const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { OpenAI } = require("openai")
const brain = require("../ai/brain")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Suara otomatis berdasarkan persona
// gpt-4o-mini-tts mendukung "instructions" untuk gaya bicara — lebih natural seperti dubbing
const PERSONA_VOICE_CONFIG = {
  default: {
    voice: "nova",
    instructions: "Bicara dengan nada hangat, natural, dan ramah dalam Bahasa Indonesia. Seperti orang yang berbicara langsung, bukan membaca teks. Jeda sewajarnya."
  },
  santai: {
    voice: "fable",
    instructions: "Bicara dengan nada santai dan kasual dalam Bahasa Indonesia. Seperti teman ngobrol yang asik. Nada rileks, tidak terburu-buru, sesekali ada sedikit keakraban."
  },
  galak: {
    voice: "onyx",
    instructions: "Bicara dengan nada tegas, lugas, dan berwibawa dalam Bahasa Indonesia. Suara dalam dan serius. Tidak basa-basi, langsung ke poin."
  },
  anime: {
    voice: "shimmer",
    instructions: "Bicara dengan nada ceria, playful, dan sedikit manja dalam Bahasa Indonesia. Seperti karakter anime perempuan yang energetik dan ekspresif. Nada naik-turun dengan semangat."
  }
}

async function textToSpeech(text, persona = "default", voiceOverride = null) {
  const config = PERSONA_VOICE_CONFIG[persona] || PERSONA_VOICE_CONFIG["default"]
  const voice = voiceOverride || config.voice

  // Pra-proses teks berdasarkan emosi yang terdeteksi
  let styled = text
  const lower = text.toLowerCase()

  if (/anj|goblok|tolol|diam|apaan|apa sih|berisik/.test(lower)) {
    styled = styled.toUpperCase().replace(/\.$/, "!")
  } else if (/haha|wkwk|lol|ngakak|lucu/.test(lower)) {
    styled = styled + " hehe"
  } else if (/sedih|capek|lelah|kecewa|hiks/.test(lower)) {
    styled = "..." + styled
  }

  if (persona === "anime") {
    styled = styled.replace(/\.$/, "!").replace(/\?/g, "?!")
  }

  styled = styled
    .replace(/bacakan.*?:/gi, "")
    .replace(/dengan gaya.*?:/gi, "")
    .replace(/dalam bahasa indonesia.*?:/gi, "")
    .trim()

  const audio = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: voice,
    input: styled,
    instructions: config.instructions,
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
      const val = text.split(" ").slice(1).join(" ").trim().toLowerCase()
      if (val === "auto" || val === "otomatis") {
        brain.updateSettings(sender, { voiceOverride: null })
        return sock.sendMessage(from, { text: "✅ Suara kembali ke *otomatis* (ikut persona)" })
      }
      const validVoices = ["nova", "fable", "onyx", "shimmer", "echo", "alloy"]
      if (validVoices.includes(val)) {
        brain.updateSettings(sender, { voiceOverride: val })
        return sock.sendMessage(from, { text: `✅ Suara di-override ke *${val}*` })
      }
      return sock.sendMessage(from, { text: `❌ Suara tidak valid. Pilih: ${validVoices.join(" / ")}` })
    }

    if (text.startsWith("persona ")) {
      const val = text.split(" ")[1]
      const validPersona = ["default", "santai", "galak", "anime"]
      if (validPersona.includes(val)) {
        brain.updateSettings(sender, { persona: val })
        const voiceInfo = { default: "Nova", santai: "Fable", galak: "Onyx", anime: "Shimmer" }
        return sock.sendMessage(from, {
          text: `✅ Persona diubah ke *${val}*\n🎙️ Suara otomatis: ${voiceInfo[val]}`
        })
      }
      return sock.sendMessage(from, { text: "❌ Persona tidak valid. Pilih: default / santai / galak / anime" })
    }

    if (text === "reset") {
      brain.getMemory(sender).splice(0)
      return sock.sendMessage(from, { text: "🗑️ Memory direset!" })
    }

    if (text === "info") {
      const s = brain.getSettings(sender)
      const voiceInfo = { default: "Nova", santai: "Fable", galak: "Onyx", anime: "Shimmer" }
      const activeVoice = s.voiceOverride
        ? `${s.voiceOverride} (manual override)`
        : `${voiceInfo[s.persona] || "Nova"} (otomatis dari persona)`
      return sock.sendMessage(from, {
        text:
          `📊 *Setting kamu:*\n` +
          `• Mode: ${s.mode}\n` +
          `• Persona: ${s.persona}\n` +
          `• Suara aktif: ${activeVoice}\n` +
          `• Memory: ${(brain.getMemory(sender) || []).length} pesan`
      })
    }

    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
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
          "• `.ai persona santai` — suara & gaya santai\n" +
          "• `.ai persona galak` — suara & gaya tegas\n" +
          "• `.ai persona anime` — suara & gaya anime manja\n" +
          "• `.ai persona default` — suara & gaya normal\n" +
          "• `.ai voice nova/fable/onyx/shimmer` — override suara\n" +
          "• `.ai voice auto` — suara otomatis ikut persona\n" +
          "• `.ai reset` — hapus memory\n" +
          "• `.ai info` — lihat setting\n" +
          "• kirim/reply gambar + `.ai` → analisa gambar"
      })
    }

    await sock.sendMessage(from, { text: "⏳..." })

    // Gunakan system prompt berdasarkan persona
    const PERSONA_PROMPTS = brain.PERSONA_PROMPTS || {}
    let systemPrompt = identity.sistemPrompt
      ? identity.sistemPrompt()
      : "Kamu adalah AI WhatsApp yang santai dan helpful."

    if (PERSONA_PROMPTS[userSetting.persona]) {
      systemPrompt = PERSONA_PROMPTS[userSetting.persona]
    } else {
      if (userSetting.persona === "santai") systemPrompt += "\nJawab santai dan gaul."
      if (userSetting.persona === "galak") systemPrompt += "\nJawab tegas dan galak."
      if (userSetting.persona === "anime") systemPrompt += "\nJawab seperti karakter anime."
    }

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
            image_url: { url: `data:${mime};base64,${base64}` }
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
          { role: "user", content: userContent }
        ],
        temperature: 0.7
      })

      const reply = res.choices[0].message.content
      brain.addBotReply(sender, reply)

      if (userSetting.mode === "voice") {
        try {
          const audioBuffer = await textToSpeech(
            reply,
            userSetting.persona,
            userSetting.voiceOverride || null
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
