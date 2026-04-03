module.exports = {
  name: "stiker",
  run: async (sock, m) => {
    await sock.sendMessage(m.key.remoteJid, {
      text: "✅ stiker ke-detect (next kita bikin real)"
    })
  }
}
