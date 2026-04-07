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
  name: "botak",
  alias: ["bald", "gundul"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const hasImage = m.message?.imageMessage || quoted?.imageMessage

      if (!hasImage) {
        return sock.sendMessage(from, {
          text: "⚠️ Reply foto dengan .botak\nContoh: reply foto lalu ketik .botak"
        })
      }

      await sock.sendMessage(from, { text: "🦲 Lagi ngegundulin kepala..." })

      const targetMsg = quoted ? { key: m.key, message: quoted } : m
      const buffer = await downloadMediaMessage(targetMsg, "buffer", {}, {
        logger: console,
        reuploadRequest: sock.updateMediaMessage
      })

      const imageUrl = await uploadImage(buffer)
      if (!imageUrl) throw new Error("Gagal upload gambar")

      let resultBuffer = null

      // API 1: siputzx
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.siputzx.my.id/api/edit/bald?url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 2: betabotz
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.betabotz.eu.org/api/filter/bald?url=${encodeURIComponent(imageUrl)}&apikey=beta`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 3: nexoracle
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.nexoracle.com/filter/bald?apikey=free&url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 4: ryzendesu
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.ryzendesu.vip/api/image/bald?url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 5: surabaya
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.surabaya.eu.org/api/edit/bald?url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (r.data) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      if (!resultBuffer) throw new Error("Semua API gagal")

      await sock.sendMessage(from, {
        image: resultBuffer,
        caption: "🦲 Foto Botak"
      })

    } catch (err) {
      console.log("BOTAK ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal edit foto botak, coba lagi nanti" })
    }
  }
}
