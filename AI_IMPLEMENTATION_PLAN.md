# 🎯 AI Implementation Plan - Step by Step

## Quick Start: 3 AI Features You Can Add Today

---

## Feature 1: Enhanced Natural Language Query (30 minutes)

### What You'll Get:
- Better SQL generation from natural language
- Query explanations in plain English
- Optimization suggestions
- Error handling and validation

### Setup:

1. **Get OpenAI API Key**:
   ```bash
   # Visit https://platform.openai.com/api-keys
   # Create new API key
   # Add to .env.local
   ```

2. **Install OpenAI SDK**:
   ```bash
   cd pepsaco-db-viewer
   npm install openai
   ```

3. **Add to .env.local**:
   ```env
   OPENAI_API_KEY=sk-proj-your-key-here
   ```

### Implementation:

**File: `lib/ai-query-helper.ts`** (NEW)
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  const systemPrompt = `You are a SQL expert for a WideWorldImporters database.
Available tables: ${schema.join(', ')}

Generate SQL Server queries that:
1. Use proper schema names (e.g., Sales.Orders, Warehouse.StockItems)
2. Include appropriate JOINs when needed
3. Use TOP instead of LIMIT
4. Format dates properly for SQL Server
5. Include helpful comments

Return JSON with: sql, explanation, confidence (0-1), suggestions[]`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  return result;
}

export async function explainQuery(sql: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Explain SQL queries in simple, business-friendly language."
      },
      {
        role: "user",
        content: `Explain this SQL query:\n\n${sql}`
      }
    ],
    temperature: 0.5,
  });

  return completion.choices[0].message.content || '';
}

export async function optimizeQuery(sql: string): Promise<{
  optimizedSQL: string;
  improvements: string[];
}> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a SQL optimization expert. Suggest improvements for query performance."
      },
      {
        role: "user",
        content: `Optimize this SQL query:\n\n${sql}`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}
```

**File: `app/api/ai-query/route.ts`** (NEW)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateSQLFromNaturalLanguage, explainQuery, optimizeQuery } from '@/lib/ai-query-helper';

export async function POST(request: NextRequest) {
  try {
    const { action, query, sql, schema } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'generate':
        const result = await generateSQLFromNaturalLanguage(query, schema);
        return NextResponse.json(result);

      case 'explain':
        const explanation = await explainQuery(sql);
        return NextResponse.json({ explanation });

      case 'optimize':
        const optimization = await optimizeQuery(sql);
        return NextResponse.json(optimization);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
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
```

### Usage in Query Builder:

Update `app/query-builder/page.tsx` to use the new AI endpoint:

```typescript
// Add this function
const generateWithAI = async () => {
  setIsGenerating(true);
  try {
    const response = await fetch('/api/ai-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        query: naturalLanguageQuery,
        schema: tables.map(t => t.name)
      })
    });
    
    const result = await response.json();
    setQuery(result.sql);
    setExplanation(result.explanation);
    
    if (result.confidence < 0.7) {
      alert('Low confidence query - please review carefully');
    }
  } catch (error) {
    console.error('AI generation failed:', error);
  } finally {
    setIsGenerating(false);
  }
};
```

---

## Feature 2: AI-Powered Insights Dashboard (2 hours)

### What You'll Get:
- Automated data analysis
- Natural language insights
- Trend detection
- Actionable recommendations

### Implementation:

**File: `lib/ai-insights.ts`** (NEW)
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

Return as JSON array of insights.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a business intelligence analyst. Generate actionable insights from data."
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"insights":[]}');
  return result.insights || [];
}

export async function detectAnomalies(
  timeSeries: { date: string; value: number }[]
): Promise<{
  anomalies: { date: string; value: number; reason: string }[];
  analysis: string;
}> {
  const prompt = `Analyze this time series data for anomalies:

${timeSeries.map(d => `${d.date}: ${d.value}`).join('\n')}

Identify:
1. Unusual spikes or drops
2. Unexpected patterns
3. Potential data quality issues

Return JSON with: anomalies[] (date, value, reason), analysis (overall summary)`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a data scientist specializing in anomaly detection."
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}

