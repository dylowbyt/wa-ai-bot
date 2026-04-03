const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const QRCode = require("qrcode")
const fs = require("fs")
const { handleCommand } = require("./ai/brain")
const OpenAI = require("openai")

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// 🔥 anti duplicate
const processed = new Set()

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  })

  sock.ev.on("creds.update", saveCreds)

  // ===== CONNECTION =====
  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect } = update

    if (qr) {
      console.log("📱 QR TERDETEKSI")
      const qrImage = await QRCode.toDataURL(qr)
      console.log(qrImage)
    }

    if (connection === "open") {
      console.log("✅ BOT CONNECTED")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log("❌ Disconnect:", reason)

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconnect 5 detik...")
        setTimeout(startBot, 5000)
      } else {
        console.log("⚠️ Harus scan ulang QR")
      }
    }
  })

  // ===== MESSAGE HANDLER =====
  sock.ev.on("messages.upsert", async (msg) => {
    try {
      const m = msg.messages[0]
      if (!m.message) return

      // ❌ ANTI SPAM (WAJIB)
      if (m.key.fromMe) return
      if (m.message?.protocolMessage) return

      const id = m.key.id
      if (processed.has(id)) return
      processed.add(id)

      const from = m.key.remoteJid

      const text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption

      if (!text) return

      console.log("📩:", text)

      // ===== AI SYSTEM (brain.js) =====
      let res = null
      try {
        res = await handleCommand(text)
      } catch (err) {
        console.log("Brain error:", err.message)
      }

      if (res) {
        return await sock.sendMessage(from, { text: res })
      }

      // ===== PLUGIN SYSTEM =====
      const files = fs.readdirSync("./plugins")

      for (let file of files) {
        const plugin = require(`./plugins/${file}`)

        if (text.startsWith("." + plugin.name)) {
          try {
            await plugin.run(sock, m)
            return
          } catch (e) {
            console.log("Plugin error:", e.message)
          }
        }
      }

      // ===== AI CHAT (FALLBACK) =====
      try {
        const ai = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: text }
          ]
        })

        const reply = ai.choices[0].message.content

        await sock.sendMessage(from, { text: reply })

      } catch (err) {
        console.log("AI ERROR:", err.message)

        await sock.sendMessage(from, {
          text: "⚠️ AI error, cek API key / saldo"
        })
      }

    } catch (err) {
      console.log("SYSTEM ERROR:", err)
    }
  })
}

// 🔥 Delay biar Railway stabil
setTimeout(startBot, 3000)
