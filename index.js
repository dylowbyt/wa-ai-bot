const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const OpenAI = require("openai")
const qrcode = require("qrcode")

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    })

    sock.ev.on("creds.update", saveCreds)

    // ===== CONNECTION + QR =====
    sock.ev.on("connection.update", async (update) => {
        const { connection, qr } = update

        if (qr) {
            const qrImage = await qrcode.toDataURL(qr)
            console.log("\nSCAN QR INI:\n")
            console.log(qrImage)
        }

        if (connection === "open") {
            console.log("✅ BOT CONNECTED")
        }

        if (connection === "close") {
            console.log("❌ RECONNECTING...")
            startBot()
        }
    })

    // ===== LISTENER PESAN =====
    sock.ev.on("messages.upsert", async ({ messages }) => {
        try {
            const m = messages[0]
            if (!m.message) return

            const from = m.key.remoteJid

            const msg =
                m.message.conversation ||
                m.message.extendedTextMessage?.text ||
                m.message.imageMessage?.caption

            if (!msg) return

            console.log("📩:", msg)

            // ===== COMMAND =====
            if (msg.startsWith(".")) {

                if (msg.startsWith(".stiker")) {
                    if (m.message.imageMessage) {
                        await sock.sendMessage(from, {
                            text: "✅ stiker siap dipakai"
                        })
                    } else {
                        await sock.sendMessage(from, {
                            text: "❌ kirim gambar + .stiker"
                        })
                    }
                }

                return // ⛔ stop di command
            }

            // ===== AI CHAT =====
            try {
                const res = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "user", content: msg }
                    ]
                })

                const reply = res.choices[0].message.content

                await sock.sendMessage(from, {
                    text: reply
                })

            } catch (err) {
                console.log("❌ AI ERROR:", err.message)

                await sock.sendMessage(from, {
                    text: "⚠️ AI lagi error, cek API key / saldo"
                })
            }

        } catch (err) {
            console.log("❌ SYSTEM ERROR:", err)
        }
    })
}

startBot()
