const memory = {}
const settings = {}

// ================= SETTINGS =================
function getSettings(sender) {
  if (!settings[sender]) {
    settings[sender] = {
      mode: "text",     // text / voice
      voice: "Brian",   // Brian (cowok) / Amy (cewek)
      persona: "default"
    }
  }
  return settings[sender]
}

function updateSettings(sender, data) {
  settings[sender] = { ...getSettings(sender), ...data }
}

// ================= MAIN HANDLER =================
// FIX: Terima imageBuffer dari index.js
async function handleCommand({ text, sender, from, isGroup, imageBuffer }) {
  const lowerText = (text || "").toLowerCase()

  if (!memory[sender]) memory[sender] = []

  // Simpan pesan user ke memori (hanya kalau ada teks)
  if (lowerText) {
    memory[sender].push({ role: "user", content: lowerText })
    if (memory[sender].length > 10) {
      memory[sender].shift()
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
    if (lowerText.includes("meme")) {
      return ".memeai"
    }

    if (lowerText.includes("tourl") || lowerText.includes("upload link")) {
      return ".tourl"
    }

    return null
  }

  // ===== TRIGGER CODING MODE =====
  if (lowerText.includes("buat fitur") || lowerText.includes("coding")) {
    return await codingMode(text)
  }

  // ===== TRIGGER ANALISIS HARGA =====
  if (lowerText.includes("harga") || lowerText.includes("berapa harga")) {
    return await analyzeMode(text)
  }

  return null
}

// ================= CODING MODE =================
async function codingMode(text) {
  // Placeholder — bisa dihubungkan ke OpenAI/Gemini
  return null
}

// ================= ANALYZE MODE =================
async function analyzeMode(text) {
  // Placeholder — bisa dihubungkan ke OpenAI/Gemini
  return null
}

// ================= MEMORY =================
function getMemory(sender) {
  return memory[sender] || []
}

function addBotReply(sender, reply) {
  if (!memory[sender]) memory[sender] = []

  memory[sender].push({ role: "assistant", content: reply })

  if (memory[sender].length > 10) {
    memory[sender].shift()
  }
}

module.exports = {
  handleCommand,
  getMemory,
  addBotReply,
  getSettings,
  updateSettings
}
