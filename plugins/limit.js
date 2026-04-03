const fs = require("fs")
const path = require("path")

const filePath = path.join(__dirname, "limit.json")

let db = {}

// load data
if (fs.existsSync(filePath)) {
  db = JSON.parse(fs.readFileSync(filePath))
}

// save data
function save() {
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2))
}

// reset harian
function resetDaily() {
  const now = new Date().toDateString()

  for (let user in db) {
    if (db[user].lastReset !== now) {
      db[user].limit = 5
      db[user].lastReset = now
    }
  }

  save()
}

// pakai limit
function useLimit(user) {
  resetDaily()

  if (!db[user]) {
    db[user] = {
      limit: 5,
      lastReset: new Date().toDateString()
    }
  }

  if (db[user].limit <= 0) return false

  db[user].limit -= 1
  save()
  return true
}

// cek sisa
function getLimit(user) {
  resetDaily()

  if (!db[user]) return 5
  return db[user].limit
}

module.exports = {
  useLimit,
  getLimit
}
