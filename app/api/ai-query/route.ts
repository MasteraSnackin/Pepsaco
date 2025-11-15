import { NextRequest, NextResponse } from 'next/server';
import { generateSQLFromNaturalLanguage, explainQuery, optimizeQuery } from '@/lib/ai-query-helper';

export async function POST(request: NextRequest) {
  try {
    const { action, query, sql, schema } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'generate':
        if (!query || !schema) {
          return NextResponse.json(
            { error: 'Missing required parameters: query and schema' },
            { status: 400 }
          );
        }
        const result = await generateSQLFromNaturalLanguage(query, schema);
        return NextResponse.json(result);

      case 'explain':
        if (!sql) {
          return NextResponse.json(
            { error: 'Missing required parameter: sql' },
            { status: 400 }
          );
        }
        const explanation = await explainQuery(sql);
        return NextResponse.json({ explanation });

      case 'optimize':
        if (!sql) {
          return NextResponse.json(
            { error: 'Missing required parameter: sql' },
            { status: 400 }
          );
        }
        const optimization = await optimizeQuery(sql);
        return NextResponse.json(optimization);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: generate, explain, or optimize' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('AI Query Error:', error);
    return NextResponse.json(
      { error: error.message || 'AI processing failed' },
      { status: 500 }
    );
  }
}