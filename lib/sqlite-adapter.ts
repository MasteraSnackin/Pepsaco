import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * SQLite Database Adapter
 * Provides a consistent interface for querying SQLite database
 */
export class SQLiteAdapter {
  private db: Database.Database | null = null;
  private dbPath: string;
  private isInitialized: boolean = false;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'local.db');
  }

  /**
   * Initialize database connection
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Ensure data directory exists
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Open database connection
      this.db = new Database(this.dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
      });

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      this.isInitialized = true;
      console.log(`[SQLite] Connected to database at ${this.dbPath}`);
    } catch (error) {
      console.error('[SQLite] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Execute a SELECT query
   * @param sql SQL query string
   * @param params Query parameters
   * @returns Array of result rows
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await this.init();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = this.db.prepare(sql);
      const results = stmt.all(...params) as T[];
      return results;
    } catch (error) {
      console.error('[SQLite] Query error:', error);
      throw error;
    }
  }

  /**
   * Execute a single row SELECT query
   * @param sql SQL query string
   * @param params Query parameters
   * @returns Single result row or undefined
   */
  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    await this.init();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.get(...params) as T | undefined;
      return result;
    } catch (error) {
      console.error('[SQLite] Query error:', error);
      throw error;
    }
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE statement
   * @param sql SQL statement
   * @param params Statement parameters
   * @returns Number of affected rows
   */
  async execute(sql: string, params: any[] = []): Promise<number> {
    await this.init();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...params);
      return result.changes;
    } catch (error) {
      console.error('[SQLite] Execute error:', error);
      throw error;
    }
  }

  /**
   * Execute multiple statements in a transaction
   * @param statements Array of SQL statements with parameters
   * @returns Number of total affected rows
   */
  async executeTransaction(statements: Array<{ sql: string; params?: any[] }>): Promise<number> {
    await this.init();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    let totalChanges = 0;

    const transaction = this.db.transaction(() => {
      for (const { sql, params = [] } of statements) {
        const stmt = this.db!.prepare(sql);
        const result = stmt.run(...params);
        totalChanges += result.changes;
      }
    });

    try {
      transaction();
      return totalChanges;
    } catch (error) {
      console.error('[SQLite] Transaction error:', error);
      throw error;
    }
  }

  /**
   * Batch insert rows into a table
   * @param tableName Table name
   * @param rows Array of row objects
   * @param batchSize Number of rows per batch (default: 1000)
   * @returns Total number of inserted rows
   */
  async batchInsert(tableName: string, rows: any[], batchSize: number = 1000): Promise<number> {
    await this.init();

    if (!this.db || rows.length === 0) {
      return 0;
    }

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    let totalInserted = 0;

    // Process in batches
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      const transaction = this.db.transaction(() => {
        const stmt = this.db!.prepare(sql);
        for (const row of batch) {
          const values = columns.map(col => row[col]);
          stmt.run(...values);
        }
      });

      try {
        transaction();
        totalInserted += batch.length;
        console.log(`[SQLite] Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} rows into ${tableName}`);
      } catch (error) {
        console.error(`[SQLite] Batch insert error for ${tableName}:`, error);
        throw error;
      }
    }

    return totalInserted;
  }

  /**
   * Check if a table exists
   * @param tableName Table name
   * @returns Boolean indicating if table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    await this.init();

    if (!this.db) {
      return false;
    }

    const result = await this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );

    return (result?.count || 0) > 0;
  }

  /**
   * Get list of all tables
   * @returns Array of table names
   */
  async getTables(): Promise<string[]> {
    await this.init();

    if (!this.db) {
      return [];
    }

    const results = await this.query<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    );

    return results.map(r => r.name);
  }

  /**
   * Get table schema information
   * @param tableName Table name
   * @returns Array of column information
   */
  async getTableSchema(tableName: string): Promise<any[]> {
    await this.init();

    if (!this.db) {
      return [];
    }

    return await this.query(`PRAGMA table_info(${tableName})`);
  }

  /**
   * Get row count for a table
   * @param tableName Table name
   * @returns Number of rows
   */
  async getRowCount(tableName: string): Promise<number> {
    await this.init();

    const result = await this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );

    return result?.count || 0;
  }

  /**
   * Create an index on a table
   * @param tableName Table name
   * @param columnName Column name
   * @param indexName Optional index name
   */
  async createIndex(tableName: string, columnName: string, indexName?: string): Promise<void> {
    await this.init();

    const idxName = indexName || `idx_${tableName}_${columnName}`;
    const sql = `CREATE INDEX IF NOT EXISTS ${idxName} ON ${tableName}(${columnName})`;
    
    await this.execute(sql);
    console.log(`[SQLite] Created index ${idxName} on ${tableName}(${columnName})`);
  }

  /**
   * Vacuum database to reclaim space
   */
  async vacuum(): Promise<void> {
    await this.init();

    if (!this.db) {
      return;
    }

    this.db.exec('VACUUM');
    console.log('[SQLite] Database vacuumed');
  }

  /**
   * Get database file size in bytes
   * @returns File size in bytes
   */
  getFileSize(): number {
    if (!fs.existsSync(this.dbPath)) {
      return 0;
    }

    const stats = fs.statSync(this.dbPath);
    return stats.size;
  }

  /**
   * Get database file size in human-readable format
   * @returns Formatted file size string
   */
  getFileSizeFormatted(): string {
    const bytes = this.getFileSize();
    
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if database file exists
   * @returns Boolean indicating if database exists
   */
  exists(): boolean {
    return fs.existsSync(this.dbPath);
  }

  /**
   * Get database path
   * @returns Database file path
   */
  getPath(): string {
    return this.dbPath;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('[SQLite] Database connection closed');
    }
  }

  /**
   * Get database statistics
   * @returns Object with database statistics
   */
  async getStats(): Promise<{
    tables: number;
    totalRows: number;
    fileSize: string;
    path: string;
  }> {
    await this.init();

    const tables = await this.getTables();
    let totalRows = 0;

    for (const table of tables) {
      const count = await this.getRowCount(table);
      totalRows += count;
    }

    return {
      tables: tables.length,
      totalRows,
      fileSize: this.getFileSizeFormatted(),
      path: this.dbPath,
    };
  }
}

// Singleton instance
let sqliteInstance: SQLiteAdapter | null = null;

/**
 * Get singleton SQLite adapter instance
 * @returns SQLiteAdapter instance
 */
export function getSQLiteAdapter(): SQLiteAdapter {
  if (!sqliteInstance) {
    sqliteInstance = new SQLiteAdapter();
  }
  return sqliteInstance;
}

export default SQLiteAdapter;