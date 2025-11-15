import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'sales' | 'inventory' | 'temperature' | 'quality';
  recommendation: string;
  data: any;
  timestamp: string;
}

export async function analyzeForAlerts(metrics: {
  sales?: any;
  inventory?: any;
  temperature?: any;
}): Promise<Alert[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Analyze these business metrics and generate alerts for issues that need attention:

Sales: ${JSON.stringify(metrics.sales)}
Inventory: ${JSON.stringify(metrics.inventory)}
Temperature: ${JSON.stringify(metrics.temperature)}

Generate alerts for:
- Significant drops or spikes
- Items needing attention
- Compliance issues
- Potential problems

Return ONLY a valid JSON object with an "alerts" array containing objects with: id, title, description, severity (low/medium/high/critical), category (sales/inventory/temperature/quality), recommendation

JSON:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.alerts || []).map((alert: any) => ({
      ...alert,
      timestamp: new Date().toISOString()
    }));
  }
  
  return [];
}