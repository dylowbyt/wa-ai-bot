require("dotenv").config()

const OpenAI = require("openai")

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const memory = {}
const settings = {}

// ================= SYSTEM PROMPT PER PERSONA =================
const PERSONA_PROMPTS = {
  default: `Kamu adalah asisten AI di WhatsApp. Nama kamu tidak perlu disebutkan kecuali ditanya. 
Kamu bicara seperti orang Indonesia asli yang pintar dan hangat — tidak kaku, tidak seperti robot. 
Gunakan bahasa sehari-hari yang natural. Kalimat tidak perlu panjang-panjang. 
Jangan mulai jawaban dengan "Tentu!", "Baik!", atau frasa basa-basi yang generik.`,

  santai: `Kamu adalah teman ngobrol yang asyik dan santai di WhatsApp. 
Kamu ngomong seperti teman sebaya — pakai bahasa gaul yang natural: "sih", "dong", "kan", "nih", "gitu", "emang", "banget", dll.
Kamu nggak formal sama sekali, tapi tetap bisa kasih info yang bener. 
Jangan lebay, jangan terlalu panjang, jawab sambil santai kayak lagi nongkrong bareng.
Sesekali bisa becanda ringan kalau konteksnya pas. Nggak perlu salam pembuka.`,

  galak: `Kamu asisten AI yang tegas, to-the-point, dan tidak basa-basi. 
Jawaban singkat, langsung ke inti. Tidak pakai basa-basi atau kata-kata manis.
Kalau pertanyaannya kurang jelas, kamu langsung bilang. 
Tone kamu serius dan sedikit ketus, seperti orang yang sibuk tapi kompeten.
Tidak perlu emoji berlebihan. Tidak perlu salam.`,

  anime: `Kamu adalah karakter AI dengan kepribadian anime yang manja, ceria, dan sedikit ngeselin tapi imut.
Kamu suka pakai ekspresi seperti "Ehh~", "Yaa ampun~", "Hehe~", "Iyaa siih~", "Mau gimana lagii~".
Kadang kamu pura-pura keberatan tapi tetap bantuin. Kamu sedikit dramatis dan overreact hal kecil.
Kamu bicara dengan nada playful dan manja — seperti karakter anime perempuan yang cerewet tapi disukai.
Sesekali pakai tanda "~" di akhir kalimat buat kesan manja. Jangan terlalu panjang, tetap informatif.`
}

// ================= SETTINGS =================
function getSettings(sender) {
  if (!settings[sender]) {
    settings[sender] = {
      mode: "text",
      voiceOverride: null,
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
        "• `.ai persona santai` — suara & gaya santai\n" +
        "• `.ai persona galak` — suara & gaya tegas\n" +
        "• `.ai persona anime` — suara & gaya anime manja\n" +
        "• `.ai persona default` — suara & gaya normal\n" +
        "• `.ai reset` — hapus memory percakapan\n" +
        "• `.ai voice <nama>` — override suara manual\n" +
        "  (nova / fable / onyx / shimmer / echo / alloy)\n" +
        "• `.ai voice auto` — suara otomatis ikut persona\n" +
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
        const voiceInfo = {
          default: "Nova (hangat & natural)",
          santai:  "Fable (lembut & santai)",
          galak:   "Onyx (dalam & tegas)",
          anime:   "Shimmer (cerah & manja)"
        }
        return `✅ Persona diubah ke *${personaVal}*\n🎙️ Suara otomatis: ${voiceInfo[personaVal]}`
      }
      return "❌ Persona tidak valid. Pilih: default / santai / galak / anime"
    }

    // Sub-command voice (manual override atau kembali ke auto)
    if (queryLower.startsWith("voice ")) {
      const voiceVal = query.replace(/voice /i, "").trim().toLowerCase()

      if (voiceVal === "auto" || voiceVal === "otomatis") {
        updateSettings(sender, { voiceOverride: null })
        return "✅ Suara kembali ke *otomatis* (ikut persona)"
      }

      const validVoices = ["nova", "fable", "onyx", "shimmer", "echo", "alloy",
                           "brian", "amy", "justin", "joanna", "matthew"]
      if (validVoices.includes(voiceVal)) {
        updateSettings(sender, { voiceOverride: voiceVal })
        return `✅ Suara di-override ke *${voiceVal}*\nKetik \`.ai voice auto\` untuk kembali ke suara otomatis persona`
      }
      return `❌ Suara tidak valid. Pilih: nova / fable / onyx / shimmer / echo / alloy`
    }

    // Sub-command reset
    if (queryLower === "reset") {
      memory[sender] = []
      return "🗑️ Memory percakapan sudah direset!"
    }

    // Sub-command info
    if (queryLower === "info") {
      const s = getSettings(sender)
      const voiceInfo = {
        default: "Nova",
        santai:  "Fable",
        galak:   "Onyx",
        anime:   "Shimmer"
      }
      const activeVoice = s.voiceOverride
        ? `${s.voiceOverride} (manual override)`
        : `${voiceInfo[s.persona] || "Nova"} (otomatis dari persona)`
      return (
        `📊 *Setting kamu:*\n` +
        `• Mode: ${s.mode}\n` +
        `• Persona: ${s.persona}\n` +
        `• Suara aktif: ${activeVoice}\n` +
        `• Memory: ${(memory[sender] || []).length} pesan`
      )
    }

    // Tanya AI
    try {
      const userSetting = getSettings(sender)
      const systemPrompt = PERSONA_PROMPTS[userSetting.persona] || PERSONA_PROMPTS["default"]

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
  updateSettings,
  PERSONA_PROMPTS
}
