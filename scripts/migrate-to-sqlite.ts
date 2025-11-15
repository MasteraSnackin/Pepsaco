import { getConnection } from '../lib/db';
import { getSQLiteAdapter } from '../lib/sqlite-adapter';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

/**
 * Table configuration for migration
 */
interface TableConfig {
  schema: string;
  name: string;
  dateColumn?: string;  // Column to filter by date (for 6-month data)
  isReference: boolean; // If true, copy all data; if false, copy last 6 months
  sampleRate?: number;  // For large tables, sample every Nth row (e.g., 10 = every 10th row)
}

/**
 * Tables to migrate with their configurations
 */
const TABLES_TO_MIGRATE: TableConfig[] = [
  // Application Schema - Reference Data (Full)
  { schema: 'Application', name: 'Cities', isReference: true },
  { schema: 'Application', name: 'Countries', isReference: true },
  { schema: 'Application', name: 'StateProvinces', isReference: true },
  { schema: 'Application', name: 'People', isReference: true },
  { schema: 'Application', name: 'DeliveryMethods', isReference: true },
  { schema: 'Application', name: 'PaymentMethods', isReference: true },
  
  // Sales Schema - Transactional Data (6 months)
  { schema: 'Sales', name: 'Customers', isReference: true },
  { schema: 'Sales', name: 'Orders', dateColumn: 'OrderDate', isReference: false },
  { schema: 'Sales', name: 'OrderLines', dateColumn: 'OrderDate', isReference: false },
  { schema: 'Sales', name: 'Invoices', dateColumn: 'InvoiceDate', isReference: false },
  { schema: 'Sales', name: 'InvoiceLines', dateColumn: 'InvoiceDate', isReference: false },
  { schema: 'Sales', name: 'CustomerTransactions', dateColumn: 'TransactionDate', isReference: false },
  
  // Purchasing Schema
  { schema: 'Purchasing', name: 'Suppliers', isReference: true },
  { schema: 'Purchasing', name: 'PurchaseOrders', dateColumn: 'OrderDate', isReference: false },
  { schema: 'Purchasing', name: 'PurchaseOrderLines', dateColumn: 'OrderDate', isReference: false },
  { schema: 'Purchasing', name: 'SupplierTransactions', dateColumn: 'TransactionDate', isReference: false },
  
  // Warehouse Schema
  { schema: 'Warehouse', name: 'StockItems', isReference: true },
  { schema: 'Warehouse', name: 'StockItemHoldings', isReference: true },
  { schema: 'Warehouse', name: 'Colors', isReference: true },
  { schema: 'Warehouse', name: 'PackageTypes', isReference: true },
  { schema: 'Warehouse', name: 'StockItemTransactions', dateColumn: 'TransactionOccurredWhen', isReference: false },
  { schema: 'Warehouse', name: 'ColdRoomTemperatures_Archive', dateColumn: 'RecordedWhen', isReference: false, sampleRate: 10 },
  { schema: 'Warehouse', name: 'VehicleTemperatures', dateColumn: 'RecordedWhen', isReference: false },
];

/**
 * Progress tracking
 */
class MigrationProgress {
  private totalTables: number;
  private completedTables: number = 0;
  private totalRows: number = 0;
  private startTime: number;

  constructor(totalTables: number) {
    this.totalTables = totalTables;
    this.startTime = Date.now();
  }

  tableStarted(tableName: string) {
    console.log(`\n[${this.completedTables + 1}/${this.totalTables}] Starting: ${tableName}`);
  }

  tableCompleted(tableName: string, rowCount: number) {
    this.completedTables++;
    this.totalRows += rowCount;
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    console.log(`✓ Completed: ${tableName} (${rowCount.toLocaleString()} rows) - ${elapsed}s elapsed`);
  }

  tableFailed(tableName: string, error: any) {
    console.error(`✗ Failed: ${tableName} - ${error.message}`);
  }

