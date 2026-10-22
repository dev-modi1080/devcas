/// <reference path="./node-sqlite.d.ts" />
/**
 * Minimal SQLite driver wrapper built on the Node.js built-in `node:sqlite` module.
 * No native add-ons required — keeps local development dependency free.
 */
import { DatabaseSync } from 'node:sqlite';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface SqliteOptions {
  /** Absolute or relative path of the database file. */
  file?: string;
  /** Skip creating the parent directory (used by in-memory databases). */
  memory?: boolean;
}

export function resolveDatabaseFile(): string {
  const explicit = process.env.SQLITE_PATH?.trim();
  const fromUrl = parseFileUrl(process.env.DATABASE_URL);

  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless && !explicit && !fromUrl) {
    const tmpDb = path.join(os.tmpdir(), 'cas.db');
    try {
      if (!fs.existsSync(tmpDb)) {
        const candidates = [
          path.resolve(process.cwd(), 'data', 'cas.db'),
          path.resolve(process.cwd(), 'apps', 'api', 'data', 'cas.db'),
        ];
        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            fs.copyFileSync(candidate, tmpDb);
            break;
          }
        }
      }
    } catch {
      // ignore copy errors
    }
    return tmpDb;
  }

  const raw = explicit || fromUrl || './data/cas.db';

  if (path.isAbsolute(raw)) return raw;

  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, 'nest-cli.json'))) {
      return path.join(dir, raw);
    }
    const nested = path.join(dir, 'apps', 'api');
    if (fs.existsSync(path.join(nested, 'nest-cli.json'))) {
      return path.join(nested, raw);
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), raw);
}

function parseFileUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.startsWith('file:')) return null;
  return trimmed.slice('file:'.length).split('?')[0] || null;
}

export class SqliteConnection {
  private database: DatabaseSync | null = null;
  readonly file: string;
  readonly memory: boolean;

  constructor(options: SqliteOptions = {}) {
    this.memory = options.memory ?? false;
    this.file = options.file ?? resolveDatabaseFile();
  }

  open(): DatabaseSync {
    if (this.database) return this.database;

    if (!this.memory) {
      const dir = path.dirname(this.file);
      if (dir && !fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch {
          // ignore directory creation error in read-only environments
        }
      }
    }

    this.database = new DatabaseSync(this.memory ? ':memory:' : this.file, {
      enableForeignKeyConstraints: true,
    });
    try {
      this.database.exec('PRAGMA journal_mode = WAL;');
    } catch {
      // ignore WAL pragma if not supported
    }
    this.database.exec('PRAGMA synchronous = NORMAL;');
    this.database.exec('PRAGMA foreign_keys = ON;');
    return this.database;
  }

  get db(): DatabaseSync {
    return this.open();
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  all<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...(params as any[])) as T[];
  }

  get<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = this.db.prepare(sql);
    return stmt.get(...(params as any[])) as T | undefined;
  }

  run(sql: string, params: any[] = []): { changes: number } {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...(params as any[]));
    return { changes: Number(result.changes) };
  }

  close(): void {
    if (this.database) {
      this.database.close();
      this.database = null;
    }
  }
}
