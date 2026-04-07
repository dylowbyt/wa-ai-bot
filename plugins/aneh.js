const axios = require("axios")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const FormData = require("form-data")

async function uploadImage(buffer) {
  // Upload 1: tmpfiles.org
  try {
    const form = new FormData()
    form.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" })
    const r = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
      headers: form.getHeaders(), timeout: 20000
    })
    const raw = r.data?.data?.url
    if (raw?.startsWith("http")) return raw.replace("tmpfiles.org/", "tmpfiles.org/dl/")
  } catch {}

  // Upload 2: 0x0.st
  try {
    const form = new FormData()
    form.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" })
    const r = await axios.post("https://0x0.st", form, {
      headers: form.getHeaders(), timeout: 20000
    })
    const url = r.data?.trim()
    if (url?.startsWith("http")) return url
  } catch {}

  return null
}

const effects = [
  { name: "Triggered 😤", key: "triggered" },
  { name: "Wasted 💀", key: "wasted" },
  { name: "Jail 🔒", key: "jail" },
  { name: "Wanted 🤠", key: "wanted" },
  { name: "Rainbow 🌈", key: "rainbow" },
  { name: "Blur 🌀", key: "blur" },
  { name: "Invert 🔄", key: "invert" }
]

module.exports = {
  name: "aneh",
  alias: ["weird", "filter", "efek"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    // Tampilkan list efek jika tidak ada gambar dan tidak ada args
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const hasImage = m.message?.imageMessage || quoted?.imageMessage

    if (!hasImage) {
      const list = effects.map((e, i) => `${i + 1}. .aneh ${e.key} → ${e.name}`).join("\n")
      return sock.sendMessage(from, {
        text: `⚠️ Reply foto dengan pilihan efek:\n\n${list}\n\nAtau .aneh random untuk efek acak`
      })
    }

    try {
      // Tentukan efek
      const pilihanEfek = args[0]?.toLowerCase()
      let efek

      if (!pilihanEfek || pilihanEfek === "random") {
        efek = effects[Math.floor(Math.random() * effects.length)]
      } else {
        efek = effects.find(e => e.key === pilihanEfek) || effects[Math.floor(Math.random() * effects.length)]
      }

      await sock.sendMessage(from, { text: `🎭 Menerapkan efek *${efek.name}*...` })

      const targetMsg = quoted ? { key: m.key, message: quoted } : m
      const buffer = await downloadMediaMessage(targetMsg, "buffer", {}, {
        logger: console,
        reuploadRequest: sock.updateMediaMessage
      })

      const imageUrl = await uploadImage(buffer)
      if (!imageUrl) throw new Error("Gagal upload gambar")

      let resultBuffer = null

      // API 1: popcat.xyz (support banyak efek)
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.popcat.xyz/${efek.key}?image=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 2: betabotz
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.betabotz.eu.org/api/filter/${efek.key}?url=${encodeURIComponent(imageUrl)}&apikey=beta`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 3: nexoracle
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.nexoracle.com/filter/${efek.key}?apikey=free&url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 4: siputzx
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.siputzx.my.id/api/edit/${efek.key}?url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 5: ryzendesu
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.ryzendesu.vip/api/image/filter/${efek.key}?url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      if (!resultBuffer) throw new Error("Semua API gagal")

      await sock.sendMessage(from, {
        image: resultBuffer,
        caption: `🎭 Efek: ${efek.name}`
      })

    } catch (err) {
      console.log("ANEH ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal apply efek, coba lagi nanti" })
    }
  }
}
