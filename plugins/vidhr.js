export default {
  name: "vdhr",
  command: ["vdhr"],
  tags: ["ai"],
  description: "Generate video dari teks (Magic Hour AI)",

  run: async (m, { text, reply }) => {
    if (!text) {
      return reply("Masukkan prompt!\nContoh:\n.vdhr kucing naik motor");
    }

    // 🔑 Ambil dari Railway ENV
    const API_KEY = process.env.MAGIC_HOUR_KEY;

    if (!API_KEY) {
      return reply("❌ API KEY belum diset di Railway!");
    }

    try {
      reply("🎬 Membuat video...");

      // 1. Request generate
      let res = await fetch("https://api.magichour.ai/v1/video/generate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: text,
          duration: 5,
          aspect_ratio: "9:16"
        })
      });

      let data = await res.json();

      if (!data.id) {
        console.log(data);
        return reply("❌ Gagal generate video");
      }

      // 2. Polling
      let videoUrl;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 4000));

        let check = await fetch(`https://api.magichour.ai/v1/video/status/${data.id}`, {
          headers: {
            "Authorization": `Bearer ${API_KEY}`
          }
        });

        let result = await check.json();

        if (result.status === "completed") {
          videoUrl = result.result_url;
          break;
        }
      }

      if (!videoUrl) {
        return reply("⏳ Masih diproses, coba lagi nanti");
      }

      await m.reply({
        video: { url: videoUrl },
        caption: `🎥 Prompt: ${text}`
      });

    } catch (err) {
      console.log(err);
      reply("❌ Error saat proses video");
    }
  }
};
