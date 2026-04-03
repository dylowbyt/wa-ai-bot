const { installFeature } = require("./installer")

async function handleCommand(text) {
  if (!text) return null

  if (text.startsWith("tambah fitur")) {
    const fitur = text.replace("tambah fitur", "").trim()
    return await installFeature(fitur)
  }

  return null
}

module.exports = { handleCommand }
