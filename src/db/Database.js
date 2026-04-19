import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '../../data/outreach.db')

mkdirSync(join(__dirname, '../../data'), { recursive: true })

const db = new Database(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT DEFAULT (datetime('now')),
    finished_at TEXT,
    status TEXT DEFAULT 'running',
    log TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    industry TEXT,
    location TEXT,
    description TEXT,
    email_found TEXT,
    email_source TEXT,
    status TEXT DEFAULT 'pending',
    subject TEXT,
    body TEXT,
    sent_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(domain, run_id)
  );
`)

export default db
