/**
 * premium.js — Sistem token & pembayaran otomatis via Tripay
 *
 * Commands:
 *   .premium            → lihat saldo & daftar paket
 *   .buy basic/medium/pro → buat transaksi Tripay otomatis
 *   .cekbayar <ref>     → cek status bayar manual
 *   .addtoken <no> <jml> → admin: tambah token manual
 */

const axios  = require("axios")
const crypto = require("crypto")
const { getTokens, addTokens }           = require("../ai/tokendb")
const { addPendingPayment, getByReference, updateStatus } = require("../ai/paymentdb")

const TRIPAY_API_KEY     = process.env.TRIPAY_API_KEY
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE
const TRIPAY_CHANNEL     = process.env.TRIPAY_CHANNEL || "QRISONE"
const TRIPAY_BASE_URL    = process.env.TRIPAY_SANDBOX === "true"
  ? "https://tripay.co.id/api-sandbox"
  : "https://tripay.co.id/api"

const ADMIN_NUMBER = process.env.ADMIN_NUMBER || "6281234567890"

const PACKAGES = {
  basic:  { tokens: 20,  price: 10000, label: "Basic"  },
  medium: { tokens: 50,  price: 25000, label: "Medium" },
  pro:    { tokens: 100, price: 50000, label: "Pro"    }
}

function formatRupiah(n) {
  return "Rp" + n.toLocaleString("id-ID")
}

function makeRef(pkg) {
  return `TKN-${pkg.toUpperCase()}-${Date.now()}`
}

