import Database from 'better-sqlite3'
import path from 'path'

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(
      path.join(process.cwd(), 'src/db/worldcup.db'),
      { readonly: true }
    )
    _db.pragma('cache_size = -32000') // 32 MB cache
  }
  return _db
}
