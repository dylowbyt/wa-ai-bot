const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const fs = require("fs")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    })

    // Simpan session
    sock.ev.on("creds.update", saveCreds)

    // Status koneksi
    sock.ev.on("connection.update", (update) => {
        const { connection } = update
        if (connection === "open") {
            console.log("✅ Bot Connected to WhatsApp")
        } else if (connection === "close") {
            console.log("❌ Connection closed, reconnecting...")
            startBot()
        }
    })

    // LISTENER PESAN (INI YANG PENTING)
    sock.ev.on("messages.upsert", async ({ messages }) => {
        try {
            const m = messages[0]
            if (!m.message) return

            const from = m.key.remoteJid

            // Ambil isi pesan dari semua tipe
            const msg =
                m.message.conversation ||
                m.message.imageMessage?.caption ||
                m.message.videoMessage?.caption ||
                m.message.extendedTextMessage?.text

            if (!msg) return

            console.log("📩 Pesan masuk:", msg)

            // ===== TEST RESPON =====
            if (msg.toLowerCase() === "halo") {
                await sock.sendMessage(from, { text: "Halo juga 👋" })
            }

            // ===== FITUR STIKER (DETECT DULU) =====
            if (msg.startsWith(".stiker")) {
                if (m.message.imageMessage) {
                    await sock.sendMessage(from, {
                        text: "✅ Gambar terdeteksi, stiker siap dibuat"
                    })
                } else {
                    await sock.sendMessage(from, {
                        text: "❌ Kirim gambar dengan caption .stiker"
                    })
                }
            }

        } catch (err) {
            console.log("❌ ERROR:", err)
        }
    })
}

startBot()
