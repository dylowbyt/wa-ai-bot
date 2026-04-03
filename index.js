const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const fs = require("fs")
const QRCode = require("qrcode")
const { handleCommand } = require("./ai/brain")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect } = update

    // 🔥 QR FIX
    if (qr) {
      console.log("📱 QR BARU:")
      const qrImage = await QRCode.toDataURL(qr)
      console.log(qrImage)
    }

    if (connection === "open") {
      console.log("✅ BOT CONNECTED KE WHATSAPP")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      console.log("❌ Disconnect reason:", reason)

      // reconnect otomatis kecuali logout
      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconnecting...")
        setTimeout(startBot, 3000)
      } else {
        console.log("⚠️ Session logout, scan ulang QR")
      }
    }
  })

  sock.ev.on("messages.upsert", async (msg) => {
    const m = msg.messages[0]
    if (!m.message) return

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text

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

startBot()
