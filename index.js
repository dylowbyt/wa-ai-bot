const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const fs = require("fs")
const QRCode = require("qrcode")
const { handleCommand } = require("./ai/brain")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")
  const sock = makeWASocket({ auth: state })

  // SIMPAN SESSION
  sock.ev.on("creds.update", saveCreds)

  // 🔥 QR KE LINK
  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update

    if (qr) {
      console.log("📱 Scan QR ini di browser HP kamu:")

      const qrImage = await QRCode.toDataURL(qr)
      console.log(qrImage)
    }

    if (connection === "open") {
      console.log("✅ Bot berhasil login ke WhatsApp!")
    }

    if (connection === "close") {
      console.log("❌ Koneksi terputus, reconnecting...")
      startBot()
    }
  })

  // MESSAGE HANDLER
  sock.ev.on("messages.upsert", async (msg) => {
    const m = msg.messages[0]
    if (!m.message) return

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text

    if (!text) return

    // AI command
    const res = await handleCommand(text)
    if (res) {
      return sock.sendMessage(m.key.remoteJid, { text: res })
    }

    // PLUGIN SYSTEM
    const files = fs.readdirSync("./plugins")

    for (let file of files) {
      const plugin = require(`./plugins/${file}`)

      if (text.startsWith("." + plugin.name)) {
        try {
          await plugin.run(sock, m)
        } catch (e) {
          console.log("Plugin error:", e.message)
          await sock.sendMessage(m.key.remoteJid, {
            text: "⚠️ fitur error"
          })
        }
      }
    }
  })
}

startBot()
