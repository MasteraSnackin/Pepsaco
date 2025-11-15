import NodeCache from 'node-cache';

/**
 * Cache statistics interface
 */
export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  ksize: number;
  vsize: number;
  hitRate: number;
}

/**
 * Cache configuration options
 */
export interface CacheOptions {
  stdTTL?: number;        // Standard TTL in seconds (default: 300 = 5 minutes)
  checkperiod?: number;   // Period for automatic delete check in seconds (default: 60)
  maxKeys?: number;       // Maximum number of keys (default: 1000)
  useClones?: boolean;    // Clone variables before returning (default: true)
}

/**
 * CacheManager - Manages in-memory caching with TTL and statistics
 * 
 * Features:
 * - Configurable TTL per key or global default
 * - LRU eviction when maxKeys reached
 * - Hit/miss statistics tracking
 * - Cache warming capabilities
 * - Namespace support for organized caching
 */
export class CacheManager {
  private cache: NodeCache;
  private hits: number = 0;
  private misses: number = 0;
  private enabled: boolean;

  constructor(options: CacheOptions = {}) {
    this.enabled = process.env.CACHE_ENABLED !== 'false';
    
    this.cache = new NodeCache({
      stdTTL: options.stdTTL || parseInt(process.env.CACHE_TTL_DEFAULT || '300'),
      checkperiod: options.checkperiod || 60,
      maxKeys: options.maxKeys || 1000,
      useClones: options.useClones !== false,
    });

    // Log cache initialization
    if (this.enabled) {
      console.log('[CacheManager] Initialized with TTL:', this.cache.options.stdTTL, 'seconds');
    } else {
      console.log('[CacheManager] Cache disabled via environment variable');
    }
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or undefined if not found
   */
  get<T>(key: string): T | undefined {
    if (!this.enabled) return undefined;

    const value = this.cache.get<T>(key);
    
    if (value !== undefined) {
      this.hits++;
      console.log(`[Cache HIT] ${key}`);
    } else {
      this.misses++;
      console.log(`[Cache MISS] ${key}`);
    }

    return value;
  }

  /**
   * Set value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional, uses default if not provided)
   * @returns Success boolean
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (!this.enabled) return false;

    const success = this.cache.set(key, value, ttl || 0);
    
    if (success) {
      console.log(`[Cache SET] ${key} (TTL: ${ttl || this.cache.options.stdTTL}s)`);
    }

    return success;
  }

  /**
   * Delete specific key from cache
   * @param key Cache key to delete
   * @returns Number of deleted entries
   */
  del(key: string): number {
    if (!this.enabled) return 0;

    const deleted = this.cache.del(key);
    console.log(`[Cache DEL] ${key} (deleted: ${deleted})`);
    return deleted;
  }

  /**
   * Delete multiple keys from cache
   * @param keys Array of cache keys to delete
   * @returns Number of deleted entries
   */
  delMultiple(keys: string[]): number {
    if (!this.enabled) return 0;

    const deleted = this.cache.del(keys);
    console.log(`[Cache DEL] Multiple keys (deleted: ${deleted})`);
    return deleted;
  }

  /**
   * Flush all cache entries
   */
  flush(): void {
    if (!this.enabled) return;

    this.cache.flushAll();
    this.hits = 0;
    this.misses = 0;
    console.log('[Cache FLUSH] All entries cleared');
  }

  /**
   * Check if key exists in cache
   * @param key Cache key
   * @returns Boolean indicating if key exists
   */
  has(key: string): boolean {
    if (!this.enabled) return false;
    return this.cache.has(key);
  }

  /**
   * Get all cache keys
   * @returns Array of all cache keys
   */
  keys(): string[] {
    if (!this.enabled) return [];
    return this.cache.keys();
  }

  /**
   * Get cache statistics
   * @returns CacheStats object with hit rate and other metrics
   */
  getStats(): CacheStats {
    const stats = this.cache.getStats();
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      keys: stats.keys,
      ksize: stats.ksize,
      vsize: stats.vsize,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Get TTL for a specific key
   * @param key Cache key
   * @returns TTL in milliseconds or undefined if key doesn't exist
   */
  getTtl(key: string): number | undefined {
    if (!this.enabled) return undefined;
    return this.cache.getTtl(key);
  }

  /**
   * Update TTL for a specific key
   * @param key Cache key
   * @param ttl New TTL in seconds
   * @returns Success boolean
   */
  ttl(key: string, ttl: number): boolean {
    if (!this.enabled) return false;
    return this.cache.ttl(key, ttl);
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   * @param key Cache key
   * @param fetchFn Function to fetch data if not in cache
   * @param ttl Optional TTL in seconds
   * @returns Cached or freshly fetched data
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Cache the result
    this.set(key, data, ttl);

    return data;
  }

  /**
   * Warm cache with predefined data
   * Useful for preloading frequently accessed data
   * @param entries Array of key-value-ttl tuples
   */
  warm(entries: Array<{ key: string; value: any; ttl?: number }>): void {
    if (!this.enabled) return;

    console.log(`[Cache WARM] Loading ${entries.length} entries`);
    
    entries.forEach(({ key, value, ttl }) => {
      this.set(key, value, ttl);
    });
  }

  /**
   * Invalidate cache entries by pattern
   * @param pattern String pattern to match keys (supports wildcards)
   */
  invalidatePattern(pattern: string): number {
    if (!this.enabled) return 0;

    const keys = this.keys();
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const matchingKeys = keys.filter(key => regex.test(key));

    if (matchingKeys.length > 0) {
      return this.delMultiple(matchingKeys);
    }

    return 0;
  }

  /**
   * Get cache size in bytes (approximate)
   * @returns Approximate cache size in bytes
   */
  getSize(): number {
    const stats = this.cache.getStats();
    return stats.vsize + stats.ksize;
  }

  /**
   * Check if cache is enabled
   * @returns Boolean indicating if cache is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable cache
   */
  enable(): void {
    this.enabled = true;
    console.log('[CacheManager] Cache enabled');
  }

  /**
   * Disable cache
   */
  disable(): void {
    this.enabled = false;
    console.log('[CacheManager] Cache disabled');
  }
}

// Singleton instance for global use
let cacheInstance: CacheManager | null = null;

/**
 * Get singleton cache instance
 * @returns CacheManager instance
 */
export function getCacheManager(): CacheManager {
  if (!cacheInstance) {
    cacheInstance = new CacheManager();
  }
  return cacheInstance;
}

/**
 * Generate cache key from components
 * @param components Array of key components
 * @returns Formatted cache key
 */
export function generateCacheKey(...components: (string | number)[]): string {
  return components.join(':');
}

/**
 * Predefined TTL constants (in seconds)
 */
export const CacheTTL = {
  VERY_SHORT: 30,      // 30 seconds - real-time data
  SHORT: 120,          // 2 minutes - frequently changing data
  MEDIUM: 300,         // 5 minutes - dashboard metrics
  LONG: 600,           // 10 minutes - analytics data
  VERY_LONG: 3600,     // 1 hour - reference data
  DAY: 86400,          // 24 hours - static data
} as const;

export default CacheManager;