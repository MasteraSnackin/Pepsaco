import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/queries';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query' },
        { status: 400 }
      );
    }

    const data = await executeQuery(query);
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return NextResponse.json({ data, columns });
  } catch (error: any) {
    console.error('Error executing query:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute query' },
      { status: 500 }
    );
  }
}