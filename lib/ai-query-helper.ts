import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface QueryResult {
  sql: string;
  explanation: string;
  confidence: number;
  suggestions?: string[];
}

export async function generateSQLFromNaturalLanguage(
  userQuery: string,
  schema: string[]
): Promise<QueryResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `You are a SQL expert for a WideWorldImporters database.
Available tables: ${schema.join(', ')}

Generate SQL Server queries that:
1. Use proper schema names (e.g., Sales.Orders, Warehouse.StockItems)
2. Include appropriate JOINs when needed
3. Use TOP instead of LIMIT
4. Format dates properly for SQL Server
5. Include helpful comments

User query: ${userQuery}

Return ONLY a valid JSON object with these fields:
- sql: the SQL query
- explanation: plain English explanation
- confidence: number between 0 and 1
- suggestions: array of helpful tips

JSON:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  // Fallback if JSON parsing fails
  return {
    sql: text,
    explanation: 'Generated SQL query',
    confidence: 0.7,
    suggestions: []
  };
}

export async function explainQuery(sql: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Explain this SQL query in simple, business-friendly language:

${sql}

Provide a clear, concise explanation that a non-technical person can understand.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function optimizeQuery(sql: string): Promise<{
  optimizedSQL: string;
  improvements: string[];
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `You are a SQL optimization expert. Analyze and optimize this SQL query:

${sql}

Return ONLY a valid JSON object with these fields:
- optimizedSQL: the optimized query
- improvements: array of improvements made

JSON:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  // Fallback
  return {
    optimizedSQL: sql,
    improvements: ['No optimizations suggested']
  };
}