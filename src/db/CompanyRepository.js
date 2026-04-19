import db from './Database.js'

export class CompanyRepository {
  static insert(company) {
    try {
      return db.prepare(`
        INSERT INTO companies (run_id, name, domain, industry, location, description, email_found, email_source)
        VALUES (@run_id, @name, @domain, @industry, @location, @description, @email_found, @email_source)
      `).run(company)
    } catch {
      return null
    }
  }

  static updateEmail(id, email) {
    db.prepare(`UPDATE companies SET email_found = ? WHERE id = ?`).run(email, id)
  }

  static updateDraft(id, subject, body) {
    db.prepare(`UPDATE companies SET subject = ?, body = ?, status = 'draft' WHERE id = ?`).run(subject, body, id)
  }

  static updateStatus(id, status) {
    db.prepare(`UPDATE companies SET status = ? WHERE id = ?`).run(status, id)
  }

  static markSent(id) {
    db.prepare(`UPDATE companies SET status = 'sent', sent_at = datetime('now') WHERE id = ?`).run(id)
  }

  static getById(id) {
    return db.prepare(`SELECT * FROM companies WHERE id = ?`).get(id)
  }

  static getByRunId(runId) {
    return db.prepare(`SELECT * FROM companies WHERE run_id = ? ORDER BY id`).all(runId)
  }

  static getAll() {
    return db.prepare(`SELECT * FROM companies ORDER BY id DESC`).all()
  }
}
