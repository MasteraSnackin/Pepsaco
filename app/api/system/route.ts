import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseRouter } from '@/lib/db-router';
import { getCacheManager } from '@/lib/cache-manager';
import { getSQLiteAdapter } from '@/lib/sqlite-adapter';

/**
 * GET /api/system
 * Get system status including database availability, cache stats, and SQLite info
 */
export async function GET(request: NextRequest) {
  try {
    const router = getDatabaseRouter();
    const status = await router.getStatus();

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] System status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get system status',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/system
 * Perform system actions (flush cache, change mode, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    const router = getDatabaseRouter();
    const cache = getCacheManager();

    let result: any = { success: true };

    switch (action) {
      case 'flush_cache':
        router.flushCache();
        result.message = 'Cache flushed successfully';
        break;

      case 'invalidate_cache':
        const pattern = params?.pattern || '*';
        const deleted = router.invalidateCache(pattern);
        result.message = `Invalidated ${deleted} cache entries`;
        result.deleted = deleted;
        break;

      case 'set_mode':
        const mode = params?.mode;
        if (!mode || !['auto', 'sqlite', 'remote'].includes(mode)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid mode. Must be: auto, sqlite, or remote',
            },
            { status: 400 }
          );
        }
        router.setMode(mode);
        result.message = `Database mode set to: ${mode}`;
        result.mode = mode;
        break;

      case 'enable_cache':
        cache.enable();
        result.message = 'Cache enabled';
        break;

      case 'disable_cache':
        cache.disable();
        result.message = 'Cache disabled';
        break;

      case 'get_cache_stats':
        result.stats = cache.getStats();
        break;

      case 'get_sqlite_stats':
        const sqlite = getSQLiteAdapter();
        if (await sqlite.exists()) {
          result.stats = await sqlite.getStats();
        } else {
          result.stats = null;
          result.message = 'SQLite database not found';
        }
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
          },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] System action error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to perform system action',
      },
      { status: 500 }
    );
  }
}