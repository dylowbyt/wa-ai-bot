export default {
  name: "vanime",
  command: ["vanime"],
  tags: ["ai"],
  description: "Video jadi anime",

  run: async (m, { reply }) => {
    const API_KEY = process.env.MAGIC_HOUR_KEY;
    if (!API_KEY) return reply("API KEY belum diset!");

    if (!m.quoted || !/video/.test(m.quoted.mimetype)) {
      return reply("Reply video!");
    }

    try {
      reply("🎌 Mengubah ke anime...");

      let media = await m.quoted.download();

      let form = new FormData();
      form.append("file", media, "video.mp4");

      let up = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: form
      });

      let upRes = await up.json();
      let videoUrl = upRes.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");

      let res = await fetch("https://api.magichour.ai/v1/video/style", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          video_url: videoUrl,
          style: "anime"
        })
      });

      let data = await res.json();

      reply("⏳ Diproses...");

      let resultUrl;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 4000));

        let check = await fetch(`https://api.magichour.ai/v1/video/status/${data.id}`, {
          headers: { Authorization: `Bearer ${API_KEY}` }
        });

        let result = await check.json();
        if (result.status === "completed") {
          resultUrl = result.result_url;
          break;
        }
      }

      if (!resultUrl) return reply("Masih diproses...");

      await m.reply({ video: { url: resultUrl } });

    } catch (e) {
      console.log(e);
      reply("Error!");
    }
  }
};
