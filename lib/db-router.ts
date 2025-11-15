import { getSQLiteAdapter } from './sqlite-adapter';
import { getConnection } from './db';
import { getCacheManager, generateCacheKey, CacheTTL } from './cache-manager';

/**
 * Database source types
 */
export type DatabaseSource = 'auto' | 'sqlite' | 'remote' | 'cache';

/**
 * Query options for database router
 */
export interface QueryOptions {
  source?: DatabaseSource;
  cacheTTL?: number;
  cacheKey?: string;
  skipCache?: boolean;
  preferOffline?: boolean;
}

/**
 * Query result with metadata
 */
export interface QueryResult<T = any> {
  data: T[];
  source: DatabaseSource;
  cached: boolean;
  executionTime: number;
}

/**
 * Database Router
 * Intelligently routes queries between SQLite, SQL Server, and cache
 */
export class DatabaseRouter {
  private sqlite = getSQLiteAdapter();
  private cache = getCacheManager();
  private mode: DatabaseSource;

  constructor() {
    this.mode = (process.env.DB_MODE as DatabaseSource) || 'auto';
  }

  /**
   * Execute a query with intelligent routing
   * @param sql SQL query string
   * @param params Query parameters
   * @param options Query options
   * @returns Query result with metadata
   */
  async query<T = any>(
    sqlQuery: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const {
      source = this.mode,
      cacheTTL,
      cacheKey,
      skipCache = false,
      preferOffline = false,
    } = options;

    // Generate cache key if not provided
    const finalCacheKey = cacheKey || generateCacheKey('query', sqlQuery, ...params);

    // 1. Try cache first (if not skipped)
    if (!skipCache && this.cache.isEnabled()) {
      const cached = this.cache.get<T[]>(finalCacheKey);
      if (cached) {
        return {
          data: cached,
          source: 'cache',
          cached: true,
          executionTime: Date.now() - startTime,
        };
      }
    }

    // 2. Determine source based on mode and conditions
    let actualSource: 'sqlite' | 'remote';

    if (source === 'sqlite') {
      actualSource = 'sqlite';
    } else if (source === 'remote') {
      actualSource = 'remote';
    } else {
      // Auto mode - intelligent routing
      actualSource = await this.determineSource(sqlQuery, preferOffline);
    }

    // 3. Execute query on determined source
    let data: T[];
    try {
      if (actualSource === 'sqlite') {
        data = await this.executeSQLite<T>(sqlQuery, params);
      } else {
        data = await this.executeRemote<T>(sqlQuery, params);
      }
    } catch (error) {
      // Fallback logic
      console.error(`[DatabaseRouter] Error with ${actualSource}:`, error);
      
      if (actualSource === 'remote' && await this.sqlite.exists()) {
        console.log('[DatabaseRouter] Falling back to SQLite');
        data = await this.executeSQLite<T>(sqlQuery, params);
        actualSource = 'sqlite';
      } else if (actualSource === 'sqlite') {
        console.log('[DatabaseRouter] Falling back to remote');
        data = await this.executeRemote<T>(sqlQuery, params);
        actualSource = 'remote';
      } else {
        throw error;
      }
    }

    // 4. Cache the result
    if (!skipCache && cacheTTL && this.cache.isEnabled()) {
      this.cache.set(finalCacheKey, data, cacheTTL);
    }

    return {
      data,
      source: actualSource,
      cached: false,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Execute query on SQLite
   */
  private async executeSQLite<T>(sqlQuery: string, params: any[]): Promise<T[]> {
    // Convert SQL Server syntax to SQLite if needed
    const convertedSQL = this.convertSQLServerToSQLite(sqlQuery);
    return await this.sqlite.query<T>(convertedSQL, params);
  }

  /**
   * Execute query on SQL Server
   */
  private async executeRemote<T>(sqlQuery: string, params: any[]): Promise<T[]> {
    const pool = await getConnection();
    const request = pool.request();

    // Add parameters
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });

    // Replace ? placeholders with @param0, @param1, etc.
    let parameterizedSQL = sqlQuery;
    params.forEach((_, index) => {
      parameterizedSQL = parameterizedSQL.replace('?', `@param${index}`);
    });

    const result = await request.query(parameterizedSQL);
    return result.recordset as T[];
  }

  /**
   * Determine best source for query
   */
  private async determineSource(sqlQuery: string, preferOffline: boolean): Promise<'sqlite' | 'remote'> {
    // Check if SQLite database exists
    const sqliteExists = await this.sqlite.exists();

    // If offline preferred and SQLite exists, use it
    if (preferOffline && sqliteExists) {
      return 'sqlite';
    }

    // Check if query is for recent data (last 6 months)
    if (this.isRecentDataQuery(sqlQuery) && sqliteExists) {
      return 'sqlite';
    }

    // Check if query is for reference data
    if (this.isReferenceDataQuery(sqlQuery) && sqliteExists) {
      return 'sqlite';
    }

    // Check network connectivity
    const isOnline = await this.checkConnectivity();
    if (!isOnline && sqliteExists) {
      return 'sqlite';
    }

    // Default to remote
    return 'remote';
  }

