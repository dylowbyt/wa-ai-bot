module.exports = {
  name: "stiker",
  run: async (sock, m) => {
    await sock.sendMessage(m.key.remoteJid, {
      text: "🎉 fitur stiker aktif (dummy dulu)"
    })
  }
}
