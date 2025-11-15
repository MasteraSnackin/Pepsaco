# Hybrid Database Architecture Plan

## 🎯 Objective

Implement a dual-database system that:
1. **Downloads 6-month sample data** to SQLite for offline use
2. **Adds caching layer** for frequently accessed remote data
3. **Maintains seamless switching** between offline and online modes

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│                    (Next.js API Routes)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Database Abstraction Layer                      │
│         (Unified Query Interface + Router)                   │
└─────┬──────────────────────────────────────────┬────────────┘
      │                                           │
      ▼                                           ▼
┌─────────────────┐                    ┌──────────────────────┐
│  Cache Layer    │                    │   Database Router    │
│  (node-cache)   │                    │  (Source Selector)   │
│                 │                    │                      │
│ • 5-min TTL     │                    │ • Auto-detect mode   │
│ • LRU eviction  │                    │ • Fallback logic     │
│ • 100MB limit   │                    │ • Health checks      │
└─────┬───────────┘                    └──────┬───────────────┘
      │                                       │
      │                          ┌────────────┴────────────┐
      │                          │                         │
      ▼                          ▼                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Remote Cache   │    │  SQLite Local    │    │  SQL Server     │
│  (Hot Data)     │    │  (6-mo Sample)   │    │  (Full Remote)  │
│                 │    │                  │    │                 │
│ • Dashboard     │    │ • 49 tables      │    │ • 49 tables     │
│ • Analytics     │    │ • Last 6 months  │    │ • 3.8B rows     │
│ • Top queries   │    │ • ~50-100MB      │    │ • AWS RDS       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 📊 Data Distribution Strategy

### SQLite Local Database (Offline)
**Purpose**: Fast offline access to recent data

**Data Scope** (Last 6 Months):
- **Sales Data**: Orders, Invoices, OrderLines (last 6 months)
- **Inventory**: Current stock levels + recent transactions
- **Cold Chain**: Temperature readings (last 6 months, sampled)
- **Reference Data**: All customers, products, suppliers (full)
- **Geography**: All cities, countries, states (full)

**Estimated Size**: 50-100 MB

**Tables to Include**:
```
Application Schema (Full):
- Cities, Countries, StateProvinces
- People, DeliveryMethods, PaymentMethods

Sales Schema (6 months):
- Orders (WHERE OrderDate >= DATEADD(month, -6, GETDATE()))
- OrderLines (related to Orders)
- Invoices (WHERE InvoiceDate >= DATEADD(month, -6, GETDATE()))
- InvoiceLines (related to Invoices)
- Customers (Full - reference data)
- CustomerTransactions (6 months)

Purchasing Schema (6 months):
- PurchaseOrders (6 months)
- PurchaseOrderLines (related)
- Suppliers (Full - reference data)
- SupplierTransactions (6 months)

Warehouse Schema:
- StockItems (Full - current inventory)
- StockItemHoldings (Full - current stock)
- StockItemTransactions (6 months)
- ColdRoomTemperatures (6 months, sampled every 10th record)
- VehicleTemperatures (6 months)
- Colors, PackageTypes (Full - reference)
```

### Remote Database (Online)
**Purpose**: Full historical data access

**Data Scope**: Complete dataset (3.8B rows)
- All tables, all time periods
- Used when offline data insufficient
- Fallback for complex queries

### Cache Layer (In-Memory)
**Purpose**: Speed up frequently accessed data

**Cached Items**:
1. **Dashboard Metrics** (5-min TTL):
   - Total revenue, orders, customers
   - Stock summaries
   - Temperature averages

2. **Analytics Data** (10-min TTL):
   - Top customers
   - Top products
   - Monthly trends

3. **Reference Data** (1-hour TTL):
   - Table list
   - Schema information
   - Lookup tables

4. **Query Results** (2-min TTL):
   - Recent custom queries
   - Common filters

**Cache Configuration**:
- Max size: 100 MB
- Eviction: LRU (Least Recently Used)
- Persistence: None (in-memory only)

---

## 🔄 Data Synchronization

