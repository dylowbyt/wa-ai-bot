const memory = {}

async function handleCommand({ text, sender, imageBuffer }) {
  text = text.toLowerCase()

  if (!memory[sender]) memory[sender] = []

  memory[sender].push({ role: "user", content: text })

  if (memory[sender].length > 5) {
    memory[sender].shift()
  }

  // 🔥 AUTO DOWNLOAD LAGU
  if (
    text.includes("download lagu") ||
    text.includes("putar lagu") ||
    text.includes("play lagu")
  ) {
    const query = text
      .replace("download lagu", "")
      .replace("putar lagu", "")
      .replace("play lagu", "")
      .trim()

    return ".play " + query
  }

  // fitur lama tetap aman
  if (imageBuffer) {
    return await visionMode(text, imageBuffer)
  }

  if (text.includes("buat fitur") || text.includes("coding")) {
    return await codingMode(text)
  }

  if (text.includes("harga") || text.includes("berapa")) {
    return await analyzeMode(text)
  }

  return null
}

function getMemory(sender) {
  return memory[sender] || []
}

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