  complete() {
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Migration Complete!`);
    console.log(`Tables: ${this.completedTables}/${this.totalTables}`);
    console.log(`Total Rows: ${this.totalRows.toLocaleString()}`);
    console.log(`Time: ${elapsed}s`);
    console.log(`${'='.repeat(60)}\n`);
  }
}

/**
 * Get SQL Server column information
 */
async function getColumnInfo(schema: string, tableName: string): Promise<any[]> {
  const pool = await getConnection();
  const query = `
    SELECT 
      COLUMN_NAME,
      DATA_TYPE,
      CHARACTER_MAXIMUM_LENGTH,
      IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = @tableName
    ORDER BY ORDINAL_POSITION
  `;
  
  const result = await pool.request()
    .input('schema', schema)
    .input('tableName', tableName)
    .query(query);
  
  return result.recordset;
}

/**
 * Convert SQL Server data type to SQLite
 */
function convertDataType(sqlServerType: string): string {
  const typeMap: { [key: string]: string } = {
    'int': 'INTEGER',
    'bigint': 'INTEGER',
    'smallint': 'INTEGER',
    'tinyint': 'INTEGER',
    'bit': 'INTEGER',
    'decimal': 'REAL',
    'numeric': 'REAL',
    'float': 'REAL',
    'real': 'REAL',
    'money': 'REAL',
    'smallmoney': 'REAL',
    'varchar': 'TEXT',
    'nvarchar': 'TEXT',
    'char': 'TEXT',
    'nchar': 'TEXT',
    'text': 'TEXT',
    'ntext': 'TEXT',
    'datetime': 'TEXT',
    'datetime2': 'TEXT',
    'date': 'TEXT',
    'time': 'TEXT',
    'uniqueidentifier': 'TEXT',
    'varbinary': 'BLOB',
    'binary': 'BLOB',
    'image': 'BLOB',
  };
  
  return typeMap[sqlServerType.toLowerCase()] || 'TEXT';
}

/**
 * Create SQLite table from SQL Server schema
 */
async function createSQLiteTable(sqlite: any, config: TableConfig, columns: any[]): Promise<void> {
  const tableName = `${config.schema}_${config.name}`;
  
  // Drop table if exists
  await sqlite.execute(`DROP TABLE IF EXISTS ${tableName}`);
  
  // Build CREATE TABLE statement
  const columnDefs = columns.map(col => {
    const sqliteType = convertDataType(col.DATA_TYPE);
    const nullable = col.IS_NULLABLE === 'YES' ? '' : ' NOT NULL';
    return `${col.COLUMN_NAME} ${sqliteType}${nullable}`;
  });
  
  const createSQL = `CREATE TABLE ${tableName} (${columnDefs.join(', ')})`;
  await sqlite.execute(createSQL);
  
  console.log(`  Created table: ${tableName}`);
}

/**
 * Migrate table data
 */
async function migrateTable(config: TableConfig, sqlite: any, progress: MigrationProgress): Promise<void> {
  const fullTableName = `[${config.schema}].[${config.name}]`;
  const sqliteTableName = `${config.schema}_${config.name}`;
  
  progress.tableStarted(fullTableName);
  
  try {
    // Get column information
    const columns = await getColumnInfo(config.schema, config.name);
    
    if (columns.length === 0) {
      console.log(`  ⚠ No columns found, skipping...`);
      return;
    }
    
    // Create SQLite table
    await createSQLiteTable(sqlite, config, columns);
    
    // Build SELECT query
    let selectQuery = `SELECT * FROM ${fullTableName}`;
    
    // Add date filter for non-reference tables
    if (!config.isReference && config.dateColumn) {
      selectQuery += ` WHERE ${config.dateColumn} >= DATEADD(month, -6, GETDATE())`;
    }
    
    // Add sampling for large tables
    if (config.sampleRate && config.sampleRate > 1) {
      // For SQL Server, we can use ROW_NUMBER() for sampling
      selectQuery = `
        SELECT * FROM (
          SELECT *, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) as RowNum
          FROM ${fullTableName}
          ${!config.isReference && config.dateColumn ? `WHERE ${config.dateColumn} >= DATEADD(month, -6, GETDATE())` : ''}
        ) AS Sampled
        WHERE RowNum % ${config.sampleRate} = 0
      `;
    }
    
    // Fetch data from SQL Server
    const pool = await getConnection();
    const result = await pool.request().query(selectQuery);
    const rows = result.recordset;
    
    if (rows.length === 0) {
      console.log(`  ℹ No data to migrate`);
      progress.tableCompleted(fullTableName, 0);
      return;
    }
    
    // Remove RowNum column if it exists (from sampling)
    const cleanRows = rows.map(row => {
      const { RowNum, ...rest } = row;
      return rest;
    });
    
    // Batch insert into SQLite
    const batchSize = 1000;
    let inserted = 0;
    
    for (let i = 0; i < cleanRows.length; i += batchSize) {
      const batch = cleanRows.slice(i, i + batchSize);
      const count = await sqlite.batchInsert(sqliteTableName, batch, batchSize);
      inserted += count;
      
      if (i % 5000 === 0 && i > 0) {
        console.log(`  Progress: ${inserted.toLocaleString()} / ${cleanRows.length.toLocaleString()} rows`);
      }
    }
    
    // Create indexes on date columns
    if (config.dateColumn) {
      await sqlite.createIndex(sqliteTableName, config.dateColumn);
    }
    
    progress.tableCompleted(fullTableName, inserted);
    
  } catch (error) {
    progress.tableFailed(fullTableName, error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('\n' + '='.repeat(60));
  console.log('SQLite Database Migration');
  console.log('Downloading 6-month sample data from SQL Server');
  console.log('='.repeat(60) + '\n');
  
  const sqlite = getSQLiteAdapter();
  await sqlite.init();
  
  const progress = new MigrationProgress(TABLES_TO_MIGRATE.length);
  
  // Migrate each table
  for (const config of TABLES_TO_MIGRATE) {
    try {
      await migrateTable(config, sqlite, progress);
    } catch (error) {
      console.error(`Error migrating ${config.schema}.${config.name}:`, error);
      // Continue with next table
    }
  }
  
  // Vacuum database to optimize
  console.log('\nOptimizing database...');
  await sqlite.vacuum();
  
  // Show final statistics
  const stats = await sqlite.getStats();
  console.log('\nSQLite Database Statistics:');
  console.log(`  Tables: ${stats.tables}`);
  console.log(`  Total Rows: ${stats.totalRows.toLocaleString()}`);
  console.log(`  File Size: ${stats.fileSize}`);
  console.log(`  Location: ${stats.path}`);
  
  progress.complete();
  
  sqlite.close();
  process.exit(0);
}

// Run migration
migrate().catch(error => {
  console.error('\nMigration failed:', error);
  process.exit(1);
});