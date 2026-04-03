const memory = {}

async function handleCommand({ text, sender, from, isGroup, imageBuffer }) {
  text = text.toLowerCase()

  // 🔥 buat memory user
  if (!memory[sender]) memory[sender] = []

  // simpan chat user
  memory[sender].push({ role: "user", content: text })

  // batasi memory biar ringan
  if (memory[sender].length > 5) {
    memory[sender].shift()
  }

  // 🔥 kalau ada gambar → pakai vision
  if (imageBuffer) {
    return await visionMode(text, imageBuffer)
  }

  // 🔥 mode coding
  if (text.includes("buat fitur") || text.includes("coding")) {
    return await codingMode(text)
  }

  // 🔥 mode analisa
  if (text.includes("harga") || text.includes("berapa")) {
    return await analyzeMode(text)
  }

  return null
}

// 🔥 ambil memory
function getMemory(sender) {
  return memory[sender] || []
}

// 🔥 simpan balasan bot
function addBotReply(sender, reply) {
  if (!memory[sender]) memory[sender] = []

  memory[sender].push({ role: "assistant", content: reply })

  if (memory[sender].length > 5) {
    memory[sender].shift()
  }
}

module.exports = {
  handleCommand,
  getMemory,
  addBotReply
}
