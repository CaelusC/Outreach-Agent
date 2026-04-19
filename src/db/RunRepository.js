import db from './Database.js'

export class RunRepository {
  static create() {
    return db.prepare(`INSERT INTO runs DEFAULT VALUES`).run().lastInsertRowid
  }

  static finish(id, status) {
    db.prepare(`UPDATE runs SET finished_at = datetime('now'), status = ? WHERE id = ?`).run(status, id)
  }

  static appendLog(id, line) {
    const run = db.prepare(`SELECT log FROM runs WHERE id = ?`).get(id)
    const newLog = (run?.log || '') + line + '\n'
    db.prepare(`UPDATE runs SET log = ? WHERE id = ?`).run(newLog, id)
  }

  static getById(id) {
    return db.prepare(`SELECT * FROM runs WHERE id = ?`).get(id)
  }

  static getLatest() {
    return db.prepare(`SELECT * FROM runs ORDER BY id DESC LIMIT 1`).get()
  }

  static getAll() {
    return db.prepare(`SELECT * FROM runs ORDER BY id DESC`).all()
  }
}
