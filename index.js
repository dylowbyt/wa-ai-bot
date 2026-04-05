const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage
} = require("@whiskeysockets/baileys")

const QRCode = require("qrcode")
const fs = require("fs")

const { handleCommand, getMemory, addBotReply } = require("./ai/brain")
const { startGempaMonitor } = require("./ai/gempaAlert")

const OpenAI = require("openai")
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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
      startGempaMonitor(sock)
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

      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      let text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        ""

      text = text.trim()

      const isGroup = from.endsWith("@g.us")
      if (isGroup && !text.startsWith(".")) return

      console.log("📩:", text)

      const sender = m.key.participant || m.key.remoteJid

      // ===== DETEKSI GAMBAR (langsung atau quoted) =====
      const directImage = m.message?.imageMessage
      const quotedImage = quoted?.imageMessage
      const isImage = !!(directImage || quotedImage)

      // ===== DOWNLOAD GAMBAR JIKA ADA =====
      let imageBuffer = null

      if (isImage) {
        try {
          const targetMsg = quotedImage
            ? { key: m.key, message: quoted }
            : m

          imageBuffer = await downloadMediaMessage(
            targetMsg,
            "buffer",
            {},
            {
              logger: console,
              reuploadRequest: sock.updateMediaMessage
            }
          )
        } catch (e) {
          console.log("Download gambar error:", e.message)
        }
      }

      // ===== BRAIN SYSTEM (kirim imageBuffer jika ada) =====
      let res = null
      let isFromAI = false

      try {
        res = await handleCommand({
          text,
          sender,
          from,
          isGroup,
          imageBuffer
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
      const files = fs.readdirSync("./plugins").filter(f => f.endsWith(".js"))

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
            const args = text.slice(1).split(" ").slice(1)
            await plugin.run(sock, m, args)
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

      // ===== AUTO AI (hanya private chat) =====
      if (!isGroup) {
        if (text.startsWith(".")) return

        try {
          // ===== GAMBAR → OPENAI VISION =====
          if (isImage && imageBuffer) {
            const base64 = imageBuffer.toString("base64")

            const aiVision = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: text || "Jelaskan gambar ini dengan santai"
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:image/jpeg;base64,${base64}`
                      }
                    }
                  ]
                }
              ],
              max_tokens: 1000
            })

            const reply =
              aiVision.choices[0]?.message?.content ||
              "Hmm, gambarnya gak bisa dibaca 😅"

            await sock.sendMessage(from, { text: reply })
            addBotReply(sender, reply)
            return
          }

          // ===== GAMBAR ADA TAPI DOWNLOAD GAGAL =====
          if (isImage && !imageBuffer) {
            await sock.sendMessage(from, {
              text: "⚠️ Gagal baca gambar, coba kirim ulang"
            })
            return
          }

          // ===== TEXT → OPENAI =====
          if (!text) return

          const history = getMemory(sender)

          const systemPrompt = `Kamu adalah AI WhatsApp yang santai, gaul, dan helpful. Jawab seperti teman ngobrol, natural dan singkat.`

          const messages = [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: text }
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
            text: "⚠️ AI lagi error, coba lagi nanti"
          })
        }
      }

    } catch (err) {
      console.log("SYSTEM ERROR:", err)
    }
  })
}

setTimeout(startBot, 3000)
