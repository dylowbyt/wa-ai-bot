async function handleCommand(text, imageBuffer) {
  text = text.toLowerCase()

  // 🔥 kalau ada gambar → pakai vision
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
