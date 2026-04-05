require("dotenv").config()

const OpenAI = require("openai")

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const memory = {}
const settings = {}

// ================= SETTINGS =================
function getSettings(sender) {
  if (!settings[sender]) {
    settings[sender] = {
      mode: "text",
      voice: "Brian",
      persona: "default"
    }
  }
  return settings[sender]
}

function updateSettings(sender, data) {
  settings[sender] = { ...getSettings(sender), ...data }
}

// ================= MAIN HANDLER =================
async function handleCommand({ text, sender, from, isGroup, imageBuffer, sock }) {
  const lowerText = (text || "").toLowerCase().trim()

  if (!memory[sender]) memory[sender] = []

  if (lowerText && !lowerText.startsWith(".")) {
    memory[sender].push({ role: "user", content: lowerText })
    if (memory[sender].length > 10) memory[sender].shift()
  }

  // ===== COMMAND .ai =====
  if (lowerText.startsWith(".ai ") || lowerText === ".ai") {
    const query = text.slice(lowerText.startsWith(".ai ") ? 4 : 3).trim()

    if (!query) {
      return (
        "🤖 *Cara pakai .ai:*\n" +
        "• `.ai <pertanyaan>` — tanya AI\n" +
        "• `.ai mode voice` — aktifkan mode suara\n" +
        "• `.ai mode text` — kembali ke mode teks\n" +
        "• `.ai persona santai` — ganti persona\n" +
        "• `.ai persona galak` — persona tegas\n" +
        "• `.ai persona anime` — persona anime\n" +
        "• `.ai persona default` — persona normal\n" +
        "• `.ai reset` — hapus memory percakapan\n" +
        "• `.ai voice Brian` — ganti suara (Brian/Amy/Justin/Joanna)\n" +
        "• `.ai info` — lihat setting kamu"
      )
    }

    const queryLower = query.toLowerCase()

    // Sub-command mode
    if (queryLower.startsWith("mode ")) {
      const modeVal = queryLower.replace("mode ", "").trim()
      if (modeVal === "voice" || modeVal === "text") {
        updateSettings(sender, { mode: modeVal })
        return `✅ Mode diubah ke *${modeVal}*`
      }
      return "❌ Mode tidak valid. Gunakan: voice / text"
    }

    // Sub-command persona
    if (queryLower.startsWith("persona ")) {
      const personaVal = queryLower.replace("persona ", "").trim()
      const validPersona = ["default", "santai", "galak", "anime"]
      if (validPersona.includes(personaVal)) {
        updateSettings(sender, { persona: personaVal })
        return `✅ Persona diubah ke *${personaVal}*`
      }
      return "❌ Persona tidak valid. Pilih: default / santai / galak / anime"
    }

    // Sub-command voice
    if (queryLower.startsWith("voice ")) {
      const voiceVal = query.replace(/voice /i, "").trim()
      const validVoices = ["Brian", "Amy", "Justin", "Joanna", "Ivy", "Matthew", "Kendra", "Kimberly", "Salli", "Joey", "Russell", "Nicole"]
      if (validVoices.some(v => v.toLowerCase() === voiceVal.toLowerCase())) {
        const matched = validVoices.find(v => v.toLowerCase() === voiceVal.toLowerCase())
        updateSettings(sender, { voice: matched })
        return `✅ Suara diubah ke *${matched}*`
      }
      return `❌ Suara tidak valid. Pilih: ${validVoices.join(" / ")}`
    }

    // Sub-command reset
    if (queryLower === "reset") {
      memory[sender] = []
      return "🗑️ Memory percakapan sudah direset!"
    }

    // Sub-command info
    if (queryLower === "info") {
      const s = getSettings(sender)
      return (
        `📊 *Setting kamu:*\n` +
        `• Mode: ${s.mode}\n` +
        `• Voice: ${s.voice}\n` +
        `• Persona: ${s.persona}\n` +
        `• Memory: ${(memory[sender] || []).length} pesan`
      )
    }

    // Tanya AI
    try {
      const userSetting = getSettings(sender)
      let systemPrompt = "Kamu adalah AI WhatsApp yang santai dan helpful."
      if (userSetting.persona === "santai") systemPrompt += " Jawab santai dan gaul."
      else if (userSetting.persona === "galak") systemPrompt += " Jawab tegas dan galak."
      else if (userSetting.persona === "anime") systemPrompt += " Jawab seperti karakter anime."

      const history = getMemory(sender)
      const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: query }
      ]

      const ai = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages
      })

      const reply = ai.choices[0].message.content
      addBotReply(sender, reply)
      return reply
    } catch (err) {
      console.log("AI Error:", err.message)
      return "⚠️ AI error, coba lagi nanti"
    }
  }

  // ===== AUTO DOWNLOAD LAGU =====
  if (
    lowerText.includes("download lagu") ||
    lowerText.includes("putar lagu") ||
    lowerText.includes("play lagu")
  ) {
    const query = lowerText
      .replace("download lagu", "")
      .replace("putar lagu", "")
      .replace("play lagu", "")
      .trim()

    if (query) return ".play " + query
  }

  // ===== AUTO DOWNLOAD TIKTOK =====
  if (lowerText.includes("tiktok.com") || lowerText.includes("vt.tiktok")) {
    const urlMatch = text.match(/https?:\/\/[^\s]+tiktok[^\s]+/)
    if (urlMatch) return ".tt " + urlMatch[0]
  }

  // ===== TRIGGER ANALISIS GAMBAR =====
  if (imageBuffer) {
    if (lowerText.includes("meme")) return ".memeai"
    if (lowerText.includes("tourl") || lowerText.includes("upload link")) return ".tourl"
    if (lowerText.includes("analisis") || lowerText.includes("deskripsikan") || lowerText.includes("apa ini")) {
      return ".imgai"
    }
    return null
  }

  // ===== TRIGGER CODING MODE =====
  if (lowerText.includes("buat fitur") || lowerText.startsWith("coding")) {
    return await codingMode(text)
  }

  // ===== TRIGGER ANALISIS HARGA =====
  if (lowerText.includes("berapa harga") || lowerText.startsWith("harga ")) {
    return await analyzeMode(text)
  }

  return null
}

// ================= CODING MODE =================
async function codingMode(text) {
  try {
    const prompt = `Kamu adalah asisten coding expert. Buatkan kode yang diminta secara lengkap dan jelas. Request: ${text}`
    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })
    return ai.choices[0].message.content
  } catch (err) {
    console.log("Coding mode error:", err.message)
    return "⚠️ Gagal generate kode, coba lagi nanti"
  }
}

// ================= ANALYZE MODE =================
async function analyzeMode(text) {
  try {
    const prompt = `Kamu adalah asisten analisis harga. Berikan estimasi harga yang wajar untuk: ${text}. Jelaskan range harga dan faktor yang mempengaruhi.`
    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })
    return ai.choices[0].message.content
  } catch (err) {
    console.log("Analyze mode error:", err.message)
    return "⚠️ Gagal analisis harga, coba lagi nanti"
  }
}

// ================= MEMORY =================
function getMemory(sender) {
  return memory[sender] || []
}

function addBotReply(sender, reply) {
  if (!memory[sender]) memory[sender] = []
  memory[sender].push({ role: "assistant", content: reply })
  if (memory[sender].length > 10) memory[sender].shift()
}

module.exports = {
  handleCommand,
  getMemory,
  addBotReply,
  getSettings,
  updateSettings
}