export async function generateExecutiveSummary(
  metrics: Record<string, any>
): Promise<string> {
  const prompt = `Create a concise executive summary (2-3 paragraphs) from these metrics:

${JSON.stringify(metrics, null, 2)}

Focus on:
- Key performance indicators
- Notable trends
- Critical issues
- Strategic recommendations

Write in professional business language.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are an executive business analyst writing for C-level executives."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.6,
  });

  return completion.choices[0].message.content || '';
}
```

**File: `app/api/insights/route.ts`** (NEW)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateInsights, detectAnomalies, generateExecutiveSummary } from '@/lib/ai-insights';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Gather key metrics
    const [salesResult, inventoryResult, tempResult] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CAST(JSON_VALUE(OrderLines, '$[0].UnitPrice') AS DECIMAL(10,2))) as revenue
        FROM Sales.Orders
        WHERE OrderDate >= DATEADD(day, -30, GETDATE())
      `),
      query(`
        SELECT COUNT(*) as low_stock_items
        FROM Warehouse.StockItems
        WHERE QuantityOnHand < ReorderLevel
      `),
      query(`
        SELECT COUNT(*) as violations
        FROM Warehouse.ColdRoomTemperatures
        WHERE Temperature > 4 OR Temperature < 2
        AND RecordedWhen >= DATEADD(day, -7, GETDATE())
      `)
    ]);

    const dataSummaries = [
      {
        metric: 'Orders (Last 30 Days)',
        value: salesResult[0]?.total_orders || 0
      },
      {
        metric: 'Revenue (Last 30 Days)',
        value: salesResult[0]?.revenue || 0
      },
      {
        metric: 'Low Stock Items',
        value: inventoryResult[0]?.low_stock_items || 0
      },
      {
        metric: 'Temperature Violations (Last 7 Days)',
        value: tempResult[0]?.violations || 0
      }
    ];

    // Generate AI insights
    const insights = await generateInsights(
      dataSummaries,
      'PepsaCo supply chain and sales operations'
    );

    // Generate executive summary
    const summary = await generateExecutiveSummary({
      sales: salesResult[0],
      inventory: inventoryResult[0],
      coldChain: tempResult[0]
    });

    return NextResponse.json({
      insights,
      summary,
      metrics: dataSummaries,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Insights generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
```

**File: `app/insights/page.tsx`** (NEW)
```typescript
'use client';

import { useState, useEffect } from 'react';

interface Insight {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  recommendation?: string;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/insights');
      const data = await response.json();
      setInsights(data.insights || []);
      setSummary(data.summary || '');
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-900';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      default: return 'bg-blue-100 border-blue-500 text-blue-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating AI insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 AI-Powered Insights
        </h1>
        <p className="text-gray-600">
          Automated analysis and recommendations from your data
        </p>
      </div>

      {/* Executive Summary */}
      {summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 mb-8 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
            📊 Executive Summary
          </h2>
          <div className="text-gray-700 whitespace-pre-line leading-relaxed">
            {summary}
          </div>
        </div>
      )}

      {/* Insights Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`border-l-4 p-6 rounded-lg shadow-sm ${getSeverityColor(insight.severity)}`}
          >
            <div className="flex items-start">
              <span className="text-2xl mr-3">{getSeverityIcon(insight.severity)}</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{insight.title}</h3>
                <p className="mb-3 opacity-90">{insight.description}</p>
                {insight.recommendation && (
                  <div className="mt-4 pt-4 border-t border-current opacity-75">
                    <p className="font-medium mb-1">💡 Recommendation:</p>
                    <p>{insight.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button
          onClick={fetchInsights}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh Insights
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Insights are generated using AI analysis of your latest data
        </p>
      </div>
    </div>
  );
}
```

---

## Feature 3: Smart Alerts System (1 hour)

### What You'll Get:
- Automated anomaly detection
- Intelligent alert prioritization
- Natural language explanations
- Actionable recommendations

