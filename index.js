const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const QRCode = require("qrcode")
const fs = require("fs")
const { handleCommand, getMemory, addBotReply } = require("./ai/brain")
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

      const isGroup = from.endsWith("@g.us")

      // 🔥 filter grup
      if (isGroup && !text.startsWith(".")) return

      console.log("📩:", text)

      const sender = m.key.participant || m.key.remoteJid

      // ===== AI SYSTEM =====
      let res = null
      try {
        res = await handleCommand({
          text,
          sender,
          from,
          isGroup
        })
      } catch (err) {
        console.log("Brain error:", err.message)
      }

      if (res) {
        return await sock.sendMessage(from, { text: res })
      }

      // ===== PLUGIN SYSTEM =====
      const files = fs.readdirSync("./plugins")

      for (let file of files) {
        delete require.cache[require.resolve(`./plugins/${file}`)]
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

      // ===== AI CHAT (MEMORY) =====
      try {
        const messages = [
          {
            role: "system",
            content: "Kamu adalah AI WhatsApp yang santai, gaul, dan membantu."
          },
          ...getMemory(sender),
          {
            role: "user",
            content: text
          }
        ]

        const ai = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages
        })

        const reply = ai.choices[0].message.content

        await sock.sendMessage(from, { text: reply })

        // 🔥 simpan memory
        addBotReply(sender, reply)

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

setTimeout(startBot, 3000)
