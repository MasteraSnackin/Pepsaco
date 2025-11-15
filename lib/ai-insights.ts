import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface DataSummary {
  metric: string;
  value: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface Insight {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  recommendation?: string;
  data?: any;
}

export async function generateInsights(
  dataSummaries: DataSummary[],
  context: string
): Promise<Insight[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Analyze this business data and generate 3-5 key insights:

Context: ${context}

Data:
${dataSummaries.map(d => 
  `- ${d.metric}: ${d.value}${d.previousValue ? ` (was ${d.previousValue})` : ''}`
).join('\n')}

For each insight, provide:
1. Title (short, attention-grabbing)
2. Description (what's happening and why it matters)
3. Severity (info/warning/critical)
4. Recommendation (what action to take)

Return ONLY a valid JSON object with an "insights" array containing objects with: title, description, severity, recommendation

JSON:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.insights || [];
  }
  
  return [];
}

export async function detectAnomalies(
  timeSeries: { date: string; value: number }[]
): Promise<{
  anomalies: { date: string; value: number; reason: string }[];
  analysis: string;
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Analyze this time series data for anomalies:

${timeSeries.map(d => `${d.date}: ${d.value}`).join('\n')}

Identify:
1. Unusual spikes or drops
2. Unexpected patterns
3. Potential data quality issues

Return ONLY a valid JSON object with: anomalies[] (date, value, reason), analysis (overall summary)

JSON:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  return { anomalies: [], analysis: '' };
}

export async function generateExecutiveSummary(
  metrics: Record<string, any>
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Create a concise executive summary (2-3 paragraphs) from these metrics:

${JSON.stringify(metrics, null, 2)}

Focus on:
- Key performance indicators
- Notable trends
- Critical issues
- Strategic recommendations

Write in professional business language.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}