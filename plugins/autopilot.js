const axios = require("axios")
const OpenAI = require("openai")

// ===== STORAGE =====
// grupId -> { enabled: bool }
const grupConfig = {}

// grupId -> { userId -> { warnings: int, lastWarn: timestamp } }
const violations = {}

// ===== KATA KOTOR (Indonesia) =====
const kataKotor = [
  "anjing", "anjir", "anjrit", "anying",
  "babi", "babi lu", "babi lo",
  "bangsat", "bajingan", "bajinguk",
  "kontol", "kontol lu", "kontol lo",
  "memek", "memek lu",
  "pepek", "pepek lu",
  "ngentot", "entot", "ngentod",
  "jancok", "jancuk", "jancik",
  "cok", "cuk", "cik",
  "tai", "taik", "tahi",
  "goblok", "goblog", "gblok",
  "tolol", "tololnya",
  "idiot", "idiotnya",
  "brengsek", "brengsek lu",
  "keparat", "keparat lu",
  "sialan", "sial lu",
  "asu", "asu lu",
  "kampret", "kampret lu",
  "celeng", "berengsek",
  "monyet", "monyet lu", "monyet lo",
  "monyong", "mamak lu", "mamak lo",
  "bokep", "porno", "xxx", "hot video",
  "nyepong", "ngewe", "ngecrot"
]

function cekKataKotor(text) {
  if (!text) return null
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ")
  for (const kata of kataKotor) {
    const regex = new RegExp(`\\b${kata.replace(/\s+/g, "\\s+")}\\b`, "i")
    if (regex.test(lower)) return kata
  }
  return null
}