### Initial Download (One-time)
```javascript
// Migration script workflow
1. Connect to SQL Server
2. For each table:
   a. Create SQLite table with matching schema
   b. Query last 6 months of data (or full for reference tables)
   c. Insert into SQLite in batches (1000 rows)
   d. Show progress bar
3. Create indexes for performance
4. Verify row counts
5. Generate sync metadata
```

**Estimated Time**: 5-15 minutes (depending on connection speed)

### Incremental Updates (Optional)
```javascript
// Daily sync script
1. Check last sync timestamp
2. Query new/updated records since last sync
3. Upsert into SQLite
4. Update sync metadata
```

### Manual Refresh
- Admin page with "Sync Now" button
- Shows last sync time
- Progress indicator during sync

---

## 🎛️ Database Router Logic

### Query Routing Decision Tree

```javascript
function routeQuery(query, options) {
  // 1. Check if offline mode forced
  if (options.forceOffline || !isOnline()) {
    return executeSQLite(query);
  }

  // 2. Check if query requires full historical data
  if (requiresFullHistory(query)) {
    return executeRemote(query);
  }

  // 3. Check cache first
  const cacheKey = generateCacheKey(query);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 4. Determine best source
  if (isRecentData(query) && sqliteHasData(query)) {
    const result = executeSQLite(query);
    cache.set(cacheKey, result, TTL);
    return result;
  }

  // 5. Fallback to remote
  try {
    const result = executeRemote(query);
    cache.set(cacheKey, result, TTL);
    return result;
  } catch (error) {
    // 6. Final fallback to SQLite if remote fails
    return executeSQLite(query);
  }
}
```

### Source Selection Criteria

| Query Type | Primary Source | Fallback | Cache TTL |
|------------|---------------|----------|-----------|
| Dashboard metrics | Cache → SQLite | Remote | 5 min |
| Recent sales (6mo) | SQLite | Remote | 10 min |
| Historical sales (>6mo) | Remote | None | 30 min |
| Reference data | Cache → SQLite | Remote | 1 hour |
| Custom queries | Remote | SQLite | 2 min |
| Real-time temps | Remote | SQLite | 30 sec |
| Stock levels | SQLite | Remote | 5 min |

---

## 🛠️ Implementation Components

### 1. Database Abstraction Layer
**File**: `lib/db-abstraction.ts`

```typescript
interface DatabaseAdapter {
  query(sql: string, params?: any[]): Promise<any[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  close(): Promise<void>;
}

class SQLiteAdapter implements DatabaseAdapter { }
class SQLServerAdapter implements DatabaseAdapter { }

class DatabaseRouter {
  constructor(
    private sqlite: SQLiteAdapter,
    private sqlserver: SQLServerAdapter,
    private cache: CacheManager
  ) {}

  async query(sql: string, options?: QueryOptions): Promise<any[]> {
    // Routing logic here
  }
}
```

### 2. Cache Manager
**File**: `lib/cache-manager.ts`

```typescript
class CacheManager {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      maxKeys: 1000,
      checkperiod: 60
    });
  }

  get(key: string): any | undefined;
  set(key: string, value: any, ttl?: number): void;
  del(key: string): void;
  flush(): void;
  getStats(): CacheStats;
}
```

### 3. Data Migration Script
**File**: `scripts/migrate-to-sqlite.ts`

```typescript
async function migrateData() {
  const tables = await getTableList();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  for (const table of tables) {
    console.log(`Migrating ${table.name}...`);
    
    // Create table in SQLite
    await createSQLiteTable(table);
    
    // Determine if full or filtered
    const isReferenceTable = isReference(table);
    const query = isReferenceTable
      ? `SELECT * FROM ${table.name}`
      : `SELECT * FROM ${table.name} WHERE ${table.dateColumn} >= @date`;
    
    // Batch insert
    await batchInsert(table, query, sixMonthsAgo);
    
    // Create indexes
    await createIndexes(table);
  }
}
```

### 4. Admin Dashboard
**File**: `app/admin/page.tsx`

Features:
- Database source selector (SQLite/Remote/Auto)
- Sync status and last sync time
- Manual sync trigger button
- Cache statistics (hit rate, size, keys)
- Cache flush button
- Data freshness indicators
- Storage usage (SQLite file size)

### 5. Updated API Routes
**File**: `app/api/*/route.ts`

