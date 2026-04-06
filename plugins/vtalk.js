export default {
  name: "vtalk",
  command: ["vtalk"],
  tags: ["ai"],
  description: "Foto jadi ngomong",

  run: async (m, { text, reply }) => {
    const API_KEY = process.env.MAGIC_HOUR_KEY;
    if (!API_KEY) return reply("API KEY belum diset!");

    if (!m.quoted || !/image/.test(m.quoted.mimetype)) {
      return reply("Reply foto + teks\nContoh: .vtalk halo nama saya bot");
    }

    if (!text) return reply("Masukkan teks!");

    try {
      reply("🗣️ Membuat foto berbicara...");

      let media = await m.quoted.download();

      let form = new FormData();
      form.append("file", media, "image.jpg");

      let up = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: form
      });

      let upRes = await up.json();
      let imageUrl = upRes.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");

      let res = await fetch("https://api.magichour.ai/v1/video/talk", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image_url: imageUrl,
          text: text
        })
      });

      let data = await res.json();

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
