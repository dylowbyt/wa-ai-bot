const axios = require("axios")

module.exports = {
  name: "spotify",
  async run(sock, m, args) {
    const url = args[0]
    const { data } = await axios.get(`https://api.fabdl.com/spotify?url=${url}`)

    await sock.sendMessage(m.key.remoteJid, {
      audio: { url: data.result.url },
      mimetype: "audio/mpeg"
    })
  }
}
