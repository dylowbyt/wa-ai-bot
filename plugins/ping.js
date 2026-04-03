module.exports = {
  name: "ping",
  run: async (sock, m) => {
    await sock.sendMessage(m.key.remoteJid, {
      text: "🏓 pong!"
    })
  }
}
