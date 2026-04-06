const axios = require("axios")
const cheerio = require("cheerio")

async function mediafireDl(url) {
  try {
    const res = await axios.get(url)
    const $ = cheerio.load(res.data)

    const link = $("a#downloadButton").attr("href")
    if (!link) throw "Link download tidak ditemukan"

    let size = $("a#downloadButton").text()
    size = size.replace(/Download|\(|\)|\n/g, "").trim()

    const nama = link.split("/").pop()
    const mime = nama.split(".").pop()

    return {
      nama,
      mime,
      size,
      link
    }
  } catch (err) {
    throw err
  }
}

module.exports = {
  name: "mediafire",
  command: ["mediafire", "mf"],
  category: "downloader",
  description: "Download file dari MediaFire",

  async execute({ sock, m, args }) {
    try {
      if (!args[0]) {
        return m.reply("📥 Masukkan link MediaFire!\nContoh: .mf https://mediafire.com/xxxx")
      }

      const url = args[0]

      if (!url.includes("mediafire.com")) {
        return m.reply("❌ Itu bukan link MediaFire")
      }

      await m.reply("⏳ Sedang mengambil file...")

      const data = await mediafireDl(url)

      let caption = `📦 *MEDIAFIRE DOWNLOADER*\n\n`
      caption += `📄 Nama: ${data.nama}\n`
      caption += `📦 Size: ${data.size}\n`
      caption += `📁 Type: ${data.mime}\n`

      // kirim info dulu
      await sock.sendMessage(
        m.chat,
        { text: caption },
        { quoted: m }
      )

      // download file
      const file = await axios.get(data.link, {
        responseType: "arraybuffer"
      })

      // kirim file
      await sock.sendMessage(
        m.chat,
        {
          document: Buffer.from(file.data),
          fileName: data.nama,
          mimetype: "application/octet-stream"
        },
        { quoted: m }
      )

    } catch (err) {
      console.error(err)
      m.reply("❌ Gagal mengambil file dari MediaFire")
    }
  }
}