async function cekGambarJorok(imageBuffer) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !imageBuffer) return false

  try {
    const openai = new OpenAI({ apiKey })
    const base64 = imageBuffer.toString("base64")

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Apakah gambar ini mengandung konten dewasa, pornografi, kekerasan ekstrem, atau konten yang tidak pantas? Jawab hanya dengan: YA atau TIDAK"
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64}` }
            }
          ]
        }
      ],
      max_tokens: 10
    })

    const jawaban = result.choices[0]?.message?.content?.toUpperCase() || ""
    return jawaban.includes("YA")
  } catch (err) {
    console.log("AUTOPILOT IMG CHECK ERROR:", err?.message)
    return false
  }
}

function tambahViolation(grupId, userId) {
  if (!violations[grupId]) violations[grupId] = {}
  if (!violations[grupId][userId]) violations[grupId][userId] = { count: 0, lastWarn: 0 }
  violations[grupId][userId].count++
  violations[grupId][userId].lastWarn = Date.now()
  return violations[grupId][userId].count
}

function resetViolation(grupId, userId) {
  if (violations[grupId]?.[userId]) {
    violations[grupId][userId].count = 0
  }
}

function getViolation(grupId, userId) {
  return violations[grupId]?.[userId]?.count || 0
}

async function getBotNumber(sock) {
  return sock.user?.id?.split(":")[0] + "@s.whatsapp.net"
}

async function isBotAdmin(sock, grupId) {
  try {
    const meta = await sock.groupMetadata(grupId)
    const botNum = await getBotNumber(sock)
    const botMember = meta.participants.find(p => p.id === botNum || p.id === sock.user?.id)
    return botMember?.admin === "admin" || botMember?.admin === "superadmin"
  } catch {
    return false
  }
}

// ===== FUNGSI CHECK — dipanggil dari index.js =====
async function check(sock, m, { text, sender, from, imageBuffer }) {
  try {
    // Hanya di grup
    if (!from?.endsWith("@g.us")) return false

    // Cek apakah autopilot aktif di grup ini
    if (!grupConfig[from]?.enabled) return false

    // Jangan proses pesan dari bot sendiri
    const botNum = await getBotNumber(sock)
    if (sender === botNum || m.key.fromMe) return false

    // Jangan proses pesan command
    if (text?.startsWith(".")) return false

    const botAdmin = await isBotAdmin(sock, from)
    if (!botAdmin) return false

    let pelanggaranTipe = null

    // === CEK KATA KOTOR ===
    const kataJorok = cekKataKotor(text)
    if (kataJorok) {
      pelanggaranTipe = `kata kotor (*${kataJorok}*)`
    }

    // === CEK GAMBAR JOROK ===
    if (!pelanggaranTipe && imageBuffer) {
      const jorok = await cekGambarJorok(imageBuffer)
      if (jorok) {
        pelanggaranTipe = "media tidak pantas (konten dewasa)"
      }
    }

    if (!pelanggaranTipe) return false

    // ===== ADA PELANGGARAN =====
    const jumlahWarn = tambahViolation(from, sender)
    const namaSender = `@${sender.split("@")[0]}`

    if (jumlahWarn === 1) {
      // === PERINGATAN PERTAMA ===
      try {
        await sock.sendMessage(from, {
          text: `⚠️ *PERINGATAN* ⚠️\n\n${namaSender} terdeteksi mengirim ${pelanggaranTipe}.\n\n❗ Ini peringatan ke-1. Jika melanggar lagi, kamu akan dikeluarkan dari grup!`,
          mentions: [sender]
        })

        // Hapus pesan jika bisa
        try {
          await sock.sendMessage(from, { delete: m.key })
        } catch {}
      } catch (e) {
        console.log("AUTOPILOT WARN ERROR:", e.message)
      }

    } else {
      // === KICK SETELAH PERINGATAN ===
      try {
        await sock.sendMessage(from, {
          text: `🚫 *DIKELUARKAN* 🚫\n\n${namaSender} telah dikeluarkan karena berulang kali mengirim ${pelanggaranTipe}.\n\n(Pelanggaran ke-${jumlahWarn})`,
          mentions: [sender]
        })

        // Hapus pesan
        try {
          await sock.sendMessage(from, { delete: m.key })
        } catch {}

        // Kick member
        await sock.groupParticipantsUpdate(from, [sender], "remove")

        // Reset violation setelah dikick
        resetViolation(from, sender)
      } catch (e) {
        console.log("AUTOPILOT KICK ERROR:", e.message)
      }
    }

    return true // pesan sudah ditangani

  } catch (err) {
    console.log("AUTOPILOT CHECK ERROR:", err?.message)
    return false
  }
}

// ===== COMMAND PLUGIN (.autopilot) =====
module.exports = {
  name: "autopilot",
  alias: ["automod", "autoadmin"],

  check, // expose ke index.js

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "❌ Fitur ini hanya untuk grup" })
    }

    // Cek sender admin
    let senderIsAdmin = false
    try {
      const meta = await sock.groupMetadata(from)
      const member = meta.participants.find(p => p.id === sender)
      senderIsAdmin = member?.admin === "admin" || member?.admin === "superadmin"
    } catch {}

    if (!senderIsAdmin) {
      return sock.sendMessage(from, { text: "❌ Hanya admin yang bisa mengatur autopilot" })
    }

    const sub = args[0]?.toLowerCase()

    if (!sub || sub === "status") {
      const aktif = grupConfig[from]?.enabled ? "✅ AKTIF" : "❌ NONAKTIF"
      const totalWarn = Object.values(violations[from] || {})
        .reduce((sum, v) => sum + v.count, 0)

      return sock.sendMessage(from, {
        text: `🤖 *STATUS AUTOPILOT*\n\n` +
          `Status: ${aktif}\n` +
          `Total pelanggaran hari ini: ${totalWarn}\n\n` +
          `*Perintah:*\n` +
          `.autopilot on — Aktifkan\n` +
          `.autopilot off — Matikan\n` +
          `.autopilot status — Lihat status\n` +
          `.autopilot reset — Reset data pelanggaran\n\n` +
          `*Yang dideteksi:*\n` +
          `🔤 Kata-kata kotor/kasar\n` +
          `🖼️ Gambar/video tidak pantas (butuh OpenAI key)\n\n` +
          `*Sistem hukuman:*\n` +
          `1️⃣ Pelanggaran pertama → Peringatan\n` +
          `2️⃣ Pelanggaran kedua → Dikeluarkan dari grup`
      })
    }

    if (sub === "on") {
      grupConfig[from] = { enabled: true }
      return sock.sendMessage(from, {
        text: `✅ *Autopilot Admin AKTIF!*\n\nBot akan otomatis:\n🔤 Memperingatkan kata kasar\n🖼️ Memperingatkan media tidak pantas\n🚫 Mengeluarkan member yang sudah diperingatkan\n\n⚠️ Pastikan bot sudah jadi admin grup!`
      })
    }

    if (sub === "off") {
      grupConfig[from] = { enabled: false }
      return sock.sendMessage(from, {
        text: "❌ *Autopilot Admin DIMATIKAN*\n\nBot tidak akan lagi memantau pesan di grup ini"
      })
    }

    if (sub === "reset") {
      violations[from] = {}
      return sock.sendMessage(from, {
        text: "✅ Data pelanggaran grup ini sudah direset"
      })
    }

    return sock.sendMessage(from, {
      text: "⚠️ Perintah tidak dikenal\nGunakan: .autopilot on / off / status / reset"
    })
  }
}
