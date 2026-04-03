const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const QRCode = require("qrcode")
const fs = require("fs")
const { handleCommand } = require("./ai/brain")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")

  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"] // 🔥 penting
  })

  sock.ev.on("creds.update", saveCreds)

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

  sock.ev.on("messages.upsert", async (msg) => {
    const m = msg.messages[0]
    if (!m.message) return

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text
      m.message.imageMessage?.caption
    if (!text) return

    const res = await handleCommand(text)
    if (res) {
      return sock.sendMessage(m.key.remoteJid, { text: res })
    }

    const files = fs.readdirSync("./plugins")

    for (let file of files) {
      const plugin = require(`./plugins/${file}`)

      if (text.startsWith("." + plugin.name)) {
        try {
          await plugin.run(sock, m)
        } catch (e) {
          console.log("Plugin error:", e.message)
        }
      }
    }
  })
}

// 🔥 delay biar Railway gak crash duluan
setTimeout(startBot, 3000)
