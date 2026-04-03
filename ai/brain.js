const { installFeature } = require("./installer")
const res = await handleCommand(text, imageBuffer)
async function handleCommand(text) {
  text = text.toLowerCase()

  // 🔥 DETEKSI MODE
  if (text.includes("buat fitur") || text.includes("coding")) {
    return await codingMode(text)
  }

  if (text.includes("harga") || text.includes("berapa")) {
    return await analyzeMode(text)
  }

  if (text.includes("gambar") || text.includes("foto")) {
    return await imageMode(text)
  }

  return null
}

module.exports = { handleCommand }
