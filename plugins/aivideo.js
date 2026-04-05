require("dotenv").config()

const axios = require("axios")
const fs = require("fs")
const path = require("path")

/**
 * API CONFIG (PAKAI ENV)
 */
const FREE_APIS = [
  {
    name: "HuggingFace",
    daftar: "https://huggingface.co/join (gratis selamanya)",
    key: process.env.HF_KEY_1,
    model: "damo-vilab/text-to-video-ms-1.7b"
  },
  {
    name: "HuggingFace Backup",
    daftar: "https://huggingface.co/join",
    key: process.env.HF_KEY_2,
    model: "ali-vilab/i2vgen-xl"
  },
  {
    name: "Replicate",
    daftar: "https://replicate.com (gratis $5 credits signup)",
    key: process.env.REPLICATE_KEY,
    model: "anotherjesse/zeroscope-v2-xl"
  },
  {
    name: "ModelsLab",
    daftar: "https://modelslab.com (free plan tersedia)",
    key: process.env.MODELSLAB_KEY,
    model: "text2video"
  }
]

// ================= GENERATOR =================

async function generateHuggingFace(prompt, api) {
  const res = await axios.post(
    `https://api-inference.huggingface.co/models/${api.model}`,
    { inputs: prompt },
    {
      headers: {
        Authorization: `Bearer ${api.key}`,
        "Content-Type": "application/json"
      },
      responseType: "arraybuffer",
      timeout: 120000
    }
  )
  return Buffer.from(res.data)
}

async function generateReplicate(prompt, apiKey) {
  const create = await axios.post(
    "https://api.replicate.com/v1/predictions",
    {
      version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
      input: {
        prompt,
        num_frames: 24,
        width: 576,
        height: 320
      }
    },
    {
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 30000
    }
  )

  const id = create.data?.id
  if (!id) throw new Error("Replicate: gagal buat prediksi")

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 5000))

    const poll = await axios.get(
      `https://api.replicate.com/v1/predictions/${id}`,
      {
        headers: { Authorization: `Token ${apiKey}` },
        timeout: 15000
      }
    )

    const status = poll.data?.status

    if (status === "succeeded") {
      const videoUrl = poll.data?.output?.[0] || poll.data?.output
      if (!videoUrl) throw new Error("Replicate: tidak ada output")

      const dl = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 60000
      })

      return Buffer.from(dl.data)
    }

    if (status === "failed") {
      throw new Error("Replicate: proses gagal")
    }
  }

  throw new Error("Replicate: timeout")
}

async function generateModelsLab(prompt, apiKey) {
  const res = await axios.post(
    "https://modelslab.com/api/v6/video/text2video",
    {
      key: apiKey,
      prompt,
      negative_prompt: "bad quality, blurry, distorted",
      num_frames: 16,
      num_inference_steps: 20,
      guidance_scale: 7.5,
      width: 512,
      height: 288
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 30000
    }
  )

  const data = res.data

  if (data.status === "error") {
    throw new Error(data.message || "ModelsLab error")
  }

  const videoUrl = data.output?.[0] || data.proxy_links?.[0]

  if (!videoUrl) {
    if (data.status === "processing" || data.status === "queued") {
      await new Promise(r => setTimeout(r, 10000))

      const dl = await axios.get(data.future_links?.[0], {
        responseType: "arraybuffer",
        timeout: 60000
      })

      return Buffer.from(dl.data)
    }

    throw new Error("ModelsLab: tidak ada output")
  }

  const dl = await axios.get(videoUrl, {
    responseType: "arraybuffer",
    timeout: 60000
  })

  return Buffer.from(dl.data)
}

// ================= MODULE =================

module.exports = {
  name: "aivideo",
  alias: ["videogen", "genvideo", "texttovideo", "t2v"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sub = args[0]?.toLowerCase()

    // HELP
    if (!args.length || sub === "help") {
      return sock.sendMessage(from, {
        text: `🎬 *AI VIDEO GENERATOR*
━━━━━━━━━━━━━━━
Format: .aivideo <deskripsi video>

Contoh:
• .aivideo sunset di pantai dengan ombak tenang
• .aivideo kucing bermain di taman bunga
• .aivideo kota Jakarta di malam hari

Ketik .aivideo apikey untuk lihat cara setup API key.

⚠️ Proses 1-3 menit.`
      })
    }

    // APIKEY INFO
    if (sub === "apikey" || sub === "setup") {
      const info = FREE_APIS.map((api, i) =>
        `${i + 1}. *${api.name}*\n   Daftar: ${api.daftar}`
      ).join("\n\n")

      return sock.sendMessage(from, {
        text: `🔑 *CARA SETUP API KEY*
━━━━━━━━━━━━━━━
${info}

📌 Gunakan ENV:

HF_KEY_1=
HF_KEY_2=
REPLICATE_KEY=
MODELSLAB_KEY=`
      })
    }

    const prompt = args.join(" ")

    if (prompt.length < 3) {
      return sock.sendMessage(from, {
        text: "❌ Minimal 3 kata."
      })
    }

    await sock.sendMessage(from, {
      text: `🎬 Membuat video...\n📝 "${prompt}"\n⏳ Tunggu 1-3 menit`
    })

    // VALID API
    const validApis = FREE_APIS.filter(api =>
      api.key &&
      api.key !== "" &&
      api.key !== "undefined"
    )

    if (validApis.length === 0) {
      return sock.sendMessage(from, {
        text: "❌ API key belum diset di ENV."
      })
    }

    let lastError = null

    for (const api of validApis) {
      try {
        await sock.sendMessage(from, {
          text: `🔄 ${api.name}...`
        })

        let buffer = null

        if (api.name.startsWith("HuggingFace")) {
          buffer = await generateHuggingFace(prompt, api)
        } else if (api.name === "Replicate") {
          buffer = await generateReplicate(prompt, api.key)
        } else if (api.name === "ModelsLab") {
          buffer = await generateModelsLab(prompt, api.key)
        }

        if (!buffer || buffer.length < 1000) {
          throw new Error("Output tidak valid")
        }

        await sock.sendMessage(from, {
          video: buffer,
          caption: `🎬 Video AI\n📝 ${prompt}\n✨ ${api.name}`
        })

        return

      } catch (err) {
        lastError = err

        await sock.sendMessage(from, {
          text: `❌ ${api.name} gagal, lanjut API berikutnya...`
        })

        await new Promise(r => setTimeout(r, 2000))
      }
    }

    await sock.sendMessage(from, {
      text: `❌ Semua API gagal\nError: ${lastError?.message}`
    })
  }
}
