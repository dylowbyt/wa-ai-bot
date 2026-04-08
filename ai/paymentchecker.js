/**
 * paymentchecker.js — Cek status pembayaran Tripay otomatis setiap 30 detik
 *
 * Tambahkan di index.js kamu (di dalam startBot, setelah connection === "open"):
 *   const { startPaymentChecker } = require("./ai/paymentchecker")
 *   startPaymentChecker(sock)
 */

const axios = require("axios")
const crypto = require("crypto")
const { getPendingPayments, updateStatus } = require("./paymentdb")
const { addTokens } = require("./tokendb")

const TRIPAY_API_KEY    = process.env.TRIPAY_API_KEY
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY
const TRIPAY_BASE_URL   = process.env.TRIPAY_SANDBOX === "true"
  ? "https://tripay.co.id/api-sandbox"
  : "https://tripay.co.id/api"

const CHECK_INTERVAL_MS = 30_000

async function checkTransaction(reference) {
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

function startPaymentChecker(sock) {
  if (!TRIPAY_API_KEY || !TRIPAY_PRIVATE_KEY) {
    console.log("[PaymentChecker] TRIPAY_API_KEY / TRIPAY_PRIVATE_KEY tidak diset, auto-check dinonaktifkan.")
    return
  }

  console.log("[PaymentChecker] Auto-check pembayaran aktif setiap 30 detik.")

  setInterval(async () => {
    const pending = getPendingPayments()
    if (pending.length === 0) return

    for (const payment of pending) {
      try {
        const trx = await checkTransaction(payment.reference)
        if (!trx) continue

        if (trx.status === "PAID") {
          updateStatus(payment.reference, "PAID")
          const newTotal = addTokens(payment.userId, payment.tokens)

          await sock.sendMessage(payment.userId, {
            text:
              `✅ *Pembayaran Diterima!*\n\n` +
              `Ref: \`${payment.reference}\`\n` +
              `➕ Token ditambahkan: *${payment.tokens}*\n` +
              `🪙 Total token kamu: *${newTotal}*\n\n` +
              `Selamat generate gambar! 🎉\n` +
              `Ketik *.img <prompt>* untuk mulai.`
          }).catch(e => console.log("[PaymentChecker] Gagal kirim notif:", e.message))

          console.log(`[PaymentChecker] ✅ Pembayaran PAID: ${payment.reference} → ${payment.userId} +${payment.tokens} token`)

        } else if (trx.status === "EXPIRED" || trx.status === "FAILED") {
          updateStatus(payment.reference, trx.status)

          await sock.sendMessage(payment.userId, {
            text:
              `❌ *Pembayaran Kadaluarsa!*\n\n` +
              `Ref: \`${payment.reference}\`\n\n` +
              `Silakan buat transaksi baru dengan\n` +
              `ketik *.buy basic* / *.buy medium* / *.buy pro*`
          }).catch(() => {})

          console.log(`[PaymentChecker] ❌ Pembayaran ${trx.status}: ${payment.reference}`)
        }

      } catch (err) {
        console.log("[PaymentChecker] Gagal cek:", payment.reference, err?.message)
      }
    }
  }, CHECK_INTERVAL_MS)
}

module.exports = { startPaymentChecker }
