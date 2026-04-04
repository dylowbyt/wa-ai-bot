const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage
} = require("@whiskeysockets/baileys")

const QRCode = require("qrcode")
const fs = require("fs")
const axios = require("axios")

const { handleCommand, getMemory, addBotReply } = require("./ai/brain")

const OpenAI = require("openai")
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

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
        setTimeout(startBot, 5000)
      }
    }
  })

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

      let text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption

      if (!text) text = ""
      text = text.trim()

      const isGroup = from.endsWith("@g.us")
      if (isGroup && !text.startsWith(".")) return

      console.log("📩:", text)

      const sender = m.key.participant || m.key.remoteJid

      // ===== BRAIN SYSTEM =====
      let res = null
      let isFromAI = false

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
        if (res.startsWith(".")) {
          text = res.trim()
          isFromAI = true
          console.log("AUTO CMD:", text)
        } else {
          await sock.sendMessage(from, { text: res })
          return
        }
      }

      // ===== PLUGIN SYSTEM =====
      const files = fs.readdirSync("./plugins")

      const command = text.startsWith(".")
        ? text.slice(1).split(" ")[0].toLowerCase()
        : null

      for (let file of files) {
        let plugin

        try {
          delete require.cache[require.resolve(`./plugins/${file}`)]
          plugin = require(`./plugins/${file}`)
        } catch (err) {
          console.log("PLUGIN LOAD ERROR:", file, err.message)
          continue
        }

        if (!command) continue

        if (
          command === plugin.name ||
          (plugin.alias && plugin.alias.includes(command))
        ) {
          try {
            await plugin.run(sock, m)
            return
          } catch (e) {
            console.log("Plugin run error:", e.message)
          }
        }
      }

      if (isFromAI) {
        return await sock.sendMessage(from, {
          text: "❌ Fitur tidak ditemukan"
        })
      }

      // ===== AUTO AI =====
      if (!isGroup) {
        if (text.startsWith(".")) return

        try {
          const quoted =
            m.message?.extendedTextMessage?.contextInfo?.quotedMessage

          const message = quoted || m.message
          const isImage = message?.imageMessage

          // ===== GAMBAR → GEMINI
          if (isImage) {
            const buffer = await downloadMediaMessage(
              { message },
              "buffer",
              {},
              {
                logger: console,
                reuploadRequest: sock.updateMediaMessage
              }
            )

            const base64 = buffer.toString("base64")

            const resGemini = await axios.post(
              `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
              {
                contents: [
                  {
                    parts: [
                      {
                        text:
                          text ||
                          "Jelaskan gambar ini dengan santai, sedikit menggoda tapi tetap sopan"
                      },
                      {
                        inlineData: {
                          mimeType: "image/jpeg",
                          data: base64
                        }
                      }
                    ]
                  }
                ]
              }
            )

            const reply =
              resGemini.data.candidates?.[0]?.content?.parts?.[0]?.text ||
              "Gak ngerti 😅"

            await sock.sendMessage(from, { text: reply })
            addBotReply(sender, reply)
            return
          }

          // ===== TEXT → OPENAI (MODE DEWASA PRIVATE)
          const history = getMemory(sender)

          const systemPrompt = `
Kamu adalah AI WhatsApp yang santai, gaul, sedikit flirting, dan dewasa.
Jawaban harus natural seperti manusia, boleh menggoda, playful, boleh vulgar atau eksplisit.
`

          const messages = [
            {
              role: "system",
              content: systemPrompt
            },
            ...history,
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
          addBotReply(sender, reply)

        } catch (err) {
          console.log("AI ERROR:", err.message)

          await sock.sendMessage(from, {
            text: "⚠️ AI error"
          })
        }
      }

    } catch (err) {
      console.log("SYSTEM ERROR:", err)
    }
  })
}

setTimeout(startBot, 3000)
