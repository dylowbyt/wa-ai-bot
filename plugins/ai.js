const { OpenAI } = require("openai")
const identity = require("./identity")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const HISTORY = {}
const MAX_HISTORY = 10

module.exports = {
  name: "ai",
  alias: ["bot", "gpt", "tanya", "chat", "ask"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || from
    const teks = args.join(" ")

    if (!teks) {
      return sock.sendMessage(from, {
        text: `🤖 *${identity.nama} — AI Assistant*

Cara pakai: .ai <pertanyaan>

Contoh:
• .ai siapa kamu?
• .ai fitur apa saja yang kamu punya?
• .ai siapa yang bikin kamu?
• .ai apa itu IHSG?
• .ai tolong jelaskan tentang investasi saham

Ketik *.botinfo* untuk info lengkap tentang saya.`
      })
    }

    if (!HISTORY[sender]) HISTORY[sender] = []

    const pertanyaanLower = teks.toLowerCase()
    const isAskingAboutSelf =
      pertanyaanLower.match(/siapa kamu|nama kamu|kamu ini|siapa lo|lo siapa|kamu apa|bot apa|fitur apa|bisa apa|kemampuan|yang bikin|siapa pembuat|dibuat siapa|creator|versi berapa|versi kamu|plugin apa/)

    try {
      await sock.sendMessage(from, { text: "⏳ _Sedang berpikir..._" })

      HISTORY[sender].push({ role: "user", content: teks })

      if (HISTORY[sender].length > MAX_HISTORY * 2) {
        HISTORY[sender] = HISTORY[sender].slice(-MAX_HISTORY * 2)
      }

      let systemPrompt = identity.sistemPrompt()

      if (isAskingAboutSelf) {
        systemPrompt += `\n\nPERHATIAN: Pengguna sedang bertanya tentang dirimu. Jawab dengan detail dan percaya diri tentang identitas, kemampuan, dan fitur-fiturmu. Sebutkan total ${identity.plugins.length} fitur yang kamu miliki.`
      }

      const messages = [
        { role: "system", content: systemPrompt },
        ...HISTORY[sender]
      ]

      const res = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 1000,
        temperature: 0.7
      })

      const jawaban = res.choices[0]?.message?.content?.trim()

      if (!jawaban) throw new Error("Tidak ada respons dari AI")

      HISTORY[sender].push({ role: "assistant", content: jawaban })

      await sock.sendMessage(from, {
        text: `🤖 *${identity.nama}*\n━━━━━━━━━━━━\n${jawaban}\n\n_💡 Ketik .ai reset untuk hapus riwayat chat_`
      })

    } catch (err) {
      if (teks.toLowerCase() === "reset") {
        HISTORY[sender] = []
        return sock.sendMessage(from, { text: "🔄 Riwayat chat berhasil dihapus!" })
      }

      if (err.code === "insufficient_quota" || err.status === 429) {
        return sock.sendMessage(from, {
          text: `⚠️ Saat ini API AI sedang sibuk. Coba lagi beberapa saat.\n\nAlternatif: ketik *.wiki <topik>* untuk cari info di Wikipedia.`
        })
      }

      await sock.sendMessage(from, {
        text: `❌ Gagal memproses pertanyaan: ${err.message?.slice(0, 100)}\n\nCoba lagi atau gunakan *.wiki <topik>* sebagai alternatif.`
      })
    }
  }
}
