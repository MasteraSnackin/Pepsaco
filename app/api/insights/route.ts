import { NextRequest, NextResponse } from 'next/server';
import { generateInsights, generateExecutiveSummary } from '@/lib/ai-insights';
import { getConnection } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Gather key metrics from the database
    const pool = await getConnection();
    
    const [salesResult, inventoryResult, tempResult] = await Promise.all([
      pool.request().query(`
        SELECT
          COUNT(*) as total_orders,
          SUM(CAST(JSON_VALUE(OrderLines, '$[0].UnitPrice') AS DECIMAL(10,2))) as revenue
        FROM Sales.Orders
        WHERE OrderDate >= DATEADD(day, -30, GETDATE())
      `).then((result: any) => result.recordset).catch(() => [{ total_orders: 0, revenue: 0 }]),
      
      pool.request().query(`
        SELECT COUNT(*) as low_stock_items
        FROM Warehouse.StockItems
        WHERE QuantityOnHand < ReorderLevel
      `).then((result: any) => result.recordset).catch(() => [{ low_stock_items: 0 }]),
      
      pool.request().query(`
        SELECT COUNT(*) as violations
        FROM Warehouse.ColdRoomTemperatures
        WHERE Temperature > 4 OR Temperature < 2
        AND RecordedWhen >= DATEADD(day, -7, GETDATE())
      `).then((result: any) => result.recordset).catch(() => [{ violations: 0 }])
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