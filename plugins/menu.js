module.exports = {
  name: "menu",
  alias: ["help"],

  async run(sock, m) {
    const from = m.key.remoteJid

    const menu = `
╭━━━〔 🤖 *BOT MENU* 〕━━━⬣

📌 *AI & GENERATOR*
• ai
• aivideo
• memeai
• image
• tts
• textsummarize

📌 *DOWNLOAD & MEDIA*
• play
• yt / video
• spotify
• pinterest
• tt
• dlmedia
• toimg
• tourl
• stickers

📌 *INFORMASI*
• berita
• wikipedia
• kbbi
• gempa / infogempa2
• cuaca / cekcuaca2
• waktudunia
• googlemaps

📌 *CEK & VALIDASI*
• cekip
• ceknik
• ceknpwp
• cekpajak
• cekrekening
• cekstatus
• ceklink
• cekobat
• cekhargaemas
• ceknilaisaham
• nomorhp

📌 *TOOLS*
• kalkulator
• kalkmatematika
• konversiunit
• encode
• qrgen
• shortlink
• password

📌 *KEUANGAN*
• kurs
• kripto
• saham
• investasi

📌 *ISLAM*
• jadwalsholat
• jadwalsaur
• kalkzakat

📌 *HIBURAN*
• fun
• random
• tebakangka
• motivasi
• peribahasa

📌 *PRODUKTIVITAS*
• reminder
• notestask
• pomodoro
• countdown
• logbook

📌 *OWNER / SETTING*
• setbio
• setpp
• botinfo
• ping

╰━━━━━━━━━━━━━━━━⬣
✨ Ketik: .menu <nama>
Contoh: .menu ai
`

    await sock.sendMessage(from, { text: menu })
  }
}
