export default {
  name: "vimg",
  command: ["vimg"],
  tags: ["ai"],
  description: "Gambar jadi video",

  run: async (m, { reply }) => {
    const API_KEY = process.env.MAGIC_HOUR_KEY;
    if (!API_KEY) return reply("API KEY belum diset!");

    if (!m.quoted || !/image/.test(m.quoted.mimetype)) {
      return reply("Reply gambar!");
    }

    try {
      reply("🎬 Membuat video dari gambar...");

      let media = await m.quoted.download();

      let form = new FormData();
      form.append("file", media, "image.jpg");

      let up = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: form
      });

      let upRes = await up.json();
      let imageUrl = upRes.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");

      let res = await fetch("https://api.magichour.ai/v1/video/image-to-video", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image_url: imageUrl
        })
      });

      let data = await res.json();

      reply("⏳ Diproses...");

      // polling
      let videoUrl;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 4000));

        let check = await fetch(`https://api.magichour.ai/v1/video/status/${data.id}`, {
          headers: { Authorization: `Bearer ${API_KEY}` }
        });

        let result = await check.json();
        if (result.status === "completed") {
          videoUrl = result.result_url;
          break;
        }
      }

      if (!videoUrl) return reply("Masih diproses...");

      await m.reply({ video: { url: videoUrl } });

    } catch (e) {
      console.log(e);
      reply("Error!");
    }
  }
};
