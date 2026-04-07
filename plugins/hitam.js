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

module.exports = {
  name: "hitam",
  alias: ["bw", "grayscale", "greyscale"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const hasImage = m.message?.imageMessage || quoted?.imageMessage

      if (!hasImage) {
        return sock.sendMessage(from, {
          text: "⚠️ Reply foto dengan .hitam\nContoh: reply foto lalu ketik .hitam"
        })
      }

      await sock.sendMessage(from, { text: "🖤 Mengubah foto jadi hitam putih..." })

      const targetMsg = quoted ? { key: m.key, message: quoted } : m
      const buffer = await downloadMediaMessage(targetMsg, "buffer", {}, {
        logger: console,
        reuploadRequest: sock.updateMediaMessage
      })

      const imageUrl = await uploadImage(buffer)
      if (!imageUrl) throw new Error("Gagal upload gambar")

      let resultBuffer = null

      // API 1: popcat.xyz
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.popcat.xyz/greyscale?image=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 2: siputzx
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.siputzx.my.id/api/edit/greyscale?url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 3: betabotz
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.betabotz.eu.org/api/filter/bw?url=${encodeURIComponent(imageUrl)}&apikey=beta`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 4: nexoracle
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.nexoracle.com/filter/greyscale?apikey=free&url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 5: ryzendesu
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.ryzendesu.vip/api/image/filter/greyscale?url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      if (!resultBuffer) throw new Error("Semua API gagal")

      await sock.sendMessage(from, {
        image: resultBuffer,
        caption: "🖤 Foto Hitam Putih"
      })

    } catch (err) {
      console.log("HITAM ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal edit foto hitam putih, coba lagi nanti" })
    }
  }
}
