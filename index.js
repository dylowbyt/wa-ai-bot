const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const qrcode = require("qrcode")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    })

    // simpan session
    sock.ev.on("creds.update", saveCreds)

    // 🔥 HANDLE CONNECTION + QR
    sock.ev.on("connection.update", async (update) => {
        const { connection, qr } = update

        if (qr) {
            const qrImage = await qrcode.toDataURL(qr)
            console.log("\n🔗 SCAN QR INI DI BROWSER:\n")
            console.log(qrImage)
        }

        if (connection === "open") {
            console.log("✅ Bot Connected to WhatsApp")
        }

        if (connection === "close") {
            console.log("❌ Connection closed, reconnecting...")
            startBot()
        }
    })

    // 🔥 LISTENER PESAN (WAJIB ADA)
    sock.ev.on("messages.upsert", async ({ messages }) => {
        try {
            const m = messages[0]
            if (!m.message) return

            const from = m.key.remoteJid

            const msg =
                m.message.conversation ||
                m.message.imageMessage?.caption ||
                m.message.videoMessage?.caption ||
                m.message.extendedTextMessage?.text

            if (!msg) return

            console.log("📩 Pesan masuk:", msg)

            // ===== TEST =====
            if (msg.toLowerCase() === "halo") {
                await sock.sendMessage(from, {
                    text: "Halo juga 👋"
                })
            }

            // ===== STIKER (DETECT DULU) =====
            if (msg.startsWith(".stiker")) {
                if (m.message.imageMessage) {
                    await sock.sendMessage(from, {
                        text: "✅ Gambar terdeteksi, siap jadi stiker"
                    })
                } else {
                    await sock.sendMessage(from, {
                        text: "❌ Kirim gambar + caption .stiker"
                    })
                }
            }

        } catch (err) {
            console.log("❌ ERROR:", err)
        }
    })
}

startBot()
