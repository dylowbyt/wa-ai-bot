const axios = require("axios")

// Jokes cadangan offline
const jokesList = [
  "Kenapa programmer tidak suka alam terbuka?\nKarena banyak bug! 🐛",
  "Apa bedanya AC dengan mantan?\nAC kalau dimatiin masih dingin, mantan kalau dimatiin masih nyakitin 😂",
  "Dokter: Bapak harus diet\nPasien: Makanan apa yg boleh saya makan dok?\nDokter: Makanan yg tidak enak\nPasien: Berarti masakan istri saya boleh dong dok 😭",
  "Kenapa orang stress pergi ke pantai?\nKarena disana bisa curhat ke ombak... udah curhat panjang lebar, ombaknya malah pergi 🌊",
  "Guru: Kenapa kamu telat?\nMurid: Tadi ada tanda 'School Ahead, Go Slow'\nGuru: Itu untuk mobil!\nMurid: Iya bu, saya naik motor 🏍️",
  "Istri: Kamu lebih sayang mobil atau aku?\nSuami: Ya iyalah aku lebih sayang kamu\nIstri: Bohong!\nSuami: Beneran, buktinya garasi aku buat mobilmu, aku tidur di sofa 😅",
  "Apa persamaan jomblo dan wifi?\nDua-duanya sering dicari kalau lagi dibutuhin, abis itu dilupain 📶",
  "Kenapa kucing tidak bisa main komputer?\nKarena takut sama mouse 🐭",
  "Apa yang bisa terbang tapi tidak punya sayap?\nWaktu... 🕐",
  "Kenapa buku matematika selalu sedih?\nKarena penuh dengan masalah 😂",
  "Suami: Yah, kamu cantik banget hari ini\nIstri: Biasanya kamu ga pernah bilang gitu\nSuami: Biasanya kamu ga bawa setrika 🤣",
  "Kenapa orang gemuk selalu happy?\nKarena susah untuk down 😂",
  "Apa bedanya politisi sama pisang?\nKalau pisang makin tua makin manis, kalau politisi makin tua makin... bikin sakit kepala 🍌",
  "Tukang becak: Mau kemana mas?\nPenumpang: Ke kantor\nTukang becak: Jauh ga?\nPenumpang: Ya jauh lah, makanya naik becak 😂",
  "Kenapa lebah tidak pernah ujian?\nKarena sudah punya bee-diploma 🐝"
]

async function getJokeOnline() {
  const apis = [
    async () => {
      const r = await axios.get("https://api.betabotz.eu.org/api/fun/jokes?apikey=beta", { timeout: 8000 })
      return r.data?.result || r.data?.joke || null
    },
    async () => {
      const r = await axios.get("https://api.nexoracle.com/fun/jokes?apikey=free", { timeout: 8000 })
      return r.data?.result || r.data?.joke || null
    },
    async () => {
      const r = await axios.get("https://api.siputzx.my.id/api/random/jokes", { timeout: 8000 })
      return r.data?.data || r.data?.joke || null
    },
    async () => {
      const r = await axios.get("https://api.surabaya.eu.org/api/random/jokes", { timeout: 8000 })
      return r.data?.data || r.data?.result || null
    }
  ]

  for (const api of apis) {
    try {
      const joke = await api()
      if (joke && typeof joke === "string") return joke
    } catch {}
  }

  return null
}

module.exports = {
  name: "lucu",
  alias: ["jokes", "ketawa", "humor"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      await sock.sendMessage(from, { text: "😂 Loading jokes..." })

      let joke = await getJokeOnline()

      if (!joke) {
        joke = jokesList[Math.floor(Math.random() * jokesList.length)]
      }

      await sock.sendMessage(from, { text: `😂 *JOKES*\n\n${joke}` })

    } catch (err) {
      console.log("LUCU ERROR:", err?.message)
      const fallback = jokesList[Math.floor(Math.random() * jokesList.length)]
      sock.sendMessage(from, { text: `😂 *JOKES*\n\n${fallback}` })
    }
  }
}
