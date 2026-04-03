async function handleCommand({ text, sender, from, isGroup, imageBuffer }) {
  text = text.toLowerCase()

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

module.exports = { handleCommand }
