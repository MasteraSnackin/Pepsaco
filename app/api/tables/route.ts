import { NextResponse } from 'next/server';
import { getAllTables } from '@/lib/queries';

export async function GET() {
  try {
    const tables = await getAllTables();
    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}