  /**
   * Check if query is for recent data (last 6 months)
   */
  private isRecentDataQuery(sqlQuery: string): boolean {
    const recentKeywords = [
      'DATEADD(month, -6',
      'DATEADD(MONTH, -6',
      'WHERE.*Date.*>=',
      'WHERE.*Date.*>',
    ];

    return recentKeywords.some(keyword => 
      new RegExp(keyword, 'i').test(sqlQuery)
    );
  }

  /**
   * Check if query is for reference data
   */
  private isReferenceDataQuery(sqlQuery: string): boolean {
    const referenceTables = [
      'Application.Cities',
      'Application.Countries',
      'Application.StateProvinces',
      'Application.People',
      'Sales.Customers',
      'Purchasing.Suppliers',
      'Warehouse.StockItems',
      'Warehouse.Colors',
      'Warehouse.PackageTypes',
    ];

    return referenceTables.some(table => 
      sqlQuery.includes(table)
    );
  }

  /**
   * Check network connectivity to remote database
   */
  private async checkConnectivity(): Promise<boolean> {
    try {
      const pool = await getConnection();
      await pool.request().query('SELECT 1');
      return true;
    } catch (error) {
      console.error('[DatabaseRouter] Connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Convert SQL Server syntax to SQLite
   */
  private convertSQLServerToSQLite(sqlQuery: string): string {
    let converted = sqlQuery;

    // Remove schema qualifiers [Schema].[Table] -> Table
    converted = converted.replace(/\[(\w+)\]\.\[(\w+)\]/g, '$1_$2');
    
    // Convert TOP to LIMIT
    converted = converted.replace(/SELECT TOP (\d+)/gi, 'SELECT');
    const topMatch = sqlQuery.match(/SELECT TOP (\d+)/i);
    if (topMatch) {
      converted += ` LIMIT ${topMatch[1]}`;
    }

    // Convert GETDATE() to datetime('now')
    converted = converted.replace(/GETDATE\(\)/gi, "datetime('now')");

    // Convert DATEADD to date functions
    converted = converted.replace(
      /DATEADD\(month,\s*(-?\d+),\s*GETDATE\(\)\)/gi,
      "datetime('now', '$1 months')"
    );

    // Convert ISNULL to IFNULL
    converted = converted.replace(/ISNULL\(/gi, 'IFNULL(');

    return converted;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get SQLite statistics
   */
  async getSQLiteStats() {
    if (!await this.sqlite.exists()) {
      return null;
    }
    return await this.sqlite.getStats();
  }

  /**
   * Flush cache
   */
  flushCache() {
    this.cache.flush();
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateCache(pattern: string) {
    return this.cache.invalidatePattern(pattern);
  }

  /**
   * Set database mode
   */
  setMode(mode: DatabaseSource) {
    this.mode = mode;
    console.log(`[DatabaseRouter] Mode set to: ${mode}`);
  }

  /**
   * Get current mode
   */
  getMode(): DatabaseSource {
    return this.mode;
  }

  /**
   * Check if SQLite is available
   */
  async isSQLiteAvailable(): Promise<boolean> {
    return await this.sqlite.exists();
  }

  /**
   * Check if remote is available
   */
  async isRemoteAvailable(): Promise<boolean> {
    return await this.checkConnectivity();
  }

  /**
   * Get system status
   */
  async getStatus() {
    const [sqliteAvailable, remoteAvailable, sqliteStats] = await Promise.all([
      this.isSQLiteAvailable(),
      this.isRemoteAvailable(),
      this.getSQLiteStats(),
    ]);

    return {
      mode: this.mode,
      sqlite: {
        available: sqliteAvailable,
        stats: sqliteStats,
      },
      remote: {
        available: remoteAvailable,
      },
      cache: {
        enabled: this.cache.isEnabled(),
        stats: this.getCacheStats(),
      },
    };
  }
}

// Singleton instance
let routerInstance: DatabaseRouter | null = null;

/**
 * Get singleton database router instance
 */
export function getDatabaseRouter(): DatabaseRouter {
  if (!routerInstance) {
    routerInstance = new DatabaseRouter();
  }
  return routerInstance;
}

/**
 * Helper function to execute query with caching
 */
export async function cachedQuery<T = any>(
  sql: string,
  params: any[] = [],
  cacheTTL: number = CacheTTL.MEDIUM
): Promise<T[]> {
  const router = getDatabaseRouter();
  const result = await router.query<T>(sql, params, { cacheTTL });
  return result.data;
}

export default DatabaseRouter;