```typescript
// Example: Sales Dashboard API
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || 'auto';

  const db = new DatabaseRouter(sqlite, sqlserver, cache);
  
  const data = await db.query(
    'SELECT ... FROM Sales.Orders WHERE ...',
    { source, cacheTTL: 300 }
  );

  return Response.json(data);
}
```

---

## 📦 Dependencies to Install

```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.2",
    "node-cache": "^5.1.2",
    "@types/better-sqlite3": "^7.6.8"
  }
}
```

**Installation**:
```bash
npm install better-sqlite3 node-cache @types/better-sqlite3
```

---

## 🔧 Configuration

### Environment Variables
**File**: `.env.local`

```env
# Existing SQL Server config
DB_HOST=pepsaco-db-standard.c1oqimeoszvd.eu-west-2.rds.amazonaws.com
DB_PORT=1433
DB_DATABASE=WideWorldImporters_Base
DB_USER=hackathon_ro_03
DB_PASSWORD=Z9@fLm2*

# New SQLite config
SQLITE_DB_PATH=./data/local.db
SQLITE_ENABLED=true

# Cache config
CACHE_ENABLED=true
CACHE_TTL_DEFAULT=300
CACHE_MAX_SIZE=100

# Database mode (auto, sqlite, remote)
DB_MODE=auto
```

---

## 🎯 User Experience

### Mode Indicator
Display current database mode in UI:
- 🟢 **Online** - Using remote database with cache
- 🟡 **Hybrid** - Using SQLite + cache
- 🔴 **Offline** - Using SQLite only

### Automatic Fallback
- App detects network connectivity
- Automatically switches to SQLite when offline
- Shows notification: "Working offline with local data"
- Seamlessly switches back when online

### Data Freshness Indicators
- Show "Last synced: 2 hours ago" on pages
- Warning if data is >7 days old
- "Sync Now" button for manual refresh

---

## 📊 Performance Expectations

### Query Performance

| Query Type | Remote | SQLite | Cache | Improvement |
|------------|--------|--------|-------|-------------|
| Dashboard load | 800ms | 50ms | 10ms | 80x faster |
| Table browse | 500ms | 30ms | 5ms | 100x faster |
| Analytics | 1200ms | 80ms | 15ms | 80x faster |
| Custom query | 600ms | 40ms | N/A | 15x faster |
| Cold chain | 2000ms | 100ms | 20ms | 100x faster |

### Storage Requirements

| Component | Size | Notes |
|-----------|------|-------|
| SQLite DB | 50-100 MB | 6 months data |
| Cache | 50-100 MB | In-memory |
| Total | 100-200 MB | Minimal footprint |

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Tasks 21-23)
- Design architecture ✓
- Install dependencies
- Create database abstraction layer
- Set up SQLite schema

### Phase 2: Data Migration (Task 24)
- Build migration script
- Download 6-month sample
- Verify data integrity
- Create indexes

### Phase 3: Caching (Tasks 25-27)
- Implement cache manager
- Add cache-first logic
- Configure TTLs
- Test cache performance

### Phase 4: Integration (Tasks 28-29)
- Update API routes
- Add source selector
- Implement routing logic
- Test dual-source queries

### Phase 5: Admin & Testing (Tasks 30-32)
- Create admin dashboard
- Add sync controls
- Test offline mode
- Write documentation

---

## 🎉 Benefits

### For Users
✅ **80-100x faster** page loads with cache  
✅ **Offline capability** - work without internet  
✅ **Reduced latency** - local data access  
✅ **Better reliability** - automatic fallback  

### For System
✅ **Reduced load** on remote database  
✅ **Lower bandwidth** usage  
✅ **Better scalability** with caching  
✅ **Improved resilience** with dual sources  

---

## 📝 Next Steps

1. Review and approve this architecture
2. Switch to Code mode to implement
3. Start with Phase 1 (Foundation)
4. Iteratively build and test each phase
5. Deploy and monitor performance

---

**Status**: Architecture Complete - Ready for Implementation  
**Estimated Implementation Time**: 4-6 hours  
**Complexity**: Medium-High  
**Risk**: Low (fallback mechanisms in place)