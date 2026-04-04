module.exports = {
  name: "random",
  alias: ["pilihkan", "acak", "pilih"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const input = args.join(" ")

    if (!input) {
      return sock.sendMessage(from, {
        text: `🎲 *RANDOM PILIH*

Format: .random <pilihan1> | <pilihan2> | ...

Contoh:
.random makan | tidur | main game
.random nasi goreng | mie ayam | soto
.random A | B | C | D

Atau:
.random angka 1 100    (angka acak 1-100)
.random dice           (lempar dadu)
.random coin           (lempar koin)`
      })
    }

    if (input.toLowerCase() === "dice") {
      const result = Math.floor(Math.random() * 6) + 1
      const faces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]
      return sock.sendMessage(from, {
        text: `🎲 *LEMPAR DADU*\n━━━━━━━━━━━\n${faces[result]} Hasil: *${result}*`
      })
    }

    if (input.toLowerCase() === "coin") {
      const result = Math.random() > 0.5 ? "HEADS (Gambar)" : "TAILS (Angka)"
      return sock.sendMessage(from, {
        text: `🪙 *LEMPAR KOIN*\n━━━━━━━━━━━\n🎯 Hasil: *${result}*`
      })
    }

    if (input.toLowerCase().startsWith("angka")) {
      const parts = input.split(/\s+/)
      const min = parseInt(parts[1]) || 1
      const max = parseInt(parts[2]) || 100
      if (min >= max) return sock.sendMessage(from, { text: "❌ Min harus lebih kecil dari max." })
      const result = Math.floor(Math.random() * (max - min + 1)) + min
      return sock.sendMessage(from, {
        text: `🔢 *ANGKA ACAK*\n━━━━━━━━━━━\nRange: ${min} - ${max}\n🎯 Hasil: *${result}*`
      })
    }

    const choices = input.split("|").map(c => c.trim()).filter(Boolean)
    if (choices.length < 2) {
      return sock.sendMessage(from, { text: "⚠️ Pisahkan pilihan dengan | (pipa). Minimal 2 pilihan." })
    }

    const result = choices[Math.floor(Math.random() * choices.length)]
    const list = choices.map((c, i) => `${i + 1}. ${c}${c === result ? " ✅" : ""}`).join("\n")

    await sock.sendMessage(from, {
      text: `🎲 *PILIHAN ACAK*
━━━━━━━━━━━━━━━
📋 Pilihan:
${list}

🎯 Terpilih: *${result}*`
    })
  }
}
