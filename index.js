const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const fs = require("fs")
const { handleCommand } = require("./ai/brain")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")
  const sock = makeWASocket({ auth: state })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("messages.upsert", async (msg) => {
    const m = msg.messages[0]
    if (!m.message) return

    const text = m.message.conversation || m.message.extendedTextMessage?.text

    // AI command
    const res = await handleCommand(text)
    if (res) {
      return sock.sendMessage(m.key.remoteJid, { text: res })
    }

    // plugin system
    const files = fs.readdirSync("./plugins")

    for (let file of files) {
      const plugin = require(`./plugins/${file}`)

      if (text.startsWith("." + plugin.name)) {
        await plugin.run(sock, m)
      }
    }
  })
}

startBot()