async function createTripayInvoice({ reference, pkg, userPhone }) {
  const selected = PACKAGES[pkg]

  const signature = crypto
    .createHmac("sha256", TRIPAY_PRIVATE_KEY)
    .update(TRIPAY_MERCHANT_CODE + reference + selected.price)
    .digest("hex")

  const payload = {
    method:          TRIPAY_CHANNEL,
    merchant_ref:    reference,
    amount:          selected.price,
    customer_name:   userPhone,
    customer_email:  `${userPhone}@wa.bot`,
    customer_phone:  userPhone,
    order_items: [
      {
        name:      `Token Premium ${selected.label}`,
        price:     selected.price,
        quantity:  1
      }
    ],
    signature,
    expired_time: Math.floor(Date.now() / 1000) + (2 * 60 * 60)
  }

  const res = await axios.post(
    `${TRIPAY_BASE_URL}/transaction/create`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${TRIPAY_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  )

  if (!res.data?.success) {
    throw new Error(res.data?.message || "Gagal buat transaksi Tripay")
  }

  return res.data.data
}

async function fetchTripayStatus(reference) {
  const signature = crypto
    .createHmac("sha256", TRIPAY_PRIVATE_KEY)
    .update(reference)
    .digest("hex")

  const res = await axios.get(`${TRIPAY_BASE_URL}/transaction/detail`, {
    params:  { reference },
    headers: {
      Authorization: `Bearer ${TRIPAY_API_KEY}`,
      "X-Tripay-Signature": signature
    }
  })
  return res.data?.data
}

module.exports = {
  name:  "premium",
  alias: ["buy", "token", "topup", "addtoken", "cekbayar"],

  async run(sock, m, args) {
    const from    = m.key.remoteJid
    const sender  = m.key.participant || m.key.remoteJid
    const rawText = (
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""
    ).trim()
    const command = rawText.slice(1).split(" ")[0].toLowerCase()

    // ─── .premium ──────────────────────────────────────────────
    if (command === "premium") {
      const tokens = getTokens(sender)
      return sock.sendMessage(from, {
        text:
          `💎 *PREMIUM IMAGE GENERATOR*\n\n` +
          `🪙 Token kamu: *${tokens} token*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📦 *PILIH PAKET:*\n\n` +
          `1️⃣  *Basic*  — 20 gambar → ${formatRupiah(10000)}\n` +
          `2️⃣  *Medium* — 50 gambar → ${formatRupiah(25000)}\n` +
          `3️⃣  *Pro*    — 100 gambar → ${formatRupiah(50000)}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `✨ *Bonus semua paket:*\n` +
          `⚡ .img (1 token) · ⚖️ .img-hd (2 token) · 👑 .img-pro (3 token)\n\n` +
          `📝 Ketik: *.buy basic* / *.buy medium* / *.buy pro*`
      })
    }

    // ─── .buy <paket> ──────────────────────────────────────────
    if (command === "buy") {
      const pkg = args[0]?.toLowerCase()

      if (!pkg || !PACKAGES[pkg]) {
        return sock.sendMessage(from, {
          text:
            `❌ *Paket tidak valid!*\n\n` +
            `• *.buy basic*  → 20 token / ${formatRupiah(10000)}\n` +
            `• *.buy medium* → 50 token / ${formatRupiah(25000)}\n` +
            `• *.buy pro*    → 100 token / ${formatRupiah(50000)}`
        })
      }

      const selected  = PACKAGES[pkg]
      const userPhone = sender.replace("@s.whatsapp.net", "")

      if (!TRIPAY_API_KEY || !TRIPAY_PRIVATE_KEY || !TRIPAY_MERCHANT_CODE) {
        return sock.sendMessage(from, {
          text:
            `💎 *Paket ${selected.label}*\n\n` +
            `🪙 Token: *${selected.tokens}*\n` +
            `💰 Harga: *${formatRupiah(selected.price)}*\n\n` +
            `${process.env.PAYMENT_INFO || "Hubungi admin untuk pembayaran."}\n\n` +
            `📞 Admin: wa.me/${ADMIN_NUMBER}`
        })
      }

      await sock.sendMessage(from, { text: "⏳ Membuat link pembayaran..." })

      try {
        const reference = makeRef(pkg)
        const trx       = await createTripayInvoice({ reference, pkg, userPhone })

        addPendingPayment({
          reference,
          userId:    sender,
          tokens:    selected.tokens,
          amount:    selected.price,
          expiredAt: new Date(trx.expired_time * 1000).toISOString()
        })

        const paymentCode = trx.pay_code || trx.qr_string || "-"
        const payUrl      = trx.checkout_url || "-"
        const expiredAt   = new Date(trx.expired_time * 1000)
          .toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })

        return sock.sendMessage(from, {
          text:
            `💎 *PEMBAYARAN PAKET ${selected.label.toUpperCase()}*\n\n` +
            `🪙 Token: *${selected.tokens} token*\n` +
            `💰 Jumlah: *${formatRupiah(selected.price)}*\n` +
            `🔖 Referensi: \`${reference}\`\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `💳 *Cara Bayar:*\n\n` +
            (TRIPAY_CHANNEL === "QRISONE"
              ? `📷 Scan QRIS di link berikut:\n${payUrl}\n\n`
              : `🏦 Kode Bayar: *${paymentCode}*\n\n`) +
            `⏰ Berlaku sampai: ${expiredAt} WIB\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `✅ Token otomatis masuk setelah bayar!\n` +
            `📲 Cek manual: *.cekbayar ${reference}*`
        })

      } catch (err) {
        console.log("[premium] Tripay error:", err?.response?.data || err?.message)
        return sock.sendMessage(from, {
          text:
            `❌ Gagal membuat link pembayaran.\n\n` +
            `Coba lagi atau hubungi admin:\n` +
            `wa.me/${ADMIN_NUMBER}\n\n` +
            `Error: ${err?.response?.data?.message || err?.message}`
        })
      }
    }

    // ─── .cekbayar <ref> ──────────────────────────────────────
    if (command === "cekbayar") {
      const reference = args[0]
      if (!reference) {
        return sock.sendMessage(from, {
          text: `⚠️ Format: *.cekbayar <referensi>*\nContoh: *.cekbayar TKN-BASIC-1234567890*`
        })
      }

      const local = getByReference(reference)
      if (!local) {
        return sock.sendMessage(from, { text: `❌ Referensi *${reference}* tidak ditemukan.` })
      }

      if (local.status === "PAID") {
        return sock.sendMessage(from, {
          text: `✅ Pembayaran *${reference}* sudah dikonfirmasi!\n🪙 Token: *${getTokens(sender)}*`
        })
      }

      try {
        await sock.sendMessage(from, { text: "🔍 Mengecek status pembayaran..." })
        const trx = await fetchTripayStatus(reference)

        if (trx?.status === "PAID") {
          updateStatus(reference, "PAID")
          const newTotal = addTokens(local.userId, local.tokens)
          return sock.sendMessage(from, {
            text:
              `✅ *Pembayaran Diterima!*\n\n` +
              `➕ Token ditambahkan: *${local.tokens}*\n` +
              `🪙 Total token: *${newTotal}*\n\n` +
              `Ketik *.img <prompt>* untuk mulai generate!`
          })
        }

        const statusLabel = {
          UNPAID:  "⏳ Belum dibayar",
          EXPIRED: "❌ Kadaluarsa",
          FAILED:  "❌ Gagal"
        }[trx?.status] || trx?.status

        return sock.sendMessage(from, {
          text:
            `📋 *Status Pembayaran*\n\n` +
            `🔖 Ref: \`${reference}\`\n` +
            `💰 Jumlah: *${formatRupiah(local.amount)}*\n` +
            `📊 Status: *${statusLabel}*\n\n` +
            `Bot akan otomatis menambah token saat pembayaran masuk.`
        })

      } catch (err) {
        return sock.sendMessage(from, {
          text: `❌ Gagal cek status: ${err?.message}`
        })
      }
    }

    // ─── .addtoken <nomor> <jumlah> (admin only) ───────────────
    if (command === "addtoken") {
      const adminId = ADMIN_NUMBER + "@s.whatsapp.net"
      if (sender !== adminId) {
        return sock.sendMessage(from, { text: "❌ Perintah ini hanya untuk admin." })
      }

      const targetNum = args[0]
      const amount    = parseInt(args[1])

      if (!targetNum || isNaN(amount) || amount <= 0) {
        return sock.sendMessage(from, {
          text: `⚠️ Format: *.addtoken 628xxx <jumlah>*`
        })
      }

      const userId   = targetNum.replace(/^0/, "62") + "@s.whatsapp.net"
      const newTotal = addTokens(userId, amount)

      await sock.sendMessage(from, {
        text:
          `✅ *Token ditambahkan!*\n\n` +
          `👤 User: ${targetNum}\n` +
          `➕ Ditambah: ${amount} token\n` +
          `🪙 Total: ${newTotal} token`
      })

      await sock.sendMessage(userId, {
        text:
          `🎉 *Token kamu telah diisi!*\n\n` +
          `➕ Ditambahkan: *${amount} token*\n` +
          `🪙 Total token: *${newTotal}*\n\n` +
          `Ketik *.img <prompt>* untuk mulai! 🖼️`
      }).catch(() => {})
    }
  }
}
