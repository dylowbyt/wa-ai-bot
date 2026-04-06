require("dotenv").config()

const { OpenAI } = require("openai")
const { spawnSync } = require("child_process")
const fs = require("fs")
const os = require("os")
const crypto = require("crypto")
const path = require("path")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const VOICE_MAP = {
  brian: "onyx",
  amy: "nova",
  cowok: "onyx",
  cewek: "nova",
  justin: "echo",
  joanna: "shimmer",
  matthew: "fable",
  alloy: "alloy",
  echo: "echo",
  fable: "fable",
  onyx: "onyx",
  nova: "nova",
  shimmer: "shimmer"
}

function resolveVoice(voice = "Brian") {
  return VOICE_MAP[(voice || "brian").toLowerCase()] || "alloy"
}

// Konversi MP3 buffer → OGG Opus buffer (wajib untuk WA PTT)
function mp3ToOgg(mp3Buffer) {
  const id = crypto.randomBytes(6).toString("hex")
  const tmpIn = path.join(os.tmpdir(), `tts_${id}.mp3`)
  const tmpOut = path.join(os.tmpdir(), `tts_${id}.ogg`)

  try {
    fs.writeFileSync(tmpIn, mp3Buffer)

    const result = spawnSync("ffmpeg", [
      "-y",
      "-i", tmpIn,
      "-c:a", "libopus",
      "-b:a", "64k",
      "-ar", "48000",
      "-ac", "1",
      tmpOut
    ], { timeout: 30000 })

    if (result.status !== 0) {
      const errMsg = result.stderr ? result.stderr.toString() : "unknown error"
      throw new Error("ffmpeg error: " + errMsg.slice(-200))
    }

    return fs.readFileSync(tmpOut)
  } finally {
    try { fs.unlinkSync(tmpIn) } catch {}
    try { fs.unlinkSync(tmpOut) } catch {}
  }
}

async function textToSpeech(text, voice = "Brian") {
  const oaiVoice = resolveVoice(voice)

  // Ambil audio MP3 dari OpenAI
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: oaiVoice,
    input: text
  })

  const mp3Buffer = Buffer.from(await mp3.arrayBuffer())

  // Konversi ke OGG Opus supaya bisa diputar di WA
  const oggBuffer = mp3ToOgg(mp3Buffer)
  return oggBuffer
}

module.exports = { textToSpeech, resolveVoice }
