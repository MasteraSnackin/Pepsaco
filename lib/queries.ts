import { sql, getConnection } from './db';

export interface TableInfo {
  name: string;
  schema: string;
  rowCount: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  maxLength: number | null;
}

export async function getAllTables(): Promise<TableInfo[]> {
  const pool = await getConnection();
  const result = await pool.request().query(`
    SELECT
      t.TABLE_SCHEMA as [schema],
      t.TABLE_NAME as name,
      ISNULL(SUM(p.rows), 0) as [rowCount]
    FROM INFORMATION_SCHEMA.TABLES t
    LEFT JOIN sys.tables st ON t.TABLE_NAME = st.name
    LEFT JOIN sys.partitions p ON st.object_id = p.object_id AND p.index_id IN (0, 1)
    WHERE t.TABLE_TYPE = 'BASE TABLE'
    GROUP BY t.TABLE_SCHEMA, t.TABLE_NAME
    ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME
  `);
  return result.recordset;
}

export async function getTableSchema(schemaName: string, tableName: string): Promise<ColumnInfo[]> {
  const pool = await getConnection();
  const result = await pool.request()
    .input('schemaName', sql.NVarChar, schemaName)
    .input('tableName', sql.NVarChar, tableName)
    .query(`
      SELECT
        COLUMN_NAME as name,
        DATA_TYPE as type,
        CASE WHEN IS_NULLABLE = 'YES' THEN 1 ELSE 0 END as nullable,
        CHARACTER_MAXIMUM_LENGTH as maxLength
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @tableName
      ORDER BY ORDINAL_POSITION
    `);
  return result.recordset;
}

export async function getTableData(
  schemaName: string,
  tableName: string,
  page: number = 1,
  limit: number = 50,
  sortBy?: string,
  sortOrder: 'ASC' | 'DESC' = 'ASC',
  filters?: Record<string, string>
): Promise<{ data: any[]; totalRows: number }> {
  const pool = await getConnection();
  
  // Validate table name to prevent SQL injection
  const tableExists = await pool.request()
    .input('schemaName', sql.NVarChar, schemaName)
    .input('tableName', sql.NVarChar, tableName)
    .query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @tableName
    `);
  
  if (tableExists.recordset[0].count === 0) {
    throw new Error('Table not found');
  }

  // Build fully qualified table name
  const fullTableName = `[${schemaName}].[${tableName}]`;

  // Build WHERE clause from filters
  let whereClause = '';
  const request = pool.request();
  
  if (filters && Object.keys(filters).length > 0) {
    const conditions: string[] = [];
    Object.entries(filters).forEach(([column, value], index) => {
      // Validate column name exists
      conditions.push(`[${column}] LIKE @filter${index}`);
      request.input(`filter${index}`, sql.NVarChar, `%${value}%`);
    });
    whereClause = 'WHERE ' + conditions.join(' AND ');
  }

  // Get total count
  const countResult = await request.query(`
    SELECT COUNT(*) as total FROM ${fullTableName} ${whereClause}
  `);
  const totalRows = countResult.recordset[0].total;

  // Get paginated data
  const offset = (page - 1) * limit;
  const orderBy = sortBy ? `ORDER BY [${sortBy}] ${sortOrder}` : 'ORDER BY (SELECT NULL)';
  
  const dataResult = await pool.request().query(`
    SELECT * FROM ${fullTableName}
    ${whereClause}
    ${orderBy}
    OFFSET ${offset} ROWS
    FETCH NEXT ${limit} ROWS ONLY
  `);

  return {
    data: dataResult.recordset,
    totalRows,
  };
}

export async function executeQuery(query: string): Promise<any[]> {
  // Validate that query is SELECT only
  const trimmedQuery = query.trim().toUpperCase();
  if (!trimmedQuery.startsWith('SELECT')) {
    throw new Error('Only SELECT queries are allowed');
  }
  
  // Check for dangerous keywords
  const dangerousKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'EXEC', 'EXECUTE'];
  if (dangerousKeywords.some(keyword => trimmedQuery.includes(keyword))) {
    throw new Error('Query contains forbidden operations');
  }

  const pool = await getConnection();
  const result = await pool.request().query(query);
  return result.recordset;
}