import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/queries';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Execute the query (already has safety checks in executeQuery function)
    const results = await executeQuery(query);

    return NextResponse.json({
      success: true,
      results,
      rowCount: results.length,
    });
  } catch (error: any) {
    console.error('Error executing custom query:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to execute query',
        success: false 
      },
      { status: 500 }
    );
  }
}