### Implementation:

**File: `lib/ai-alerts.ts`** (NEW)
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  const prompt = `Analyze these business metrics and generate alerts for issues that need attention:

Sales: ${JSON.stringify(metrics.sales)}
Inventory: ${JSON.stringify(metrics.inventory)}
Temperature: ${JSON.stringify(metrics.temperature)}

Generate alerts for:
- Significant drops or spikes
- Items needing attention
- Compliance issues
- Potential problems

Return JSON array with: id, title, description, severity, category, recommendation`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are an operations monitoring system. Generate actionable alerts."
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"alerts":[]}');
  return (result.alerts || []).map((alert: any) => ({
    ...alert,
    timestamp: new Date().toISOString()
  }));
}
```

**File: `app/api/alerts/route.ts`** (NEW)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { analyzeForAlerts } from '@/lib/ai-alerts';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Gather metrics for analysis
    const [salesMetrics, inventoryMetrics, tempMetrics] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as orders_today,
          SUM(CAST(JSON_VALUE(OrderLines, '$[0].UnitPrice') AS DECIMAL(10,2))) as revenue_today
        FROM Sales.Orders
        WHERE CAST(OrderDate AS DATE) = CAST(GETDATE() AS DATE)
      `),
      query(`
        SELECT 
          COUNT(*) as low_stock_count,
          STRING_AGG(StockItemName, ', ') as low_stock_items
        FROM Warehouse.StockItems
        WHERE QuantityOnHand < ReorderLevel
      `),
      query(`
        SELECT 
          COUNT(*) as violations,
          AVG(Temperature) as avg_temp
        FROM Warehouse.ColdRoomTemperatures
        WHERE RecordedWhen >= DATEADD(hour, -1, GETDATE())
        AND (Temperature > 4 OR Temperature < 2)
      `)
    ]);

    const alerts = await analyzeForAlerts({
      sales: salesMetrics[0],
      inventory: inventoryMetrics[0],
      temperature: tempMetrics[0]
    });

    return NextResponse.json({ alerts });

  } catch (error: any) {
    console.error('Alert generation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Cost Management

### Estimated Costs:

**Feature 1 - Enhanced Query Builder**:
- ~$0.01 per query generation
- ~$0.001 per explanation
- ~$0.01 per optimization
- **Monthly (100 queries)**: ~$2

**Feature 2 - Insights Dashboard**:
- ~$0.05 per insight generation
- Daily refresh: ~$1.50/month
- **Monthly**: ~$1.50

**Feature 3 - Smart Alerts**:
- ~$0.03 per alert check
- Hourly checks: ~$22/month
- **Monthly**: ~$22

**Total Estimated Cost**: ~$25-30/month

### Cost Optimization:

```typescript
// Add caching to reduce API calls
import NodeCache from 'node-cache';

const insightsCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

export async function getCachedInsights() {
  const cached = insightsCache.get('insights');
  if (cached) return cached;
  
  const insights = await generateInsights(...);
  insightsCache.set('insights', insights);
  return insights;
}
```

---

## Next Steps

1. **Set up OpenAI API key** in `.env.local`
2. **Install dependencies**: `npm install openai`
3. **Implement Feature 1** (Enhanced Query Builder)
4. **Test with sample queries**
5. **Add Features 2 & 3** based on needs
6. **Monitor costs** in OpenAI dashboard
7. **Gather user feedback**
8. **Iterate and improve**

---

## Testing

```bash
# Test AI query generation
curl -X POST http://localhost:3000/api/ai-query \
  -H "Content-Type: application/json" \
  -d '{"action":"generate","query":"Show top 10 customers","schema":["Sales.Customers"]}'

# Test insights generation
curl http://localhost:3000/api/insights

# Test alerts
curl http://localhost:3000/api/alerts
```

---

## Support

Need help? Check:
- OpenAI Documentation: https://platform.openai.com/docs
- OpenAI Cookbook: https://cookbook.openai.com/
- Community Forum: https://community.openai.com/

Ready to make your data intelligent! 🚀