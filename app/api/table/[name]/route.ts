import { NextResponse } from 'next/server';
import { getTableSchema, getTableData } from '@/lib/queries';

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') || 'ASC') as 'ASC' | 'DESC';
    
    // Parse schema and table name from params (format: schema.tableName)
    // Decode the URL-encoded parameter first
    const decodedName = decodeURIComponent(params.name);
    const parts = decodedName.split('.');
    const schemaName = parts.length > 1 ? parts[0] : 'dbo';
    const tableName = parts.length > 1 ? parts[1] : parts[0];
    
    // Parse filters
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        const columnName = key.replace('filter_', '');
        filters[columnName] = value;
      }
    });

    const [schema, result] = await Promise.all([
      getTableSchema(schemaName, tableName),
      getTableData(schemaName, tableName, page, limit, sortBy, sortOrder, filters),
    ]);

    return NextResponse.json({
      schema,
      data: result.data,
      totalRows: result.totalRows,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching table data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table data' },
      { status: 500 }
    );
  }
}