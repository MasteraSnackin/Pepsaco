import { NextRequest, NextResponse } from 'next/server';
import { analyzeForAlerts } from '@/lib/ai-alerts';
import { getConnection } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Gather metrics for analysis
    const pool = await getConnection();
    
    const [salesMetrics, inventoryMetrics, tempMetrics] = await Promise.all([
      pool.request().query(`
        SELECT 
          COUNT(*) as orders_today,
          SUM(CAST(JSON_VALUE(OrderLines, '$[0].UnitPrice') AS DECIMAL(10,2))) as revenue_today
        FROM Sales.Orders
        WHERE CAST(OrderDate AS DATE) = CAST(GETDATE() AS DATE)
      `).then((result: any) => result.recordset[0]).catch(() => ({ orders_today: 0, revenue_today: 0 })),
      
      pool.request().query(`
        SELECT 
          COUNT(*) as low_stock_count,
          STRING_AGG(StockItemName, ', ') as low_stock_items
        FROM Warehouse.StockItems
        WHERE QuantityOnHand < ReorderLevel
      `).then((result: any) => result.recordset[0]).catch(() => ({ low_stock_count: 0, low_stock_items: '' })),
      
      pool.request().query(`
        SELECT 
          COUNT(*) as violations,
          AVG(Temperature) as avg_temp
        FROM Warehouse.ColdRoomTemperatures
        WHERE RecordedWhen >= DATEADD(hour, -1, GETDATE())
        AND (Temperature > 4 OR Temperature < 2)
      `).then((result: any) => result.recordset[0]).catch(() => ({ violations: 0, avg_temp: 0 }))
    ]);

    const alerts = await analyzeForAlerts({
      sales: salesMetrics,
      inventory: inventoryMetrics,
      temperature: tempMetrics
    });

    return NextResponse.json({ alerts });

  } catch (error: any) {
    console.error('Alert generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate alerts' },
      { status: 500 }
    );
  }
}