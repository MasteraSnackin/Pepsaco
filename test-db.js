const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const config = {
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Server:', config.server);
  console.log('Database:', config.database);
  console.log('User:', config.user);
  console.log('');

  try {
    console.log('Connecting to SQL Server...');
    const pool = await sql.connect(config);
    console.log('✅ Connection successful!');
    console.log('');

    console.log('Fetching sample tables...');
    const result = await pool.request().query(`
      SELECT TOP 5
        t.TABLE_SCHEMA as [schema],
        t.TABLE_NAME as name,
        ISNULL(p.rows, 0) as rowCount
      FROM INFORMATION_SCHEMA.TABLES t
      LEFT JOIN sys.tables st ON t.TABLE_NAME = st.name
      LEFT JOIN sys.partitions p ON st.object_id = p.object_id
      WHERE t.TABLE_TYPE = 'BASE TABLE'
        AND (p.index_id IN (0, 1) OR p.index_id IS NULL)
      GROUP BY t.TABLE_SCHEMA, t.TABLE_NAME, p.rows
      ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME
    `);

    console.log('✅ Query successful!');
    console.log('');
    console.log('Sample tables:');
    console.table(result.recordset);

    await pool.close();
    console.log('');
    console.log('✅ Database connection test completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('');
    console.error('Full error:', err);
    process.exit(1);
  }
}

testConnection();